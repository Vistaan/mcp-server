// Minimal vanilla JavaScript for workflow-os-mcp landing page interactivity

document.addEventListener('DOMContentLoaded', function () {
  // Animate workflow steps on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  }, observerOptions);

  // Observe workflow steps
  document.querySelectorAll('.workflow-step').forEach((step) => {
    observer.observe(step);
  });

  // Observe other sections
  document.querySelectorAll('section > div').forEach((section) => {
    observer.observe(section);
  });

  // Workflow step click animation
  document.querySelectorAll('.workflow-step').forEach((step) => {
    step.addEventListener('click', function () {
      // Remove active class from all steps
      document.querySelectorAll('.workflow-step').forEach((s) => s.classList.remove('active'));
      // Add active class to clicked step
      this.classList.add('active');

      // Animate the step number
      const stepNum = this.dataset.step;
      console.log(`Step ${stepNum} activated`);
    });
  });

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  // Sticky navigation
  const nav = document.querySelector('nav');
  const navOffset = nav.offsetTop;

  window.addEventListener('scroll', function () {
    if (window.pageYOffset > navOffset) {
      nav.classList.add('sticky');
    } else {
      nav.classList.remove('sticky');
    }
  });

  // Tool card hover effects
  document.querySelectorAll('.tool-card').forEach((card) => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-5px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Client card stagger animation
  const clientCards = document.querySelectorAll('.client-card');
  clientCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in-up');
  });

  // Deployment option hover
  document.querySelectorAll('.deployment-option').forEach((option) => {
    option.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-10px)';
      this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
    });

    option.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    });
  });

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Console log for debugging (remove in production)
  console.log('workflow-os-mcp landing page loaded successfully');
});
