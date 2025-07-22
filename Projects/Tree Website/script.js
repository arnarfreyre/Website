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
    initWarmBiomeEffects();
    initProgressBars();
    initHeroAnimations();
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
            // Handle different number formats
            if (target >= 1000) {
                element.textContent = Math.floor(current).toLocaleString();
            } else if (target < 100 && target > 1) {
                element.textContent = Math.floor(current);
            } else {
                element.textContent = current.toFixed(0);
            }
            requestAnimationFrame(updateCounter);
        } else {
            // Final value
            if (target >= 1000) {
                element.textContent = Math.floor(target).toLocaleString();
            } else {
                element.textContent = Math.floor(target);
            }
        }
    };

    updateCounter();
}

// Intersection Observer for fade-in animations
function initIntersectionObserver() {
    const elements = document.querySelectorAll('.research-card, .species-card, .stat-card, .anatomy-container, .biome-card, .impact-card, .challenge-card, .restoration-callout, .climate-warning');
    
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
    
    // Performance metrics tracking (commented out for production)
    /*
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page Load Metrics:', {
            'DOM Content Loaded': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            'Load Complete': perfData.loadEventEnd - perfData.loadEventStart,
            'Total Load Time': perfData.loadEventEnd - perfData.fetchStart
        });
    });
    */
}

// Newsletter form handling
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        // Here you would normally send this to your backend
        // console.log('Newsletter subscription:', email);
        
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

// Warm Biome Special Effects
function initWarmBiomeEffects() {
    // Add hover effects to biome cards
    const biomeCards = document.querySelectorAll('.biome-card');
    biomeCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Add glow effect based on biome type
            const glowColors = ['rgba(27, 67, 50, 0.3)', 'rgba(212, 167, 106, 0.3)', 'rgba(107, 142, 35, 0.3)'];
            this.style.boxShadow = `0 20px 40px ${glowColors[index % 3]}`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });

    // Create floating particles effect
    createFloatingParticles();
}

// Progress bar animations
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.style.width || bar.getAttribute('data-width') || '100%';
                
                // Start from 0 and animate to target width
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                    bar.style.transition = 'width 2s ease-out';
                }, 100);
                
                progressObserver.unobserve(bar);
            }
        });
    }, observerOptions);
    
    progressBars.forEach(bar => {
        progressObserver.observe(bar);
    });
}

// Hero section animations
function initHeroAnimations() {
    const heroStats = document.querySelectorAll('.hero-stat');
    
    // Add staggered entrance animations
    heroStats.forEach((stat, index) => {
        stat.style.animationDelay = `${index * 0.2}s`;
        stat.classList.add('animate-in');
    });
    
    // Add interactive hover effects
    heroStats.forEach(stat => {
        stat.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
            this.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
        });
        
        stat.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

// Create floating particles for visual effect
function createFloatingParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
    `;
    
    // Only add particles on larger screens
    if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.appendChild(particleContainer);
        
        // Create particles
        for (let i = 0; i < 15; i++) {
            createParticle(particleContainer);
        }
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    const symbols = ['🍃', '🌿', '🌱'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    particle.textContent = symbol;
    particle.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 20 + 10}px;
        opacity: ${Math.random() * 0.3 + 0.1};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: floatParticle ${Math.random() * 20 + 20}s linear infinite;
    `;
    
    container.appendChild(particle);
    
    // Remove particle after animation
    particle.addEventListener('animationend', () => {
        particle.remove();
        createParticle(container); // Create new particle to maintain count
    });
}

// Add floating particle animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes floatParticle {
        0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
        }
        25% {
            transform: translateY(75vh) translateX(20px) rotate(90deg);
        }
        50% {
            transform: translateY(50vh) translateX(-20px) rotate(180deg);
        }
        75% {
            transform: translateY(25vh) translateX(20px) rotate(270deg);
        }
        100% {
            transform: translateY(-100px) translateX(0) rotate(360deg);
        }
    }
    
    .animate-in {
        animation: riseAndGlow 1s ease forwards;
    }
    
    @keyframes riseAndGlow {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(particleStyle);

// Enhanced scroll reveal with different directions
const scrollRevealElements = document.querySelectorAll('.scroll-reveal, .fade-in-left, .fade-in-right');
scrollRevealElements.forEach(el => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    revealObserver.observe(el);
});