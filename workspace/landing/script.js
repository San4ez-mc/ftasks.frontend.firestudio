
document.addEventListener('DOMContentLoaded', () => {

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const header = document.querySelector('.header');
    
    if (menuToggle && header) {
        menuToggle.addEventListener('click', () => {
            header.classList.toggle('active');
        });
    }

    // Scroll Animations for all cards
    const animatedElements = document.querySelectorAll('.feature-card, .step, .problem-card, .audience-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });

});
