// Advanced Availability Manager
class AdvancedAvailabilityManager {
    constructor(listingId, initialData) {
        this.listingId = listingId;
        this.listing = initialData.listing;
        this.bookings = initialData.bookings || [];

        // State
        this.selectedDates = new Set();
        this.blockedDates = new Set();
        this.bookedDates = new Set();
        this.pricingVariations = new Map();
        this.recurringBlocks = [];
        this.history = [];
        this.historyIndex = -1;

        // UI State
        this.currentMode = 'multiple';
        this.currentAction = 'block'; // 'block' or 'available'
        this.isDragging = false;
        this.dragStart = null;
        this.currentMonth = new Date();
        this.monthsToShow = window.innerWidth > 992 ? 3 : 1;

        this.init();
    }

    init() {
        this.processInitialData();
        this.renderCalendar();
        this.setupEventListeners();
        this.updateAnalytics();
        this.loadPricingVariations();
    }

    processInitialData() {
        // Process blocked dates
        if (this.listing.unavailableDates) {
            this.listing.unavailableDates.forEach(date => {
                this.blockedDates.add(this.formatDate(new Date(date)));
            });
        }

        // Process booked dates
        this.bookings.forEach(booking => {
            let curr = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            while (curr <= end) {
                this.bookedDates.add(this.formatDate(new Date(curr)));
                curr.setDate(curr.getDate() + 1);
            }
        });
    }

    renderCalendar() {
        const container = document.getElementById('advanced-calendar');
        if (!container) return;

        let html = '<div class="multi-month-calendar">';

        for (let i = 0; i < this.monthsToShow; i++) {
            const monthDate = new Date(this.currentMonth);
            monthDate.setMonth(monthDate.getMonth() + i);
            html += this.renderMonth(monthDate);
        }

        html += '</div>';
        container.innerHTML = html;

        this.attachCalendarListeners();
    }

    renderMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayIndex = firstDay.getDay();

        let html = `
            <div class="calendar-month">
                <div class="month-header">
                    <h5 class="month-title">${monthNames[month]} ${year}</h5>
                </div>
                <div class="weekdays-grid">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
            `<div class="weekday">${day}</div>`
        ).join('')}
                </div>
                <div class="days-grid">
        `;

        // Empty cells for days before month starts
        for (let i = 0; i < firstDayIndex; i++) {
            html += '<div class="day-cell empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateStr = this.formatDate(currentDate);
            const isToday = this.isToday(currentDate);
            const isPast = currentDate < new Date().setHours(0, 0, 0, 0);
            const isBlocked = this.blockedDates.has(dateStr);
            const isBooked = this.bookedDates.has(dateStr);
            const isSelected = this.selectedDates.has(dateStr);
            const pricing = this.pricingVariations.get(dateStr);

            let classes = ['day-cell'];
            if (isToday) classes.push('today');
            if (isPast) classes.push('past');
            if (isBlocked) classes.push('blocked');
            if (isBooked) classes.push('booked');
            if (isSelected) classes.push('selected');
            if (pricing) classes.push('has-pricing');
            if (!isPast && !isBooked) classes.push('selectable');

            html += `
                <div class="${classes.join(' ')}" data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    ${pricing ? `<span class="price-badge">₹${pricing.price}</span>` : ''}
                    ${isBlocked ? '<span class="status-icon blocked-icon">🚫</span>' : ''}
                    ${isBooked ? '<span class="status-icon booked-icon">📅</span>' : ''}
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    attachCalendarListeners() {
        const dayCells = document.querySelectorAll('.day-cell.selectable');

        dayCells.forEach(cell => {


            // Drag to select
            cell.addEventListener('mousedown', (e) => {
                if (!cell.classList.contains('booked')) {
                    this.isDragging = true;
                    this.dragStart = cell.dataset.date;

                    // If mode is 'price', we just want to select, not toggle
                    if (this.currentAction === 'price') {
                        this.dragStartAction = 'select'; // Custom action for pricing selection
                    } else {
                        // Determine initial action based on CURRENT state before toggle
                        const isBlocked = this.blockedDates.has(this.dragStart);
                        this.dragStartAction = isBlocked ? 'available' : 'block';
                    }

                    // Apply action immediately if not price mode (price mode waits for modal)
                    if (this.currentAction !== 'price') {
                        this.applyActionToDate(this.dragStart, this.dragStartAction);
                        this.saveToHistory();
                        this.renderCalendar();
                        this.updateAnalytics();
                    } else {
                        // Just visually select
                        this.selectedDates.clear(); // Clear previous selection for new range
                        this.selectedDates.add(this.dragStart);
                        this.renderCalendar();
                    }

                    e.preventDefault();
                }
            });

            cell.addEventListener('mouseenter', (e) => {
                if (this.isDragging && this.dragStart && !cell.classList.contains('booked')) {
                    this.handleDateDrag(this.dragStart, cell.dataset.date);
                }
            });

            cell.addEventListener('mouseup', () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    this.dragStart = null;
                    this.dragStartAction = null; // Reset drag action
                    this.saveToHistory();

                    // If in price mode and we have a selection, show modal automatically
                    if (this.currentAction === 'price' && this.selectedDates.size > 0) {
                        this.showPricingModal();
                    }
                }
            });
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.dragStart = null;
            this.dragStartAction = null;
        });
    }

    handleDateClick(dateStr) {
        // 1. Check if clicking on an existing price variation -> Edit it
        const existingPrice = this.pricingVariations.get(dateStr);
        if (existingPrice) {
            this.selectedDates.clear();
            this.selectedDates.add(dateStr); // Select just this one for context
            this.showPricingModal(existingPrice); // Pass existing data
            return;
        }

        // 2. Normal Toggle Logic
        // Toggle logic: If blocked, make available. If available, block.
        const isBlocked = this.blockedDates.has(dateStr);

        // If in Price mode, clicking just selects it (and then auto-opens modal if simple click)
        if (this.currentAction === 'price') {
            this.selectedDates.clear();
            this.selectedDates.add(dateStr);
            this.renderCalendar();
            this.showPricingModal();
            return;
        }

        const action = isBlocked ? 'available' : 'block';
        this.applyActionToDate(dateStr, action);
        this.saveToHistory();
        this.renderCalendar();
        this.updateAnalytics();
    }

    handleDateDrag(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const [d1, d2] = start <= end ? [start, end] : [end, start];

        // Smart Paint: Determine action based on the start date of the drag
        if (!this.dragStartAction) {
            const isStartBlocked = this.blockedDates.has(startDate);
            this.dragStartAction = isStartBlocked ? 'available' : 'block';
        }

        let curr = new Date(d1);
        let changed = false;

        while (curr <= d2) {
            const dateStr = this.formatDate(curr);
            if (!this.bookedDates.has(dateStr)) {
                // Apply the determined action to all cells in range
                if (this.dragStartAction === 'select') {
                    this.selectedDates.add(dateStr);
                    changed = true;
                } else if (this.applyActionToDate(dateStr, this.dragStartAction, false)) {
                    changed = true;
                }
            }
            curr.setDate(curr.getDate() + 1);
        }

        if (changed) {
            this.renderCalendar();
            this.updateAnalytics();
        }
    }

    applyActionToDate(dateStr, action, updateSelected = true) {
        let changed = false;

        // Use provided action or fallback to currentAction (though click/drag logic overrides this now)
        const act = action || this.currentAction;

        if (act === 'available') {
            if (this.blockedDates.has(dateStr)) {
                this.blockedDates.delete(dateStr);
                changed = true;
            }
        } else {
            if (!this.blockedDates.has(dateStr)) {
                this.blockedDates.add(dateStr);
                changed = true;
            }
        }

        if (updateSelected) {
            this.selectedDates.add(dateStr);
        }
        return changed;
    }

    setupEventListeners() {
        // Mode toggles
        document.getElementById('btn-multiple')?.addEventListener('click', () => {
            this.currentMode = 'multiple';
            document.getElementById('btn-multiple').classList.add('active');
            document.getElementById('btn-range')?.classList.remove('active');
        });

        document.getElementById('btn-range')?.addEventListener('click', () => {
            this.currentMode = 'range';
            document.getElementById('btn-range').classList.add('active');
            document.getElementById('btn-multiple')?.classList.remove('active');
        });

        // Action toggles
        document.getElementById('action-block')?.addEventListener('click', () => {
            this.currentAction = 'block';
            document.getElementById('action-block').classList.add('active');
            document.getElementById('action-available')?.classList.remove('active');
            toast.info('Mode: Planning to Block dates', { icon: '🚫' });
        });

        document.getElementById('action-available')?.addEventListener('click', () => {
            this.currentAction = 'available';
            document.getElementById('action-available').classList.add('active');
            document.getElementById('action-block')?.classList.remove('active');
            document.getElementById('action-price')?.classList.remove('active');
            toast.info('Mode: Planning to make dates Available', { icon: '✅' });
        });

        document.getElementById('action-price')?.addEventListener('click', () => {
            this.currentAction = 'price';
            document.getElementById('action-price').classList.add('active');
            document.getElementById('action-block')?.classList.remove('active');
            document.getElementById('action-available')?.classList.remove('active');
            toast.info('Mode: Select range to set Custom Price', { icon: '🏷️' });
        });

        // Quick actions
        document.getElementById('quick-block-30')?.addEventListener('click', () => this.blockNext30Days());
        document.getElementById('quick-block-weekends')?.addEventListener('click', () => this.blockWeekends());
        document.getElementById('quick-clear-all')?.addEventListener('click', () => this.clearAllBlocks());

        // Save button
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveAvailability());

        // Navigation
        document.getElementById('prev-months')?.addEventListener('click', () => this.navigateMonths(-1));
        document.getElementById('next-months')?.addEventListener('click', () => this.navigateMonths(1));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });

        // Recurring pattern button
        document.getElementById('btn-recurring')?.addEventListener('click', () => this.showRecurringModal());

        // Pricing variation button
        document.getElementById('btn-pricing')?.addEventListener('click', () => this.showPricingModal());

        // Export button
        document.getElementById('btn-export')?.addEventListener('click', () => this.exportCalendar());
    }

    // Quick Actions
    blockNext30Days() {
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date);
            if (!this.bookedDates.has(dateStr)) {
                this.blockedDates.add(dateStr);
            }
        }
        this.saveToHistory();
        this.renderCalendar();
        this.updateAnalytics();
        toast.success('Blocked next 30 days');
    }

    blockWeekends() {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 3);

        let curr = new Date(today);
        while (curr <= endDate) {
            if (curr.getDay() === 0 || curr.getDay() === 6) {
                const dateStr = this.formatDate(curr);
                if (!this.bookedDates.has(dateStr)) {
                    this.blockedDates.add(dateStr);
                }
            }
            curr.setDate(curr.getDate() + 1);
        }

        this.saveToHistory();
        this.renderCalendar();
        this.updateAnalytics();
        toast.success('Blocked all weekends for next 3 months');
    }

    clearAllBlocks() {
        if (confirm('Are you sure you want to clear all blocked dates?')) {
            this.blockedDates.clear();
            this.selectedDates.clear();
            this.saveToHistory();
            this.renderCalendar();
            this.updateAnalytics();
            toast.success('All blocks cleared');
        }
    }

    // Analytics
    async updateAnalytics() {
        try {
            const response = await fetch(`/listings/${this.listingId}/availability/analytics?days=90`);
            const data = await response.json();

            if (data.success) {
                const analytics = data.analytics;
                document.getElementById('stat-count').textContent = analytics.blockedDays;
                document.getElementById('stat-occupancy').textContent = `${analytics.occupancyRate}%`;
                document.getElementById('stat-value').textContent = `₹${analytics.estimatedLoss.toLocaleString('en-IN')}`;

                // Update additional stats if elements exist
                if (document.getElementById('stat-booked')) {
                    document.getElementById('stat-booked').textContent = analytics.bookedDays;
                }
                if (document.getElementById('stat-available')) {
                    document.getElementById('stat-available').textContent = analytics.availableDays;
                }
                if (document.getElementById('stat-revenue')) {
                    document.getElementById('stat-revenue').textContent = `₹${analytics.projectedRevenue.toLocaleString('en-IN')}`;
                }
            }
        } catch (err) {
            console.error('Analytics error:', err);
        }
    }

    // Save
    async saveAvailability() {
        const btn = document.getElementById('save-btn');
        const originalHTML = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Saving...';

        try {
            const unavailableDates = Array.from(this.blockedDates).map(d => new Date(d).toISOString());

            const response = await fetch(`/listings/${this.listingId}/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unavailableDates })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Calendar updated successfully!');
                this.updateAnalytics();
            } else {
                toast.error(data.message || 'Failed to update calendar');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Connection error. Please try again.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }

    // Recurring Patterns
    showRecurringModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="recurringModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Apply Recurring Pattern</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Pattern Type</label>
                                <select class="form-select" id="pattern-type">
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div class="mb-3" id="weekly-pattern">
                                <label class="form-label">Select Days</label>
                                <div class="btn-group-vertical w-100" role="group">
                                    ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => `
                                        <input type="checkbox" class="btn-check" id="day-${i}" value="${i}">
                                        <label class="btn btn-outline-primary" for="day-${i}">${day}</label>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Start Date</label>
                                <input type="date" class="form-control" id="pattern-start">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">End Date</label>
                                <input type="date" class="form-control" id="pattern-end">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="apply-pattern-btn">Apply Pattern</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        document.getElementById('recurringModal')?.remove();

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('recurringModal'));
        modal.show();

        // Apply pattern button
        document.getElementById('apply-pattern-btn').addEventListener('click', () => {
            this.applyRecurringPattern();
            modal.hide();
        });
    }

    async applyRecurringPattern() {
        const type = document.getElementById('pattern-type').value;
        const startDate = document.getElementById('pattern-start').value;
        const endDate = document.getElementById('pattern-end').value;

        let pattern = [];
        if (type === 'weekly') {
            document.querySelectorAll('#weekly-pattern input:checked').forEach(input => {
                pattern.push(parseInt(input.value));
            });
        }

        if (!startDate || !endDate || pattern.length === 0) {
            toast.warning('Please fill all fields');
            return;
        }

        try {
            const response = await fetch(`/listings/${this.listingId}/availability/recurring-blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, pattern, startDate, endDate })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Applied recurring pattern! ${data.datesAdded} dates added.`);
                // Reload data
                location.reload();
            } else {
                toast.error(data.message || 'Failed to apply pattern');
            }
        } catch (err) {
            console.error('Recurring pattern error:', err);
            toast.error('Failed to apply pattern');
        }
    }

    // Pricing Variations
    async loadPricingVariations() {
        try {
            const response = await fetch(`/listings/${this.listingId}/availability/pricing-variations`);
            const data = await response.json();

            if (data.success && data.variations) {
                data.variations.forEach(variation => {
                    let curr = new Date(variation.startDate);
                    const end = new Date(variation.endDate);
                    while (curr <= end) {
                        this.pricingVariations.set(this.formatDate(curr), variation);
                        curr.setDate(curr.getDate() + 1);
                    }
                });
                this.renderCalendar();
            }
        } catch (err) {
            console.error('Load pricing error:', err);
        }
    }

    showPricingModal(existingData = null) {
        // If no dates selected, show warning
        if (this.selectedDates.size === 0) {
            toast.warning('Please select dates on the calendar first');
            return;
        }

        // Get date range from selection
        const dates = Array.from(this.selectedDates).sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        // Populate modal UI
        const modalTitle = document.querySelector('#pricingModal .modal-title');
        const priceInput = document.getElementById('custom-price');
        const reasonInput = document.getElementById('pricing-reason');
        const startDateEl = document.getElementById('pricing-start-date');
        const endDateEl = document.getElementById('pricing-end-date');
        const saveBtn = document.getElementById('save-pricing-btn');
        const removeBtn = document.getElementById('remove-pricing-btn');

        startDateEl.textContent = new Date(startDate).toLocaleDateString();
        endDateEl.textContent = new Date(endDate).toLocaleDateString();

        // Check if we are editing
        if (existingData) {
            modalTitle.textContent = 'Edit Custom Price';
            priceInput.value = existingData.price;
            reasonInput.value = existingData.reason || '';
            saveBtn.textContent = 'Update Price';
            removeBtn.classList.remove('d-none');
        } else {
            modalTitle.textContent = 'Set Custom Price';
            priceInput.value = '';
            reasonInput.value = '';
            saveBtn.textContent = 'Set Price';
            removeBtn.classList.add('d-none');
        }

        // Show modal
        const modalEl = document.getElementById('pricingModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // Handle Remove
        const newRemoveBtn = removeBtn.cloneNode(true);
        removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);

        if (existingData) {
            newRemoveBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to remove this custom pricing?')) return;

                try {
                    newRemoveBtn.disabled = true;
                    newRemoveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Removing...';

                    const response = await fetch(`/listings/${this.listingId}/availability/pricing-variations/${existingData._id}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (data.success) {
                        toast.success('Price variation removed');
                        modal.hide();

                        // Reload pricing variations to update calendar
                        this.loadPricingVariations();

                        // Clear selection
                        this.selectedDates.clear();
                        this.renderCalendar();
                    } else {
                        toast.error(data.message || 'Failed to remove');
                    }

                } catch (err) {
                    console.error('Remove error:', err);
                    toast.error('Failed to remove price');
                } finally {
                    newRemoveBtn.disabled = false;
                    newRemoveBtn.innerHTML = '<i class="fas fa-trash-alt me-2"></i>Remove';
                }
            });
        }


        // Handle save
        // Remove old execution to prevent dupes
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);

        newBtn.addEventListener('click', async () => {
            const price = priceInput.value;
            const reason = reasonInput.value;

            if (!price || price < 0) {
                toast.warning('Please enter a valid price');
                return;
            }

            // Call API
            try {
                newBtn.disabled = true;
                newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

                const response = await fetch(`/listings/${this.listingId}/availability/pricing-variations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startDate: startDate,
                        endDate: endDate,
                        price: parseFloat(price),
                        reason: reason
                    })
                });

                const data = await response.json();

                if (data.success) {
                    toast.success(existingData ? 'Price updated successfully' : 'Custom price set successfully');
                    modal.hide();

                    // Reload pricing variations to update calendar
                    this.loadPricingVariations();

                    // Clear selection
                    this.selectedDates.clear();
                    this.renderCalendar();
                } else {
                    toast.error(data.message || 'Failed to set price');
                }

            } catch (err) {
                console.error('Pricing error:', err);
                toast.error('Failed to save price');
            } finally {
                newBtn.disabled = false;
                newBtn.innerHTML = existingData ? 'Update Price' : 'Set Price';
            }
        });
    }

    // Export
    async exportCalendar() {
        try {
            window.location.href = `/listings/${this.listingId}/availability/export`;
            toast.success('Downloading calendar file...');
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to export calendar');
        }
    }

    // Navigation
    navigateMonths(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.renderCalendar();
    }

    // History (Undo/Redo)
    saveToHistory() {
        const state = {
            blockedDates: new Set(this.blockedDates),
            selectedDates: new Set(this.selectedDates)
        };

        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex++;

        // Limit history to 50 states
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.blockedDates = new Set(state.blockedDates);
            this.selectedDates = new Set(state.selectedDates);
            this.renderCalendar();
            this.updateAnalytics();
            toast.info('Undo');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.blockedDates = new Set(state.blockedDates);
            this.selectedDates = new Set(state.selectedDates);
            this.renderCalendar();
            this.updateAnalytics();
            toast.info('Redo');
        }
    }

    // Utilities
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }
}

// Initialize when DOM is ready
window.initAdvancedAvailability = function (listingId, initialData) {
    window.availabilityManager = new AdvancedAvailabilityManager(listingId, initialData);
};
