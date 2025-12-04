class AIAssistant {
    constructor() {
        // Prevent multiple initializations
        if (window.wanderAI) {
            console.warn('AI Assistant is already initialized');
            return window.wanderAI;
        }

        // Core state
        this.isOpen = false;
        this.chatHistory = [];
        this.state = {
            isOpen: false,
            conversationId: this.generateId()
        };

        // Initialize UI
        this.initializeUI();
        this.bindEvents();
        
        // Save reference
        window.wanderAI = this;
        console.log('AI Assistant initialized');
    }

    generateId() {
        return 'conv_' + Math.random().toString(36).substr(2, 9);
    }

    initializeUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'ai-assistant';
        this.container.className = 'ai-assistant';
        this.container.innerHTML = `
            <div class="ai-assistant-container">
                <div class="ai-assistant-header">
                    <h3>Travel Assistant</h3>
                    <button class="ai-close">×</button>
                </div>
                <div class="ai-messages"></div>
                <div class="ai-input-container">
                    <input type="text" id="ai-message-input" placeholder="Ask me anything about travel...">
                    <button class="ai-send">Send</button>
                </div>
            </div>
            <button class="ai-toggle">
                <i class="fas fa-comment-dots"></i>
            </button>
        `;
        document.body.appendChild(this.container);
    }

    bindEvents() {
        // Toggle button
        const toggleBtn = this.container.querySelector('.ai-toggle');
        const closeBtn = this.container.querySelector('.ai-close');
        const sendBtn = this.container.querySelector('.ai-send');
        const input = this.container.querySelector('#ai-message-input');

        toggleBtn.addEventListener('click', (e) => this.toggle(e));
        closeBtn.addEventListener('click', (e) => this.toggle(e, false));
        sendBtn.addEventListener('click', () => this.handleSend());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    toggle(event, show = !this.isOpen) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        this.isOpen = show;
        this.container.classList.toggle('open', show);
        
        if (show) {
            this.container.querySelector('#ai-message-input').focus();
        }
    }

    async handleSend() {
        const input = this.container.querySelector('#ai-message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message to chat
        this.addMessage('user', message);
        
        try {
            // Simulate AI response (replace with actual API call)
            setTimeout(() => {
                this.addMessage('assistant', 'I\'m here to help with your travel plans! This is a demo response.');
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }

    addMessage(role, content) {
        const messagesContainer = this.container.querySelector('.ai-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ${role}`;
        messageEl.textContent = content;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.wanderAI) {
        window.wanderAI = new AIAssistant();
    }
});
    constructor() {
        // Prevent multiple initializations
        if (window.wanderAI) {
            console.warn('AI Assistant is already initialized');
            return window.wanderAI;
        }

        // Core state
        this.isOpen = false;
        this.chatHistory = [];
        this.state = {
            isOpen: false,
            conversationId: this.generateId()
        };

        // Initialize UI
        this.initializeUI();
        this.bindEvents();
        
        // Save reference
        window.wanderAI = this;
        console.log('AI Assistant initialized');
    }

    generateId() {
        return 'conv_' + Math.random().toString(36).substr(2, 9);
    }

    initializeUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'ai-assistant';
        this.container.className = 'ai-assistant';
        this.container.innerHTML = `
            <div class="ai-assistant-container">
                <div class="ai-assistant-header">
                    <h3>Travel Assistant</h3>
                    <button class="ai-close">×</button>
                </div>
                <div class="ai-messages"></div>
                <div class="ai-input-container">
                    <input type="text" id="ai-message-input" placeholder="Ask me anything about travel...">
                    <button class="ai-send">Send</button>
                </div>
            </div>
            <button class="ai-toggle">
                <i class="fas fa-comment-dots"></i>
            </button>
        `;
        document.body.appendChild(this.container);
    }

    bindEvents() {
        // Toggle button
        const toggleBtn = this.container.querySelector('.ai-toggle');
        const closeBtn = this.container.querySelector('.ai-close');
        const sendBtn = this.container.querySelector('.ai-send');
        const input = this.container.querySelector('#ai-message-input');

        toggleBtn.addEventListener('click', (e) => this.toggle(e));
        closeBtn.addEventListener('click', (e) => this.toggle(e, false));
        sendBtn.addEventListener('click', () => this.handleSend());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    toggle(event, show = !this.isOpen) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        this.isOpen = show;
        this.container.classList.toggle('open', show);
        
        if (show) {
            this.container.querySelector('#ai-message-input').focus();
        }
    }

    async handleSend() {
        const input = this.container.querySelector('#ai-message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message to chat
        this.addMessage('user', message);
        
        try {
            // Simulate AI response (replace with actual API call)
            setTimeout(() => {
                this.addMessage('assistant', 'I\'m here to help with your travel plans! This is a demo response.');
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }

    addMessage(role, content) {
        const messagesContainer = this.container.querySelector('.ai-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ${role}`;
        messageEl.textContent = content;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.wanderAI) {
        window.wanderAI = new AIAssistant();
    }
});
    constructor() {
        // Check if AI Assistant is already initialized
        if (window.wanderAI) {
            console.warn('AI Assistant is already initialized');
            return window.wanderAI;
        }

        // Core state
        this.isOpen = false;
        this.isListening = false;
        this.chatHistory = [];
        this.recognition = null;
        this.synth = window.speechSynthesis;
        this.mapboxAccessToken = 'pk.eyJ1IjoibmFyZW5kcmE5NSIsImV4cGlyZXMiOjE3MzU1Njg4MDB9.abcdefghijklmnopqrstuvwxyz';
        
        // Initialize state from localStorage
        this.state = {
            isOpen: false, // Don't auto-open
            lastMessageTime: parseInt(localStorage.getItem('aiAssistantLastMessageTime') || '0'),
            conversationId: localStorage.getItem('aiAssistantConversationId') || this.generateId(),
            // Add any other state variables you need to persist
        };
        
        // Create and append the container immediately
        this.container = document.createElement('div');
        this.container.className = 'ai-assistant';
        this.container.id = 'ai-assistant';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
        
        // Initialize elements and events
        this.initializeElements();
        this.initializeEventListeners();
        this.bindEvents();
        this.render();
        
        // Save reference to instance
        window.wanderAI = this;
        
        console.log('AI Assistant initialized with state:', this.state);
    }
    
    generateId() {
        return 'conv_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeElements() {
        // Create the AI Assistant container if it doesn't exist
        if (!document.getElementById('ai-assistant')) {
            const aiAssistantHTML = `
                <div id="ai-assistant" class="ai-assistant">
                    <div class="ai-assistant-header">
                        <div class="ai-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="header-content">
                            <h3>WanderLust AI Assistant</h3>
                            <div class="ai-status">Online</div>
                        </div>
                        <button class="ai-minimize" aria-label="Minimize">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="ai-close" aria-label="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="ai-assistant-messages">
                        <div class="message system">
                            <div class="message-content">
                                <p>Hello! I'm your WanderLust AI Assistant. How can I help you with your travel plans today?</p>
                            </div>
                            <div class="message-time">Just now</div>
                        </div>
                    </div>
                    <div class="ai-assistant-input">
                        <div class="input-group">
                            <input type="text" id="ai-message-input" placeholder="Ask me anything about your trip...">
                            <button id="ai-send-message">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div class="input-actions">
                            <button class="action-btn" title="Attach file">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <button class="action-btn" title="Take a photo">
                                <i class="fas fa-camera"></i>
                            </button>
                            <button class="action-btn" title="Send location">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="ai-assistant-button" class="ai-assistant-button">
                    <i class="fas fa-comment-dots"></i>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', aiAssistantHTML);
        }
        
        // Cache DOM elements
        this.elements = {
            container: document.getElementById('ai-assistant'),
            button: document.getElementById('ai-assistant-button'),
            messagesContainer: document.querySelector('#ai-assistant .ai-assistant-messages'),
            input: document.getElementById('ai-message-input'),
            sendButton: document.getElementById('ai-send-message'),
            minimizeButton: document.querySelector('.ai-minimize'),
            closeButton: document.querySelector('.ai-close'),
            actionButtons: document.querySelectorAll('.action-btn')
        };
    }
    
    bindEvents() {
        // Toggle chat window
        this.elements.button.addEventListener('click', () => this.toggle());
        
        // Send message on button click or Enter key
        this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });
        
        // Minimize and close buttons
        this.elements.minimizeButton.addEventListener('click', () => this.toggle(false));
        this.elements.closeButton.addEventListener('click', () => this.toggle(false));
        
        // Action buttons
        this.elements.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.title.toLowerCase();
                this.handleAction(action);
            });
        });
        
        // Save state when window is unloaded
        window.addEventListener('beforeunload', () => this.saveState());
    }
    
    saveState() {
        localStorage.setItem('aiAssistantOpen', this.state.isOpen);
        localStorage.setItem('aiAssistantLastMessageTime', this.state.lastMessageTime);
        localStorage.setItem('aiAssistantConversationId', this.state.conversationId);
    }
    
    render() {
        // Update UI based on state
        if (this.state.isOpen) {
            this.elements.container.classList.add('visible');
            this.elements.button.classList.add('active');
        // Create the main container with glass morphism effect
        this.container = document.createElement('div');
        this.container.className = 'ai-assistant glass-effect';
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
                                <p>👋 Hi there! I'm your WanderAI assistant. How can I help you plan your next adventure?</p>
                                <div class="quick-suggestions">
                                    <button class="suggestion-chip" data-prompt="Plan a weekend trip to Goa under ₹8000">
                                        <i class="fas fa-map-marked-alt"></i> Plan a trip
                                    </button>
                                    <button class="suggestion-chip" data-prompt="Find good dhabas near me">
                                        <i class="fas fa-utensils"></i> Find dhabas
                                    </button>
                                    <button class="suggestion-chip" data-prompt="Best places to visit in Rishikesh">
                                        <i class="fas fa-mountain"></i> Travel tips
                                    </button>
                                </div>
                            </div>
                            <div class="message-time">Just now</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-assistant-input">
                <div class="input-container">
                    <div class="input-actions">
                        <button class="action-btn" id="voiceInputBtn" title="Voice Input">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <button class="action-btn" id="attachFileBtn" title="Attach Files">
                            <i class="fas fa-paperclip"></i>
                        </button>
                        <input type="file" id="fileUpload" style="display: none;" multiple>
                    </div>
                    
                    <div class="message-input-wrapper">
                        <div 
                            id="messageInput" 
                            class="message-input" 
                            contenteditable="true" 
                            placeholder="Ask me anything about travel..."
                            role="textbox"
                            aria-multiline="true"
                        ></div>
                        <div class="suggested-replies"></div>
                    </div>
                    
                    <button class="send-btn" id="sendMessageBtn" disabled>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                
                <div class="quick-actions">
                    <button class="quick-action-btn" data-action="find-hotels">
                        <i class="fas fa-hotel"></i> Hotels
                    </button>
                    <button class="quick-action-btn" data-action="find-vehicles">
                        <i class="fas fa-car"></i> Rent Car
                    </button>
                    <button class="quick-action-btn" data-action="find-dhabas">
                        <i class="fas fa-utensils"></i> Dhabas
                    </button>
                    <button class="quick-action-btn" data-action="weather">
                        <i class="fas fa-cloud-sun"></i> Weather
                    </button>
                </div>
            </div>
            
            <div class="ai-assistant-footer">
                <div class="typing-indicator" style="display: none;">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="connection-status">
                    <span class="status-dot"></span>
                    <span>WanderAI</span>
                </div>
            </div>
        `;

        // Create the toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'ai-assistant-toggle floating-pulse';
        this.toggleButton.setAttribute('aria-label', 'Open AI Assistant');
        this.toggleButton.innerHTML = `
            <div class="toggle-button-inner">
                <i class="fas fa-robot"></i>
                <span class="notification-badge"></span>
            </div>
        `;
        this.toggleButton.addEventListener('click', () => this.toggle());

        // Add elements to the DOM
        document.body.appendChild(this.container);
        document.body.appendChild(this.toggleButton);

        // Initialize event listeners
        this.initializeEventListeners();
        this.addMessage('assistant', 'Hi there! I\'m your AI travel assistant. How can I help you plan your next adventure?');
    }

    initializeEventListeners() {
        // Toggle button
        this.toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close and minimize buttons
        this.container.querySelector('#closeBtn').addEventListener('click', () => this.close());
        this.container.querySelector('#minimizeBtn').addEventListener('click', () => this.minimize());

        // Message input and send
        const messageInput = this.container.querySelector('#messageInput');
        const sendBtn = this.container.querySelector('#sendMessageBtn');
        
        messageInput.addEventListener('input', () => {
            sendBtn.disabled = !messageInput.textContent.trim();
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        sendBtn.addEventListener('click', () => this.handleSendMessage());

        // Voice input
        const voiceBtn = this.container.querySelector('#voiceInputBtn');
        voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());

        // File upload
        const fileInput = this.container.querySelector('#fileUpload');
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Quick action buttons
        this.container.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Suggestion chips
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.suggestion-chip')) {
                const prompt = e.target.closest('.suggestion-chip').dataset.prompt;
                this.handleSuggestionClick(prompt);
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && !this.toggleButton.contains(e.target)) {
                this.close();
            }
        });

        // Prevent clicks inside the chat from closing it
        this.container.addEventListener('click', (e) => e.stopPropagation());
    }

    // Toggle chat visibility
    toggle(event, show = !this.state.isOpen) {
        try {
            // Prevent any default behavior that might cause page refresh
            if (event) {
                if (event.preventDefault) event.preventDefault();
                if (event.stopPropagation) event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            }
            
            // Update state
            this.state.isOpen = show;
            this.saveState();
            
            // Get container and button references
            const container = this.elements?.container || document.getElementById('ai-assistant');
            const button = this.elements?.button || document.getElementById('ai-assistant-button');
            const input = this.elements?.input || document.getElementById('ai-message-input');
            
            if (!container) return;
            
            // Smoothly show/hide the assistant
            if (show) {
                // Show container with animation
                container.style.display = 'flex';
                container.style.opacity = '0';
                container.style.transform = 'translateY(20px)';
                container.style.pointerEvents = 'auto';
                
                // Trigger reflow
                void container.offsetHeight;
                
                // Animate in
                container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
                
                // Focus input if available
                if (input) {
                    setTimeout(() => {
                        input.focus();
                        this.scrollToBottom();
                    }, 300);
                }
                
                // Update button state
                if (button) button.classList.add('active');
                
                // Clear any notification badge
                const notificationBadge = container.querySelector('.notification-badge');
                if (notificationBadge) {
                    notificationBadge.style.display = 'none';
                }
            
            console.log('AI Assistant shown');
        } else {
            // Hide the assistant
            this.container.classList.remove('visible');
            
            // Update floating button state
            if (floatButton) {
                floatButton.classList.remove('active');
            }
            
            console.log('AI Assistant hidden');
        }
    }

    // Close the chat
    close() {
        this.toggle(false);
    }

    // Minimize the chat
    minimize() {
        this.close();
        // Show notification badge when minimized with new messages
        this.container.querySelector('.notification-badge').style.display = 'flex';
    }

    // Handle sending a message
    async handleSendMessage() {
        const messageInput = this.container.querySelector('#messageInput');
        const message = messageInput.textContent.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        messageInput.textContent = '';
        this.container.querySelector('#sendMessageBtn').disabled = true;
        
        // Show typing indicator
        this.showTypingIndicator(true);
        
        try {
            // Process the message with AI
            const response = await this.processMessage(message);
            
            // Add AI response to chat
            this.addMessage('ai', response);
            
            // Speak the response if voice output is enabled
            if (this.speakResponses) {
                this.speak(response);
            }
            
            // Save to chat history
            this.saveToHistory('user', message);
            this.saveToHistory('ai', response);
            
        } catch (error) {
            console.error('Error processing message:', error);
            this.addSystemMessage('Sorry, I encountered an error. Please try again.');
        } finally {
            this.showTypingIndicator(false);
            this.scrollToBottom();
        }
    }

    // Process user message and generate response using the backend API
    async processMessage(message) {
        try {
            // Get user's current location if available
            let location = null;
            try {
                const position = await this.getCurrentLocation();
                location = {
                    coordinates: [position.coords.longitude, position.coords.latitude],
                    name: position.city || 'your location'
                };
            } catch (error) {
                console.log('Could not get user location:', error);
            }
            
            // Get chat history (last 5 messages)
            const chatHistory = this.chatHistory.slice(-5).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));
            
            // Call the backend API
            const response = await fetch('/ai/assistant/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    message,
                    location,
                    context: chatHistory
                }),
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response from server');
            }
            
            const data = await response.json();
            
            // Handle different response types
            if (data.type === 'trip_plan') {
                return this.formatTripPlanResponse(data);
            } else if (data.type === 'dhaba_list') {
                return this.formatDhabaListResponse(data);
            } else if (data.type === 'vehicle_rental') {
                return this.formatVehicleResponse(data);
            } else if (data.type === 'weather') {
                return this.formatWeatherResponse(data);
            }
            
            return data.reply || "I'm not sure how to respond to that. Could you try rephrasing?";
            
        } catch (error) {
            console.error('Error processing message:', error);
            return "I'm having trouble connecting to the server. Please try again later.";
        }
    }

    // Toggle voice recognition
    toggleVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            this.addSystemMessage('Speech recognition is not supported in your browser.');
            return;
        }

        const voiceBtn = this.container.querySelector('#voiceInputBtn');
        
        if (!this.recognition) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };
        }
    }

    // Handle voice input
    handleVoiceInput(transcript) {
        this.addMessage('user', transcript);
        this.processMessage(transcript);
    }

    // Format trip plan response
    formatTripPlanResponse(data) {
        let response = data.reply + '\n\n';
        
        if (data.data && data.data.itinerary) {
            const { itinerary } = data.data;
            
            response += '**Itinerary Summary**\n';
            response += `- Destination: ${itinerary.destination}\n`;
            response += `- Duration: ${itinerary.duration} days\n`;
            response += `- Budget: ₹${itinerary.budget.toLocaleString()}\n\n`;
            
            if (itinerary.dailyPlans && itinerary.dailyPlans.length > 0) {
                response += '**Daily Plan**\n';
                itinerary.dailyPlans.forEach((day, index) => {
                    response += `\n**Day ${index + 1}**\n`;
                    day.activities.forEach(activity => {
                        response += `- ${activity.time}: ${activity.description}\n`;
                    });
                });
            }
        }
        
        return response;
    }
    
    // Format dhaba list response
    formatDhabaListResponse(data) {
        let response = data.reply + '\n\n';
        
        if (data.data && data.data.results && data.data.results.length > 0) {
            response += '**Top Recommendations**\n';
            data.data.results.slice(0, 5).forEach((dhaba, index) => {
                response += `\n**${index + 1}. ${dhaba.name}**\n`;
                response += `⭐ ${dhaba.rating || 'N/A'} (${dhaba.reviewCount || 0} reviews)\n`;
                response += `📍 ${dhaba.address || 'Address not available'}\n`;
                response += `💰 ${dhaba.priceRange || 'Varies'}`;
            });
            
            response += '\n\nWould you like to see more details about any of these?';
        } else {
            response += 'I couldn\'t find any dhabas matching your criteria. Would you like to try a different location or cuisine?';
        }
        
        return response;
    }
    
    // Format vehicle response
    formatVehicleResponse(data) {
        let response = data.reply + '\n\n';
        
        if (data.data && data.data.results && data.data.results.length > 0) {
            response += '**Available Vehicles**\n';
            data.data.results.slice(0, 5).forEach((vehicle, index) => {
                response += `\n**${index + 1}. ${vehicle.make} ${vehicle.model} (${vehicle.year})**\n`;
                response += `🚗 Type: ${vehicle.type}\n`;
                response += `💰 Price: ₹${vehicle.pricePerDay}/day\n`;
                response += `✅ Available: ${vehicle.available ? 'Yes' : 'No'}`;
            });
            
            response += '\n\nWould you like to book any of these vehicles or see more options?';
        } else {
            response += 'I couldn\'t find any available vehicles matching your criteria. Would you like to try different search parameters?';
        }
        
        return response;
    }
    
    // Format weather response
    formatWeatherResponse(data) {
        if (!data.data) {
            return data.reply || 'I couldn\'t fetch the weather information. Please try again later.';
        }
        
        const { location, temperature, condition, description, humidity, windSpeed, icon } = data.data;
        
        let response = `**Weather in ${location}**\n\n`;
        response += `🌡️ Temperature: ${temperature}°C\n`;
        response += `🌤️ Condition: ${condition} (${description})\n`;
        response += `💧 Humidity: ${humidity}%\n`;
        response += `💨 Wind: ${windSpeed} m/s\n`;
        
        if (data.data.sunrise && data.data.sunset) {
            response += `🌅 Sunrise: ${data.data.sunrise}\n`;
            response += `🌇 Sunset: ${data.data.sunset}\n`;
        }
        
        response += '\nWhat would you like to know about the weather?';
        
        return response;
    }

    // Speak text using the Web Speech API
    speak(text) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.synth.getVoices().find(voice => 
            voice.name.includes('Google US English') || 
            voice.default
        );
        
        this.synth.speak(utterance);
    }

    // Handle file uploads
    handleFileUpload(files) {
        if (!files.length) return;
        
        // Handle image files
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            this.processImageUpload(imageFiles[0]);
            return;
        }
        
        // Handle other file types
        this.addSystemMessage(`Received ${files.length} file(s). How can I help you with these?`);
    }

    // Process uploaded image
    async processImageUpload(file) {
        return new Promise((resolve, reject) => {
            try {
                // Here you would typically send the image to your backend for processing
                // For now, we'll just show a preview
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.maxWidth = '100%';
                        img.style.borderRadius = '8px';
                        img.style.marginTop = '8px';
                        
                        this.addMessage('user', 'I found this image:');
                        const message = this.container.querySelector('.ai-assistant-messages .message:last-child .message-text');
                        if (message) {
                            message.appendChild(document.createElement('br'));
                            message.appendChild(img);
                        }
                        
                        // Simulate image recognition
                        setTimeout(() => {
                            this.addMessage('ai', 'I see this is an image of a travel destination. How can I assist you with it?');
                            resolve();
                        }, 1000);
                    } catch (innerError) {
                        console.error('Error processing image data:', innerError);
                        this.addSystemMessage('Sorry, I had trouble displaying that image.');
                        reject(innerError);
                    }
                };
                
                reader.onerror = (error) => {
                    console.error('Error reading file:', error);
                    this.addSystemMessage('Sorry, I had trouble reading that image file.');
                    reject(error);
                };
                
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error in processImageUpload:', error);
                this.addSystemMessage('Sorry, I had trouble processing that image.');
                reject(error);
            }
        });
    }

    // Handle quick actions
    handleQuickAction(action) {
        switch (action) {
            case 'find-hotels':
                this.processMessage('Find hotels near me');
                break;
            case 'find-vehicles':
                this.processMessage('I want to rent a car');
                break;
            case 'find-dhabas':
                this.processMessage('Find dhabas nearby');
                break;
            case 'weather':
                this.getCurrentLocation()
                    .then(location => {
                        this.processMessage(`What's the weather like in ${location.city}?`);
                    })
                    .catch(() => {
                        this.processMessage('What\'s the weather like?');
                    });
                break;
            default:
                this.processMessage(action);
        }
    }

    // Handle suggestion clicks
    handleSuggestionClick(prompt) {
        const messageInput = this.container.querySelector('#messageInput');
        messageInput.textContent = prompt;
        this.handleSendMessage();
    }

    // Get current location using browser's geolocation API
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Try to get city name using reverse geocoding
                    this.reverseGeocode(position.coords.latitude, position.coords.longitude)
                        .then(city => {
                            resolve({
                                coords: position.coords,
                                city: city || 'Unknown location'
                            });
                        })
                        .catch(() => {
                            // If reverse geocoding fails, still resolve with coordinates
                            resolve({
                                coords: position.coords,
                                city: 'Your current location'
                            });
                        });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }
    
    // Reverse geocode coordinates to get location name
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.mapboxAccessToken}&types=place,locality`);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                // Try to get the most relevant place name
                return data.features[0].text || data.features[0].place_name;
            }
            return null;
        } catch (error) {
            console.error('Error in reverse geocoding:', error);
            return null;
        }
    }
    
    // Search for nearby places (hotels, dhabas, vehicles)
    async searchNearbyPlaces(type, location, radius = 10) {
        try {
            const response = await fetch(`/ai/assistant/nearby?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&type=${type}&radius=${radius}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch nearby places');
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error(`Error searching for nearby ${type}:`, error);
            return [];
        }
    }
    
    // Get weather information for a location
    async getWeatherInfo(location) {
        try {
            let url;
            
            if (location.coords) {
                // Use coordinates if available
                url = `/ai/assistant/weather?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`;
            } else if (location.city) {
                // Fall back to city name
                url = `/ai/assistant/weather?city=${encodeURIComponent(location.city)}`;
            } else {
                throw new Error('No valid location provided');
            }
            
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting weather info:', error);
            throw error;
        }
    }

    // Show typing indicator
    showTypingIndicator(show = true) {
        const typingIndicator = this.container.querySelector('.typing-indicator');
        typingIndicator.style.display = show ? 'flex' : 'none';
        if (show) this.scrollToBottom();
    }

    // Add a message to the chat
    addMessage(sender, content) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessageContent(content)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    // Add a system message
    addSystemMessage(content) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = content;
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    // Format message content (URLs, phone numbers, etc.)
    formatMessageContent(content) {
        // Simple formatting for URLs, phone numbers, etc.
        return content
            .replace(/\b(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/\b(\d{10})\b/g, '<a href="tel:$1">$1</a>')
            .replace(/\n/g, '<br>');
    }

    // Scroll to bottom of messages
    scrollToBottom() {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Save message to history
    saveToHistory(sender, content) {
        this.chatHistory.push({ sender, content, timestamp: new Date() });
        // Keep only the last 100 messages
        if (this.chatHistory.length > 100) {
            this.chatHistory.shift();
        }
        // Save to localStorage
        localStorage.setItem('aiAssistantChatHistory', JSON.stringify(this.chatHistory));
    }

    // Load chat history from localStorage
    loadChatHistory() {
        const savedHistory = localStorage.getItem('aiAssistantChatHistory');
        if (savedHistory) {
            try {
                this.chatHistory = JSON.parse(savedHistory);
                // Optionally, display the last few messages
                const recentMessages = this.chatHistory.slice(-5);
                recentMessages.forEach(msg => {
                    this.addMessage(msg.sender, msg.content);
                });
            } catch (e) {
                console.error('Error loading chat history:', e);
            }
        }
    }

    // Generate response for trip planning
    async generateTripPlanResponse(query) {
        // This would call your backend API in a real implementation
        return `I can help you plan your trip! Based on your query: "${query}", I recommend considering these destinations:
        
1. **Goa** - Beautiful beaches and vibrant nightlife
2. **Manali** - Scenic mountains and adventure sports
3. **Kerala** - Serene backwaters and lush greenery

Would you like me to create a detailed itinerary for any of these destinations?`;
    }

    // Generate response for dhaba queries
    async generateDhabaResponse(query) {
        // This would call your backend API in a real implementation
        return `I can help you find great dhabas! Based on your query: "${query}", here are some top-rated options nearby:
        
1. **Punjab Dhaba** - Famous for butter chicken and dal makhani
2. **Baba Ka Dhaba** - Known for authentic North Indian thali
3. **Haveli** - Great ambience with traditional Punjabi cuisine

Would you like me to show you more details or make a reservation?`;
    }

    // Generate response for vehicle rental queries
    async generateVehicleResponse(query) {
        // This would call your backend API in a real implementation
        return `I can help you with vehicle rentals! Based on your query: "${query}", here are some options:
        
1. **Economy Car** - ₹1500/day (Maruti Swift, Hyundai i10)
2. **SUV** - ₹2500/day (Hyundai Creta, Kia Seltos)
3. **Luxury Car** - ₹5000+/day (Mercedes, BMW)

Would you like to check availability or book a vehicle?`;
    }

    // Generate weather response
    async generateWeatherResponse(query) {
        try {
            const location = await this.getCurrentLocation();
            // In a real implementation, you would call a weather API here
            return `The weather in ${location.city} is currently sunny with a high of 28°C and a low of 20°C. Perfect weather for outdoor activities!`;
        } catch (error) {
            return "I couldn't get your location. Could you please specify which location's weather you'd like to know about?";
        }
    }

    // Initialize the AI Assistant
    initialize() {
        // Create the main container with glass morphism effect
        this.container = document.createElement('div');
        this.container.className = 'ai-assistant';
        this.container.innerHTML = `
            <div class="ai-assistant-container">
                <div class="ai-assistant-header">
                    <div class="ai-avatar">
                        <i class="fas fa-plane"></i>
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
                        <div class="message ai-message">
                            <div class="message-avatar">
                                <i class="fas fa-plane"></i>
                            </div>
                            <div class="message-content">
                                <div class="message-text">
                                    <p>👋 Hi there! I'm your WanderAI assistant. How can I help you plan your next adventure?</p>
                                    <div class="quick-suggestions">
                                        <button class="suggestion-chip" data-prompt="Plan a weekend trip to Goa under ₹8000">
                                            <i class="fas fa-map-marked-alt"></i> Plan a trip
                                        </button>
                                        <button class="suggestion-chip" data-prompt="Find good dhabas near me">
                                            <i class="fas fa-utensils"></i> Find dhabas
                                        </button>
                                        <button class="suggestion-chip" data-prompt="Best places to visit in Rishikesh">
                                            <i class="fas fa-mountain"></i> Travel tips
                                        </button>
                                    </div>
                                </div>
                                <div class="message-time">Just now</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                
                <div class="ai-assistant-input">
                    <div class="input-container">
                        <div class="input-actions">
                            <button class="action-btn" id="voiceInputBtn" title="Voice Input">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button class="action-btn" id="attachFileBtn" title="Attach Files">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <input type="file" id="fileUpload" style="display: none;" multiple>
                        </div>
                        
                        <div id="messageInput" class="message-input" contenteditable="true" 
                             placeholder="Ask me anything about travel..."></div>
                        
                        <button class="send-btn" id="sendMessageBtn" disabled>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div class="quick-actions">
                        <button class="quick-action-btn" data-action="find-hotels">
                            <i class="fas fa-hotel"></i> Hotels
                        </button>
                        <button class="quick-action-btn" data-action="find-vehicles">
                            <i class="fas fa-car"></i> Rent a Car
                        </button>
                        <button class="quick-action-btn" data-action="find-dhabas">
                            <i class="fas fa-utensils"></i> Find Dhabas
                        </button>
                        <button class="quick-action-btn" data-action="weather">
                            <i class="fas fa-cloud-sun"></i> Weather
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Create the toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'ai-assistant-toggle';
        this.toggleButton.innerHTML = '<i class="fas fa-comment-dots"></i>';
        this.toggleButton.title = 'Chat with WanderAI';
        
        // Add notification badge
        const notificationBadge = document.createElement('div');
        notificationBadge.className = 'notification-badge';
        notificationBadge.style.display = 'none';
        this.toggleButton.appendChild(notificationBadge);
        
        // Add elements to the DOM
        document.body.appendChild(this.container);
        document.body.appendChild(this.toggleButton);
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load chat history
        this.loadChatHistory();
        
        // Auto-open on first visit (optional)
        const firstVisit = !localStorage.getItem('aiAssistantFirstVisit');
        if (firstVisit) {
            localStorage.setItem('aiAssistantFirstVisit', 'true');
            setTimeout(() => this.toggle(true), 2000);
        }
    }
    
    // Handle user query (legacy method, kept for backward compatibility)
    async handleUserQuery(query = null) {
        const input = query || document.getElementById('aiQueryInput')?.value.trim();
        if (!input) return;
        
        const messageInput = this.container?.querySelector('#messageInput');
        if (messageInput) {
            messageInput.textContent = input;
            this.handleSendMessage();
        } else {
            // Fallback for older implementations
            this.addMessage('user', input);
            if (document.getElementById('aiQueryInput')) {
                document.getElementById('aiQueryInput').value = '';
            }
        }

        try {
            // Show typing indicator
            this.showTypingIndicator();

            // Check if this is a trip planning query
            if (input.toLowerCase().includes('plan') && (input.toLowerCase().includes('trip') || input.toLowerCase().includes('itinerary'))) {
                await this.handleTripPlanningQuery(input);
            } else {
                // Default to general chat
                await this.handleGeneralQuery(input);
            }
        } catch (error) {
            console.error('Error processing query:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again later.');
        } finally {
            this.hideTypingIndicator();
        }
    }

    async handleTripPlanningQuery(query) {
        try {
            // Show loading indicator
            this.showTypingIndicator();
            
            const response = await fetch('/api/ai/trip/plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ query }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tripPlan = await response.json();
            
            if (tripPlan.error) {
                throw new Error(tripPlan.error);
            }
            
            // Display the trip plan
            this.addMessage('assistant', this.formatTripPlanResponse(tripPlan));
            
        } catch (error) {
            console.error('Error generating trip plan:', error);
            this.addMessage('assistant', 'Sorry, I had trouble planning your trip. Please try again with more specific details.');
        } finally {
            this.hideTypingIndicator();
        }
    }

    async handleGeneralQuery(query) {
        try {
            // In a real implementation, this would call your AI chat endpoint
            // For now, we'll simulate a response
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const responses = [
                "I can help you plan your trip, find accommodations, or suggest activities. Could you be more specific?",
                "That's a great question! Let me find the best options for you.",
                "I'd be happy to help with that. Here's what I found...",
                "Based on your preferences, I recommend..."
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addMessage('assistant', randomResponse);
        } catch (error) {
            console.error('Error handling general query:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error processing your request.');
        }
    }

    displayTripPlan(tripPlan) {
        // Create a nice visual representation of the trip plan
        const message = document.createElement('div');
        message.className = 'trip-plan-message';
        
        // Add trip summary
        const summary = document.createElement('div');
        summary.className = 'trip-summary';
        summary.innerHTML = `
            <h4>${tripPlan.summary || 'Your Trip Plan'}</h4>
            <p><strong>Duration:</strong> ${tripPlan.days?.length || 0} days</p>
            <p><strong>Estimated Cost:</strong> ${tripPlan.totalEstimatedCost || 'Varies'}</p>
        `;
        message.appendChild(summary);

        // Add daily itinerary
        const daysContainer = document.createElement('div');
        daysContainer.className = 'trip-days';
        
        tripPlan.days?.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'trip-day';
            
            let activitiesHtml = `
                <div class="day-header">
                    <h5>Day ${day.day}: ${day.date || ''}</h5>
                </div>
                <div class="day-activities">
            `;
            
            day.activities?.forEach(activity => {
                activitiesHtml += `
                    <div class="activity ${activity.type}">
                        <div class="activity-time">${activity.time || ''}</div>
                        <div class="activity-details">
                            <div class="activity-title">${activity.title || 'Activity'}</div>
                            <div class="activity-description">${activity.description || ''}</div>
                            ${activity.location ? `<div class="activity-location"><i class="fas fa-map-marker-alt"></i> ${activity.location}</div>` : ''}
                            ${activity.duration ? `<div class="activity-duration"><i class="far fa-clock"></i> ${activity.duration}</div>` : ''}
                            ${activity.cost ? `<div class="activity-cost"><i class="fas fa-rupee-sign"></i> ${activity.cost}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            
            activitiesHtml += '</div>';
            dayElement.innerHTML = activitiesHtml;
            daysContainer.appendChild(dayElement);
        });
        
        message.appendChild(daysContainer);
        
        // Add action buttons
        const actions = document.createElement('div');
        actions.className = 'trip-actions';
        actions.innerHTML = `
            <button class="btn btn-sm btn-outline-primary save-trip">
                <i class="far fa-bookmark"></i> Save Trip
            </button>
            <button class="btn btn-sm btn-outline-secondary share-trip">
                <i class="fas fa-share-alt"></i> Share
            </button>
            <button class="btn btn-sm btn-outline-info edit-trip">
                <i class="fas fa-edit"></i> Customize
            </button>
        `;
        message.appendChild(actions);
        
        // Add to chat
        this.addMessage('assistant', '', message);
    }

    addMessage(sender, text, customElement = null) {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        if (customElement) {
            messageElement.appendChild(customElement);
        } else {
            messageElement.textContent = text;
        }
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = this.container.querySelector('.ai-assistant-messages');
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.id = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.addMessage('assistant', 'Sorry, your browser does not support voice recognition.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        this.addMessage('user', '🎤 Listening...');
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('aiQueryInput').value = transcript;
            this.handleUserQuery(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.addMessage('assistant', `Error: ${event.error}`);
        };
        
        recognition.start();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading state
            this.addMessage('user', 'Analyzing image...');
            
            // In a real implementation, you would upload the image to your server
            // and process it with a computer vision API
            // For now, we'll simulate a response
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simulate image recognition response
            this.addMessage('assistant', 'I think this is a beautiful location! Here are some details:');
            
            // Display image preview
            const reader = new FileReader();
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.addMessage('assistant', 'Sorry, I had trouble analyzing that image. Please try another one.');
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

    // Handle image analysis
    async analyzeImage(file) {
        try {
            // In a real implementation, this would call an image recognition API
            // For now, we'll just show a preview
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
            // If there's an error, start with an empty chat
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

    // Get current location using browser's geolocation API
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Try to get city name using reverse geocoding
                    this.reverseGeocode(position.coords.latitude, position.coords.longitude)
                        .then(city => {
                            resolve({
                                coords: position.coords,
                                city: city || 'Unknown location'
                            });
                        })
                        .catch(() => {
                            // If reverse geocoding fails, still resolve with coordinates
                            resolve({
                                coords: position.coords,
                                city: 'Your current location'
                            });
                        });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }
    
    // Reverse geocode coordinates to get location name
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.mapboxAccessToken}&types=place,locality`);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                // Try to get the most relevant place name
                return data.features[0].text || data.features[0].place_name;
            }
            return null;
        } catch (error) {
            console.error('Error in reverse geocoding:', error);
            return null;
        }
    }
    
    // Search for nearby places (hotels, dhabas, vehicles)
    async searchNearbyPlaces(type, location, radius = 10) {
        try {
            const response = await fetch(`/ai/assistant/nearby?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&type=${type}&radius=${radius}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch nearby places');
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error(`Error searching for nearby ${type}:`, error);
            return [];
        }
    }
    
    // Get weather information for a location
    async getWeatherInfo(location) {
        try {
            let url;
            
            if (location.coords) {
                // Use coordinates if available
                url = `/ai/assistant/weather?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`;
            } else if (location.city) {
                // Fall back to city name
                url = `/ai/assistant/weather?city=${encodeURIComponent(location.city)}`;
            } else {
                throw new Error('No valid location provided');
            }
            
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting weather info:', error);
            throw error;
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
        floatingButton.id = 'ai-assistant-float';
        floatingButton.innerHTML = '<i class="fas fa-comment-dots"></i>';
        floatingButton.onclick = () => window.toggleAIAssistant();
        
        // Add the floating button to the page
        document.body.appendChild(floatingButton);
        
        styleLink.onload = () => {
            // Initialize the AI Assistant after styles are loaded
            window.wanderAI = new AIAssistant();
            
            // Expose a global function to toggle the assistant
            window.toggleAIAssistant = (show = !(window.wanderAI && window.wanderAI.isOpen)) => {
                if (window.wanderAI) {
                    window.wanderAI.toggle(show);
                    // Toggle the active class on the floating button
                    document.getElementById('ai-assistant-float').classList.toggle('active', show);
                }
            };
            
            console.log('WanderAI Assistant initialized');
            
            // Show the assistant immediately
            window.toggleAIAssistant(true);
            
            // Make sure the container is visible
            if (window.wanderAI && window.wanderAI.container) {
                window.wanderAI.container.style.display = 'flex';
                window.wanderAI.container.style.opacity = '1';
                window.wanderAI.container.style.visibility = 'visible';
                window.wanderAI.container.style.transform = 'translateY(0) scale(1)';
            }
        };
        
        document.head.appendChild(styleLink);
        
        // Add Font Awesome if not already loaded
        if (!document.querySelector('link[href*="font-awesome"]') && !document.querySelector('link[href*="fontawesome"]')) {
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
            document.head.appendChild(fontAwesome);
        }
    }
});

// Export the AIAssistant class for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAssistant;
}
