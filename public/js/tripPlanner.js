class TripPlanner {
    constructor() {
        this.form = document.getElementById('trip-planner-form');
        this.results = document.getElementById('trip-results');
        this.loading = document.getElementById('trip-loading');
        this.error = document.getElementById('trip-error');
        this.init();
        
        // Add CSRF token to all fetch requests
        this.csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            destination: formData.get('destination'),
            duration: formData.get('duration'),
            budget: formData.get('budget'),
            preferences: formData.get('preferences')
        };
        
        // Basic validation
        if (!data.destination || !data.duration || !data.budget) {
            this.showError('Please fill in all required fields');
            return;
        }

        // Show loading state
        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            const result = await this.fetchTripPlan(data);
            this.displayResults(result.data);
        } catch (err) {
            console.error('Trip planning error:', err);
            this.showError(err.message || 'Failed to generate trip plan. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(data) {
        if (!this.results) return;

        let html = `
            <div class="trip-summary">
                <h3>Your ${data.duration}-Day Trip to ${data.destination}</h3>
                <p class="budget">Budget: ₹${data.budget.toLocaleString()}</p>
                <p class="estimated-cost">Estimated Cost: ₹${data.totalEstimatedCost || 'N/A'}</p>
                
                <div class="itinerary">
                    ${data.itinerary.map(day => `
                        <div class="day-card">
                            <h4>Day ${day.day}</h4>
                            <div class="activities">
                                ${day.activities.map(activity => `
                                    <div class="activity ${activity.type}">
                                        <div class="time">${activity.time}</div>
                                        <div class="details">
                                            <h5>${activity.activity}</h5>
                                            ${activity.location ? `<p class="location">📍 ${activity.location}</p>` : ''}
                                            ${activity.cost ? `<p class="cost">₹${activity.cost}</p>` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${data.moneySavingTips && data.moneySavingTips.length ? `
                    <div class="money-saving-tips">
                        <h4>Money Saving Tips</h4>
                        <ul>
                            ${data.moneySavingTips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="emergency-contacts">
                    <h4>Emergency Contacts</h4>
                    <div class="contacts-grid">
                        <div class="contact">
                            <span class="label">Police:</span>
                            <span>${data.emergencyContacts?.police || '100'}</span>
                        </div>
                        <div class="contact">
                            <span class="label">Ambulance:</span>
                            <span>${data.emergencyContacts?.hospitals || '108'}</span>
                        </div>
                        ${data.emergencyContacts?.embassy ? `
                            <div class="contact">
                                <span class="label">Embassy:</span>
                                <span>${data.emergencyContacts.embassy}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="actions">
                    <button id="save-trip" class="btn btn-primary">Save This Trip</button>
                    <button id="share-trip" class="btn btn-secondary">Share</button>
                </div>
            </div>
        `;

        this.results.innerHTML = html;
        this.results.style.display = 'block';

        // Add event listeners for the action buttons
        document.getElementById('save-trip')?.addEventListener('click', () => this.saveTrip(data));
        document.getElementById('share-trip')?.addEventListener('click', () => this.shareTrip(data));
    }

    showLoading() {
        if (this.loading) {
            this.loading.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loading) {
            this.loading.style.display = 'none';
        }
    }

    async fetchTripPlan(data) {
        try {
            // Use absolute URL to avoid path resolution issues
            const baseUrl = window.location.origin; // Gets the current origin (e.g., http://localhost:3000)
            const response = await fetch(`${baseUrl}/api/trip/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(this.csrfToken && { 'X-CSRF-Token': this.csrfToken })
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });

            const responseData = await response.json();
            
            if (!response.ok) {
                console.error('Server error response:', responseData);
                throw new Error(responseData.message || `Error ${response.status}: ${response.statusText}`);
            }

            return responseData;
        } catch (error) {
            console.error('Fetch error:', error);
            // Check for specific error conditions
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to the server. Please check your internet connection.');
            }
            throw error; // Re-throw the error to be handled by the caller
        }
    }

    showError(message) {
        if (this.error) {
            this.error.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            this.error.style.display = 'block';
            
            // Auto-hide error after 10 seconds
            setTimeout(() => {
                this.hideError();
            }, 10000);
        }
    }

    hideError() {
        if (this.error) {
            this.error.style.display = 'none';
        }
    }

    hideResults() {
        if (this.results) {
            this.results.style.display = 'none';
        }
    }

    saveTrip(tripData) {
        // Implement save functionality (e.g., save to user's account or localStorage)
        const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
        trips.push({
            ...tripData,
            savedAt: new Date().toISOString(),
            id: Date.now().toString()
        });
        localStorage.setItem('savedTrips', JSON.stringify(trips));
        
        alert('Trip saved successfully!');
    }

    async shareTrip(tripData) {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `My ${tripData.duration}-Day Trip to ${tripData.destination}`,
                    text: `Check out my ${tripData.duration}-day trip plan to ${tripData.destination} with a budget of ₹${tripData.budget}`,
                    url: window.location.href
                });
            } else {
                // Fallback for browsers that don't support Web Share API
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('trip-planner-form')) {
        new TripPlanner();
    }
});
