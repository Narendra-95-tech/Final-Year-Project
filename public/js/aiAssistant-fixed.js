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
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('WebSocket connection established');
                this.updateConnectionStatus('connected');
                this.syncData();
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
            this.socket.onclose = () => {
                console.log('WebSocket connection closed');
                this.updateConnectionStatus('disconnected');
                // Attempt to reconnect after a delay
                setTimeout(() => this.initializeWebSocket(), 5000);
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error');
            };
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            this.updateConnectionStatus('error');
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
                            <i class="fas fa-plane-departure"></i>
                            <div class="connection-status"></div>
                        </div>
                        <div class="header-content">
                            <h3>WanderAI Assistant</h3>
                            <div class="ai-status">
                                <span class="status-indicator online"></span>
                                <span class="status-text">Online</span>
                                <span class="typing-indicator">typing...</span>
                            </div>
                        </div>
                        <div class="ai-actions">
                            <button class="ai-action-btn" id="toggleSidebar" title="Toggle sidebar">
                                <i class="fas fa-columns"></i>
                            </button>
                            <button class="ai-action-btn" id="toggleTheme" title="Toggle theme">
                                <i class="fas fa-moon"></i>
                            </button>
                            <button class="ai-action-btn ai-settings" title="Settings">
                                <i class="fas fa-cog"></i>
                            </button>
                            <button class="ai-action-btn ai-minimize" title="Minimize">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="ai-action-btn ai-close" title="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Conversation Area -->
                    <div class="ai-assistant-messages">
                        <div class="welcome-message">
                            <h3>Welcome to WanderAI!</h3>
                            <p>I'm your personal travel assistant. How can I help you today?</p>
                            <div class="quick-starter">
                                <button class="quick-starter-btn" data-query="Plan a 7-day trip to Japan">
                                    <i class="fas fa-plane"></i> Plan a Trip
                                </button>
                                <button class="quick-starter-btn" data-query="Find best beaches in Thailand">
                                    <i class="fas fa-umbrella-beach"></i> Find Destinations
                                </button>
                                <button class="quick-starter-btn" data-query="Book a hotel in Paris">
                                    <i class="fas fa-hotel"></i> Book Accommodation
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div class="ai-assistant-input">
                        <div class="quick-actions">
                            <button class="quick-btn" data-command="Plan trip">
                                <i class="fas fa-route"></i> <span>Trip Plan</span>
                            </button>
                            <button class="quick-btn" data-command="Weather forecast">
                                <i class="fas fa-cloud-sun"></i> <span>Weather</span>
                            </button>
                            <button class="quick-btn" data-command="Budget help">
                                <i class="fas fa-wallet"></i> <span>Budget</span>
                            </button>
                            <button class="quick-btn" data-command="Packing list">
                                <i class="fas fa-suitcase"></i> <span>Packing</span>
                            </button>
                            <button class="quick-btn more-options">
                                <i class="fas fa-ellipsis-h"></i> <span>More</span>
                            </button>
                        </div>
                        
                        <div class="typing-indicator" style="display: none;">
                            <span></span><span></span><span></span>
                        </div>
                        
                        <div class="input-group">
                            <div class="input-actions">
                                <button class="action-btn" id="attachFile" title="Attach file">
                                    <i class="fas fa-paperclip"></i>
                                </button>
                                <button class="action-btn" id="voiceInput" title="Voice input">
                                    <i class="fas fa-microphone"></i>
                                </button>
                                <div class="language-selector" title="Select language">
                                    <span class="language-flag">🌐</span>
                                    <select id="languageSelect" class="language-selector-dropdown">
                                    ${this.supportedLanguages.map(lang => 
                                        `<option value="${lang.code}" data-flag="${lang.flag}" ${this.userPreferences.language === lang.code ? 'selected' : ''}>
                                            ${lang.flag} ${lang.name}
                                        </option>`
                                    ).join('')}
                                </select>
                                </div>
                            </div>
                            
                            <div 
                                id="messageInput" 
                                class="message-input" 
                                contenteditable="true" 
                                placeholder="Ask me anything about your trip..."
                        role="textbox"
                        aria-multiline="true"
                    ></div>
                    <button class="voice-btn" title="Voice input">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button class="send-btn" title="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // Initialize event listeners
        this.initializeEventListeners();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Toggle chat visibility
        const toggleButton = document.querySelector('.ai-minimize');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggle(!this.isOpen));
        }

        // Close button
        const closeButton = document.querySelector('.ai-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }

        // Send button
        const sendButton = this.container.querySelector('.send-btn');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        // Voice input button
        const voiceButton = this.container.querySelector('.voice-btn');
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
    handleSendMessage() {
        const input = this.container.querySelector('.message-input');
        if (!input) return;

        const message = input.textContent.trim();
        if (!message) return;

        // Clear the input
        input.textContent = '';
        
        // Add the message to the chat
        this.handleUserInput(message);
    }

    // Process user message and generate response
    async handleUserInput(message) {
        this.addMessage('user', message);
        this.showTypingIndicator();
        
        try {
            // Check for specific commands or intents
            const lowerMessage = message.toLowerCase();
            
            if (this.isGreeting(lowerMessage)) {
                this.handleGreeting();
            } else if (lowerMessage.includes('itinerary') || lowerMessage.includes('plan my trip')) {
                await this.handleItineraryRequest(message);
            } else if (lowerMessage.includes('weather') || lowerMessage.includes('forecast')) {
                await this.handleWeatherRequest(message);
            } else if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
                this.handleBudgetPlanning(message);
            } else if (lowerMessage.includes('packing') || lowerMessage.includes('what to pack')) {
                this.generatePackingList(message);
            } else if (lowerMessage.includes('translate') || lowerMessage.includes('how to say')) {
                this.handleTranslationRequest(message);
            } else if (lowerMessage.includes('currency') || lowerMessage.includes('exchange rate')) {
                this.handleCurrencyConversion(message);
            } else if (lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
                this.provideEmergencyInfo();
            } else if (lowerMessage.includes('transport') || lowerMessage.includes('how to get')) {
                this.provideTransportationInfo(message);
            } else if (lowerMessage.includes('culture') || lowerMessage.includes('etiquette')) {
                this.provideCulturalTips(message);
            } else if (lowerMessage.includes('food') || lowerMessage.includes('restaurant')) {
                this.recommendLocalFood(message);
            } else {
                // Default response for general queries
                this.addMessage('assistant', 'I can help you with various travel-related queries. Here are some things I can assist with:\n\n' +
                    '• Plan a travel itinerary\n' +
                    '• Check weather forecasts\n' +
                    '• Budget planning\n' +
                    '• Packing lists\n' +
                    '• Language translation\n' +
                    '• Currency conversion\n' +
                    '• Local transportation\n' +
                    '• Cultural tips\n\n' +
                    'How can I assist you today?');
                this.addMessage('assistant', 'I can help you with travel planning, finding places, and more. Try asking me to plan a trip or find local attractions!');
            }
        } catch (error) {
            console.error('Error processing message:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        } finally {
            this.hideTypingIndicator();
        }
    }

    // Toggle voice recognition
    toggleVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            this.addSystemMessage('Speech recognition is not supported in your browser.');
            return;
        }

        if (!this.recognition) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const input = this.container.querySelector('.message-input');
                if (input) {
                    input.textContent = transcript;
                    // Trigger the send after a short delay
                    setTimeout(() => this.handleSendMessage(), 500);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.addSystemMessage('Error: ' + event.error);
            };
        }

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.container.querySelector('.voice-btn').classList.remove('listening');
        } else {
            this.recognition.start();
            this.isListening = true;
            this.container.querySelector('.voice-btn').classList.add('listening');
        }
    }

    // Handle trip planning queries
    async handleTripPlanningQuery(query) {
        try {
            // In a real implementation, this would call your backend API
            // For now, we'll use a simple response
            this.addMessage('assistant', 'I can help you plan your trip! Please provide more details like: ' +
                '\n• Destination\n• Travel dates\n• Number of travelers\n• Budget\n• Interests (e.g., adventure, relaxation, culture)');
        } catch (error) {
            console.error('Error handling trip planning query:', error);
            this.addSystemMessage('Sorry, I encountered an error while planning your trip. Please try again.');
        }
    }

    // Add a message to the chat
    addMessage(sender, content) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'assistant') {
            messageContent.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-text">${this.formatMessageContent(content)}</div>
            `;
        } else {
            messageContent.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-text">${this.formatMessageContent(content)}</div>
            `;
        }
        
        messageDiv.appendChild(messageContent);
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
            
            // Add keyboard shortcut (Alt+A) to toggle the assistant
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    window.wanderAI.toggle();
                }
            });
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
