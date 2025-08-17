// Initial Setup

document.addEventListener('DOMContentLoaded', () => {
    // Form validation and handling
    document.querySelectorAll('.needs-validation').forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            } else if (form.id === 'contactForm') {
                event.preventDefault(); // Only prevent default if valid & it's the contact form
                
                const successAlert = document.getElementById('successAlert');
                successAlert.classList.remove('d-none');
                successAlert.classList.add('show');

                form.reset();
                form.classList.remove('was-validated');

                // Hide the alert after 5 seconds
                setTimeout(() => successAlert.classList.add('d-none'), 5000);
            }
            form.classList.add('was-validated');
        });
    });

    // Active navigation highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href').endsWith(currentPage)) {
            link.classList.add('active');
        }
    });

    // Fade in elements on scroll (Optimized with Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-in');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Stop observing once visible
                }
            });
        }, { threshold: 0.3 });

        fadeElements.forEach(element => observer.observe(element));
    } else {
        // Fallback for older browsers
        const fadeInOnScroll = () => {
            fadeElements.forEach(element => {
                const { top, bottom } = element.getBoundingClientRect();
                if (top < window.innerHeight && bottom >= 0) {
                    element.classList.add('visible');
                }
            });
        };
        fadeInOnScroll();
        window.addEventListener('scroll', fadeInOnScroll);
    }
});
