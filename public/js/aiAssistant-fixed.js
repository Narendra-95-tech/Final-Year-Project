class AIAssistant {
    constructor() {
        // Core State
        this.isOpen = false;
        this.isListening = false;
        this.isTyping = false;
        this.chatHistory = [];
        this.recognition = null;
        this.synth = window.speechSynthesis;
        this.activeRequests = new Set();

        // API Keys and Services
        this.mapboxAccessToken = 'pk.eyJ1IjoibmFyZW5kcmE5NSIsImV4cGlyZXMiOjE3MzU1Njg4MDB9.abcdefghijklmnopqrstuvwxyz';
        this.weatherAPIKey = 'YOUR_WEATHER_API_KEY';
        this.translationAPIKey = 'YOUR_TRANSLATION_API_KEY';

        // Available Languages
        this.supportedLanguages = [
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'it', name: 'Italiano', flag: '🇮🇹' },
            { code: 'pt', name: 'Português', flag: '🇵🇹' },
            { code: 'ru', name: 'Русский', flag: '🇷🇺' },
            { code: 'zh', name: '中文', flag: '🇨🇳' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'ko', name: '한국어', flag: '🇰🇷' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
            { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
            { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
            { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
            { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
            { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
            { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
            { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
            { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
            { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' }
        ];

        // User Preferences
        this.userPreferences = JSON.parse(localStorage.getItem('aiAssistantPreferences')) || {
            language: 'en',
            currency: 'USD',
            theme: 'light',
            notifications: true,
            voiceEnabled: true,
            autoTranslate: true,
            accessibility: {
                highContrast: false,
                fontSize: 'medium',
                reduceMotion: false
            },
            privacy: {
                locationSharing: 'on-demand',
                dataCollection: 'essential',
                personalizedAds: false
            },
            social: {
                shareLocation: false,
                shareItinerary: false,
                autoPost: false
            },
            payment: {
                defaultMethod: 'card',
                saveCards: false,
                currency: 'USD',
                preferredProviders: ['visa', 'mastercard']
            },
            offline: {
                cacheMaps: true,
                saveItinerary: true,
                downloadGuides: false
            }
        };

        // Current Context
        this.currentContext = {
            tripDetails: null,
            currentLocation: null,
            budget: {
                total: 0,
                daily: 0,
                categories: {}
            },
            travelDates: {
                start: null,
                end: null,
                duration: 0
            },
            interests: [],
            travelCompanions: [],
            dietaryRestrictions: [],
            accessibilityNeeds: [],
            savedPlaces: [],
            recentSearches: []
        };

        // AI Capabilities
        this.capabilities = {
            naturalLanguageUnderstanding: true,
            imageRecognition: true,
            voiceCommands: true,
            offlineMode: false,
            realTimeUpdates: true
        };

        // Initialize WebSocket for real-time updates
        this.initializeWebSocket();

        // Create and append the container immediately
        this.container = document.createElement('div');
        this.container.className = 'ai-assistant';
        this.container.style.display = 'flex'; // Make it visible by default
        document.body.appendChild(this.container);

        this.initialize();
        this.loadChatHistory();
    }

    // Initialize WebSocket connection for real-time features
    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${window.location.host}/ws/assistant`;

        try {
            // Using Socket.IO client library (loaded in boilerplate)
            if (typeof io !== 'undefined') {
                this.socket = io({
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    console.log('Socket.IO connection established');
                    this.updateConnectionStatus('connected');

                    // Authenticate if user ID exists
                    const userId = document.querySelector('meta[name="user-id"]')?.content;
                    if (userId) {
                        this.socket.emit('authenticate', userId);
                    }
                });

                this.socket.on('ai_response', (data) => {
                    this.handleRealTimeUpdate(data);
                });

                this.socket.on('disconnect', () => {
                    console.log('Socket.IO disconnected');
                    this.updateConnectionStatus('disconnected');
                });

                this.socket.on('connect_error', (error) => {
                    console.error('Socket.IO error:', error);
                    this.updateConnectionStatus('error');
                });
            } else {
                console.warn('Socket.IO library not loaded, falling back to HTTP only');
            }
        } catch (error) {
            console.error('Failed to initialize Socket.IO:', error);
            this.updateConnectionStatus('error');
        }
    }

    updateConnectionStatus(status) {
        const statusIndicator = this.container?.querySelector('.status-indicator');
        const statusText = this.container?.querySelector('.status-text');

        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${status}`;
            statusText.textContent = status === 'connected' ? 'Online' : status === 'disconnected' ? 'Offline' : 'Error';
        }
    }

    // Initialize the AI Assistant UI with enhanced features
    initialize() {
        // Create the main container with glass morphism effect
        this.container.innerHTML = `
            <div class="ai-assistant-container">
                <!-- Main Chat Interface -->
                <div class="ai-assistant-main">
                    <div class="ai-assistant-header">
                        <div class="ai-avatar">
                            <i class="fas fa-robot"></i>
                            <div class="connection-status"></div>
                        </div>
                        <div class="header-content">
                            <h3>WanderAI</h3>
                            <div class="ai-status">
                                <span class="status-indicator online"></span>
                                <span class="status-text">Online</span>
                            </div>
                        </div>
                        <div class="ai-actions">
                            <button class="ai-header-btn" id="toggleTheme" title="Toggle theme">
                                <i class="fas fa-moon"></i>
                            </button>
                            <button class="ai-header-btn ai-minimize" title="Minimize">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="ai-header-btn ai-close" title="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Conversation Area -->
                    <div class="ai-assistant-messages">
                        <div class="welcome-message">
                            <h3>Hi there! 👋</h3>
                            <p>I'm your AI travel companion. Ask me anything!</p>
                            <div class="quick-starter">
                                <button class="quick-starter-btn" onclick="window.wanderAI.handleSendMessage('Plan a trip to Goa')">
                                    <i class="fas fa-plane"></i> Plan a trip to Goa
                                </button>
                                <button class="quick-starter-btn" onclick="window.wanderAI.handleSendMessage('Find hotels in Mumbai')">
                                    <i class="fas fa-hotel"></i> Find hotels in Mumbai
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div class="ai-assistant-input">
                        <div class="typing-indicator" style="display: none;">
                            <span></span><span></span><span></span>
                        </div>
                        
                        <div class="input-container">
                            <div class="input-wrapper">
                                <button class="input-action-btn" id="voiceInput" title="Voice Input">
                                    <i class="fas fa-microphone"></i>
                                </button>
                                <div 
                                    id="messageInput" 
                                    class="message-input" 
                                    contenteditable="true" 
                                    placeholder="Type your message..."
                                    role="textbox"
                                    aria-multiline="true"
                                ></div>
                                <button class="send-btn" title="Send">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize event listeners
        this.initializeEventListeners();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Toggle chat visibility (Minimize)
        const toggleButton = this.container.querySelector('.ai-minimize');
        if (toggleButton) {
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle(false);
            });
        }

        // Close button
        const closeButton = this.container.querySelector('.ai-close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        // Theme Toggle
        const themeBtn = this.container.querySelector('#toggleTheme');
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Simple theme toggle logic (could be improved)
                this.container.classList.toggle('dark-mode');
            });
        }

        // Send button
        const sendButton = this.container.querySelector('.send-btn');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        // Voice input button
        const voiceButton = this.container.querySelector('#voiceInput');
        if (voiceButton) {
            voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
        }

        // Handle Enter key in message input
        const messageInput = this.container.querySelector('.message-input');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            // Auto-focus input when clicking container
            this.container.addEventListener('click', (e) => {
                // Don't focus if clicking buttons
                if (e.target.closest('button') || e.target.closest('.ai-card')) return;
                messageInput.focus();
            });
        }
    }

    // Toggle chat visibility
    toggle(show = !this.isOpen) {
        this.isOpen = show;
        if (this.isOpen) {
            this.container.classList.add('visible');
            // Focus the input when opening
            const input = this.container.querySelector('.message-input');
            if (input) input.focus();
        } else {
            this.container.classList.remove('visible');
        }
    }

    // Close the chat
    close() {
        this.container.style.display = 'none';
        this.isOpen = false;
    }

    // Handle sending a message
    handleSendMessage(autoMessage = null) {
        const input = this.container.querySelector('.message-input');
        const message = autoMessage || (input ? input.innerText.trim() : '');

        if (!message) return;

        // Clear the input
        if (input) input.innerText = '';

        // Add the message to the chat
        this.addMessage('user', message);
        this.sendMessageToBackend(message);
    }

    // Send message to backend via WebSocket or HTTP
    async sendMessageToBackend(message) {
        this.showTypingIndicator();

        try {
            const context = {
                location: this.currentContext?.currentLocation || null,
                path: window.location.pathname
            };

            const userId = document.querySelector('meta[name="user-id"]')?.content;
            const payload = {
                message,
                userId,
                context
            };

            // Try Socket.IO first
            if (this.socket && this.socket.connected) {
                this.socket.emit('ai_message', payload);
            } else {
                // Fallback to HTTP
                const response = await fetch('/ai/assistant/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                this.handleAIResponse(data);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', "I'm having trouble retrieving that information right now. Please try again.");
        }
    }

    // Handle incoming AI response
    handleAIResponse(data) {
        this.hideTypingIndicator();

        // 1. Show main text reply
        if (data.reply) {
            this.addMessage('assistant', data.reply);
        }

        // 2. Handle Rich Content (Cards/Carousels)
        if (data.type === 'function_result' && data.functionResult?.success) {
            const result = data.functionResult;

            if (data.functionCalled === 'search_listings' && result.count > 0) {
                this.renderCarousel(result.results, 'listing');
            } else if (data.functionCalled === 'search_vehicles' && result.count > 0) {
                this.renderCarousel(result.results, 'vehicle');
            } else if (data.functionCalled === 'search_dhabas' && result.count > 0) {
                this.renderCarousel(result.results, 'dhaba');
            } else if (data.functionCalled === 'get_user_bookings' && result.count > 0) {
                this.renderBookingsList(result.bookings);
            }
        }

        // 3. Show Suggestions
        if (data.suggestions && data.suggestions.length > 0) {
            this.showSuggestions(data.suggestions);
        }
    }

    // Render a horizontal carousel of cards
    renderCarousel(items, type) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'ai-carousel-container fade-in';

        let cardsHtml = '';
        items.forEach(item => {
            if (type === 'listing') cardsHtml += this.getListingCardHtml(item);
            else if (type === 'vehicle') cardsHtml += this.getVehicleCardHtml(item);
            else if (type === 'dhaba') cardsHtml += this.getDhabaCardHtml(item);
        });

        carouselContainer.innerHTML = `<div class="ai-carousel">${cardsHtml}</div>`;
        messagesContainer.appendChild(carouselContainer);
        this.scrollToBottom();
    }

    getListingCardHtml(item) {
        return `
            <div class="ai-card" onclick="window.location.href='/listings/${item.id}'">
                <div class="ai-card-img" style="background-image: url('${item.image || '/images/default-listing.jpg'}')">
                    <span class="ai-card-badge">${item.type}</span>
                </div>
                <div class="ai-card-content">
                    <h4>${item.title}</h4>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
                    <div class="ai-card-footer">
                        <span class="price">₹${item.price.toLocaleString()}</span>
                        <span class="rating"><i class="fas fa-star"></i> ${item.rating}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getVehicleCardHtml(item) {
        return `
            <div class="ai-card" onclick="window.location.href='/vehicles/${item.id}'">
                <div class="ai-card-img" style="background-image: url('${item.image || '/images/default-vehicle.jpg'}')">
                    <span class="ai-card-badge">${item.type}</span>
                </div>
                <div class="ai-card-content">
                    <h4>${item.name}</h4>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
                    <div class="ai-card-footer">
                        <span class="price">₹${item.price.toLocaleString()}/day</span>
                    </div>
                </div>
            </div>
        `;
    }

    getDhabaCardHtml(item) {
        return `
            <div class="ai-card" onclick="window.location.href='/dhabas/${item.id}'">
                <div class="ai-card-img" style="background-image: url('${item.image || '/images/default-dhaba.jpg'}')">
                    <span class="ai-card-badge">${item.cuisine || 'Dhaba'}</span>
                </div>
                <div class="ai-card-content">
                    <h4>${item.name}</h4>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
                    <div class="ai-card-footer">
                        <span class="rating"><i class="fas fa-star"></i> ${item.rating}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderBookingsList(bookings) {
        const html = bookings.map(b =>
            `<div class="booking-item">
                <strong>${b.item}</strong><br>
                <small>${new Date(b.startDate).toLocaleDateString()} - ${b.status}</small>
            </div>`
        ).join('');
        this.addMessage('assistant', `<div class="booking-list">${html}</div>`);
    }

    showSuggestions(suggestions) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'ai-assistant-options fade-in';

        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'ai-option-btn';
            btn.innerHTML = suggestion.text;
            btn.onclick = () => {
                this.handleSendMessage(suggestion.text);
            };
            optionsDiv.appendChild(btn);
        });

        messagesContainer.appendChild(optionsDiv);
        this.scrollToBottom();
    }

    // Handle real-time update from WebSocket
    handleRealTimeUpdate(data) {
        if (data.reply || data.type === 'function_result') {
            this.handleAIResponse(data);
        }
    }

    // Add a message to the chat
    addMessage(sender, content) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message fade-in`;

        // Direct HTML content without extra wrappers, assuming CSS handles '.message' as the bubble
        // and content needs formatting.
        if (content.includes('<div') || content.includes('<span')) {
            // Already HTML (e.g. from renderBookingsList)
            messageDiv.innerHTML = content;
        } else {
            messageDiv.innerHTML = this.formatMessageContent(content);
        }

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Save to chat history
        this.chatHistory.push({ sender, content });
        this.saveChatHistory();
    }

    // Add a system message (for errors, info, etc.)
    addSystemMessage(content) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        messageDiv.textContent = content;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // Format message content (escape HTML, handle links, etc.)
    formatMessageContent(content) {
        // Simple HTML escaping
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Convert URLs to links
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );

        return formatted;
    }

    // Scroll to the bottom of the messages
    scrollToBottom() {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Show typing indicator
    showTypingIndicator() {
        const typingIndicator = this.container.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            this.scrollToBottom();
        }
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const typingIndicator = this.container.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    toggleVoiceRecognition() {
        // Simple toggle for now, in a real implementation this would use Web Speech API
        this.isListening = !this.isListening;
        const voiceBtn = this.container.querySelector('#voiceInput');
        if (voiceBtn) {
            voiceBtn.style.color = this.isListening ? 'red' : '';
            if (this.isListening) {
                // Mock listening start
                this.addMessage('assistant', 'I am listening...');
            }
        }
    }

    // Load chat history from localStorage
    loadChatHistory() {
        try {
            const savedHistory = localStorage.getItem('wanderAI_chatHistory');
            if (savedHistory) {
                this.chatHistory = JSON.parse(savedHistory);
                // Optionally, you could also render the chat history here
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.chatHistory = [];
        }
    }

    // Save chat history to localStorage
    saveChatHistory() {
        try {
            localStorage.setItem('wanderAI_chatHistory', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }
}

// Initialize the AI Assistant when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if the AI Assistant is enabled for this page
    const aiAssistantEnabled = !document.body.hasAttribute('data-disable-ai-assistant');

    if (aiAssistantEnabled) {

        // Create the floating assistant button
        const floatingButton = document.createElement('div');
        floatingButton.className = 'ai-assistant-toggle';
        floatingButton.innerHTML = '<i class="fas fa-comment-dots"></i>';
        floatingButton.onclick = () => window.wanderAI.toggle();

        // Add the floating button to the page
        document.body.appendChild(floatingButton);

        // Initialize the AI Assistant
        window.wanderAI = new AIAssistant();

        // Auto-open after a short delay (optional)
        // setTimeout(() => window.wanderAI.toggle(true), 1000);

        // Add keyboard shortcut (Alt+A) to toggle the assistant
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                window.wanderAI.toggle();
            }
        });

        // Add Font Awesome if not already loaded
        if (!document.querySelector('link[href*="font-awesome"]') && !document.querySelector('link[href*="fontawesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            document.head.appendChild(fontAwesome);
        }

        console.log('✅ WanderAssistant initialized');
    }
});
