document.addEventListener('DOMContentLoaded', function () {
  // Initialize elements
  const loadingOverlay = document.getElementById('loadingOverlay');
  const floatingButtons = document.querySelector('.floating-buttons');
  const voiceAssistant = document.getElementById('voiceAssistant');
  const assistantBubble = document.getElementById('assistantBubble');
  const assistantButton = document.getElementById('assistantButton');
  const assistantClose = document.getElementById('assistantClose');
  const helpBtn = document.getElementById('helpBtn');
  const chatBtn = document.getElementById('chatBtn');
  const addListingBtn = document.getElementById('addListingBtn');

  // Show loading overlay initially
  if (loadingOverlay) {
    // Hide loading overlay after page loads
    window.addEventListener('load', () => {
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');

        // Show floating buttons after loading is complete
        setTimeout(() => {
          floatingButtons.classList.add('visible');
          // Show voice assistant after a short delay
          setTimeout(showAssistantBubble, 2000);
        }, 300);
      }, 1500); // Show loading for at least 1.5 seconds
    });
  }

  // Voice Assistant Functions
  function showAssistantBubble() {
    assistantBubble.classList.add('visible');
    // Auto-hide after 10 seconds if not interacted with
    setTimeout(() => {
      if (!assistantBubble.matches(':hover') && !assistantButton.matches(':hover')) {
        assistantBubble.classList.remove('visible');
      }
    }, 10000);
  }

  // Toggle assistant bubble
  if (assistantButton) {
    // Show bubble on page load after a delay
    setTimeout(() => {
      showAssistantBubble();
    }, 2000);

    // Toggle bubble on button click
    assistantButton.addEventListener('click', (e) => {
      e.stopPropagation();
      assistantBubble.classList.toggle('visible');
    });

    // Add hover effect
    assistantButton.addEventListener('mouseenter', () => {
      assistantButton.style.transform = 'scale(1.1)';
    });

    assistantButton.addEventListener('mouseleave', () => {
      assistantButton.style.transform = 'scale(1)';
    });
  }

  // Close assistant bubble
  if (assistantClose) {
    assistantClose.addEventListener('click', (e) => {
      e.stopPropagation();
      assistantBubble.classList.remove('visible');
    });
  }

  // Close bubble when clicking outside
  document.addEventListener('click', (e) => {
    if (!assistantBubble.contains(e.target) && e.target !== assistantButton) {
      assistantBubble.classList.remove('visible');
    }
  });

  // Floating button actions with ripple effect
  function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  }

  // Help Button
  if (helpBtn) {
    helpBtn.addEventListener('click', (e) => {
      createRipple(e);
      // Add a small delay for better UX
      setTimeout(() => {
        window.location.href = '/help';
      }, 200);
    });

    // Add hover effect
    helpBtn.addEventListener('mouseenter', () => {
      helpBtn.querySelector('i').style.transform = 'rotate(15deg)';
    });

    helpBtn.addEventListener('mouseleave', () => {
      helpBtn.querySelector('i').style.transform = 'rotate(0)';
    });
  }

  // Chat Button
  if (chatBtn) {
    chatBtn.addEventListener('click', (e) => {
      createRipple(e);
      // Toggle chat interface
      const chatContainer = document.getElementById('chatContainer');
      if (chatContainer) {
        chatContainer.classList.toggle('active');
      } else {
        // Fallback if chat container doesn't exist
        alert('Chat with our support team is coming soon!');
      }
    });

    // Pulsing animation for new messages
    let pulseInterval;

    // Simulate new message notification
    setTimeout(() => {
      if (chatBtn && !document.querySelector('.chat-notification')) {
        const notification = document.createElement('span');
        notification.className = 'chat-notification';
        chatBtn.appendChild(notification);

        // Pulsing effect
        pulseInterval = setInterval(() => {
          notification.style.transform = 'scale(1.2)';
          setTimeout(() => {
            notification.style.transform = 'scale(1)';
          }, 500);
        }, 1000);
      }
    }, 5000);

    // Clean up interval when leaving the page
    window.addEventListener('beforeunload', () => {
      if (pulseInterval) clearInterval(pulseInterval);
    });
  }

  // Add Listing Button
  if (addListingBtn) {
    addListingBtn.addEventListener('click', (e) => {
      createRipple(e);
      // Add a small delay for better UX
      setTimeout(() => {
        window.location.href = '/listings/new';
      }, 200);
    });

    // Add subtle animation on hover
    addListingBtn.addEventListener('mouseenter', () => {
      const icon = addListingBtn.querySelector('i');
      icon.style.transition = 'transform 0.3s ease';
      icon.style.transform = 'rotate(90deg)';
    });

    addListingBtn.addEventListener('mouseleave', () => {
      const icon = addListingBtn.querySelector('i');
      icon.style.transform = 'rotate(0)';
    });
  }

  // Scroll-triggered animations
  function checkIfInView() {
    const elements = document.querySelectorAll('.reveal');

    elements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;

      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add('visible');
      }
    });
  }

  // Run on load and scroll
  window.addEventListener('scroll', checkIfInView);
  window.addEventListener('load', checkIfInView);

  // Add reveal class to elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(el => {
    el.classList.add('reveal');
    if (el.dataset.delay) {
      el.classList.add(`delay-${el.dataset.delay}`);
    }
  });

  // Add smooth scroll to anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Add animation to buttons on click
  document.querySelectorAll('button, a.btn').forEach(button => {
    button.addEventListener('click', function (e) {
      // Ripple effect
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      // Remove ripple after animation completes
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
});

// Add ripple effect styles dynamically
{
  const style = document.createElement('style');
  style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.7);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  button, a.btn {
    position: relative;
    overflow: hidden;
  }
`;
  document.head.appendChild(style);
}
