// Truwit Marketing Website - Interactive Features

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      const icon = this.querySelector('span');
      if (icon) {
        icon.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.nav-container')) {
        navMenu.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('span');
        if (icon) {
          icon.textContent = '☰';
        }
      }
    });
  }
});

// Tab Functionality
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabButtons.length === 0) return;
  
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      if (tabContents[index]) {
        tabContents[index].classList.add('active');
      }
    });
  });
  
  // Activate first tab by default
  if (tabButtons[0] && tabContents[0]) {
    tabButtons[0].classList.add('active');
    tabContents[0].classList.add('active');
  }
}

// Initialize tabs when DOM is ready
document.addEventListener('DOMContentLoaded', initTabs);

// Smooth Scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Form submission handler (for contact form)
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // TODO: Implement actual form submission to backend
      console.log('Form submitted:', data);
      
      // Show success message (placeholder)
      alert('Thank you for your message! We\'ll get back to you soon.');
      this.reset();
    });
  }
});

// Add sticky nav shadow on scroll
window.addEventListener('scroll', function() {
  const nav = document.querySelector('.nav');
  if (nav) {
    if (window.scrollY > 10) {
      nav.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    } else {
      nav.style.boxShadow = 'none';
    }
  }
});


