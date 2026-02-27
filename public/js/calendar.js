class AvailabilityCalendar {
    constructor(options) {
        this.calendarEl = document.getElementById(options.elementId);
        this.type = options.type; // 'listing' or 'vehicle'
        this.itemId = options.itemId;
        this.price = options.price;
        this.bookingModalId = options.bookingModalId;
        this.startDateId = options.startDateId;
        this.endDateId = options.endDateId;
        this.startTimeId = options.startTimeId;
        this.endTimeId = options.endTimeId;
        this.amountDisplayId = options.amountDisplayId;
        this.selectedStart = null;
        this.selectedEnd = null;
        this.bookedDates = [];
        this.calendar = null;

        this.initialize();
    }

    async initialize() {
        if (!this.calendarEl) return;

        // Fetch initial bookings
        await this.fetchBookings();

        // Initialize FullCalendar
        this.calendar = new FullCalendar.Calendar(this.calendarEl, {
            initialView: 'dayGridMonth',
            height: 'auto',
            selectable: true,
            selectConstraint: {
                start: new Date(),
                end: '2100-01-01'
            },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
            },
            events: this.bookedDates,
            select: (info) => this.handleDateSelect(info),
            eventDidMount: (info) => this.handleEventMount(info),
            selectConstraint: 'available',
            selectOverlap: false,
            longPressDelay: 100,
            eventColor: '#dc3545',
            validRange: {
                start: new Date()
            }
        });

        this.calendar.render();
        this.setupEventListeners();
        this.initializeWebSocket();
    }

    async fetchBookings() {
        try {
            const response = await fetch(`/${this.type}s/${this.itemId}/bookings`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
                // Server may have redirected to login page (HTML) - handle gracefully
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error('Server returned non-JSON response (possibly redirected to login)');
                }
                throw new Error('Failed to fetch bookings');
            }
            this.bookedDates = await response.json();
        } catch (error) {
            console.error('Error fetching bookings:', error);
            this.bookedDates = [];
        }
    }

    handleDateSelect(info) {
        const startDate = info.start;
        const endDate = info.end;

        if (this.isDateRangeBooked(startDate, endDate)) {
            alert('Some dates in this range are already booked');
            this.calendar.unselect();
            return;
        }

        this.selectedStart = startDate;
        this.selectedEnd = endDate;

        // Update form inputs
        document.getElementById(this.startDateId).value = this.formatDate(startDate);
        document.getElementById(this.endDateId).value = this.formatDate(endDate);

        // For vehicles, set default times if time inputs exist
        if (this.type === 'vehicle') {
            const startTimeInput = document.getElementById(this.startTimeId);
            const endTimeInput = document.getElementById(this.endTimeId);
            if (startTimeInput) startTimeInput.value = '10:00';
            if (endTimeInput) endTimeInput.value = '18:00';
        }

        this.updateTotalPrice();

        // Open booking modal
        const bookingModal = new bootstrap.Modal(document.getElementById(this.bookingModalId));
        bookingModal.show();
    }

    handleEventMount(info) {
        // Add tooltips to booked dates
        new bootstrap.Tooltip(info.el, {
            title: `${info.event.title} - From ${this.formatDate(info.event.start)} ${info.event.extendedProps.startTime || ''} to ${this.formatDate(info.event.end)} ${info.event.extendedProps.endTime || ''}`,
            placement: 'top',
            trigger: 'hover',
            container: 'body'
        });
    }

    setupEventListeners() {
        // Listen for date/time input changes
        const startDateInput = document.getElementById(this.startDateId);
        const endDateInput = document.getElementById(this.endDateId);
        const startTimeInput = document.getElementById(this.startTimeId);
        const endTimeInput = document.getElementById(this.endTimeId);

        startDateInput?.addEventListener('change', () => this.updateTotalPrice());
        endDateInput?.addEventListener('change', () => this.updateTotalPrice());
        startTimeInput?.addEventListener('change', () => this.updateTotalPrice());
        endTimeInput?.addEventListener('change', () => this.updateTotalPrice());
    }

    initializeWebSocket() {
        // Set up WebSocket connection for real-time updates
        const ws = new WebSocket(window.location.origin.replace(/^http/, 'ws'));

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === `${this.type}_booking` && data.itemId === this.itemId) {
                await this.fetchBookings();
                this.calendar.removeAllEvents();
                this.calendar.addEventSource(this.bookedDates);
            }
        };
    }

    isDateRangeBooked(start, end) {
        return this.bookedDates.some(booking => {
            const bookingStart = new Date(booking.start);
            const bookingEnd = new Date(booking.end);
            return (start < bookingEnd && end > bookingStart);
        });
    }

    updateTotalPrice() {
        const startDateInput = document.getElementById(this.startDateId);
        const endDateInput = document.getElementById(this.endDateId);
        const amountDisplay = document.getElementById(this.amountDisplayId);

        if (!startDateInput || !endDateInput || !amountDisplay) return;

        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return;

        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const total = this.price * days;

        amountDisplay.textContent = `₹${total.toLocaleString("en-IN")}`;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    refreshCalendar() {
        this.fetchBookings().then(() => {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(this.bookedDates);
        });
    }
}