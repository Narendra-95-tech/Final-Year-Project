class DescriptionModal {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        // Create modal HTML
        this.createModal();

        // Add event listeners
        this.addListeners();
    }

    createModal() {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'description-modal';
        modalDiv.className = 'modal-overlay';
        modalDiv.style.display = 'none';

        // Get description content (fallback to empty if not found)
        const descriptionContent = document.querySelector('.description-text')?.innerHTML || '';

        modalDiv.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <h2 class="modal-title">About this space</h2>
                    <div class="modal-description-body">
                        ${descriptionContent}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalDiv);
        this.modal = modalDiv;
    }

    addListeners() {
        // Open button
        const showMoreBtn = document.querySelector('.show-more-desc-btn');
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => this.open());
        }

        // Close button
        const closeBtn = this.modal.querySelector('.close-modal-btn');
        closeBtn.addEventListener('click', () => this.close());

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    open() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock scroll
        // Animate in
        setTimeout(() => {
            this.modal.classList.add('visible');
            this.modal.querySelector('.modal-container').classList.add('slide-up');
        }, 10);
    }

    close() {
        this.modal.classList.remove('visible');
        this.modal.querySelector('.modal-container').classList.remove('slide-up');
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = ''; // Unlock scroll
        }, 300);
    }
}
