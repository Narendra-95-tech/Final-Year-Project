class ContactHostModal {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        this.createModal();
        this.attachListeners();
    }

    createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'amenities-modal'; // Reuse existing modal overlay style
        this.overlay.innerHTML = `
            <div class="amenities-modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="section-title mb-0">Contact Host</h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="contact-host-form">
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">SUBJECT</label>
                            <input type="text" class="form-control" name="subject" placeholder="Inquiry about this listing" required>
                        </div>
                        <div class="mb-4">
                            <label class="form-label text-secondary small fw-bold">MESSAGE</label>
                            <textarea class="form-control" name="message" rows="5" placeholder="Hi, I'm interested in booking..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-dark w-100 py-3 fw-bold" style="border-radius: 8px;">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        // Close logic
        this.overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Form Submission
        this.overlay.querySelector('#contact-host-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSend();
        });
    }

    open() {
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleSend() {
        const btn = this.overlay.querySelector('button[type="submit"]');
        const originalText = btn.innerText;

        // Simulate loading state
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';
        btn.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
            btn.classList.replace('btn-dark', 'btn-success');

            setTimeout(() => {
                this.close();
                // Reset form
                this.overlay.querySelector('form').reset();
                btn.innerText = originalText;
                btn.disabled = false;
                btn.classList.replace('btn-success', 'btn-dark');

                // Show Global Success Toast (if you have one, or alert for now)

                // Optional: If we had a toast system, call it here.
                // For now, the user sees the 'Sent!' button feedback before closing.
            }, 1000);
        }, 1500);
    }

    attachListeners() {
        const contactBtns = document.querySelectorAll('.contact-host-btn');
        contactBtns.forEach(btn => {
            btn.addEventListener('click', () => this.open());
        });
    }
}
