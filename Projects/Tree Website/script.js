// Arbor Academy - Interactive JavaScript
// Performance-optimized with lazy loading and smooth animations

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all interactive features
    initAnimatedCounters();
    initIntersectionObserver();
    initTreeAnatomy();
    initParallaxEffect();
    initSmoothScrolling();
    initLazyLoading();
});

// Animated number counters
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseFloat(counter.getAttribute('data-count'));
                animateCounter(counter, target);
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, target) {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = target > 100 ? Math.floor(current).toLocaleString() : current.toFixed(2);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target > 100 ? Math.floor(target).toLocaleString() : target.toFixed(2);
        }
    };

    updateCounter();
}

// Intersection Observer for fade-in animations
function initIntersectionObserver() {
    const elements = document.querySelectorAll('.research-card, .species-card, .stat-card, .anatomy-container');
    
    elements.forEach(el => {
        el.classList.add('fade-in');
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    elements.forEach(element => {
        observer.observe(element);
    });
}

// Interactive tree anatomy
function initTreeAnatomy() {
    const hotspots = document.querySelectorAll('.hotspot');
    const infoDisplay = document.getElementById('anatomyInfo');

    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', function() {
            const info = this.getAttribute('data-info');
            if (infoDisplay) {
                infoDisplay.innerHTML = `<p><strong>${info}</strong></p>`;
                infoDisplay.classList.add('highlight');
                setTimeout(() => {
                    infoDisplay.classList.remove('highlight');
                }, 300);
            }
        });

        // Keyboard accessibility
        hotspot.setAttribute('tabindex', '0');
        hotspot.setAttribute('role', 'button');
        hotspot.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Add highlight animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    .info-display.highlight {
        animation: highlight 0.3s ease;
    }
    
    @keyframes highlight {
        0% { background-color: var(--color-sky-blue); transform: scale(1); }
        50% { background-color: rgba(135, 206, 235, 0.3); transform: scale(1.02); }
        100% { background-color: var(--color-white); transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Parallax scrolling effect
function initParallaxEffect() {
    const parallaxElements = document.querySelectorAll('.parallax-layer, .floating-leaves');
    
    // Only enable on larger screens and if user hasn't requested reduced motion
    if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }, { passive: true });
    }
}

// Enhanced smooth scrolling with offset for fixed navigation
function initSmoothScrolling() {
    const navHeight = document.querySelector('.main-nav').offsetHeight;
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL without jumping
                history.pushState(null, null, targetId);
            }
        });
    });
}

// Lazy loading for images (prepare for future implementation)
function initLazyLoading() {
    // Prepare lazy loading for future images
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports native lazy loading
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    } else {
        // Fallback to Intersection Observer
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Navigation scroll behavior
let lastScrollTop = 0;
const nav = document.querySelector('.main-nav');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        nav.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        nav.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
}, { passive: true });

// Species carousel (basic implementation)
const initCarousel = () => {
    const track = document.querySelector('.species-track');
    const cards = document.querySelectorAll('.species-card');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');
    
    if (!track || !cards.length) return;
    
    let currentIndex = 0;
    const cardWidth = cards[0].offsetWidth + 32; // card width + gap
    
    const updateCarousel = () => {
        const offset = -currentIndex * cardWidth;
        track.style.transform = `translateX(${offset}px)`;
    };
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < cards.length - 1) {
                currentIndex++;
                updateCarousel();
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
    }
};

// Initialize carousel when DOM is ready
initCarousel();

// Performance monitoring (development only)
if (window.performance && performance.mark) {
    performance.mark('interactive-features-loaded');
    
    // Log performance metrics
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page Load Metrics:', {
            'DOM Content Loaded': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            'Load Complete': perfData.loadEventEnd - perfData.loadEventStart,
            'Total Load Time': perfData.loadEventEnd - perfData.fetchStart
        });
    });
}

// Newsletter form handling
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        // Here you would normally send this to your backend
        console.log('Newsletter subscription:', email);
        
        // Show success message
        const button = e.target.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Subscribed!';
        button.style.backgroundColor = 'var(--color-forest-green)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
            e.target.reset();
        }, 3000);
    });
}