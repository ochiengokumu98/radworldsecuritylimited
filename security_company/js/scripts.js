// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
       // Initialize Swiper for hero slider
        const heroSwiperEl = document.querySelector('.heroSwiper');
        let heroSwiper = null;
        if (heroSwiperEl) {
            const heroNext = heroSwiperEl.querySelector('.swiper-button-next');
            const heroPrev = heroSwiperEl.querySelector('.swiper-button-prev');
            const heroConfig = {
                loop: true,
                speed: 700,
                autoplay: {
                    delay: 6000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: heroSwiperEl.querySelector('.swiper-pagination'),
                    clickable: true,
                },
            };
            if (heroNext && heroPrev) {
                heroConfig.navigation = {
                    nextEl: heroNext,
                    prevEl: heroPrev,
                };
            }
            heroSwiper = new Swiper(heroSwiperEl, heroConfig);
        }

    // Variables
    const navbar = document.querySelector('.navbar');
    const siteHeader = document.getElementById('siteHeader');

    function getHeaderOffset() {
        return siteHeader ? siteHeader.offsetHeight : 70;
    }

    function setHeaderHeightVar() {
        if (!siteHeader) return;
        document.documentElement.style.setProperty('--header-height', `${siteHeader.offsetHeight}px`);
    }
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const prevTestimonialBtn = document.getElementById('prevTestimonial');
    const nextTestimonialBtn = document.getElementById('nextTestimonial');
    const indicators = document.querySelectorAll('.indicator');
    let currentTestimonial = 0;
    let testimonialInterval;
    let lastModalTrigger = null;

    const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function getFocusableElements(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter(el => el.offsetParent !== null || el === document.activeElement);
    }

    function setNavExpanded(isOpen) {
        if (!navToggle) return;
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }

    function closeMobileNav() {
        if (!navMenu || !navToggle) return;
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        setNavExpanded(false);
    }

    // Navbar scroll effect
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Toggle mobile navigation
    function toggleNav() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        setNavExpanded(navMenu.classList.contains('active'));
    }

    // Panel-based navigation (one main view at a time; header always stays visible)
    const PANEL_SECTIONS = {
        home: ['home', 'about', 'hero-stats'],
        about: ['about-details', 'trust'],
        services: ['services', 'clients'],
        testimonials: ['testimonials'],
        contact: ['cta-band', 'contact']
    };

    const SECTION_TO_PANEL = {};
    Object.keys(PANEL_SECTIONS).forEach((panel) => {
        PANEL_SECTIONS[panel].forEach((sectionId) => {
            SECTION_TO_PANEL[sectionId] = panel;
        });
    });

    const NAV_PANEL_TARGETS = {
        home: 'home',
        about: 'about',
        'about-details': 'about',
        trust: 'about',
        services: 'services',
        clients: 'services',
        testimonials: 'testimonials',
        contact: 'contact',
        'cta-band': 'contact'
    };

    let activePanel = 'home';

    function setActiveNavForPanel(panelName) {
        const navLinks = document.querySelectorAll('.nav-menu > li > a:not(.btn)');
        navLinks.forEach((link) => {
            const href = link.getAttribute('href') || '';
            const id = href.startsWith('#') ? href.slice(1) : '';
            link.classList.remove('active');
            if (NAV_PANEL_TARGETS[id] === panelName) {
                link.classList.add('active');
            }
        });
        if (panelName === 'home') {
            const homeLink = document.querySelector('.nav-menu a[href="#home"]');
            if (homeLink) homeLink.classList.add('active');
        }
    }

    function showPanel(panelName, scrollToId) {
        if (!PANEL_SECTIONS[panelName]) {
            panelName = 'home';
        }
        activePanel = panelName;

        document.querySelectorAll('.page-panel[data-panel]').forEach((section) => {
            const sectionPanel = section.getAttribute('data-panel');
            const isVisible = sectionPanel === panelName;
            section.classList.toggle('page-panel--hidden', !isVisible);
            section.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
        });

        setActiveNavForPanel(panelName);
        closeMobileNav();

        requestAnimationFrame(() => {
            let scrollTarget = 0;
            if (scrollToId) {
                const el = document.getElementById(scrollToId);
                if (el && !el.classList.contains('page-panel--hidden')) {
                    scrollTarget = el.offsetTop - getHeaderOffset();
                }
            } else {
                const first = document.querySelector(
                    `.page-panel[data-panel="${panelName}"]:not(.page-panel--hidden)`
                );
                if (first) {
                    scrollTarget = first.offsetTop - getHeaderOffset();
                }
            }
            window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
        });

        if (panelName === 'home' && heroSwiper) {
            heroSwiper.update();
            heroSwiper.slideTo(0, 0);
        }
    }

    function resolvePanelFromHash(hash) {
        if (!hash || hash === '#') return { panel: 'home', targetId: null };
        const id = hash.replace('#', '');
        const panel = NAV_PANEL_TARGETS[id] || SECTION_TO_PANEL[id] || 'home';
        const scrollIds = new Set(['home', 'about', 'services', 'testimonials', 'contact', 'about-details', 'trust', 'cta-band', 'clients']);
        const targetId = scrollIds.has(id) ? id : (PANEL_SECTIONS[panel] && PANEL_SECTIONS[panel].includes(id) ? id : null);
        return { panel, targetId: targetId || null };
    }

    function handleNavClick(e) {
        const href = this.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        e.preventDefault();
        const { panel, targetId } = resolvePanelFromHash(href);
        showPanel(panel, targetId);

        if (history.replaceState) {
            history.replaceState(null, '', href);
        }
    }

    // Testimonial Slider
    function showTestimonial(n) {
        // Reset current testimonial
        testimonialSlides[currentTestimonial].classList.remove('active');
        indicators[currentTestimonial].classList.remove('active');
        
        // Update current testimonial
        currentTestimonial = (n + testimonialSlides.length) % testimonialSlides.length;
        
        // Show new testimonial
        testimonialSlides[currentTestimonial].classList.add('active');
        indicators[currentTestimonial].classList.add('active');
    }

    function nextTestimonial() {
        showTestimonial(currentTestimonial + 1);
        resetTestimonialInterval();
    }

    function prevTestimonial() {
        showTestimonial(currentTestimonial - 1);
        resetTestimonialInterval();
    }

    function resetTestimonialInterval() {
        clearInterval(testimonialInterval);
        startTestimonialInterval();
    }

    function startTestimonialInterval() {
        testimonialInterval = setInterval(nextTestimonial, 5000);
    }

    // Initialize testimonial auto-rotation
    function initTestimonials() {
        if (testimonialSlides.length > 0) {
            startTestimonialInterval();
        }
    }

    // Service Modals Logic
    const modalBtns = document.querySelectorAll('.learn-more-btn');
    const modals = document.querySelectorAll('.service-modal');

    function trapFocusInModal(e, wrapper) {
        if (e.key !== 'Tab') return;
        const focusable = getFocusableElements(wrapper);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function openServiceModal(modal, trigger) {
        lastModalTrigger = trigger;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const wrapper = modal.querySelector('.modal-wrapper');
        const closeBtn = modal.querySelector('.modal-close');
        const focusTarget = closeBtn || getFocusableElements(wrapper)[0];
        if (focusTarget) focusTarget.focus();

        modal._focusTrapHandler = (e) => trapFocusInModal(e, wrapper);
        document.addEventListener('keydown', modal._focusTrapHandler);
    }

    const closeAllModals = () => {
        modals.forEach(modal => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            if (modal._focusTrapHandler) {
                document.removeEventListener('keydown', modal._focusTrapHandler);
                delete modal._focusTrapHandler;
            }
        });
        document.body.style.overflow = '';
        if (lastModalTrigger) {
            lastModalTrigger.focus();
            lastModalTrigger = null;
        }
    };
    
    modalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceId = this.getAttribute('data-service');
            const modal = document.getElementById(`modal-${serviceId}`);
            if (modal) {
                openServiceModal(modal, this);
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        if (closeBtn) closeBtn.addEventListener('click', closeAllModals);
        if (overlay) overlay.addEventListener('click', closeAllModals);

        const ctaBtn = modal.querySelector('.modal-cta-btn');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', function() {
                closeAllModals();
                const selectedService = this.getAttribute('data-service-select');
                const formServiceDropdown = document.getElementById('service');
                const formMessage = document.getElementById('message');
                
                if (formServiceDropdown) {
                    formServiceDropdown.value = selectedService;
                }
                
                if (formMessage) {
                    formMessage.value = `I am interested in: ${selectedService}. Please provide more details and schedule an on-site consultation.`;
                }
                
                showPanel('contact', 'contact');
                if (history.replaceState) {
                    history.replaceState(null, '', '#contact');
                }
                setTimeout(() => {
                    const nameField = document.getElementById('name');
                    if (nameField) nameField.focus();
                }, 800);
            });
        }
    });

    // Handle AJAX form submission to Formspree
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Request Security Consultation';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Inquiry...';
        }
        
        const data = new FormData(form);
        
        fetch(form.action, {
            method: 'POST',
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Thank you! Your security inquiry has been submitted successfully to Radworld Security. Our representative will contact you shortly.');
                form.reset();
            } else {
                return response.json().then(data => {
                    if (data && data.errors) {
                        alert('Submission Error: ' + data.errors.map(error => error.message).join(", "));
                    } else {
                        alert('Oops! There was a problem submitting your form. Please check your inputs and try again, or contact us directly via email.');
                    }
                });
            }
        })
        .catch(error => {
            alert('A network error occurred. Please check your internet connection and try again.');
            console.error('Submit Error:', error);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Keep header visible with solid background while scrolling inside a panel
    function updateHeaderOnScroll() {
        if (!siteHeader) return;
        if (window.scrollY > 8) {
            siteHeader.classList.add('is-scrolled');
        } else {
            siteHeader.classList.remove('is-scrolled');
        }
    }

    // Animations on scroll
    function animateOnScroll() {
        const elements = document.querySelectorAll('.service-card, .about-image, .about-text, .careers-image, .careers-text, .contact-info, .contact-form, .trust-card, .client-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.25;
            
            if (elementPosition < screenPosition) {
                element.classList.add('animate');
            }
        });
    }

    // Subtle reveal for stats, CTA, and section headers
    function initScrollReveal() {
        const revealTargets = document.querySelectorAll(
            '.stat-item, .cta-band-inner, .section-header, .hero-stats'
        );
        revealTargets.forEach(el => el.classList.add('reveal-on-scroll'));

        if (!('IntersectionObserver' in window)) {
            revealTargets.forEach(el => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
        );

        document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    }

    // Event Listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', updateHeaderOnScroll);
    window.addEventListener('scroll', animateOnScroll);
    
    if (navToggle) {
        navToggle.addEventListener('click', toggleNav);
    }
    
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', handleNavClick);
    });
    
    if (prevTestimonialBtn && nextTestimonialBtn) {
        prevTestimonialBtn.addEventListener('click', prevTestimonial);
        nextTestimonialBtn.addEventListener('click', nextTestimonial);
    }
    
    if (indicators.length > 0) {
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showTestimonial(index);
                resetTestimonialInterval();
            });
        });
    }
    
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        consultationForm.addEventListener('submit', handleFormSubmit);
    }

    // Initialize Page functions
    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);
    handleScroll();
    updateHeaderOnScroll();

    const initial = resolvePanelFromHash(window.location.hash);
    showPanel(initial.panel, initial.targetId);
    if (!window.location.hash && history.replaceState) {
        history.replaceState(null, '', '#home');
    }

    window.addEventListener('hashchange', () => {
        const next = resolvePanelFromHash(window.location.hash);
        showPanel(next.panel, next.targetId);
    });

    initTestimonials();
    initScrollReveal();
    animateOnScroll();
    
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate');
        }, 150 * index);
    });

    // Handle dropdown menus on mobile
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (link && menu) {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 1100) {
                    e.preventDefault();
                    menu.classList.toggle('active');
                    return;
                }
                if (this.getAttribute('href') === '#services') {
                    e.preventDefault();
                    showPanel('services', 'services');
                    if (history.replaceState) {
                        history.replaceState(null, '', '#services');
                    }
                }
            });
        }

        menu.querySelectorAll('a[href^="#"]').forEach((subLink) => {
            subLink.addEventListener('click', function() {
                if (window.innerWidth <= 1100) {
                    menu.classList.remove('active');
                }
            });
        });
    });
});
