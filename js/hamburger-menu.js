/**
 * Hamburger Menu Functionality
 * Handles mobile navigation menu toggle across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
  const hamburgerButton = document.querySelector('.hamburger-menu');
  const navActions = document.querySelector('.nav-actions');
  const siteHeader = document.querySelector('.site-header');
  const body = document.body;

  if (!hamburgerButton || !navActions) {
    console.warn('Hamburger menu elements not found');
    return;
  }

  // Toggle menu function
  function toggleMenu() {
    const isOpen = hamburgerButton.getAttribute('aria-expanded') === 'true';
    
    // Toggle button state
    hamburgerButton.setAttribute('aria-expanded', !isOpen);
    hamburgerButton.classList.toggle('active');
    
    // Toggle navigation menu
    navActions.classList.toggle('mobile-open');
    siteHeader.classList.toggle('mobile-menu-open');
    body.classList.toggle('mobile-menu-open');
  }

  // Close menu function
  function closeMenu() {
    hamburgerButton.setAttribute('aria-expanded', 'false');
    hamburgerButton.classList.remove('active');
    navActions.classList.remove('mobile-open');
    siteHeader.classList.remove('mobile-menu-open');
    body.classList.remove('mobile-menu-open');
  }

  // Event listeners
  hamburgerButton.addEventListener('click', toggleMenu);

  // Close menu when clicking on navigation links
  navActions.addEventListener('click', function(e) {
    if (e.target.classList.contains('link')) {
      // Small delay to allow the link to work properly
      setTimeout(closeMenu, 100);
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!hamburgerButton.contains(e.target) && 
        !navActions.contains(e.target) && 
        navActions.classList.contains('mobile-open')) {
      closeMenu();
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navActions.classList.contains('mobile-open')) {
      closeMenu();
    }
  });

  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && navActions.classList.contains('mobile-open')) {
      closeMenu();
    }
  });

  // Handle orientation change on mobile
  window.addEventListener('orientationchange', function() {
    setTimeout(function() {
      if (window.innerWidth > 768 && navActions.classList.contains('mobile-open')) {
        closeMenu();
      }
    }, 100);
  });

  // Add smooth scroll behavior for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        closeMenu();
        
        // Smooth scroll to target
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 150);
      }
    });
  });
});
