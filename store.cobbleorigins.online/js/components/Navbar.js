

window.Navbar = {
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.navbar = document.querySelector('.navbar');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.dropdownContainer = document.querySelector('.nav-dropdown');
        this.userMenuBtn = document.querySelector('.user-menu-btn');
    },

    bindEvents() {
        
        window.addEventListener('scroll', () => {
            if (this.navbar) {
                this.navbar.classList.toggle('scrolled', window.scrollY > 50);
            }
        });

        
        if (this.userMenuBtn) {
            this.userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown();
            });
        }

        
        window.toggleUserDropdown = () => this.toggleUserDropdown();
    },

    toggleUserDropdown() {
        if (!this.dropdownContainer) return;

        this.dropdownContainer.classList.toggle('active');

        
        const closeDropdown = (e) => {
            if (!this.dropdownContainer.contains(e.target) && !this.userMenuBtn.contains(e.target)) {
                this.dropdownContainer.classList.remove('active');
                document.removeEventListener('click', closeDropdown);
            }
        };

        
        setTimeout(() => document.addEventListener('click', closeDropdown), 0);
    },

    updateActiveLink(page) {
        const links = document.querySelectorAll('.nav-custom-link');
        links.forEach(link => {
            const navigateAttr = link.getAttribute('data-navigate');
            const hrefAttr = link.getAttribute('href');

            
            const isMatch = (navigateAttr === page) || (hrefAttr === '/' + page) || (page === 'home' && hrefAttr === '/home');

            if (isMatch) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};
