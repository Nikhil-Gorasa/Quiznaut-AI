// Hero section interactive effects
document.addEventListener('DOMContentLoaded', function() {
  // Add parallax effect to floating particles
  const particles = document.querySelectorAll('.particle');
  
  window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    particles.forEach((particle, index) => {
      const speed = (index + 1) * 0.1;
      particle.style.transform = `translateY(${rate * speed}px)`;
    });
  });
  
  // Add mouse move effect to preview card
  const previewCard = document.querySelector('.preview-card');
  if (previewCard) {
    previewCard.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    previewCard.addEventListener('mouseleave', function() {
      this.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(5deg)';
    });
  }
  

  
  // Add staggered animation to hero cards
  const heroCards = document.querySelectorAll('.hero-card');
  heroCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 300 + (index * 200));
  });
  
  // Add staggered animation to stats
  const statItems = document.querySelectorAll('.stat-item');
  statItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      item.style.transition = 'all 0.5s ease';
      item.style.opacity = '1';
      item.style.transform = 'scale(1)';
    }, 800 + (index * 150));
  });
  
  // Add floating animation to floating icons
  const floatingIcons = document.querySelectorAll('.floating-icon');
  floatingIcons.forEach((icon, index) => {
    icon.style.animationDelay = `${index * 0.5}s`;
  });
  
  // Add intersection observer for scroll-triggered animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe elements for animation
  const animatedElements = document.querySelectorAll('.hero-badge, .tagline, .hero-stats');
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });

  // Enhanced How it Works Section Effects
  const stepItems = document.querySelectorAll('.step-item');
  const timelineLine = document.querySelector('.timeline-line');
  
  // Add staggered animation to step items
  stepItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px) scale(0.9)';
    
    setTimeout(() => {
      item.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0) scale(1)';
    }, 1000 + (index * 200));
  });
  
  // Animate timeline line
  if (timelineLine) {
    timelineLine.style.width = '0%';
    timelineLine.style.transition = 'width 2s ease-in-out';
    
    setTimeout(() => {
      timelineLine.style.width = '100%';
    }, 1200);
  }
  
  // Add hover effects to step numbers
  stepItems.forEach((item, index) => {
    const stepNumber = item.querySelector('.step-number');
    if (stepNumber) {
      stepNumber.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.2) rotate(10deg)';
        this.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.5)';
      });
      
      stepNumber.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.4)';
      });
    }
  });
  
  // Add scroll-triggered animations for How it Works section
  const howItWorksObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stepItems = entry.target.querySelectorAll('.step-item');
        const timelineLine = entry.target.querySelector('.timeline-line');
        
        // Animate timeline line
        if (timelineLine) {
          timelineLine.style.width = '0%';
          timelineLine.style.transition = 'width 2s ease-in-out';
          
          setTimeout(() => {
            timelineLine.style.width = '100%';
          }, 500);
        }
        
        // Animate step items with delay
        stepItems.forEach((item, index) => {
          setTimeout(() => {
            item.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
          }, 800 + (index * 200));
        });
      }
    });
  }, { threshold: 0.3 });
  
  // Observe the How it Works section
  const howItWorksSection = document.querySelector('.how-it-works-container');
  if (howItWorksSection) {
    howItWorksObserver.observe(howItWorksSection);
  }
  
  // Add floating animation to feature tags
  const featureTags = document.querySelectorAll('.feature-tag');
  featureTags.forEach((tag, index) => {
    tag.style.animationDelay = `${index * 0.1}s`;
    tag.style.animation = 'float 3s ease-in-out infinite';
  });
  
  // Add pulse effect to CTA section
  const ctaSection = document.querySelector('.how-it-works-cta');
  if (ctaSection) {
    ctaSection.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
      this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(245, 158, 11, 0.2)';
    });
    
    ctaSection.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = 'none';
    });
  }
  
  // Add ripple effect to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  .btn {
    position: relative;
    overflow: hidden;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .feature-tag {
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
  }
`;
document.head.appendChild(style);
