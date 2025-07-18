// Landing Page JavaScript - Interactive functionality and animations

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animations
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }

    // Initialize cookie consent
    initializeCookieConsent();

    // Header scroll effect
    initializeHeaderScroll();

    // Mobile menu
    initializeMobileMenu();

    // Interactive demo
    initializeInteractiveDemo();

    // Use cases carousel
    initializeUseCasesCarousel();

    // FAQ accordion
    initializeFAQAccordion();

    // Pricing toggle
    initializePricingToggle();

    // Smooth scrolling for navigation links
    initializeSmoothScrolling();

    // Watch demo button
    initializeWatchDemo();

    // Background animations
    initializeBackgroundAnimations();
});

// Cookie Consent Initialization
function initializeCookieConsent() {
    if (typeof cookieconsent !== 'undefined') {
        window.cookieconsent.initialise({
            palette: {
                popup: {
                    background: '#111111',
                    text: '#ffffff'
                },
                button: {
                    background: '#8B5CF6',
                    text: '#ffffff'
                }
            },
            theme: 'classic',
            position: 'bottom-right',
            content: {
                message: 'This website uses cookies to ensure you get the best experience.',
                dismiss: 'Got it!',
                link: 'Learn more',
                href: '#'
            }
        });
    }
}

// Header Scroll Effect
function initializeHeaderScroll() {
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide header on scroll down, show on scroll up
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    });
}

// Mobile Menu
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
    }
}

// Interactive Demo
function initializeInteractiveDemo() {
    const canvas = document.getElementById('interactiveCanvas');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const aiPanel = document.getElementById('demoAiPanel');
    const aiSuggestion = document.getElementById('aiSuggestion');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let currentTool = 'draw';
    let startX, startY;

    // Set canvas size
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Set canvas styles
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#8B5CF6';
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Tool selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            
            if (currentTool === 'ai') {
                showAIDemo();
            }
        });
    });

    // Drawing functionality
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    function startDrawing(e) {
        if (currentTool !== 'draw') return;
        
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }

    function draw(e) {
        if (!isDrawing || currentTool !== 'draw') return;
        
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
    }

    // Text tool
    canvas.addEventListener('click', handleTextTool);

    function handleTextTool(e) {
        if (currentTool !== 'text') return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.font = '16px Inter';
        ctx.fillStyle = '#8B5CF6';
        ctx.fillText('Sample Text', x, y);
    }

    // AI Demo
    function showAIDemo() {
        // Clear canvas and draw equation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw equation
        ctx.font = '24px Inter';
        ctx.fillStyle = '#06B6D4';
        ctx.fillText('2x + 3 = 7', 50, 100);
        
        // Show AI response after delay
        setTimeout(() => {
            ctx.fillStyle = '#8B5CF6';
            ctx.fillText('x = 2', 50, 140);
            
            // Update AI suggestion
            aiSuggestion.innerHTML = `
                <div style="margin-bottom: 0.5rem;">
                    <strong>AI Solution:</strong>
                </div>
                <div style="font-size: 0.8rem; line-height: 1.4;">
                    To solve 2x + 3 = 7:<br>
                    1. Subtract 3: 2x = 4<br>
                    2. Divide by 2: x = 2
                </div>
            `;
        }, 1000);
    }

    // Demo equations for AI interaction
    const demoEquations = [
        { equation: '2x + 3 = 7', solution: 'x = 2', steps: ['Subtract 3: 2x = 4', 'Divide by 2: x = 2'] },
        { equation: 'y = 3x + 1', solution: 'Linear function', steps: ['Slope: 3', 'Y-intercept: 1'] },
        { equation: 'a² + b² = c²', solution: 'Pythagorean theorem', steps: ['For right triangles', 'c is hypotenuse'] }
    ];

    // Cycle through demo equations
    let currentEquationIndex = 0;
    setInterval(() => {
        if (currentTool === 'ai') {
            const eq = demoEquations[currentEquationIndex];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '20px Inter';
            ctx.fillStyle = '#06B6D4';
            ctx.fillText(eq.equation, 50, 100);
            
            setTimeout(() => {
                ctx.fillStyle = '#8B5CF6';
                ctx.fillText(eq.solution, 50, 140);
                
                aiSuggestion.innerHTML = `
                    <div style="margin-bottom: 0.5rem;">
                        <strong>AI Analysis:</strong>
                    </div>
                    <div style="font-size: 0.8rem; line-height: 1.4;">
                        ${eq.steps.join('<br>')}
                    </div>
                `;
            }, 800);
            
            currentEquationIndex = (currentEquationIndex + 1) % demoEquations.length;
        }
    }, 5000);
}

// Use Cases Carousel
function initializeUseCasesCarousel() {
    const track = document.getElementById('useCasesTrack');
    const prevBtn = document.getElementById('prevUseCase');
    const nextBtn = document.getElementById('nextUseCase');

    if (!track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll('.use-case-card');
    const cardWidth = cards[0].offsetWidth + 32; // card width + gap
    let currentIndex = 0;
    const maxIndex = Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));

    function updateCarousel() {
        const translateX = -currentIndex * cardWidth;
        track.style.transform = `translateX(${translateX}px)`;
        
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });

    // Auto-play carousel
    setInterval(() => {
        if (currentIndex >= maxIndex) {
            currentIndex = 0;
        } else {
            currentIndex++;
        }
        updateCarousel();
    }, 4000);

    // Initial update
    updateCarousel();

    // Update on resize
    window.addEventListener('resize', () => {
        const newMaxIndex = Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));
        if (currentIndex > newMaxIndex) {
            currentIndex = newMaxIndex;
        }
        updateCarousel();
    });
}

// FAQ Accordion
function initializeFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });
}

// Pricing Toggle
function initializePricingToggle() {
    const toggle = document.getElementById('annualToggle');
    const amounts = document.querySelectorAll('.amount');

    if (!toggle) return;

    toggle.addEventListener('change', () => {
        const isAnnual = toggle.checked;
        
        amounts.forEach(amount => {
            const monthlyPrice = amount.dataset.monthly;
            const annualPrice = amount.dataset.annual;
            
            if (isAnnual) {
                amount.textContent = annualPrice;
            } else {
                amount.textContent = monthlyPrice;
            }
        });
    });
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Watch Demo Button
function initializeWatchDemo() {
    const watchDemoBtn = document.getElementById('watchDemo');
    
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', () => {
            // Scroll to demo section
            const demoSection = document.getElementById('demo');
            if (demoSection) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = demoSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
}

// Background Animations
function initializeBackgroundAnimations() {
    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.bg-grid, .bg-gradient');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // Animated gradient backgrounds
    const gradientElements = document.querySelectorAll('.bg-gradient, .bg-particles');
    
    gradientElements.forEach(element => {
        let hue = 0;
        setInterval(() => {
            hue = (hue + 1) % 360;
            element.style.filter = `hue-rotate(${hue}deg)`;
        }, 100);
    });
}

// Intersection Observer for animations
function initializeIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Add staggered animation for grid items
                if (entry.target.classList.contains('features-grid') || 
                    entry.target.classList.contains('testimonials-grid') || 
                    entry.target.classList.contains('pricing-cards')) {
                    
                    const children = entry.target.children;
                    Array.from(children).forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('animate-in');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    // Observe elements
    const animatedElements = document.querySelectorAll(
        '.feature-card, .use-case-card, .testimonial-card, .pricing-card, .faq-item'
    );
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Initialize intersection observer after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeIntersectionObserver();
});

// Performance optimizations
function optimizePerformance() {
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            // Scroll event handling
        }, 10);
    });

    // Preload critical images
    const criticalImages = [
        // Add any critical image URLs here
    ];

    criticalImages.forEach(imageUrl => {
        const img = new Image();
        img.src = imageUrl;
    });

    // Lazy load non-critical elements
    const lazyElements = document.querySelectorAll('[data-lazy]');
    
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const src = element.dataset.lazy;
                
                if (element.tagName === 'IMG') {
                    element.src = src;
                } else {
                    element.style.backgroundImage = `url(${src})`;
                }
                
                element.removeAttribute('data-lazy');
                lazyObserver.unobserve(element);
            }
        });
    });

    lazyElements.forEach(element => {
        lazyObserver.observe(element);
    });
}

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', optimizePerformance);

// Error handling
window.addEventListener('error', (e) => {
    console.error('Landing page error:', e.error);
    // Could send to analytics or error reporting service
});

// Analytics and tracking (placeholder)
function trackEvent(eventName, properties = {}) {
    // Placeholder for analytics tracking
    console.log(`Track event: ${eventName}`, properties);
    
    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', eventName, properties);
    // }
}

// Track important user interactions
document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button');
    if (!target) return;

    const text = target.textContent.trim();
    const href = target.href;
    
    if (text.includes('Get Started') || text.includes('Try')) {
        trackEvent('cta_click', { text, href });
    } else if (text.includes('Demo')) {
        trackEvent('demo_click', { text });
    } else if (target.classList.contains('nav-link')) {
        trackEvent('navigation_click', { text, href });
    }
});

// Export functions for potential external use
window.LandingPage = {
    trackEvent,
    initializeInteractiveDemo,
    initializeFAQAccordion,
    initializePricingToggle
};
