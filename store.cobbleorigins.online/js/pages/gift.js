

window.GiftPage = {
    interval: null,

    init: function () {
        
        if (!sessionStorage.getItem('user') && (!window.App || !window.App.user)) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้องเข้าสู่ระบบเพื่อใช้งานกล่องของขวัญ',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#3085d6',
                allowOutsideClick: false
            }).then(() => {
                if (window.navigate) window.navigate('home');
                else window.location.href = '/';

                setTimeout(() => {
                    if (window.openModal) window.openModal('login-modal');
                }, 500);
            });
            return;
        }

        this.cacheElements();
        this.loadGifts();
    },

    cacheElements: function () {
        this.grid = document.getElementById('gift-grid');
        this.loading = document.getElementById('gift-loading');
        this.empty = document.getElementById('gift-empty');
        this.countTotal = document.getElementById('gift-count-total');
        this.countExpiring = document.getElementById('gift-count-expiring');
    },

    formatTimeRemaining: function (expireTimestamp) {
        const now = new Date().getTime();
        const distance = expireTimestamp - now;

        if (distance < 0) return "หมดอายุ";

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days} วัน ${hours} ชม.`;
        return `${hours} ชม. ${minutes} น.`;
    },

    loadGifts: async function () {
        if (!this.loading) this.cacheElements();
        if (!this.loading) return; 

        try {
            const response = await fetch('/backend/api/gift.php?action=list');
            const data = await response.json();

            this.loading.style.display = 'none';

            if (data.status === 'success' && data.gifts && data.gifts.length > 0) {
                this.renderGifts(data.gifts);
            } else if (data.status === 'error' && data.message === 'กรุณาเข้าสู่ระบบ') {
                if (this.empty) {
                    this.empty.innerHTML = `<h4 class="text-white">กรุณาเข้าสู่ระบบ</h4>`;
                    this.empty.style.display = 'block';
                }
                if (this.grid) this.grid.style.display = 'none';
            } else {
                if (this.grid) this.grid.style.display = 'none';
                if (this.empty) this.empty.style.display = 'block';
                this.updateStats([]);
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการโหลดของขวัญ:', error);
            if (this.loading) this.loading.style.display = 'none';
            if (this.empty) this.empty.style.display = 'block';
        }
    },

    updateStats: function (gifts) {
        if (this.countTotal) this.countTotal.textContent = gifts.length;
        if (this.countExpiring) {
            const now = new Date().getTime();
            const oneDay = 24 * 60 * 60 * 1000;
            const expiring = gifts.filter(g => (g.expire_timestamp - now) < oneDay).length;
            this.countExpiring.textContent = expiring;
        }
    },

    renderGifts: function (gifts) {
        this.updateStats(gifts);

        let html = '';
        gifts.forEach((gift, index) => {
            const senderName = gift.sender_display || 'ไม่ระบุ';
            const delay = index * 0.05;
            
            const escapedName = gift.item_name.replace(/'/g, "\\'");

            html += `
            <div class="product-card animate__animated animate__fadeInUp" style="animation-delay: ${delay}s">
                <!-- ป้ายทับซ้อน -->
                <div class="product-top-overlay">
                    <div class="product-info-pill gift-sender-pill">
                        <span class="new-price"><i class="fas fa-paper-plane mr-1"></i> ${senderName}</span>
                    </div>
                </div>
                
                <!-- รูปภาพ -->
                <div class="product-image-container">
                    <img src="${gift.item_image || '/assets/img/default-product.webp'}" alt="Item" class="product-img" loading="lazy">
                </div>
                
                <!-- ข้อมูล -->
                <div class="product-content-v2">
                    <h3 class="product-title-v2" title="${gift.item_name}">${gift.item_name}</h3>

                    <div class="product-meta-badges">
                        <!-- ป้ายเซิร์ฟเวอร์ -->
                        <div class="stock-badge-pill gift-server-badge">
                            <i class="fas fa-server mr-1"></i> ${gift.server_name || 'Global'}
                        </div>
                    </div>
                    
                    <div class="product-footer mt-auto">
                        <!-- ปุ่มดำเนินการ -->
                        <div class="product-card-actions-v2">
                            <button class="btn-buy-v2 btn-pink-custom" onclick="GiftPage.claimGift(${gift.id}, '${escapedName}')">
                                <i class="fas fa-check mr-1"></i> รับ
                            </button>
                            <button class="btn-gift-v2 btn-delete-custom" onclick="GiftPage.rejectGift(${gift.id})" title="ลบ">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <!-- หมดอายุ -->
                        <div class="gift-expire-text">
                            <i class="fas fa-clock mr-1"></i> หมดอายุ: <span class="gift-countdown" data-expire="${gift.expire_timestamp}">...</span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });

        if (this.grid) {
            this.grid.innerHTML = html;
            this.grid.style.display = 'grid';
        }
        if (this.empty) this.empty.style.display = 'none';

        this.startCountdown();
    },

    startCountdown: function () {
        if (this.interval) clearInterval(this.interval);

        const updateTimers = () => {
            if (!document.getElementById('gift-grid')) {
                clearInterval(this.interval);
                return;
            }
            const counters = document.querySelectorAll('.gift-countdown');
            if (counters.length === 0) return;

            counters.forEach(el => {
                const expire = parseInt(el.dataset.expire);
                const text = this.formatTimeRemaining(expire);
                el.textContent = text;
                if (text === 'หมดอายุ') el.closest('.product-card').style.opacity = '0.5';
            });
        };

        updateTimers();
        this.interval = setInterval(updateTimers, 60000);
    },

    claimGift: async function (id, name) {
        showFrontendConfirm(
            'ยืนยันรับของขวัญ',
            `คุณต้องการรับไอเทม "${name}" เข้าตัวละครใช่หรือไม่?`,
            async () => {
                try {
                    const response = await fetch('/backend/api/gift.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'claim', gift_id: id })
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        Toast.success('สำเร็จ', data.message);
                        this.loadGifts();
                    } else {
                        Toast.error('ผิดพลาด', data.message);
                    }
                } catch (error) { Toast.error('ผิดพลาด', 'เชื่อมต่อล้มเหลว'); }
            }
        );
    },

    rejectGift: async function (id) {
        showFrontendConfirm(
            'ยืนยันการลบ',
            'ต้องการลบของขวัญชิ้นนี้ใช่หรือไม่?',
            async () => {
                try {
                    const response = await fetch('/backend/api/gift.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reject', gift_id: id })
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        Toast.success('สำเร็จ', data.message);
                        this.loadGifts();
                    } else {
                        Toast.error('ผิดพลาด', data.message);
                    }
                } catch (error) { Toast.error('ผิดพลาด', 'เชื่อมต่อล้มเหลว'); }
            },
            'delete'
        );
    }
};
