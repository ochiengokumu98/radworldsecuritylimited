// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    // ── Swiper Hero Slider ──
    const heroSwiperEl = document.querySelector('.heroSwiper');
    let heroSwiper = null;
    if (heroSwiperEl) {
        const heroNext = heroSwiperEl.querySelector('.swiper-button-next');
        const heroPrev = heroSwiperEl.querySelector('.swiper-button-prev');
        const heroConfig = {
            loop: true,
            speed: 700,
            autoplay: { delay: 6000, disableOnInteraction: false },
            pagination: {
                el: heroSwiperEl.querySelector('.swiper-pagination'),
                clickable: true,
            },
        };
        if (heroNext && heroPrev) {
            heroConfig.navigation = { nextEl: heroNext, prevEl: heroPrev };
        }
        heroSwiper = new Swiper(heroSwiperEl, heroConfig);
    }

    const navbar = document.querySelector('.navbar');
    const siteHeader = document.getElementById('siteHeader');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    function getHeaderOffset() {
        return siteHeader ? siteHeader.offsetHeight : 70;
    }

    function setHeaderHeightVar() {
        if (!siteHeader) return;
        document.documentElement.style.setProperty('--header-height', `${siteHeader.offsetHeight}px`);
    }

    function setNavExpanded(isOpen) {
        if (!navToggle) return;
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }

    // uses only 'active' class to match custom.css
    function closeMobileNav() {
        if (!navMenu || !navToggle) return;
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        setNavExpanded(false);
        const overlay = document.getElementById('navOverlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    // uses only 'active' class, adds overlay + scroll lock
    function toggleNav() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        const isOpen = navMenu.classList.contains('active');
        setNavExpanded(isOpen);
        const overlay = document.getElementById('navOverlay');
        if (overlay) overlay.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    // (panel navigation, testimonials, modals, form — all unchanged)

    if (navToggle) {
        navToggle.addEventListener('click', toggleNav);
    }

    //clicking backdrop closes the menu
    const navOverlay = document.getElementById('navOverlay');
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileNav);
    }

    // Services dropdown toggles 'open' on the parent .dropdown
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (link && menu) {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 1100) {
                    e.preventDefault();
                    dropdown.classList.toggle('open');
                    return;
                }
            });
        }
    });

});