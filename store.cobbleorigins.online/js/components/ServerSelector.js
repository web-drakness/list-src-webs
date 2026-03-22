window.ServerSelector = {
    async init() {
        const dropdown = document.getElementById('server-dropdown');
        const header = dropdown ? dropdown.querySelector('.dropdown-header') : null;
        const optionsList = document.getElementById('server-options-list');
        const selectedText = document.getElementById('selected-server-text');
        const card = document.querySelector('.server-selector-card');

        if (!dropdown || !header || !optionsList) return;

        header.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        };

        document.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });

        try {
            const response = await fetch(`${window.App.apiBase}/servers.php`);
            const data = await response.json();

            if (data.success && data.servers && data.servers.length > 0) {
                if (data.servers.length <= 1) {
                    if (card) card.style.display = 'none';
                } else {
                    if (card) card.style.display = 'block';
                }

                optionsList.innerHTML = '';

                data.servers.forEach((server, index) => {
                    const opt = document.createElement('div');
                    opt.className = 'dropdown-option';
                    const isActive = index === 0;

                    if (isActive) {
                        opt.classList.add('active');
                    }

                    opt.dataset.value = server.id;
                    opt.innerHTML = `<i class="fas fa-server"></i> ${server.name}`;
                    optionsList.appendChild(opt);

                    if (isActive) {
                        if (selectedText) selectedText.textContent = server.name;
                        const promoName = document.getElementById('promo-server-name');
                        if (promoName) promoName.textContent = server.name;
                        this.triggerLoad(server.id);
                    }
                });

                this.attachHandlers(optionsList, dropdown, selectedText);
            }
        } catch (error) {
            console.error('Server Selector Error:', error);
        }
    },

    attachHandlers(list, dropdown, textEl) {
        const options = list.querySelectorAll('.dropdown-option');
        options.forEach(opt => {
            opt.onclick = () => {
                options.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                if (textEl) textEl.textContent = opt.textContent.trim();

                const promoName = document.getElementById('promo-server-name');
                if (promoName) promoName.textContent = opt.textContent.trim();

                dropdown.classList.remove('active');
                this.triggerLoad(opt.dataset.value);
            };
        });
    },

    triggerLoad(serverId) {
        const activeTab = document.querySelector('.shop-type-list .category-item.active');
        const activeType = activeTab ? activeTab.dataset.type : 'point';

        if (window.ProductManager) {
            window.ProductManager.loadProducts(activeType, true, serverId);
        }
        if (typeof window.loadShopCategories === 'function') {
            window.loadShopCategories(activeType, serverId);
        }
    }
};

window.initServerSelector = () => window.ServerSelector.init();
