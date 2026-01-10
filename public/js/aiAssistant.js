// AI Assistant functionality for Wanderlust
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.container = null;
        this.chatContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.messages = [];
        this.mapToken = document.querySelector('meta[name="map-token"]')?.content || '';

        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        // Create the main container
        this.container = document.createElement('div');
        this.container.id = 'ai-assistant';
        this.container.className = 'ai-assistant glass-effect';
        this.container.style.display = 'none';

        // Create the header
        const header = document.createElement('div');
        header.className = 'ai-assistant-header';
        header.innerHTML = `
            <div class="ai-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="header-content">
                <h3>WanderAssistant</h3>
                <div class="ai-status">
                    <span class="status-dot"></span> Online
                </div>
            </div>
            <div class="header-actions">
                <button class="ai-header-btn" title="Clear Chat" id="ai-clear-chat">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <button class="ai-assistant-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Create the chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'ai-assistant-messages';

        // Create the input area
        const inputArea = document.createElement('div');
        inputArea.className = 'ai-assistant-input';

        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Ask anything...';
        this.messageInput.className = 'ai-input-field';

        this.sendButton = document.createElement('button');
        this.sendButton.className = 'ai-send-btn';
        this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';

        inputGroup.appendChild(this.messageInput);
        inputGroup.appendChild(this.sendButton);
        inputArea.appendChild(inputGroup);

        // Assemble the assistant
        this.container.appendChild(header);
        this.container.appendChild(this.chatContainer);
        this.container.appendChild(inputArea);

        // Add to the page
        document.body.appendChild(this.container);

        // Add welcome message if empty
        if (this.messages.length === 0) {
            this.addMessage('assistant', 'Namaste! I am WanderAssistant. 🌍\n\nI can help you find cozy stays, rugged wheels, or the best Dhabas for your journey. What\'s on your mind?');
        }
    }

    setupEventListeners() {
        // Close button
        const closeButton = this.container.querySelector('.ai-assistant-close');
        closeButton.addEventListener('click', () => this.toggle(false));

        // Clear chat
        const clearBtn = this.container.querySelector('#ai-clear-chat');
        clearBtn.addEventListener('click', () => {
            this.chatContainer.innerHTML = '';
            this.messages = [];
            this.addMessage('assistant', 'Chat cleared! How else can I help?');
        });

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
            // Force reflow
            this.container.offsetHeight;
            this.container.classList.add('visible');
            this.messageInput.focus();
        } else {
            this.container.classList.remove('visible');
            setTimeout(() => {
                if (!this.isOpen) this.container.style.display = 'none';
            }, 300);
        }

        // Toggle the active class on the floating button
        const floatButton = document.getElementById('ai-assistant-float');
        if (floatButton) {
            floatButton.classList.toggle('active', this.isOpen);
        }
    }

    async handleSendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText) return;

        const userId = document.querySelector('meta[name="user-id"]')?.content || 'anonymous';

        this.addMessage('user', messageText);
        this.messageInput.value = '';

        this.showTypingIndicator();

        try {
            const context = {
                currentPath: window.location.pathname,
                platform: 'WanderLust',
                timestamp: new Date().toISOString()
            };

            if (window.socket && window.socket.connected) {
                window.socket.emit('ai_message', {
                    message: messageText,
                    userId: userId,
                    context: context
                });

                window.socket.once('ai_response', (data) => {
                    this.hideTypingIndicator();
                    if (data.reply) {
                        this.addMessage('assistant', data.reply, data.suggestions);
                    }
                });
            } else {
                // Fallback to REST
                const response = await axios.post('/ai/assistant/message', {
                    message: messageText,
                    userId: userId,
                    context: context
                });

                this.hideTypingIndicator();
                if (response.data.reply) {
                    this.addMessage('assistant', response.data.reply, response.data.suggestions);
                }
            }
        } catch (error) {
            console.error('AI Error:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'I encountered a small hiccup. Could you try asking that again?');
        }
    }

    addMessage(sender, text, suggestions = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message fade-in`;

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';

        messageDiv.appendChild(textDiv);
        this.chatContainer.appendChild(messageDiv);

        if (sender === 'assistant') {
            this.typeMessage(textDiv, text, () => {
                if (suggestions && suggestions.length > 0) {
                    this.showSuggestions(suggestions);
                }
                this.scrollToBottom();
            });
        } else {
            textDiv.textContent = text;
            this.scrollToBottom();
        }

        this.messages.push({ sender, text });
    }

    typeMessage(element, text, callback) {
        let i = 0;
        const speed = 15;

        const typing = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                this.scrollToBottom();
                setTimeout(typing, speed);
            } else if (callback) {
                callback();
            }
        };

        typing();
    }

    showSuggestions(suggestions) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'ai-assistant-options fade-in';

        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'ai-option-btn';
            btn.innerHTML = suggestion.text;
            btn.onclick = () => {
                // Remove emoji/prefix for the actual query if needed, 
                // but usually the AI handles the full text fine.
                this.messageInput.value = suggestion.text;
                this.handleSendMessage();
            };
            optionsDiv.appendChild(btn);
        });

        this.chatContainer.appendChild(optionsDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.hideTypingIndicator();
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'ai-typing-indicator';
        typingIndicator.className = 'typing-indicator fade-in';
        typingIndicator.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        `;
        this.chatContainer.appendChild(typingIndicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.remove();
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const aiDisabled = document.body.hasAttribute('data-disable-ai');
    if (aiDisabled) return;

    // Floating Button
    const floatBtn = document.createElement('button');
    floatBtn.id = 'ai-assistant-float';
    floatBtn.className = 'ai-assistant-toggle';
    floatBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
    floatBtn.title = 'Chat with WanderAssistant';
    floatBtn.onclick = () => window.toggleAIAssistant();
    document.body.appendChild(floatBtn);

    window.wanderAI = new AIAssistant();
    window.toggleAIAssistant = (show) => window.wanderAI.toggle(show);

    console.log('✅ WanderAssistant initialized');
});
