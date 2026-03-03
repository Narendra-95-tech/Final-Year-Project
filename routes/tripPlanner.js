const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const SavedTrip = require('../models/savedTrip');
const { isLoggedIn } = require('../middleware');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60000,
    maxRetries: 2,
});

// In-memory conversation history (keyed by conversationId)
const conversationHistory = new Map();

// ─── Helper ────────────────────────────────────────────────────────────────
const getSystemMessage = () => ({
    role: 'system',
    content: `You are WanderLust AI 🌍, India's smartest travel assistant. You create stunning, detailed travel itineraries.

ALWAYS follow this structure in your response:

## ✈️ Trip Overview
Brief exciting summary of the trip.

## 📅 Day-by-Day Itinerary
For EACH day, use this exact format:

### 🌅 Day [N] — [Day Theme/Title]
**Morning (8:00 AM):** [Activity with vivid description]
📍 *Location:* [Place name] | ⏱️ *Duration:* [X hrs] | 💰 *Cost:* ₹[amount]/person

**Afternoon (1:00 PM):** [Activity]
📍 *Location:* [Place] | ⏱️ *Duration:* [X hrs] | 💰 *Cost:* ₹[amount]/person

**Evening (6:00 PM):** [Activity]
📍 *Location:* [Place] | ⏱️ *Duration:* [X hrs] | 💰 *Cost:* ₹[amount]/person

**🍽️ Lunch:** [Restaurant/Dhaba name] — [Cuisine] — ₹[cost] for two
**🌙 Dinner:** [Restaurant/Dhaba name] — [Cuisine] — ₹[cost] for two
**🏨 Stay:** [Hotel/Guesthouse name] — ₹[cost]/night

---

## 💰 Budget Breakdown
| Category | Estimated Cost |
|----------|---------------|
| Accommodation | ₹X |
| Food & Dining | ₹X |
| Transport | ₹X |
| Activities | ₹X |
| Miscellaneous | ₹X |
| **TOTAL** | **₹X** |

## 💡 Money-Saving Tips
- Tip 1
- Tip 2
- Tip 3

## 🎒 Packing Essentials
Briefly mention 5 must-carry items for this destination/season.

## 🆘 Emergency Contacts
- **Police:** 100
- **Ambulance:** 108  
- **Tourist Helpline:** 1800-111-363

Always include estimated costs in Indian Rupees (₹). Be enthusiastic, specific and helpful!`
});

// ─── GET: Trip Planner UI ───────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.render('trip-planner', {
        title: 'AI Trip Planner | WanderLust',
        currUser: req.user || null
    });
});

// ─── POST: Generate Trip Plan (STREAMING) ──────────────────────────────────
router.post('/plan', async (req, res, next) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            success: false,
            message: 'AI service not configured. Please contact support.',
            code: 'MISSING_API_KEY'
        });
    }

    const {
        message,
        conversationId = Date.now().toString(),
        destination,
        duration,
        budget,
        preferences = '',
        stream: wantStream = false
    } = req.body;

    // Guard: at least one of (message, destination) must be provided
    if (!message && !destination) {
        return res.status(400).json({ success: false, message: 'Please provide a destination or message.' });
    }

    try {
        // Build / retrieve conversation
        if (!conversationHistory.has(conversationId)) {
            conversationHistory.set(conversationId, [getSystemMessage()]);
        }
        const history = conversationHistory.get(conversationId);

        // First message with structured form inputs
        if (destination && duration && budget && history.length === 1) {
            const prefText = preferences ? ` Special preferences: ${preferences}.` : '';
            history.push({
                role: 'user',
                content: `Plan a detailed ${duration}-day trip to ${destination} with a total budget of ₹${budget} for ${req.body.travelers || 2} people.${prefText}`
            });
        } else if (message) {
            history.push({ role: 'user', content: message });
        }

        // ── Streaming Response ──────────────────────────────────────────────
        if (wantStream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.flushHeaders();

            let fullContent = '';

            const stream = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: history,
                temperature: 0.75,
                max_tokens: 2500,
                stream: true
            });

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || '';
                if (delta) {
                    fullContent += delta;
                    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
                }
            }

            // Save assistant message to history
            history.push({ role: 'assistant', content: fullContent });

            // Prune old conversations
            _pruneConversations(conversationId);

            // End stream
            res.write(`data: ${JSON.stringify({ done: true, conversationId, fullContent })}\n\n`);
            res.end();
            return;
        }

        // ── Non-Streaming (fallback) ────────────────────────────────────────
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: history,
            temperature: 0.75,
            max_tokens: 2500,
            stream: false
        });

        const aiMessage = response.choices[0]?.message;
        if (!aiMessage?.content) throw new Error('Invalid response from AI service');

        history.push(aiMessage);
        _pruneConversations(conversationId);

        res.json({
            success: true,
            data: {
                content: aiMessage.content,
                destination, duration, budget, preferences,
                timestamp: new Date().toISOString()
            },
            conversationId
        });

    } catch (error) {
        console.error('Trip planner error:', error);
        if (res.headersSent) return res.end();
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to generate trip plan. Try again.',
            code: error.code || 'TRIP_PLAN_ERROR'
        });
    }
});

// ─── POST: Save Trip to MongoDB ─────────────────────────────────────────────
router.post('/save', isLoggedIn, async (req, res) => {
    try {
        const { destination, duration, budget, preferences, content, estimatedCost, travelers, title } = req.body;

        if (!destination || !content) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // Pick a fun emoji based on destination keywords
        const emoji = _pickEmoji(destination);

        const trip = new SavedTrip({
            user: req.user._id,
            title: title || `${duration}-Day Trip to ${destination}`,
            destination,
            duration: parseInt(duration) || 3,
            budget: parseInt(budget) || 0,
            preferences,
            content,
            estimatedCost,
            travelers: parseInt(travelers) || 2,
            emoji
        });

        await trip.save();

        res.json({ success: true, message: 'Trip saved successfully! 🎉', tripId: trip._id });
    } catch (error) {
        console.error('Save trip error:', error);
        res.status(500).json({ success: false, message: 'Failed to save trip. Please try again.' });
    }
});

// ─── GET: All Saved Trips for Current User ──────────────────────────────────
router.get('/my-trips', isLoggedIn, async (req, res) => {
    try {
        const trips = await SavedTrip.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.render('users/my-trips', {
            title: 'My Saved Trips | WanderLust',
            description: 'View and manage your saved AI-planned trip itineraries.',
            trips,
            currUser: req.user
        });
    } catch (error) {
        console.error('Fetch trips error:', error);
        req.flash('error', 'Could not load your saved trips.');
        res.redirect('/trip-planner');
    }
});

// ─── DELETE: Delete a Saved Trip ────────────────────────────────────────────
router.delete('/my-trips/:tripId', isLoggedIn, async (req, res) => {
    try {
        const trip = await SavedTrip.findOneAndDelete({
            _id: req.params.tripId,
            user: req.user._id // Ensure ownership
        });

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found.' });
        }

        res.json({ success: true, message: 'Trip deleted successfully.' });
    } catch (error) {
        console.error('Delete trip error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete trip.' });
    }
});

// ─── GET: View a Single Saved Trip ──────────────────────────────────────────
router.get('/my-trips/:tripId', isLoggedIn, async (req, res) => {
    try {
        const trip = await SavedTrip.findOne({
            _id: req.params.tripId,
            user: req.user._id
        }).lean();

        if (!trip) {
            req.flash('error', 'Trip not found.');
            return res.redirect('/api/trip/my-trips');
        }

        res.render('users/trip-detail', {
            title: `${trip.destination} Itinerary | WanderLust`,
            description: `Detailed ${trip.duration}-day itinerary for ${trip.destination}.`,
            trip,
            currUser: req.user
        });
    } catch (error) {
        req.flash('error', 'Could not load trip details.');
        res.redirect('/api/trip/my-trips');
    }
});

// ─── Helpers ────────────────────────────────────────────────────────────────
function _pruneConversations(currentId) {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id] of conversationHistory.entries()) {
        if (id !== currentId && Number(id) < oneHourAgo) {
            conversationHistory.delete(id);
        }
    }
    if (conversationHistory.size > 100) {
        const keys = [...conversationHistory.keys()].slice(0, 50);
        keys.forEach(k => conversationHistory.delete(k));
    }
}

function _pickEmoji(destination = '') {
    const d = destination.toLowerCase();
    if (d.includes('goa') || d.includes('beach') || d.includes('kerala')) return '🏖️';
    if (d.includes('manali') || d.includes('shimla') || d.includes('snow') || d.includes('leh')) return '🏔️';
    if (d.includes('rishikesh') || d.includes('adventure') || d.includes('rafting')) return '🛶';
    if (d.includes('rajasthan') || d.includes('jaipur') || d.includes('udaipur')) return '🏰';
    if (d.includes('mumbai') || d.includes('delhi') || d.includes('bangalore') || d.includes('city')) return '🏙️';
    if (d.includes('forest') || d.includes('wildlife') || d.includes('jim corbett')) return '🦁';
    return '✈️';
}

module.exports = router;
