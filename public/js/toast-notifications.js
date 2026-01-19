// Premium Toast Notification System
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Create container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }

        // Inject styles
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
            }

            .toast {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                padding: 16px 20px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                min-width: 300px;
                max-width: 400px;
                position: relative;
                overflow: hidden;
                animation: slideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                transform-origin: top right;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(120%) scale(0.8);
                    opacity: 0;
                }
                to {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
            }

            .toast.removing {
                animation: slideOut 0.3s ease-out forwards;
            }

            @keyframes slideOut {
                to {
                    transform: translateX(120%) scale(0.8);
                    opacity: 0;
                }
            }

            .toast-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .toast.success .toast-icon {
                background: #10b981;
                color: white;
            }

            .toast.error .toast-icon {
                background: #ef4444;
                color: white;
            }

            .toast.warning .toast-icon {
                background: #f59e0b;
                color: white;
            }

            .toast.info .toast-icon {
                background: #3b82f6;
                color: white;
            }

            .toast-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .toast-title {
                font-weight: 600;
                font-size: 14px;
                color: #1f2937;
                margin: 0;
            }

            .toast-message {
                font-size: 13px;
                color: #6b7280;
                margin: 0;
                line-height: 1.4;
            }

            .toast-close {
                flex-shrink: 0;
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .toast-close:hover {
                background: #f3f4f6;
                color: #4b5563;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                opacity: 0.3;
                animation: progress linear;
            }

            .toast.success .toast-progress {
                color: #10b981;
            }

            .toast.error .toast-progress {
                color: #ef4444;
            }

            .toast.warning .toast-progress {
                color: #f59e0b;
            }

            .toast.info .toast-progress {
                color: #3b82f6;
            }

            @keyframes progress {
                from {
                    width: 100%;
                }
                to {
                    width: 0%;
                }
            }

            .toast-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .toast-action-btn {
                padding: 4px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                border: 1px solid #e5e7eb;
                background: white;
                color: #374151;
                transition: all 0.2s;
            }

            .toast-action-btn:hover {
                background: #f9fafb;
                border-color: #d1d5db;
            }

            .toast-action-btn.primary {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .toast-action-btn.primary:hover {
                background: #2563eb;
            }

            @media (max-width: 640px) {
                .toast-container {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }

                .toast {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            actions = [],
            onClose = null
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const titles = {
            success: title || 'Success',
            error: title || 'Error',
            warning: title || 'Warning',
            info: title || 'Info'
        };

        let actionsHTML = '';
        if (actions.length > 0) {
            actionsHTML = `
                <div class="toast-actions">
                    ${actions.map((action, index) => `
                        <button class="toast-action-btn ${action.primary ? 'primary' : ''}" data-action-index="${index}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <p class="toast-title">${titles[type]}</p>
                ${message ? `<p class="toast-message">${message}</p>` : ''}
                ${actionsHTML}
            </div>
            <button class="toast-close">✕</button>
            ${duration > 0 ? `<div class="toast-progress" style="animation-duration: ${duration}ms"></div>` : ''}
        `;

        // Add event listeners for actions
        if (actions.length > 0) {
            const actionButtons = toast.querySelectorAll('.toast-action-btn');
            actionButtons.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    if (actions[index].onClick) {
                        actions[index].onClick();
                    }
                    this.remove(toast);
                });
            });
        }

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast);
            if (onClose) onClose();
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
                if (onClose) onClose();
            }, duration);
        }

        this.container.appendChild(toast);
        this.toasts.push(toast);

        return toast;
    }

    remove(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    success(message, title = '', duration = 5000) {
        return this.show({ type: 'success', title, message, duration });
    }

    error(message, title = '', duration = 7000) {
        return this.show({ type: 'error', title, message, duration });
    }

    warning(message, title = '', duration = 6000) {
        return this.show({ type: 'warning', title, message, duration });
    }

    info(message, title = '', duration = 5000) {
        return this.show({ type: 'info', title, message, duration });
    }

    clearAll() {
        this.toasts.forEach(toast => this.remove(toast));
    }
}

// Create global instance
window.toast = new ToastManager();
