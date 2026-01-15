class WanderLustCalendar {
  constructor(containerId, options = {}) {
    // Default options
    this.options = {
      showHeader: true,
      showWeekdays: true,
      showToday: true,
      showClearBtn: true,
      minDate: new Date(),
      maxDate: null,
      initialDate: new Date(),
      theme: {
        primary: '#00A699',
        secondary: '#007A87',
        accent: '#FF5A5F',
        background: 'rgba(255, 255, 255, 0.8)',
        text: '#484848',
        lightText: '#767676',
        border: 'rgba(0, 0, 0, 0.08)'
      },
      onDateSelect: () => { },
      onMonthChange: () => { },
      ...options
    };

    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    this.currentDate = new Date(this.options.initialDate);
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);

    this.unavailableDates = [];
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.hoveredDate = null;

    this.init();
  }

  init() {
    this.applyStyles();
    this.render();
    this.setupEventListeners();
  }

  applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .wanderlust-calendar {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        background: ${this.options.theme.background};
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        border: 1px solid ${this.options.theme.border};
        transition: all 0.3s ease;
      }
      
      .calendar-header {
        background: ${this.options.theme.primary};
        color: white;
        padding: 1rem;
        text-align: center;
        position: relative;
      }
      
      .calendar-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      .calendar-nav button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .calendar-nav button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
      
      .calendar-month {
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        padding: 0.5rem 1rem;
        background: ${this.options.theme.background};
        border-bottom: 1px solid ${this.options.theme.border};
      }
      
      .weekday {
        text-align: center;
        font-size: 0.75rem;
        font-weight: 600;
        color: ${this.options.theme.text};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 0.5rem 0;
      }
      
      .calendar-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        padding: 0.5rem;
      }
      
      .calendar-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        font-weight: 500;
        color: ${this.options.theme.text};
      }
      
      .calendar-day:hover:not(.disabled, .unavailable) {
        background: ${this.addAlpha(this.options.theme.primary, 0.1)};
        transform: translateY(-2px);
      }
      
      .calendar-day.today {
        font-weight: 700;
        color: ${this.options.theme.primary};
        position: relative;
      }
      
      .calendar-day.today::after {
        content: '';
        position: absolute;
        top: 4px;
        right: 4px;
        width: 6px;
        height: 6px;
        background: ${this.options.theme.primary};
        border-radius: 50%;
      }
      
      .calendar-day.selected {
        background: ${this.options.theme.primary};
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 12px ${this.addAlpha(this.options.theme.primary, 0.3)};
      }
      
      .calendar-day.in-range {
        background: ${this.addAlpha(this.options.theme.primary, 0.1)};
        border-radius: 0;
      }
      
      .calendar-day.range-start {
        border-top-left-radius: 12px;
        border-bottom-left-radius: 12px;
      }
      
      .calendar-day.range-end {
        border-top-right-radius: 12px;
        border-bottom-right-radius: 12px;
      }
      
      .calendar-day.disabled {
        color: #9ca3af;
        cursor: not-allowed;
        background-color: #f3f4f6;
        text-decoration: line-through;
        opacity: 1;
      }
      
      .calendar-day.unavailable {
        position: relative;
        color: ${this.options.theme.lightText};
        cursor: not-allowed;
      }
      
      .calendar-day.unavailable::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 60%;
        height: 2px;
        background: #ff4d4f;
        transform: translate(-50%, -50%) rotate(-5deg);
        opacity: 0.7;
      }
      
      .calendar-day.highlight {
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 ${this.addAlpha(this.options.theme.primary, 0.4)}; }
        70% { box-shadow: 0 0 0 10px ${this.addAlpha(this.options.theme.primary, 0)}; }
        100% { box-shadow: 0 0 0 0 ${this.addAlpha(this.options.theme.primary, 0)}; }
      }
      
      .calendar-footer {
        padding: 1rem;
        border-top: 1px solid ${this.options.theme.border};
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: ${this.options.theme.background};
      }
      
      .status-legend {
        display: flex;
        gap: 12px;
        font-size: 0.75rem;
      }
      
      .status-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      
      .status-available { background: #52c41a; }
      .status-booked { background: #ff4d4f; }
      .status-today { background: ${this.options.theme.primary}; }
      .status-selected { background: ${this.options.theme.accent}; }
      
      .trip-countdown {
        background: ${this.addAlpha(this.options.theme.primary, 0.1)};
        color: ${this.options.theme.primary};
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .section-icon {
        font-size: 1.2rem;
        margin-right: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  addAlpha(color, opacity) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Calculate days from previous month to show
    const prevMonthDays = firstDay === 0 ? 6 : firstDay - 1;

    // Calculate total cells needed (always show 6 weeks for consistent height)
    const totalCells = Math.ceil((daysInMonth + prevMonthDays) / 7) * 7;
    const nextMonthDays = totalCells - (daysInMonth + prevMonthDays);

    // Generate days array
    const days = [];

    // Previous month days
    for (let i = prevMonthDays; i > 0; i--) {
      const day = daysInPrevMonth - i + 1;
      const date = new Date(year, month - 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, this.today),
        isDisabled: this.isDateDisabled(date),
        isUnavailable: this.isDateUnavailable(date)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        day: i,
        date,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, this.today),
        isDisabled: this.isDateDisabled(date),
        isUnavailable: this.isDateUnavailable(date)
      });
    }

    // Next month days
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        day: i,
        date,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, this.today),
        isDisabled: this.isDateDisabled(date),
        isUnavailable: this.isDateUnavailable(date)
      });
    }

    // Render the calendar
    this.container.innerHTML = `
      <div class="wanderlust-calendar">
        ${this.options.showHeader ? `
          <div class="calendar-header">
            <div class="calendar-nav">
              <button class="prev-month" aria-label="Previous month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <div class="calendar-month">
                ${this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
              <button class="next-month" aria-label="Next month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
            
            <!-- Trip Countdown -->
            <div class="trip-countdown mt-2">
              <span class="section-icon">🚗</span>
              <span class="trip-countdown-text">Your next trip starts in <strong>${this.getDaysUntilNextTrip()}</strong></span>
            </div>
          </div>
        ` : ''}
        
        ${this.options.showWeekdays ? `
          <div class="calendar-weekdays">
            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          .map(day => `<div class="weekday">${day}</div>`)
          .join('')}
          </div>
        ` : ''}
        
        <div class="calendar-days">
          ${days.map((day, index) => {
            const isInRange = this.isDateInRange(day.date);
            const isStart = this.selectedStartDate && this.isSameDay(day.date, this.selectedStartDate);
            const isEnd = this.selectedEndDate && this.isSameDay(day.date, this.selectedEndDate);
            const isRangeStart = isStart && this.selectedEndDate;
            const isRangeEnd = isEnd && this.selectedStartDate;

            let className = 'calendar-day';
            if (!day.isCurrentMonth || day.isDisabled) className += ' disabled';
            if (day.isToday) className += ' today';
            if (day.isUnavailable) className += ' unavailable';
            if (isStart || isEnd) className += ' selected';
            if (isInRange) className += ' in-range';
            if (isRangeStart) className += ' range-start';
            if (isRangeEnd) className += ' range-end';

            // Add highlight class to today's date
            if (day.isToday) className += ' highlight';

            return `
              <div 
                class="${className}" 
                data-date="${day.date.toISOString()}"
                data-day="${day.day}"
                data-month="${day.date.getMonth()}"
                data-year="${day.date.getFullYear()}"
                ${day.isDisabled || day.isUnavailable ? 'disabled' : ''}
              >
                ${day.day}
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="calendar-footer">
          <div class="status-legend">
            <div class="status-item">
              <span class="status-dot status-available"></span>
              <span>Available</span>
            </div>
            <div class="status-item">
              <span class="status-dot status-booked"></span>
              <span>Booked</span>
            </div>
            <div class="status-item">
              <span class="status-dot status-today"></span>
              <span>Today</span>
            </div>
            <div class="status-item">
              <span class="status-dot status-selected"></span>
              <span>Selected</span>
            </div>
          </div>
          
          ${this.options.showClearBtn ? `
            <button class="btn-clear" style="background: none; border: none; color: ${this.options.theme.primary}; cursor: pointer; font-size: 0.85rem;">
              Clear
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Add event listeners
    this.setupEventListeners();
  }

  getDaysUntilNextTrip() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the next available date (for demo purposes, using today + random 1-14 days)
    const nextAvailableDate = new Date(today);
    nextAvailableDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1);

    const diffTime = nextAvailableDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }

  isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  isDateDisabled(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (date < today) return true;

    // Check against min/max dates if provided
    if (this.options.minDate && date < this.options.minDate) return true;
    if (this.options.maxDate && date > this.options.maxDate) return true;

    return false;
  }

  isDateUnavailable(date) {
    return this.unavailableDates.some(d => this.isSameDay(d, date));
  }

  isDateInRange(date) {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;

    const start = new Date(this.selectedStartDate);
    const end = new Date(this.selectedEndDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return date > start && date < end && !this.isSameDay(date, start) && !this.isSameDay(date, end);
  }

  setupEventListeners() {
    // Navigation
    const prevBtn = this.container.querySelector('.prev-month');
    const nextBtn = this.container.querySelector('.next-month');
    const clearBtn = this.container.querySelector('.btn-clear');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateMonth(-1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateMonth(1));
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSelection());
    }

    // Date selection
    const dayElements = this.container.querySelectorAll('.calendar-day:not(.disabled):not(.unavailable)');
    dayElements.forEach(dayEl => {
      dayEl.addEventListener('click', () => this.handleDateClick(dayEl));

      // Hover effect for range selection
      dayEl.addEventListener('mouseenter', () => {
        if (this.selectedStartDate && !this.selectedEndDate) {
          this.hoveredDate = new Date(dayEl.dataset.date);
          this.render();
        }
      });
    });
  }

  navigateMonth(offset) {
    this.currentDate.setMonth(this.currentDate.getMonth() + offset);
    this.render();

    // Call the onMonthChange callback
    if (typeof this.options.onMonthChange === 'function') {
      this.options.onMonthChange(
        this.currentDate.getMonth(),
        this.currentDate.getFullYear()
      );
    }
  }

  handleDateClick(dayEl) {
    const date = new Date(dayEl.dataset.date);

    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      // First selection or new selection
      this.selectedStartDate = date;
      this.selectedEndDate = null;
    } else if (this.selectedStartDate && !this.selectedEndDate) {
      // Second selection
      if (date > this.selectedStartDate) {
        this.selectedEndDate = date;
      } else {
        // If selected date is before start date, make it the new start date
        this.selectedStartDate = date;
      }
    }

    // Call the onDateSelect callback
    if (typeof this.options.onDateSelect === 'function') {
      this.options.onDateSelect(date, {
        startDate: this.selectedStartDate,
        endDate: this.selectedEndDate
      });
    }

    // Re-render to update the UI
    this.render();
  }

  clearSelection() {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.render();

    // Call the onDateSelect callback with null to indicate clearing
    if (typeof this.options.onDateSelect === 'function') {
      this.options.onDateSelect(null);
    }
  }

  // Public methods
  markUnavailable(date) {
    if (!this.isDateInArray(date, this.unavailableDates)) {
      this.unavailableDates.push(new Date(date));
      this.render();
    }
  }

  markAvailable(date) {
    this.unavailableDates = this.unavailableDates.filter(d => !this.isSameDay(d, date));
    this.render();
  }

  markToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Scroll to today's date
    if (this.currentDate.getMonth() !== today.getMonth() ||
      this.currentDate.getFullYear() !== today.getFullYear()) {
      this.currentDate = new Date(today);
      this.render();
    }
  }

  setUnavailableDates(dates) {
    this.unavailableDates = dates.map(date => new Date(date));
    this.render();
  }

  isDateInArray(date, dateArray) {
    return dateArray.some(d => this.isSameDay(d, date));
  }

  // Getters
  getSelectedDates() {
    if (!this.selectedStartDate) return [];
    if (!this.selectedEndDate) return [this.selectedStartDate];

    const dates = [];
    const current = new Date(this.selectedStartDate);
    const end = new Date(this.selectedEndDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  getSelectedRange() {
    return {
      start: this.selectedStartDate ? new Date(this.selectedStartDate) : null,
      end: this.selectedEndDate ? new Date(this.selectedEndDate) : null
    };
  }
}

// Make it available globally
window.WanderLustCalendar = WanderLustCalendar;
