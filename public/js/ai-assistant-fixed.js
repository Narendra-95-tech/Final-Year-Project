class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.isListening = false;
        this.chatHistory = [];
        this.recognition = null;
        this.synth = window.speechSynthesis;
        this.mapboxAccessToken = 'pk.eyJ1IjoibmFyZW5kcmE5NSIsImV4cGlyZXMiOjE3MzU1Njg4MDB9.abcdefghijklmnopqrstuvwxyz';
        
        // Create and append the container
        this.container = document.createElement('div');
        this.container.className = 'ai-assistant';
        this.container.style.display = 'flex';
        document.body.appendChild(this.container);
        
        this.initialize();
        this.loadChatHistory();
    }

    initialize() {
        // Create the main container with glass morphism effect
        this.container.innerHTML = `
            <div class="ai-assistant-header">
                <div class="ai-avatar">
                    <i class="fas fa-plane-departure"></i>
                </div>
                <div class="header-content">
                    <h3>WanderAI Assistant</h3>
                    <div class="ai-status">Online</div>
                </div>
                <div class="header-actions">
                    <button class="ai-header-btn" id="minimizeBtn">
                        <i class="fas fa-window-minimize"></i>
                    </button>
                    <button class="ai-header-btn" id="closeBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="ai-assistant-messages">
                <div class="welcome-message">
                    <div class="ai-msg">
                        <div class="ai-avatar small">
                            <i class="fas fa-plane-departure"></i>
                        </div>
                        <div class="message-content">
                            <div class="message-text">
                                <p>👋 Hi there! I'm your WanderAI assistant. How can I help you today?</p>
                                <div class="quick-actions">
                                    <button class="quick-btn" data-action="plan-trip">Plan a Trip</button>
                                    <button class="quick-btn" data-action="find-hotels">Find Hotels</button>
                                    <button class="quick-btn" data-action="local-guide">Local Guide</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="typing-indicator" id="typingIndicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
            
            <div class="ai-assistant-input">
                <div class="input-group">
                    <div class="file-upload-btn">
                        <input type="file" id="fileUpload" accept="image/*" style="display: none;">
                        <button type="button" id="attachBtn" title="Attach Image">
                            <i class="fas fa-paperclip"></i>
                        </button>
                    </div>
                    <div class="message-input" contenteditable="true" id="messageInput" placeholder="Type your message..."></div>
                    <button type="button" id="voiceBtn" title="Voice Input">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button type="button" id="sendBtn" class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // Store references to important elements
        this.messagesContainer = this.container.querySelector('.ai-assistant-messages');
        this.messageInput = this.container.querySelector('#messageInput');
        this.typingIndicator = this.container.querySelector('#typingIndicator');
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Show the assistant by default
        this.toggle(true);
    }

    initializeEventListeners() {
        // Toggle buttons
        this.container.querySelector('#minimizeBtn').addEventListener('click', () => this.toggle(false));
        this.container.querySelector('#closeBtn').addEventListener('click', () => this.close());
        
        // Message input
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // Send button
        this.container.querySelector('#sendBtn').addEventListener('click', () => this.handleSendMessage());
        
        // Voice input
        this.container.querySelector('#voiceBtn').addEventListener('click', () => this.toggleVoiceRecognition());
        
        // File upload
        const fileInput = this.container.querySelector('#fileUpload');
        this.container.querySelector('#attachBtn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        
        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    // Toggle chat visibility
    toggle(show = !this.isOpen) {
        this.isOpen = show;
        if (show) {
            this.container.classList.add('visible');
            this.messageInput.focus();
        } else {
            this.container.classList.remove('visible');
        }
    }

    // Close the chat
    close() {
        this.container.remove();
        // Remove the floating button if it exists
        const floatBtn = document.querySelector('.ai-assistant-float');
        if (floatBtn) floatBtn.remove();
    }

    // Handle sending a message
    handleSendMessage() {
        const message = this.messageInput.textContent.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        this.messageInput.textContent = '';
        
        // Process the message
        this.processMessage(message);
    }

    // Process user message and generate response
    async processMessage(message) {
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Check for specific commands
            if (message.toLowerCase().includes('trip') || message.toLowerCase().includes('plan')) {
                await this.handleTripPlanningQuery(message);
            } else if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('temperature')) {
                await this.getWeatherInfo(message);
            } else if (message.toLowerCase().includes('hotel') || message.toLowerCase().includes('stay')) {
                await this.searchNearbyPlaces('hotels', message);
            } else if (message.toLowerCase().includes('restaurant') || message.toLowerCase().includes('food') || message.toLowerCase().includes('eat')) {
                await this.searchNearbyPlaces('restaurants', message);
            } else if (message.toLowerCase().includes('dhaba')) {
                await this.searchNearbyPlaces('dhabas', message);
            } else if (message.toLowerCase().includes('vehicle') || message.toLowerCase().includes('car') || message.toLowerCase().includes('bike')) {
                await this.searchNearbyPlaces('vehicles', message);
            } else {
                // Default response for general queries
                this.addMessage('assistant', `I'm your travel assistant. I can help you with:
- Planning trips
- Finding hotels and accommodations
- Local restaurant and dhaba recommendations
- Vehicle rentals
- Weather information

How can I assist you today?`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            this.addSystemMessage('Sorry, I encountered an error. Please try again.');
        } finally {
            this.hideTypingIndicator();
        }
    }

    // Toggle voice recognition
    toggleVoiceRecognition() {
        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }

    // Start voice recognition
    startVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            this.addSystemMessage('Your browser does not support speech recognition.');
            return;
        }

        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.container.querySelector('#voiceBtn').classList.add('listening');
            this.addSystemMessage('Listening...');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.messageInput.textContent = transcript;
            this.handleSendMessage();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.addSystemMessage('Error: ' + event.error);
            this.stopVoiceRecognition();
        };

        this.recognition.onend = () => {
            this.stopVoiceRecognition();
        };

        this.recognition.start();
    }

    // Stop voice recognition
    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        const voiceBtn = this.container.querySelector('#voiceBtn');
        if (voiceBtn) voiceBtn.classList.remove('listening');
    }

    // Handle file uploads (images)
    handleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            this.addSystemMessage('Please upload an image file.');
            return;
        }
        
        this.analyzeImage(file);
    }

    // Analyze uploaded image
    async analyzeImage(file) {
        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '100%';
                img.style.borderRadius = '8px';
                
                this.addMessage('user', 'I found this image:');
                const message = this.container.querySelector('.ai-assistant-messages .message:last-child .message-text');
                if (message) {
                    message.appendChild(document.createElement('br'));
                    message.appendChild(img);
                    
                    // Simulate image recognition
                    setTimeout(() => {
                        this.addMessage('assistant', 'I see this is an image of a travel destination. How can I assist you with it?');
                    }, 1000);
                }
            };
            
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                this.addSystemMessage('Sorry, I had trouble reading that image. Please try another one.');
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error processing image:', error);
            this.addSystemMessage('Sorry, I had trouble analyzing that image. Please try another one.');
        }
    }

    // Handle quick actions
    handleQuickAction(action) {
        let message = '';
        switch (action) {
            case 'plan-trip':
                message = 'Plan a 3-day trip to a hill station';
                break;
            case 'find-hotels':
                message = 'Find hotels in New Delhi';
                break;
            case 'local-guide':
                message = 'What are the best places to visit in Mumbai?';
                break;
            default:
                message = 'How can I help you with your travel plans?';
        }
        
        this.addMessage('user', message);
        this.processMessage(message);
    }

    // Add a message to the chat
    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'assistant') {
            const avatar = document.createElement('div');
            avatar.className = 'ai-avatar small';
            avatar.innerHTML = '<i class="fas fa-plane-departure"></i>';
            messageContent.appendChild(avatar);
        }
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // Check if content is HTML or plain text
        if (typeof content === 'string' && (content.startsWith('<') || content.includes('<'))) {
            messageText.innerHTML = content;
        } else {
            messageText.textContent = content;
        }
        
        messageContent.appendChild(messageText);
        
        if (sender === 'user') {
            const userAvatar = document.createElement('div');
            userAvatar.className = 'ai-avatar small user';
            userAvatar.innerHTML = '<i class="fas fa-user"></i>';
            messageContent.appendChild(userAvatar);
        }
        
        messageDiv.appendChild(messageContent);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Save to chat history
        this.saveToHistory(sender, content);
    }

    // Add a system message
    addSystemMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = content;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // Show typing indicator
    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    // Hide typing indicator
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    // Scroll to bottom of messages
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    // Save message to chat history
    saveToHistory(sender, content) {
        this.chatHistory.push({ sender, content, timestamp: new Date().toISOString() });
        this.saveChatHistory();
    }

    // Load chat history from localStorage
    loadChatHistory() {
        try {
            const savedHistory = localStorage.getItem('aiAssistantChatHistory');
            if (savedHistory) {
                this.chatHistory = JSON.parse(savedHistory);
                // Optionally, you could display the chat history here
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    // Save chat history to localStorage
    saveChatHistory() {
        try {
            // Keep only the last 50 messages to prevent localStorage overflow
            const recentHistory = this.chatHistory.slice(-50);
            localStorage.setItem('aiAssistantChatHistory', JSON.stringify(recentHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    // Handle trip planning queries
    async handleTripPlanningQuery(query) {
        try {
            // Show typing indicator
            this.showTypingIndicator();
            
            // In a real implementation, this would call your backend API
            // For now, we'll simulate a response
            const response = {
                success: true,
                data: {
                    destination: 'Manali, Himachal Pradesh',
                    duration: '5 days',
                    itinerary: [
                        { day: 1, activities: ['Arrive in Manali', 'Check-in at hotel', 'Explore Mall Road', 'Visit Hidimba Devi Temple'] },
                        { day: 2, activities: ['Excursion to Solang Valley', 'Adventure activities (paragliding, zorbing)'] },
                        { day: 3, activities: ['Visit Rohtang Pass (if open)', 'Visit Sissu and Atal Tunnel'] },
                        { day: 4, activities: ['Visit Old Manali', 'Explore local cafes', 'Shopping at Mall Road'] },
                        { day: 5, activities: ['Relax at hotel', 'Departure'] }
                    ],
                    recommendations: [
                        'Best time to visit: March to June',
                        'Carry warm clothes, even in summer',
                        'Book adventure activities in advance during peak season'
                    ]
                }
            };
            
            // Display the trip plan
            this.displayTripPlan(response.data);
            
        } catch (error) {
            console.error('Error planning trip:', error);
            this.addSystemMessage('Sorry, I encountered an error while planning your trip. Please try again.');
        } finally {
            this.hideTypingIndicator();
        }
    }

    // Display trip plan in a formatted way
    displayTripPlan(plan) {
        let html = `
            <div class="trip-plan">
                <h4>Your ${plan.duration} Trip to ${plan.destination}</h4>
                <div class="itinerary">
                    ${plan.itinerary.map(day => `
                        <div class="day-plan">
                            <h5>Day ${day.day}</h5>
                            <ul>
                                ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
                <div class="recommendations">
                    <h5>Recommendations:</h5>
                    <ul>
                        ${plan.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        this.addMessage('assistant', html);
    }

    // Search for nearby places
    async searchNearbyPlaces(type, query) {
        try {
            this.showTypingIndicator();
            
            // Simulate API call
            setTimeout(() => {
                let results = [];
                let title = '';
                
                if (type === 'hotels') {
                    title = 'Hotels in ' + (query.includes('in ') ? query.split('in ')[1] : 'your area');
                    results = [
                        { name: 'Taj Palace', rating: 4.8, price: '₹8,000', distance: '1.2 km' },
                        { name: 'The Oberoi', rating: 4.9, price: '₹12,000', distance: '2.5 km' },
                        { name: 'ITC Maurya', rating: 4.7, price: '₹10,500', distance: '3.1 km' },
                        { name: 'The Leela Palace', rating: 4.8, price: '₹15,000', distance: '4.2 km' },
                        { name: 'The Lalit', rating: 4.5, price: '₹7,500', distance: '0.8 km' }
                    ];
                } else if (type === 'restaurants' || type === 'dhabas') {
                    title = type === 'restaurants' ? 'Restaurants' : 'Dhabas';
                    title += ' in ' + (query.includes('in ') ? query.split('in ')[1] : 'your area');
                    
                    results = type === 'restaurants' ? [
                        { name: 'Indian Accent', cuisine: 'Indian', rating: 4.8, price: '₹2,500', distance: '1.5 km' },
                        { name: 'Bukhara', cuisine: 'North Indian', rating: 4.9, price: '₹3,000', distance: '2.1 km' },
                        { name: 'Dum Pukht', cuisine: 'Awadhi', rating: 4.7, price: '₹2,800', distance: '1.8 km' },
                        { name: 'Karim\'s', cuisine: 'Mughlai', rating: 4.6, price: '₹1,200', distance: '0.7 km' },
                        { name: 'Sagar Ratna', cuisine: 'South Indian', rating: 4.4, price: '₹800', distance: '1.2 km' }
                    ] : [
                        { name: 'Haveli Dhaba', cuisine: 'Punjabi', rating: 4.5, price: '₹500', distance: '3.2 km' },
                        { name: 'Punjabi Dhaba', cuisine: 'Punjabi', rating: 4.3, price: '₹400', distance: '2.8 km' },
                        { name: 'Baba Ka Dhaba', cuisine: 'North Indian', rating: 4.2, price: '₹350', distance: '1.5 km' },
                        { name: 'Sukhdev Dhaba', cuisine: 'Punjabi', rating: 4.4, price: '₹450', distance: '5.1 km' },
                        { name: 'Amrik Sukhdev Dhaba', cuisine: 'Punjabi', rating: 4.6, price: '₹550', distance: '4.3 km' }
                    ];
                } else if (type === 'vehicles') {
                    title = 'Vehicle Rentals';
                    results = [
                        { type: 'SUV', name: 'Toyota Fortuner', price: '₹3,500/day', rating: 4.7, available: true },
                        { type: 'Sedan', name: 'Honda City', price: '₹2,000/day', rating: 4.5, available: true },
                        { type: 'Bike', name: 'Royal Enfield Classic 350', price: '₹1,500/day', rating: 4.8, available: true },
                        { type: 'SUV', name: 'Hyundai Creta', price: '₹2,800/day', rating: 4.6, available: true },
                        { type: 'Bike', name: 'KTM Duke 390', price: '₹2,000/day', rating: 4.7, available: true }
                    ];
                }
                
                // Display results
                let html = `
                    <div class="search-results">
                        <h4>${title}</h4>
                        <div class="results-grid">
                            ${results.map(item => `
                                <div class="result-item">
                                    <div class="item-name">${item.name}</div>
                                    ${item.cuisine ? `<div class="item-cuisine">${item.cuisine}</div>` : ''}
                                    <div class="item-rating">
                                        <span class="stars">${'★'.repeat(Math.floor(item.rating))}${'☆'.repeat(5-Math.floor(item.rating))}</span>
                                        <span class="rating">${item.rating}</span>
                                    </div>
                                    <div class="item-price">${item.price}${item.distance ? ` • ${item.distance}` : ''}</div>
                                    ${item.available === false ? '<div class="not-available">Not Available</div>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                this.addMessage('assistant', html);
                this.hideTypingIndicator();
            }, 1000);
            
        } catch (error) {
            console.error('Error searching for places:', error);
            this.addSystemMessage('Sorry, I encountered an error while searching. Please try again.');
            this.hideTypingIndicator();
        }
    }

    // Get weather information
    async getWeatherInfo(location) {
        try {
            this.showTypingIndicator();
            
            // Simulate API call
            setTimeout(() => {
                const weatherData = {
                    location: location.includes('in ') ? location.split('in ')[1] : 'your location',
                    temperature: '28°C',
                    condition: 'Sunny',
                    icon: '☀️',
                    humidity: '45%',
                    wind: '12 km/h',
                    forecast: [
                        { day: 'Today', high: '30°C', low: '22°C', condition: 'Sunny', icon: '☀️' },
                        { day: 'Tomorrow', high: '29°C', low: '21°C', condition: 'Partly Cloudy', icon: '⛅' },
                        { day: 'Day 3', high: '27°C', low: '20°C', condition: 'Rainy', icon: '🌧️' },
                        { day: 'Day 4', high: '26°C', low: '19°C', condition: 'Cloudy', icon: '☁️' },
                        { day: 'Day 5', high: '28°C', low: '20°C', condition: 'Sunny', icon: '☀️' }
                    ]
                };
                
                let html = `
                    <div class="weather-widget">
                        <h4>Weather in ${weatherData.location}</h4>
                        <div class="current-weather">
                            <div class="weather-main">
                                <div class="temp">${weatherData.temperature}</div>
                                <div class="condition">
                                    <span class="weather-icon">${weatherData.icon}</span>
                                    <span>${weatherData.condition}</span>
                                </div>
                            </div>
                            <div class="weather-details">
                                <div><i class="fas fa-tint"></i> Humidity: ${weatherData.humidity}</div>
                                <div><i class="fas fa-wind"></i> Wind: ${weatherData.wind}</div>
                            </div>
                        </div>
                        <div class="weather-forecast">
                            ${weatherData.forecast.map(day => `
                                <div class="forecast-day">
                                    <div class="day">${day.day}</div>
                                    <div class="forecast-icon">${day.icon}</div>
                                    <div class="forecast-temp">
                                        <span class="high">${day.high}</span>
                                        <span class="low">${day.low}</span>
                                    </div>
                                    <div class="forecast-condition">${day.condition}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                this.addMessage('assistant', html);
                this.hideTypingIndicator();
            }, 1000);
            
        } catch (error) {
            console.error('Error getting weather:', error);
            this.addSystemMessage('Sorry, I couldn\'t fetch the weather information. Please try again.');
            this.hideTypingIndicator();
        }
    }
}

// Initialize the AI Assistant when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if the AI Assistant is enabled for this page
    const aiAssistantEnabled = !document.body.hasAttribute('data-disable-ai-assistant');
    
    if (aiAssistantEnabled) {
        // Add the AI Assistant styles
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/css/ai-assistant.css';
        
        // Create the floating assistant button
        const floatingButton = document.createElement('div');
        floatingButton.className = 'ai-assistant-float';
        floatingButton.innerHTML = '<i class="fas fa-comment-dots"></i>';
        floatingButton.onclick = () => window.wanderAI.toggle();
        
        // Add the floating button to the page
        document.body.appendChild(floatingButton);
        
        // Load the AI Assistant
        styleLink.onload = () => {
            // Initialize the AI Assistant
            window.wanderAI = new AIAssistant();
            
            // Auto-open after a short delay (optional)
            setTimeout(() => window.wanderAI.toggle(true), 1000);
        };
        
        document.head.appendChild(styleLink);
        
        // Add Font Awesome if not already loaded
        if (!document.querySelector('link[href*="font-awesome"]') && !document.querySelector('link[href*="fontawesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            document.head.appendChild(fontAwesome);
        }
    }
});
