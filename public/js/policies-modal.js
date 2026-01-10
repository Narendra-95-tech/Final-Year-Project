class PoliciesModal {
    constructor(policies) {
        this.policies = policies;
        this.overlay = null;
        this.currentCategory = null;
        this.init();
    }

    init() {
        this.createModal();
        this.attachListeners();
    }

    createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'amenities-modal'; // Reusing amenities modal base styles for consistency
        this.overlay.innerHTML = `
            <div class="amenities-modal-content">
                <div class="modal-header">
                    <h2 class="section-title mb-0" id="policy-modal-title"></h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body" id="policy-modal-body">
                    <!-- Content injected via JS -->
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    open(category) {
        this.currentCategory = category;
        const titleEl = this.overlay.querySelector('#policy-modal-title');
        const bodyEl = this.overlay.querySelector('#policy-modal-body');

        let content = '';
        let title = '';

        if (category === 'houseRules') {
            title = 'House rules';
            content = this.generateList(this.policies.houseRules);
        } else if (category === 'safety') {
            title = 'Safety & property';
            content = this.generateList(this.policies.safetyGuidelines);
        } else if (category === 'cancellation') {
            title = 'Cancellation policy';
            content = `<p class="policy-text-large">${this.policies.cancellationPolicy}</p>
                       <p class="text-secondary mt-3">Make sure to read the host's full cancellation policy which applies even if you cancel due to illness or disruptions caused by COVID-19.</p>`;
        }

        titleEl.textContent = title;
        bodyEl.innerHTML = content;

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    generateList(items) {
        if (!items || items.length === 0) return '<p>No details provided.</p>';

        return `
            <ul class="policy-full-list">
                ${items.map(item => `
                    <li>
                        <i class="fas fa-check"></i>
                        <span>${item}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    attachListeners() {
        // House Rules Trigger
        const rulesBtn = document.querySelector('[data-policy-trigger="houseRules"]');
        if (rulesBtn) rulesBtn.addEventListener('click', () => this.open('houseRules'));

        // Safety Trigger
        const safetyBtn = document.querySelector('[data-policy-trigger="safety"]');
        if (safetyBtn) safetyBtn.addEventListener('click', () => this.open('safety'));

        // Cancellation Trigger
        const cancelBtn = document.querySelector('[data-policy-trigger="cancellation"]');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.open('cancellation'));
    }
}
