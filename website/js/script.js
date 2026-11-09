document.addEventListener('DOMContentLoaded', () => {
    
    // --- Navbar Scroll Effect ---
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Entrance Animations using Intersection Observer ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the 'visible' class to trigger CSS transitions
                entry.target.classList.add('visible');
                // Optional: Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-up, .fade-in');
    animatedElements.forEach(el => observer.observe(el));

    // --- Simple Welcome Message/Alert (Optional Enhancement) ---
    // Uncomment the following lines if you want a pop-up welcome message on first visit
    /*
    if (!localStorage.getItem('welcomeShown')) {
        setTimeout(() => {
            alert('أهلاً بك في موقع تطبيق اختبارات اليمن! حمل التطبيق الآن واستعد لتفوقك.');
            localStorage.setItem('welcomeShown', 'true');
        }, 1500);
    }
    */
});
