// AI Assistant functionality for Wanderlust
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.container = null;
        this.chatContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.messages = [];
        this.mapboxAccessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your actual Mapbox token
        
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        // Create the main container
        this.container = document.createElement('div');
        this.container.id = 'ai-assistant';
        this.container.className = 'ai-assistant';
        this.container.style.display = 'none';
        
        // Create the header
        const header = document.createElement('div');
        header.className = 'ai-assistant-header';
        header.innerHTML = `
            <h3>Travel Assistant</h3>
            <button class="ai-assistant-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Create the chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'ai-assistant-chat';
        
        // Create the input area
        const inputContainer = document.createElement('div');
        inputContainer.className = 'ai-assistant-input-container';
        
        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Ask me anything about your trip...';
        this.messageInput.className = 'ai-assistant-input';
        
        this.sendButton = document.createElement('button');
        this.sendButton.className = 'ai-assistant-send';
        this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        inputContainer.appendChild(this.messageInput);
        inputContainer.appendChild(this.sendButton);
        
        // Assemble the assistant
        this.container.appendChild(header);
        this.container.appendChild(this.chatContainer);
        this.container.appendChild(inputContainer);
        
        // Add to the page
        document.body.appendChild(this.container);
        
        // Add welcome message
        this.addMessage('assistant', 'Hello! I\'m your AI travel assistant. How can I help you plan your trip today?');
    }
    
    setupEventListeners() {
        // Close button
        const closeButton = this.container.querySelector('.ai-assistant-close');
        closeButton.addEventListener('click', () => this.toggle(false));
        
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });
    }
    
    toggle(show = !this.isOpen) {
        this.isOpen = show;
        
        if (this.isOpen) {
            this.container.style.display = 'flex';
            setTimeout(() => {
                this.container.style.opacity = '1';
                this.container.style.visibility = 'visible';
                this.container.style.transform = 'translateY(0) scale(1)';
            }, 10);
            this.messageInput.focus();
        } else {
            this.container.style.opacity = '0';
            this.container.style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(() => {
                this.container.style.display = 'none';
            }, 300);
        }
        
        // Toggle the active class on the floating button
        const floatButton = document.getElementById('ai-assistant-float');
        if (floatButton) {
            floatButton.classList.toggle('active', this.isOpen);
        }
    }
    
    addMessage(sender, text) {
        const message = document.createElement('div');
        message.className = `ai-message ${sender}-message`;
        message.innerHTML = `
            <div class="ai-message-content">
                <div class="ai-message-text">${text}</div>
            </div>
        `;
        
        this.chatContainer.appendChild(message);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        
        // Add to messages array
        this.messages.push({ sender, text });
    }
    
    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        this.messageInput.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'ai-message assistant-message ai-typing';
        typingIndicator.innerHTML = `
            <div class="ai-message-content">
                <div class="ai-message-text">Typing...</div>
            </div>
        `;
        this.chatContainer.appendChild(typingIndicator);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        
        try {
            // Simulate API call (replace with actual API call)
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            this.chatContainer.removeChild(typingIndicator);
            
            // Add assistant's response
            this.addMessage('assistant', response);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.chatContainer.removeChild(typingIndicator);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again later.');
        }
    }
    
    async getAIResponse(message) {
        // This is a placeholder - replace with actual API call to your backend
        // which should then call the AI service (like OpenAI, etc.)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple response logic - replace with actual AI integration
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return "Hello! How can I assist you with your travel plans today?";
        } else if (lowerMessage.includes('help')) {
            return "I can help you find places to visit, book vehicles, suggest restaurants, and plan your itinerary. What would you like to know?";
        } else if (lowerMessage.includes('thank')) {
            return "You're welcome! Is there anything else I can help you with?";
        } else {
            return "I'm your travel assistant. I can help you find places to visit, book vehicles, and plan your itinerary. What would you like to know?";
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
            // Removed the auto-open line that was here
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
