class AvailabilityCalendar {
  constructor(containerId, options = {}) {
    // Default options
    this.options = {
      // Date settings
      minDate: new Date(),
      maxDate: this.addMonths(new Date(), 12), // 1 year from now
      initialDate: new Date(),
      
      // Visual settings
      showHeader: true,
      showWeekdays: true,
      showToday: true,
      showClearBtn: true,
      showLegend: true,
      allowPastDates: false,
      
      // Colors
      theme: {
        primary: '#10b981',       // Available
        secondary: '#f59e0b',     // Partially booked
        danger: '#ef4444',        // Booked
        background: 'white',
        text: '#1f2937',
        lightText: '#6b7280',
        border: '#e5e7eb',
        today: '#3b82f6',
        hover: '#f3f4f6'
      },
      
      // Callbacks
      onDateSelect: () => {},
      onMonthChange: () => {},
      onDateHover: () => {},
      
      // Merge with user options
      ...options
    };

    // Initialize properties
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    this.currentDate = new Date(this.options.initialDate);
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    
    // State
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.hoveredDate = null;
    this.availabilityData = new Map(); // Will store date -> availability status
    
    // Initialize
    this.init();
  }

  // Initialize the calendar
  init() {
    this.container.classList.add('availability-calendar');
    this.applyStyles();
    this.render();
    this.setupEventListeners();
  }

  // Set availability for specific dates
  setAvailability(dates, status = 'available') {
    if (!Array.isArray(dates)) dates = [dates];
    
    dates.forEach(date => {
      const dateStr = this.formatDate(date);
      this.availabilityData.set(dateStr, status);
    });
    
    this.render();
  }

  // Set multiple availabilities at once
  setAvailabilities(availabilities) {
    Object.entries(availabilities).forEach(([date, status]) => {
      this.availabilityData.set(date, status);
    });
    this.render();
  }

  // Clear all availability data
  clearAvailability() {
    this.availabilityData.clear();
    this.render();
  }

  // Get availability for a specific date
  getAvailability(date) {
    return this.availabilityData.get(this.formatDate(date)) || 'available';
  }

  // Render the calendar
  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();
    
    // Create calendar HTML
    let html = `
      <div class="calendar-container">
        ${this.renderHeader()}
        ${this.renderWeekdays()}
        <div class="calendar-grid">
          ${this.renderPreviousMonthDays(firstDayIndex, year, month)}
          ${this.renderCurrentMonthDays(daysInMonth, year, month)}
          ${this.renderNextMonthDays(lastDay.getDay(), year, month + 1)}
        </div>
        ${this.options.showLegend ? this.renderLegend() : ''}
      </div>
    `;
    
    this.container.innerHTML = html;
    this.highlightSelectedRange();
  }

  // Render calendar header with month/year and navigation
  renderHeader() {
    if (!this.options.showHeader) return '';
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `
      <div class="calendar-header">
        <button class="nav-btn prev-month" aria-label="Previous month">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h3 class="month-year">
          ${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}
        </h3>
        <button class="nav-btn next-month" aria-label="Next month">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  // Render weekday headers
  renderWeekdays() {
    if (!this.options.showWeekdays) return '';
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `
      <div class="weekdays">
        ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
      </div>
    `;
  }

  // Render days from previous month
  renderPreviousMonthDays(firstDayIndex, year, month) {
    if (firstDayIndex === 0) return '';
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    let days = '';
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dateStr = this.formatDate(date);
      const isDisabled = this.isDateDisabled(date);
      
      days += `
        <div class="calendar-day other-month ${isDisabled ? 'disabled' : ''}" 
             data-date="${dateStr}" 
             data-availability="${this.getAvailability(date)}">
          <span class="day-number">${day}</span>
        </div>
      `;
    }
    
    return days;
  }

  // Render days of current month
  renderCurrentMonthDays(daysInMonth, year, month) {
    let days = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const isToday = this.isSameDay(date, new Date());
      const isSelected = this.isDateInSelection(date);
      const isDisabled = this.isDateDisabled(date);
      const availability = this.getAvailability(date);
      
      let dayClasses = ['calendar-day'];
      if (isToday) dayClasses.push('today');
      if (isSelected) dayClasses.push('selected');
      if (isDisabled) dayClasses.push('disabled');
      
      // Add availability status class
      if (availability !== 'available') {
        dayClasses.push(availability);
      }
      
      // Add hover effect if date is selectable
      if (!isDisabled) {
        dayClasses.push('selectable');
      }
      
      days += `
        <div class="${dayClasses.join(' ')}" 
             data-date="${dateStr}" 
             data-availability="${availability}">
          <span class="day-number">${day}</span>
          ${availability === 'booked' ? '<span class="status-dot"></span>' : ''}
          ${availability === 'partially-booked' ? '<span class="status-dot partial"></span>' : ''}
        </div>
      `;
    }
    
    return days;
  }

  // Render days from next month
  renderNextMonthDays(lastDayIndex, year, month) {
    if (lastDayIndex === 6) return '';
    
    const daysToAdd = 6 - lastDayIndex;
    let days = '';
    
    for (let i = 1; i <= daysToAdd; i++) {
      const date = new Date(year, month, i);
      const dateStr = this.formatDate(date);
      const isDisabled = this.isDateDisabled(date);
      
      days += `
        <div class="calendar-day other-month ${isDisabled ? 'disabled' : ''}" 
             data-date="${dateStr}" 
             data-availability="${this.getAvailability(date)}">
          <span class="day-number">${i}</span>
        </div>
      `;
    }
    
    return days;
  }

  // Render the legend
  renderLegend() {
    return `
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-color available"></span>
          <span>Available</span>
        </div>
        <div class="legend-item">
          <span class="legend-color partially-booked"></span>
          <span>Partially Booked</span>
        </div>
        <div class="legend-item">
          <span class="legend-color booked"></span>
          <span>Booked</span>
        </div>
      </div>
    `;
  }

  // Highlight the selected date range
  highlightSelectedRange() {
    if (!this.selectedStartDate) return;
    
    const days = this.container.querySelectorAll('.calendar-day');
    days.forEach(day => {
      const dateStr = day.dataset.date;
      if (!dateStr) return;
      
      const date = this.parseDate(dateStr);
      
      if (this.isDateInSelection(date)) {
        day.classList.add('in-range');
        
        if (this.isSameDay(date, this.selectedStartDate)) {
          day.classList.add('range-start');
        } else if (this.selectedEndDate && this.isSameDay(date, this.selectedEndDate)) {
          day.classList.add('range-end');
        }
      } else {
        day.classList.remove('in-range', 'range-start', 'range-end');
      }
    });
  }

  // Set up event listeners
  setupEventListeners() {
    // Navigation
    const prevMonthBtn = this.container.querySelector('.prev-month');
    const nextMonthBtn = this.container.querySelector('.next-month');
    
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
    }
    
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
    }
    
    // Date selection
    this.container.addEventListener('click', (e) => {
      const dayElement = e.target.closest('.calendar-day');
      if (!dayElement || dayElement.classList.contains('disabled')) return;
      
      const dateStr = dayElement.dataset.date;
      if (!dateStr) return;
      
      const date = this.parseDate(dateStr);
      this.handleDateClick(date, dayElement);
    });
    
    // Hover effect for date range selection
    this.container.addEventListener('mouseover', (e) => {
      const dayElement = e.target.closest('.calendar-day');
      if (!dayElement || dayElement.classList.contains('disabled')) {
        this.hoveredDate = null;
        return;
      }
      
      const dateStr = dayElement.dataset.date;
      if (!dateStr) return;
      
      this.hoveredDate = this.parseDate(dateStr);
      this.highlightHoveredRange();
    });
    
    this.container.addEventListener('mouseleave', () => {
      this.hoveredDate = null;
      this.highlightHoveredRange();
    });
  }

  // Handle date click
  handleDateClick(date, element) {
    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      // Start new selection
      this.selectedStartDate = date;
      this.selectedEndDate = null;
    } else {
      // Complete selection
      if (date < this.selectedStartDate) {
        this.selectedEndDate = this.selectedStartDate;
        this.selectedStartDate = date;
      } else {
        this.selectedEndDate = date;
      }
      
      // Trigger callback
      if (typeof this.options.onDateSelect === 'function') {
        this.options.onDateSelect({
          startDate: this.selectedStartDate,
          endDate: this.selectedEndDate,
          startDateStr: this.formatDate(this.selectedStartDate),
          endDateStr: this.selectedEndDate ? this.formatDate(this.selectedEndDate) : null
        });
      }
    }
    
    this.highlightSelectedRange();
  }

  // Highlight the hovered date range
  highlightHoveredRange() {
    if (!this.selectedStartDate || this.selectedEndDate || !this.hoveredDate) {
      // Clear all hover states if no valid hover range
      const days = this.container.querySelectorAll('.calendar-day');
      days.forEach(day => {
        day.classList.remove('hover', 'hover-start', 'hover-end');
      });
      return;
    }
    
    const start = this.selectedStartDate < this.hoveredDate ? this.selectedStartDate : this.hoveredDate;
    const end = this.selectedStartDate < this.hoveredDate ? this.hoveredDate : this.selectedStartDate;
    
    const days = this.container.querySelectorAll('.calendar-day');
    days.forEach(day => {
      const dateStr = day.dataset.date;
      if (!dateStr) return;
      
      const date = this.parseDate(dateStr);
      
      // Clear previous hover states
      day.classList.remove('hover', 'hover-start', 'hover-end');
      
      // Add appropriate hover states
      if (date >= start && date <= end) {
        day.classList.add('hover');
        
        if (this.isSameDay(date, start)) {
          day.classList.add('hover-start');
        } else if (this.isSameDay(date, end)) {
          day.classList.add('hover-end');
        }
      }
    });
  }

  // Navigate to previous or next month
  navigateMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.render();
    
    // Trigger callback
    if (typeof this.options.onMonthChange === 'function') {
      this.options.onMonthChange({
        year: this.currentDate.getFullYear(),
        month: this.currentDate.getMonth() + 1
      });
    }
  }

  // Check if a date is disabled
  isDateDisabled(date) {
    if (!this.options.allowPastDates && this.isBefore(date, this.today)) {
      return true;
    }
    
    if (this.options.minDate && this.isBefore(date, this.options.minDate)) {
      return true;
    }
    
    if (this.options.maxDate && this.isAfter(date, this.options.maxDate)) {
      return true;
    }
    
    return false;
  }

  // Check if a date is in the selected range
  isDateInSelection(date) {
    if (!this.selectedStartDate) return false;
    if (!this.selectedEndDate) return this.isSameDay(date, this.selectedStartDate);
    
    return date >= this.selectedStartDate && date <= this.selectedEndDate;
  }

  // Date helper methods
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isBefore(date1, date2) {
    return date1 < date2 && !this.isSameDay(date1, date2);
  }

  isAfter(date1, date2) {
    return date1 > date2 && !this.isSameDay(date1, date2);
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  // Apply styles to the calendar
  applyStyles() {
    if (document.getElementById('availability-calendar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'availability-calendar-styles';
    style.textContent = `
      .availability-calendar {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        max-width: 100%;
        background: ${this.options.theme.background};
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        color: ${this.options.theme.text};
      }
      
      .calendar-container {
        padding: 1rem;
      }
      
      .calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      
      .month-year {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: ${this.options.theme.text};
      }
      
      .nav-btn {
        background: none;
        border: 1px solid ${this.options.theme.border};
        border-radius: 6px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: ${this.options.theme.text};
        transition: all 0.2s ease;
      }
      
      .nav-btn:hover {
        background: ${this.options.theme.hover};
        border-color: ${this.options.theme.primary};
        color: ${this.options.theme.primary};
      }
      
      .weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-weight: 500;
        font-size: 0.875rem;
        color: ${this.options.theme.lightText};
        margin-bottom: 0.5rem;
      }
      
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }
      
      .calendar-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: default;
        transition: all 0.2s ease;
      }
      
      .calendar-day.selectable {
        cursor: pointer;
      }
      
      .calendar-day.selectable:not(.disabled):hover {
        background: ${this.options.theme.hover};
      }
      
      .calendar-day.today .day-number {
        font-weight: 700;
        color: ${this.options.theme.today};
      }
      
      .calendar-day.other-month {
        opacity: 0.5;
      }
      
      .calendar-day.disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      /* Availability status */
      .calendar-day.available {
        background-color: rgba(16, 185, 129, 0.1);
      }
      
      .calendar-day.partially-booked {
        background-color: rgba(245, 158, 11, 0.1);
      }
      
      .calendar-day.booked {
        background-color: rgba(239, 68, 68, 0.1);
        text-decoration: line-through;
        cursor: not-allowed;
      }
      
      /* Range selection */
      .calendar-day.in-range {
        background-color: rgba(16, 185, 129, 0.2);
      }
      
      .calendar-day.range-start,
      .calendar-day.range-end {
        background-color: ${this.options.theme.primary};
        color: white;
        font-weight: 600;
      }
      
      .calendar-day.range-start .day-number,
      .calendar-day.range-end .day-number {
        color: white;
      }
      
      /* Hover states */
      .calendar-day.hover {
        background-color: rgba(16, 185, 129, 0.1);
      }
      
      .calendar-day.hover-start,
      .calendar-day.hover-end {
        background-color: rgba(16, 185, 129, 0.3);
      }
      
      /* Status dots */
      .status-dot {
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: ${this.options.theme.danger};
      }
      
      .status-dot.partial {
        background-color: ${this.options.theme.secondary};
      }
      
      /* Legend */
      .calendar-legend {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1rem;
        font-size: 0.75rem;
        color: ${this.options.theme.lightText};
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .legend-color {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      
      .legend-color.available {
        background-color: ${this.options.theme.primary};
      }
      
      .legend-color.partially-booked {
        background-color: ${this.options.theme.secondary};
      }
      
      .legend-color.booked {
        background-color: ${this.options.theme.danger};
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Make it available globally
window.AvailabilityCalendar = AvailabilityCalendar;
