class VoiceSearch {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.voiceBtn = document.getElementById('voiceSearchBtn');
    this.recognition = this.setupRecognition();
    this.setupEventListeners();
  }

  setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      if (this.voiceBtn) this.voiceBtn.style.display = 'none';
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    return recognition;
  }

  setupEventListeners() {
    if (!this.voiceBtn || !this.recognition) {
      console.log('Voice search not available');
      return;
    }

    this.voiceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleVoiceSearch();
    });

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.searchInput) {
        this.searchInput.value = transcript;
        // Trigger search automatically when voice input is received
        const inputEvent = new Event('input', { bubbles: true });
        this.searchInput.dispatchEvent(inputEvent);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (this.voiceBtn) this.voiceBtn.classList.remove('listening');
    };

    this.recognition.onend = () => {
      if (this.voiceBtn) this.voiceBtn.classList.remove('listening');
    };
  }

  toggleVoiceSearch() {
    if (!this.recognition) return;

    if (this.voiceBtn.classList.contains('listening')) {
      this.recognition.stop();
      this.voiceBtn.classList.remove('listening');
    } else {
      try {
        this.recognition.start();
        this.voiceBtn.classList.add('listening');
      } catch (err) {
        console.error('Error starting voice recognition:', err);
      }
    }
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('voiceSearchBtn')) {
      new VoiceSearch();
    }
  });
} else {
  if (document.getElementById('voiceSearchBtn')) {
    new VoiceSearch();
  }
}
