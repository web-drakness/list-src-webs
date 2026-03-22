

window.Router = {
    currentPage: 'home',
    cache: {}, 
    prefetched: new Set(),
    expiryCheckInterval: null,

    init() {
        this.bindEvents();
        this.handleInitialRoute();
        this.initPrefetching();

        
        this.checkExpiry();
        this.expiryCheckInterval = setInterval(() => this.checkExpiry(), 10000);

        
        window.navigate = (page) => this.navigateTo(page);
        window.navigateTo = (page) => this.navigateTo(page);

        
        setTimeout(() => {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => this.preloadAll());
            } else {
                this.preloadAll();
            }
        }, 3000);
    },

    
    async checkExpiry() {
        try {
            const response = await fetch('/api/check_expiry.php', { cache: 'no-store' });
            const data = await response.json();

            if (data.expired && data.redirect) {
                
                if (this.expiryCheckInterval) {
                    clearInterval(this.expiryCheckInterval);
                }
                window.location.href = data.redirect;
            }
        } catch (e) {
            console.warn('Expiry check failed:', e);
        }
    },

    bindEvents() {
        
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-navigate]');
            if (link) {
                e.preventDefault();
                this.navigateTo(link.dataset.navigate);
            }

            
            const a = e.target.closest('a');
            if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/')) {
                const href = a.getAttribute('href');
                const internalPages = ['home', 'shop', 'history', 'guide', 'ranking', 'rules', 'promotions', 'download'];
                const targetPage = href.replace('/', '');

                if (internalPages.includes(targetPage) || targetPage === '') {
                    
                    if (!a.getAttribute('target')) {
                        e.preventDefault();
                        this.navigateTo(targetPage || 'home');
                    }
                }
            }
        });

        
        window.addEventListener('popstate', (e) => {
            let page = e.state?.page || window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
            if (page !== this.currentPage) {
                this.loadPage(page, false);
            }
        });
    },

    handleInitialRoute() {
        let path = window.location.pathname.replace(/^\/|\/$/g, '');
        if (path === '' || path === 'index.html') path = 'home';

        if (window.location.hash) {
            path = window.location.hash.replace('#', '');
            history.replaceState({ page: path }, '', '/' + path);
        }

        this.loadPage(path, false);
    },

    async navigateTo(page) {
        if (page === this.currentPage) return;

        const url = page === 'home' ? '/' : `/${page}`;
        history.pushState({ page }, '', url);

        await this.loadPage(page, true);
    },

    async loadPage(page, animate = true) {
        
        if (page === 'guide' && window.SiteConfig && window.SiteConfig.guideVisible === false) {
            
            console.warn('Guide page is disabled.');
            if (typeof showToast === 'function') showToast('เมนูนี้ปิดปรับปรุงชั่วคราว', 'error');

            
            if (this.currentPage !== 'home') {
                return this.navigateTo('home');
            } else {
                
                window.location.href = '/';
                return;
            }
        }

        
        if (page === 'rules' && window.SiteConfig && window.SiteConfig.rulesVisible === false) {
            console.warn('Rules page is disabled.');
            if (typeof showToast === 'function') showToast('เมนูนี้ปิดปรับปรุงชั่วคราว', 'error');
            if (this.currentPage !== 'home') return this.navigateTo('home');
            else { window.location.href = '/'; return; }
        }

        
        if (page === 'download' && window.SiteConfig && window.SiteConfig.downloadVisible === false) {
            console.warn('Download page is disabled.');
            if (typeof showToast === 'function') showToast('เมนูนี้ปิดปรับปรุงชั่วคราว', 'error');
            if (this.currentPage !== 'home') return this.navigateTo('home');
            else { window.location.href = '/'; return; }
        }

        
        
        
        const authRequiredPages = ['topup_truewallet', 'topup_bank', 'history'];
        if (authRequiredPages.includes(page) && (!window.App || !window.App.user)) {
            
            if (window.Toast) {
                window.Toast.warning('กรุณาเข้าสู่ระบบ', 'คุณต้องเข้าสู่ระบบก่อนเข้าถึงหน้านี้');
            }

            
            if (typeof window.openModal === 'function') {
                window.openModal('login-modal');
            }

            
            const targetRedirect = (page === 'history') ? 'home' : 'topup';
            const targetUrl = (targetRedirect === 'home') ? '/' : '/topup';

            if (this.currentPage !== targetRedirect) {
                return this.navigateTo(targetRedirect);
            } else {
                
                history.replaceState({ page: targetRedirect }, '', targetUrl);
                return this.loadPage(targetRedirect, false);
            }
        }

        
        if (page === 'gift' && window.SiteConfig && window.SiteConfig.giftSystem === false) {
            console.warn('Gift system is disabled.');
            if (typeof showToast === 'function') showToast('ระบบของขวัญปิดปรับปรุงชั่วคราว', 'error');
            if (this.currentPage !== 'home') return this.navigateTo('home');
            else { window.location.href = '/'; return; }
        }

        
        await this.checkExpiry();

        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        if (animate) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(10px)';
        }

        try {
            if (page === 'home') {
                mainContent.innerHTML = this.getHomeContent(); 
            } else {
                let html;
                if (this.cache[page]) {
                    html = this.cache[page];
                } else {
                    const response = await fetch(`/page/${page}.html`);
                    if (!response.ok) throw new Error(`Page ${page} not found`);
                    html = await response.text();
                    this.cache[page] = html;
                }
                mainContent.innerHTML = html;
                this.executeScripts(mainContent);
            }

            
            if (window.Navbar && window.Navbar.updateActiveLink) {
                window.Navbar.updateActiveLink(page);
            }

            
            

            this.currentPage = page;
            if (window.App) window.App.currentPage = page; 

        } catch (error) {
            console.error('Router Error:', error);
            
            if (page !== 'home') window.location.href = '/errors/404.php';
        }

        if (animate) {
            requestAnimationFrame(() => {
                mainContent.style.transition = 'all 0.3s ease';
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    },

    
    initPrefetching() {
        document.querySelectorAll('[data-navigate]').forEach(link => {
            link.addEventListener('mouseenter', () => {
                const page = link.dataset.navigate;
                if (page && page !== 'home') this.prefetch(page);
            });
        });
    },

    async prefetch(page) {
        if (this.prefetched.has(page) || page === this.currentPage || page === 'home') return;
        try {
            
            const response = await fetch(`/page/${page}.html`);
            if (response.ok) {
                const html = await response.text();
                this.cache[page] = html;
                this.prefetched.add(page);
            }
        } catch (e) {
            console.warn(`[Prefetch] Failed: ${page}`, e);
        }
    },

    async preloadAll() {
        const allPages = ['shop', 'topup', 'topup_truewallet', 'topup_bank', 'history', 'gift', 'guide', 'rules', 'promotions', 'download'];
        await Promise.all(allPages.map(p => this.prefetch(p)));
    },

    getHomeContent() {
        
        const displayMode = window.SiteConfig?.homeDisplayMode || 'slide_only';

        
        if (displayMode === 'slide_only' || displayMode === 'show_all') {
            setTimeout(() => this.loadHomeSlider(), 100);
        }

        
        const showSlider = (displayMode === 'slide_only' || displayMode === 'show_all');
        const showFeature = (displayMode === 'feature_only' || displayMode === 'show_all');

        
        const sliderHtml = showSlider ? `
        <!-- Image Slider -->
        <div class="container home-slider-section">
            <div class="home-slider" id="home-slider">
                <div class="slider-wrapper" id="slider-wrapper">
                    <!-- Slides will be loaded here -->
                </div>
                <button class="slider-btn slider-prev" id="slider-prev" style="display: none;">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="slider-btn slider-next" id="slider-next" style="display: none;">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="slider-dots" id="slider-dots"></div>
            </div>
        </div>
        ` : '';

        
        const featureHtml = showFeature ? `
            <div class="feature-cards animate__animated animate__fadeInUp anim-delay-200">
                <a href="/shop" class="feature-card-new" onclick="navigate('shop'); return false;">
                    <div class="fcard-icon"><i class="fas fa-shopping-cart"></i></div>
                    <div class="fcard-body">
                        <div class="fcard-text">
                            <h3>ร้านค้า</h3>
                            <p>เลือกซื้อสินค้าเซิร์ฟเวอร์</p>
                            <div class="fcard-btn">คลิกเลย <i class="fas fa-arrow-right"></i></div>
                        </div>
                    </div>
                    <div class="fcard-arrow"><i class="fas fa-chevron-right"></i></div>
                </a>
                <a href="/topup" class="feature-card-new" onclick="navigate('topup'); return false;">
                    <div class="fcard-icon"><i class="fas fa-gem"></i></div>
                    <div class="fcard-body">
                        <div class="fcard-text">
                            <h3>เติมเงิน</h3>
                            <p>ระบบเติมเงินอัตโนมัติ</p>
                            <div class="fcard-btn">คลิกเลย <i class="fas fa-arrow-right"></i></div>
                        </div>
                    </div>
                    <div class="fcard-arrow"><i class="fas fa-chevron-right"></i></div>
                </a>
            </div>
        ` : '';

        return `
        ${sliderHtml}

        <!-- ฟีเจอร์หน้าแรก -->
        <div class="container home-features">
            ${featureHtml}
    
            <!-- Server Info Section -->
            <div class="server-info-card">
            <div class="sinfo-image">
                    <img src="${window.SiteConfig?.siteBanner || '/assets/img/banner.webp'}" alt="Server Preview" onerror="this.onerror=null; this.src='/assets/img/wallpaper.webp'">
                </div>
                <div class="sinfo-content">

                    <h2>${window.SiteConfig?.bannerTitle || 'Minecraft Server'}</h2>
                    <p>${window.SiteConfig?.bannerDescription || 'เซิร์ฟเวอร์เอาชีวิตรอดที่สมดุลที่สุด'}</p>
                    <ul class="sinfo-features">
                        ${window.SiteConfig?.bannerFeature1 ? `<li><i class="${window.SiteConfig.bannerFeature1Icon || 'fas fa-check-circle'}"></i> ${window.SiteConfig.bannerFeature1}</li>` : ''}
                        ${window.SiteConfig?.bannerFeature2 ? `<li><i class="${window.SiteConfig.bannerFeature2Icon || 'fas fa-check-circle'}"></i> ${window.SiteConfig.bannerFeature2}</li>` : ''}
                        ${window.SiteConfig?.bannerFeature3 ? `<li><i class="${window.SiteConfig.bannerFeature3Icon || 'fas fa-check-circle'}"></i> ${window.SiteConfig.bannerFeature3}</li>` : ''}
                    </ul>
                </div>
            </div>
        </div>
        `;
    },

    
    async loadHomeSlider() {
        try {
            const response = await fetch('/api/slides.php');
            const data = await response.json();
            let slides = data.slides || [];

            
            if (slides.length === 0) {
                slides = [{ image_url: '/assets/img/slide.webp' }];
            }

            const wrapper = document.getElementById('slider-wrapper');
            const dotsContainer = document.getElementById('slider-dots');
            const prevBtn = document.getElementById('slider-prev');
            const nextBtn = document.getElementById('slider-next');

            if (!wrapper) return;

            
            wrapper.innerHTML = slides.map((slide, index) => `
                <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${slide.image_url}" alt="Slide ${index + 1}" onerror="this.src='/assets/img/slide.webp'">
                </div>
            `).join('');

            
            if (dotsContainer && slides.length > 1) {
                dotsContainer.innerHTML = slides.map((_, index) => `
                    <button class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
                `).join('');
            }

            
            if (slides.length > 1) {
                if (prevBtn) prevBtn.style.display = 'flex';
                if (nextBtn) nextBtn.style.display = 'flex';

                
                this.initSlider(slides.length);
            }

        } catch (e) {
            console.error('Load slider error:', e);
            const section = document.querySelector('.home-slider-section');
            if (section) section.style.display = 'none';
        }
    },

    
    initSlider(total) {
        let current = 0;
        let autoSlideInterval;

        const showSlide = (index) => {
            const slides = document.querySelectorAll('#slider-wrapper .slide');
            const dots = document.querySelectorAll('#slider-dots .slider-dot');

            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });

            current = index;
        };

        const nextSlide = () => {
            showSlide((current + 1) % total);
        };

        const prevSlide = () => {
            showSlide((current - 1 + total) % total);
        };

        
        const prevBtn = document.getElementById('slider-prev');
        const nextBtn = document.getElementById('slider-next');

        if (prevBtn) prevBtn.onclick = () => { prevSlide(); resetAutoSlide(); };
        if (nextBtn) nextBtn.onclick = () => { nextSlide(); resetAutoSlide(); };

        
        document.querySelectorAll('#slider-dots .slider-dot').forEach(dot => {
            dot.onclick = () => {
                showSlide(parseInt(dot.dataset.index));
                resetAutoSlide();
            };
        });

        
        const startAutoSlide = () => {
            autoSlideInterval = setInterval(nextSlide, 5000);
        };

        const resetAutoSlide = () => {
            clearInterval(autoSlideInterval);
            startAutoSlide();
        };

        startAutoSlide();
    }
};
