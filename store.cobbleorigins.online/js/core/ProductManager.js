window.ProductManager = {
    currentProduct: null,
    currentType: 'point',
    currentServer: 'all', 
    cache: { data: {}, timestamp: {}, maxAge: 5 * 60 * 1000 },
    autoRefreshInterval: null,
    autoRefreshDelay: 5 * 60 * 1000, 

    getProductImageUrl(image) {
        return (image && image.trim() !== '') ? image : '/assets/img/default-product.webp';
    },

    init() {
        if (window.initServerSelector) window.initServerSelector();
        this.startAutoRefresh();
    },

    startAutoRefresh() {
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = setInterval(() => {
            const grid = document.getElementById('products-grid');
            const isShopPage = window.Router && (window.Router.currentPage === 'shop');
            if (grid && document.visibilityState === 'visible' && isShopPage) {
                this.loadProducts(this.currentType, true);
            }
        }, this.autoRefreshDelay);
    },

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    },

    startCountdownLoop() {
        let lastUpdate = 0;
        const loop = (timestamp) => {
            if (timestamp - lastUpdate >= 1000) {
                this.updateCountdowns();
                lastUpdate = timestamp;
            }
            this.countdownRequestId = requestAnimationFrame(loop);
        };
        if (this.countdownRequestId) cancelAnimationFrame(this.countdownRequestId);
        this.countdownRequestId = requestAnimationFrame(loop);
    },

    updateCountdowns() {
        const timers = document.querySelectorAll('.btn-countdown-v2');
        const now = new Date().getTime();

        timers.forEach(timer => {
            const targetDateStr = timer.dataset.target;
            if (!targetDateStr) return;

            let countTo;
            if (targetDateStr.indexOf('-') > 0) {
                try {
                    const t = targetDateStr.split(/[- :]/); 
                    countTo = new Date(t[0], (t[1] || 1) - 1, t[2] || 1, t[3] || 0, t[4] || 0, t[5] || 0).getTime();
                } catch (e) {
                    countTo = new Date(targetDateStr).getTime();
                }
            } else {
                countTo = new Date(targetDateStr).getTime();
            }

            if (isNaN(countTo)) {
                countTo = new Date(targetDateStr.replace(' ', 'T')).getTime();
                if (isNaN(countTo)) return;
            }

            const diff = countTo - now;
            const span = timer.querySelector('.cd-timer');

            if (diff <= 0) {
                if (!timer.dataset.reloaded) {
                    timer.dataset.reloaded = 'true';
                    setTimeout(() => this.loadProducts(this.currentType, true), 1000);
                }
                if (span) span.textContent = "00:00:00";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            let text = '';
            if (days > 0) text += `${days}ว `;
            text += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (span) span.textContent = text;
        });
    },

    getCache(key) {
        const now = Date.now();
        if (this.cache.data[key] && (now - this.cache.timestamp[key]) < this.cache.maxAge) {
            return this.cache.data[key];
        }
        return null;
    },

    setCache(key, products) {
        this.cache.data[key] = products;
        this.cache.timestamp[key] = Date.now();
    },

    async loadProducts(type = 'point', forceRefresh = false, serverId = null) {
        this.currentType = type;
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        if (serverId) {
            this.currentServer = serverId;
        } else {
            const serverOption = document.querySelector('#server-options-list .dropdown-option.active');
            if (serverOption) {
                this.currentServer = serverOption.dataset.value;
            }
        }
        
        const selectedServer = this.currentServer;
        const promoServerName = document.getElementById('promo-server-name');
        const shopBanner = document.querySelector('.shop-header-banner');
        const shopWarning = document.querySelector('.shop-warning-bar');

        if (promoServerName) promoServerName.className = type === 'rp' ? 'rp' : '';
        if (shopBanner) shopBanner.classList.toggle('theme-rp', type === 'rp');
        if (shopWarning) shopWarning.classList.toggle('theme-rp', type === 'rp');

        const shopLayout = document.querySelector('.shop-layout');
        if (shopLayout) shopLayout.classList.toggle('theme-rp', type === 'rp');

        const cacheKey = `${type}_${selectedServer}`;
        const cached = this.getCache(cacheKey);

        if (cached && !forceRefresh) {
            this.renderGrid(grid, cached, type);
            this.updateCategoryCounts(cached);
            return;
        }

        grid.innerHTML = this.getSkeleton(8);

        try {
            const response = await fetch(`${window.App.apiBase}/products.php?type=${type}&server=${selectedServer}`);
            const data = await response.json();

            if (data.success) {
                const products = data.products || [];
                this.setCache(cacheKey, products);
                this.renderGrid(grid, products, type);
                this.updateCategoryCounts(products);

                if (products.length === 0) {
                    grid.innerHTML = `
                        <div class="no-products">
                            <i class="fas fa-box-open fa-3x"></i>
                            <p>ยังไม่มีสินค้าในหมวดหมู่นี้</p>
                        </div>`;
                }
            } else {
                grid.innerHTML = `<p class="text-center text-error">ไม่สามารถโหลดสินค้าได้</p>`;
            }
        } catch (error) {
            console.error('Load Products Error:', error);
            grid.innerHTML = `<p class="text-center text-error">ไม่สามารถโหลดสินค้าได้</p>`;
        }
    },

    renderGrid(grid, products, type) {
        grid.innerHTML = products.map(p => this.createCard(p, type)).join('');
    },

    createCard(product, type) {
        const priceIcon = type === 'point' ? 'fa-coins' : 'fa-gem';
        let finalPrice = parseFloat(product.price);
        let originalPrice = finalPrice;
        let hasDiscount = false;
        let priceBadgeHtml = '';

        if (parseInt(product.discount_percent) > 0) {
            const now = new Date();
            const end = product.discount_end ? new Date(product.discount_end) : null;
            if (!end || now < end) {
                hasDiscount = true;
                finalPrice = originalPrice * (100 - parseInt(product.discount_percent)) / 100;
            }
        }
        
        const productWithDiscount = { ...product, finalPrice: finalPrice };
        const productJson = JSON.stringify(productWithDiscount).replace(/"/g, '&quot;');

        const stock = parseInt(product.stock);
        const isOutOfStock = stock === 0;

        const limit = parseInt(product.purchase_limit);
        const userBought = parseInt(product.user_purchase_count) || 0;
        const isLimitReached = (limit > -1 && userBought >= limit);

        let buyBtnDisabled = isOutOfStock;
        let buyBtnText = '<i class="fas fa-shopping-cart"></i> สั่งซื้อ';
        let showGiftBtn = (window.SiteConfig?.giftSystem !== false);

        if (isLimitReached) {
            buyBtnDisabled = true;
            buyBtnText = '<i class="fas fa-user-check"></i> ครบสิทธิ์แล้ว';
            showGiftBtn = false;
        } else if (isOutOfStock) {
            buyBtnText = '<i class="fas fa-times-circle"></i> สินค้าหมด';
        }

        const now = new Date();
        const startSale = product.start_sale ? new Date(product.start_sale) : null;
        let isPreSale = false;

        if (startSale && now < startSale) {
            isPreSale = true;
            buyBtnDisabled = true;
        }

        const currencyIcon = type === 'rp' ? 'fa-gem' : 'fa-coins';
        priceBadgeHtml = `
            <div class="product-info-pill ${type}">
                ${hasDiscount ? `<span class="old-price">${formatNumber(originalPrice)}</span>` : ''}
                <span class="new-price"><i class="fas ${currencyIcon}"></i> ${formatNumber(finalPrice)}</span>
            </div>
        `;

        return `
        <div class="product-card ${type} ${buyBtnDisabled ? 'disabled' : ''}">
            <div class="product-top-overlay">${priceBadgeHtml}</div>
            <div class="product-image-container">
                <img src="${this.getProductImageUrl(product.image)}" alt="${product.name}" class="product-img" loading="lazy">
                ${isPreSale ? '<div class="coming-soon-badge">เร็วๆนี้</div>' : ''}
            </div>
            <div class="product-content-v2">
                <h3 class="product-title-v2" title="${product.name}">${product.name}</h3>
                <div class="product-meta-badges">
                    ${hasDiscount ? `<div class="meta-badge-item discount"><i class="fas fa-fire"></i> -${product.discount_percent}%</div>` : ''}
                    <div class="meta-badge-item sold"><i class="fas fa-chart-line"></i> ขายแล้ว ${formatNumber(product.sales_count || 0)}</div>
                </div>
            </div>
            
            <div class="product-card-actions-v2">
                ${isPreSale
                ? `<div class="btn-presale-info">
                         <i class="fas fa-calendar-alt"></i> เปิดขาย: ${this.formatPresaleDate(product.start_sale || product.start_date)}
                       </div>`
                : `<button class="btn-buy-v2" onclick="openPurchaseModal(${productJson}, '${type}')" ${buyBtnDisabled ? 'disabled' : ''}>
                         ${buyBtnText}
                       </button>
                       ${showGiftBtn ? `<button class="btn-gift-v2" onclick="openGiftModal(${productJson}, '${type}')" title="ส่งของขวัญ" ${buyBtnDisabled ? 'disabled' : ''}>
                         <i class="fas fa-gift"></i>
                       </button>` : ''}`
            }
            </div>

            <div class="product-detail-link" onclick="openProductDetailModal(${productJson}, '${type}')">
                <i class="fas fa-info-circle"></i> รายละเอียดสินค้า
            </div>
        </div>`;
    },

    formatPresaleDate(dateStr) {
        if (!dateStr) return '';

        let date;
        if (typeof dateStr === 'string' && dateStr.indexOf('-') > 0) {
            const t = dateStr.split(/[- :]/);
            date = new Date(t[0], (t[1] || 1) - 1, t[2] || 1, t[3] || 0, t[4] || 0, t[5] || 0);
        } else {
            date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return dateStr;

        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = (date.getFullYear() + 543).toString().slice(-2);
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');

        return `${d}/${m}/${y} ${h}:${min} น.`;
    },

    updateCategoryCounts(products) {
        document.querySelectorAll('.category-count').forEach(el => el.textContent = '0');
        const countAll = document.getElementById('count-all');
        if (countAll) countAll.textContent = products.length;

        const counts = {};
        products.forEach(p => {
            if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        });

        for (const [id, count] of Object.entries(counts)) {
            const el = document.getElementById(`count-cat-${id}`);
            if (el) el.textContent = count;
        }
    },

    getSkeleton(count = 4) {
        return Array(count).fill(0).map(() => `
            <div class="product-card skeleton-card">
                <div class="skeleton-image"></div>
                <div class="product-info"><div class="skeleton-line title"></div><div class="skeleton-line subtitle"></div></div>
                <div class="product-actions skeleton-actions"><div class="skeleton-btn"></div><div class="skeleton-btn small"></div></div>
            </div>`).join('');
    },

    async filter(category, type) {
        this.currentType = type;
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        const serverOption = document.querySelector('#server-options-list .dropdown-option.active');
        const selectedServer = serverOption ? serverOption.dataset.value : 'all';
        const grid = document.getElementById('products-grid');
        grid.innerHTML = this.getSkeleton(8);

        try {
            let url = category === 'all'
                ? `${window.App.apiBase}/products.php?type=${type}`
                : `${window.App.apiBase}/products.php?type=${type}&category=${category}`;
            url += `&server=${selectedServer}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.products.length > 0) {
                this.renderGrid(grid, data.products, type);
            } else {
                grid.innerHTML = `<div class="no-products"><i class="fas fa-box-open fa-3x"></i><p>ไม่พบสินค้าในหมวดหมู่นี้</p></div>`;
            }
        } catch (error) { console.error(error); }
    },

    search(query, type) {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        const cacheKey = `${type}_${this.currentServer}`;
        const cached = this.getCache(cacheKey);

        if (!cached) return;

        const searchLower = query.toLowerCase().trim();
        if (!searchLower) {
            this.renderGrid(grid, cached, type);
            return;
        }

        const filtered = cached.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            (p.description && p.description.toLowerCase().includes(searchLower))
        );

        if (filtered.length > 0) {
            this.renderGrid(grid, filtered, type);
        } else {
            grid.innerHTML = `<div class="no-products"><i class="fas fa-search fa-3x"></i><p>ไม่พบสินค้าที่ค้นหา "${query}"</p></div>`;
        }
    }
};

window.loadProducts = (t, f, s) => window.ProductManager.loadProducts(t, f, s);
window.filterProducts = (c, t) => window.ProductManager.filter(c, t);

window.openProductDetailModal = (product, type) => {
    const modal = document.querySelector('#detail-modal .detail-modal-v2');

    modal.classList.remove('theme-point', 'theme-rp');
    modal.classList.add(type === 'rp' ? 'theme-rp' : 'theme-point');

    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-content').innerHTML = (product.description || 'ไม่มีรายละเอียด').replace(/\n/g, '<br>');

    const img = document.getElementById('detail-img');
    if (img) img.src = window.ProductManager.getProductImageUrl(product.image);

    const stock = parseInt(product.stock);
    document.getElementById('detail-stock').textContent = (isNaN(stock) || stock === -1) ? 'ไม่จำกัด' : stock.toLocaleString() + ' ชิ้น';

    const catEl = document.getElementById('detail-category');
    if (catEl) catEl.innerHTML = '<i class="fas fa-tag"></i> ' + (product.category_name || 'ทั่วไป');

    const serverEl = document.getElementById('detail-server');
    if (serverEl) serverEl.innerHTML = '<i class="fas fa-server"></i> ' + (product.server_name || 'ทุกเซิร์ฟเวอร์');

    const limitParams = parseInt(product.purchase_limit);
    const limitEl = document.getElementById('detail-limit');
    if (limitParams > 0) {
        limitEl.textContent = `${limitParams.toLocaleString()} ชิ้น / บัญชี`;
    } else {
        limitEl.textContent = 'ไม่จำกัด';
    }

    const discountBox = document.getElementById('detail-discount-box');
    if (parseInt(product.discount_percent) > 0) {
        discountBox.style.display = 'flex';
        const dEnd = product.discount_end ? `<div style="font-size:0.75em; color:#94a3b8; margin-top:2px;">สิ้นสุด: ${formatDate(product.discount_end)}</div>` : '';
        document.getElementById('detail-discount-info').innerHTML = `
            <div>ลด ${product.discount_percent}%</div>
            ${dEnd}
        `;
    } else {
        discountBox.style.display = 'none';
    }

    const endBox = document.getElementById('detail-end-box');
    const endDate = product.end_sale || product.end_date;

    if (endDate) {
        endBox.style.display = 'flex';
        document.getElementById('detail-end-val').textContent = formatDate(endDate);
    } else {
        endBox.style.display = 'none';
    }

    const btnClose = document.getElementById('detail-btn-close');
    if (btnClose) {
        btnClose.onclick = () => {
            closeModal('detail-modal');
        };
    }

    window.openModal('detail-modal');
};

window.openPurchaseModal = (product, type) => {
    if (!window.App.user) {
        window.openModal('login-modal');
        Toast.warning('กรุณาเข้าสู่ระบบ', 'คุณต้องเข้าสู่ระบบก่อนซื้อสินค้า');
        return;
    }
    window.ProductManager.currentProduct = product;

    const modalContainer = document.querySelector('#confirm-modal .purchase-modal-v2');
    const btn = document.getElementById('btn-confirm-buy');

    modalContainer.classList.remove('theme-point', 'theme-rp');
    modalContainer.classList.add(type === 'rp' ? 'theme-rp' : 'theme-point');

    const headerBg = modalContainer.querySelector('.pm-header-bg');
    const glow = modalContainer.querySelector('.pm-product-glow');
    if (headerBg) headerBg.style.background = '';
    if (glow) glow.style.background = '';
    btn.style.background = '';
    btn.style.boxShadow = '';

    document.getElementById('confirm-name').textContent = product.name;
    document.getElementById('confirm-img').src = window.ProductManager.getProductImageUrl(product.image);
    document.getElementById('confirm-price').textContent = formatNumber(product.finalPrice || product.price);

    const unitEl = document.querySelector('#confirm-modal .pm-price-unit');
    if (unitEl) unitEl.textContent = type === 'point' ? 'Points' : 'RP';

    const balanceContainer = document.getElementById('confirm-balance-container');
    const balanceAmountEl = document.getElementById('confirm-balance-amount');
    const balanceUnitEl = document.getElementById('confirm-balance-unit');
    const balanceIcon = document.getElementById('balance-icon');

    const initialUserBalance = type === 'point' ? (window.App.user.point || 0) : (window.App.user.rp || 0);
    if (balanceAmountEl) balanceAmountEl.textContent = formatNumber(initialUserBalance);
    if (balanceUnitEl) balanceUnitEl.textContent = type === 'point' ? 'Points' : 'RP';

    const userBalance = type === 'point' ? (window.App.user.point || 0) : (window.App.user.rp || 0);
    const unitPrice = Number(product.finalPrice || product.price);

    const allowMultiBuy = (product.allow_multi_buy === 1 || product.allow_multi_buy === '1' || product.allow_multi_buy === true);
    const qtyControl = document.querySelector('#confirm-modal .pm-quantity-control');

    if (qtyControl) {
        qtyControl.style.display = allowMultiBuy ? 'flex' : 'none';
    }

    window.ProductManager.currentQuantity = 1;
    const qtyInput = document.getElementById('qty-input');
    if (qtyInput) {
        qtyInput.value = 1;
        const stock = parseInt(product.stock);
        if (!isNaN(stock) && stock > 0) {
            qtyInput.max = stock;
        } else {
            qtyInput.removeAttribute('max');
        }
    }

    window.ProductManager.currentContext = { unitPrice, userBalance, type, modalContainer, btn, balanceContainer, balanceIcon, allowMultiBuy };
    window.ProductManager.recalcTotal();

    window.openModal('confirm-modal');
};

window.adjustQuantity = (change) => {
    const pm = window.ProductManager;
    const qtyInput = document.getElementById('qty-input');
    if (!qtyInput) return;

    let newQty = parseInt(qtyInput.value) + change;
    if (isNaN(newQty) || newQty < 1) newQty = 1;

    if (pm.currentProduct && pm.currentProduct.stock > 0) {
        if (newQty > pm.currentProduct.stock) newQty = pm.currentProduct.stock;
    }

    pm.currentQuantity = newQty;
    qtyInput.value = newQty;
    pm.recalcTotal();
};

window.onQuantityInputChange = (input) => {
    const pm = window.ProductManager;
    let val = parseInt(input.value);

    if (isNaN(val) || val < 1) {
        pm.currentQuantity = 1;
    } else {
        if (pm.currentProduct && pm.currentProduct.stock > 0) {
            if (val > pm.currentProduct.stock) {
                val = pm.currentProduct.stock;
                input.value = val;
            }
        }
        pm.currentQuantity = val;
    }
    pm.recalcTotal();
};

window.onQuantityInputBlur = (input) => {
    let val = parseInt(input.value);
    if (isNaN(val) || val < 1) {
        input.value = 1;
        window.ProductManager.currentQuantity = 1;
        window.ProductManager.recalcTotal();
    }
};

window.ProductManager.recalcTotal = function () {
    const ctx = this.currentContext;
    if (!ctx) return;

    const totalPrice = ctx.unitPrice * this.currentQuantity;
    document.getElementById('confirm-price').textContent = formatNumber(totalPrice);

    if (ctx.userBalance < totalPrice) {
        ctx.balanceContainer.className = 'pm-stacked-balance status-red';
        ctx.balanceIcon.className = 'fas fa-times-circle';

        ctx.btn.disabled = true;
        ctx.btn.innerHTML = '<i class="fas fa-times-circle"></i> ยอดเงินไม่พอ';
        ctx.modalContainer.classList.add('insufficient-funds');
    } else {
        ctx.balanceContainer.className = 'pm-stacked-balance status-green';
        ctx.balanceIcon.className = 'fas fa-check-circle';

        ctx.btn.disabled = false;
        ctx.btn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการสั่งซื้อ';
        ctx.btn.onclick = () => confirmPurchase(ProductManager.currentProduct.id, ctx.type, this.currentQuantity);
        ctx.modalContainer.classList.remove('insufficient-funds');
    }
};

window.openGiftModal = (product, type) => {
    if (!window.App.user) {
        window.openModal('login-modal');
        return;
    }
    window.ProductManager.currentProduct = product;

    const modalContainer = document.querySelector('#gift-modal .purchase-modal-v2');
    modalContainer.classList.remove('theme-point', 'theme-rp');
    modalContainer.classList.add(type === 'rp' ? 'theme-rp' : 'theme-point');

    document.getElementById('gift-name').textContent = product.name;
    document.getElementById('gift-img').src = window.ProductManager.getProductImageUrl(product.image);

    const allowMultiBuy = (product.allow_multi_buy === 1 || product.allow_multi_buy === '1' || product.allow_multi_buy === true);
    const giftQtyControl = document.getElementById('gift-qty-control');
    if (giftQtyControl) {
        giftQtyControl.style.display = allowMultiBuy ? 'flex' : 'none';
    }

    const giftQtyInput = document.getElementById('gift-qty-input');
    if (giftQtyInput) {
        giftQtyInput.value = 1;
        const stock = parseInt(product.stock);
        if (!isNaN(stock) && stock > 0) {
            giftQtyInput.max = stock;
        } else {
            giftQtyInput.removeAttribute('max');
        }
    }

    const btn = document.getElementById('btn-confirm-gift');
    btn.onclick = () => confirmGift(product.id, type);
    window.openModal('gift-modal');
};

window.adjustGiftQuantity = (change) => {
    const pm = window.ProductManager;
    const qtyInput = document.getElementById('gift-qty-input');
    if (!qtyInput) return;

    let newQty = parseInt(qtyInput.value) + change;
    if (isNaN(newQty) || newQty < 1) newQty = 1;

    if (pm.currentProduct && pm.currentProduct.stock > 0) {
        if (newQty > pm.currentProduct.stock) newQty = pm.currentProduct.stock;
    }

    qtyInput.value = newQty;
};

window.onGiftQuantityInputChange = (input) => {
    const pm = window.ProductManager;
    let val = parseInt(input.value);

    if (!isNaN(val) && val >= 1) {
        if (pm.currentProduct && pm.currentProduct.stock > 0) {
            if (val > pm.currentProduct.stock) {
                val = pm.currentProduct.stock;
                input.value = val;
            }
        }
    }
};

window.onGiftQuantityInputBlur = (input) => {
    let val = parseInt(input.value);
    if (isNaN(val) || val < 1) {
        input.value = 1;
    }
};

window.confirmPurchase = async (id, type, quantity = 1) => {
    const btn = document.getElementById('btn-confirm-buy');
    btn.disabled = true;
    try {
        const res = await fetch(`${window.App.apiBase}/purchase.php`, {
            method: 'POST', body: JSON.stringify({ product_id: id, type, quantity })
        });
        const data = await res.json();
        if (data.success) {
            window.closeModal('confirm-modal');
            Toast.success('สำเร็จ', 'ดำเนินการเรียบร้อย');
            if (window.updateUserBalance && data.balance) window.updateUserBalance(data.balance);
            window.ProductManager.loadProducts(type, true);
        } else {
            Toast.error('ล้มเหลว', data.message);
        }
    } catch (e) { Toast.error('Error', 'Connection failed'); }
    btn.disabled = false;
};

window.confirmGift = async (id, type) => {
    const user = document.getElementById('gift-username').value;
    const qtyInput = document.getElementById('gift-qty-input');
    const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

    if (!user) return Toast.warning('ระบุชื่อ', 'กรุณาระบุชื่อผู้รับ');

    const btn = document.getElementById('btn-confirm-gift');
    btn.disabled = true;

    try {
        const res = await fetch(`${window.App.apiBase}/purchase.php`, {
            method: 'POST', body: JSON.stringify({ action: 'gift', product_id: id, type, receiver_username: user, quantity })
        });
        const data = await res.json();
        if (data.success) {
            window.closeModal('gift-modal');
            Toast.success('สำเร็จ', 'ส่งของขวัญเรียบร้อย');
            if (window.updateUserBalance && data.balance) window.updateUserBalance(data.balance);
        } else {
            Toast.error('ล้มเคลว', data.message);
        }
    } catch (e) {
        Toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
    btn.disabled = false;
};
