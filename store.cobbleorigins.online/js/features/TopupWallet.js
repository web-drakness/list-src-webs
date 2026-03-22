
window.TopupWallet = {
    init() {
        this.fetchRates();
    },

    async fetchRates() {
        try {
            const res = await fetch('/backend/api/topup/tw_config.php');
            const data = await res.json();
            if (data.success) {
                const elPoint = document.getElementById('tw-rate-point');
                const elRp = document.getElementById('tw-rate-rp');
                if (elPoint) elPoint.innerText = data.rate_point || '1.0';
                if (elRp) elRp.innerText = data.rate_rp || '1.0';

                
                const promoBanner = document.getElementById('tw-promo-banner');
                const promoName = document.getElementById('tw-promo-name');
                const promoPeriod = document.getElementById('tw-promo-period');

                if (promoBanner) {
                    if (data.promotion && data.promotion.name) {
                        if (promoName) promoName.innerText = data.promotion.name;
                        if (promoPeriod) promoPeriod.innerText = 'ระยะเวลา: ' + (data.promotion.period || '-');
                        promoBanner.style.display = 'flex';
                    } else {
                        promoBanner.style.display = 'none';
                    }
                }
            }
        } catch (e) { }
    },

    async submit() {
        const linkInput = document.getElementById('tw-voucher-link');
        const btn = document.getElementById('btn-submit-voucher');
        const link = linkInput.value.trim();

        if (!link) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกลิงก์ซองของขวัญ' });
            return;
        }

        if (!link.includes('gift.truemoney.com')) {
            Swal.fire({ icon: 'error', title: 'ลิงก์ไม่ถูกต้อง', text: 'กรุณาใช้ลิงก์ซองของขวัญจากแอป TrueMoney Wallet เท่านั้น' });
            return;
        }

        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบ...';

        try {
            const response = await fetch('/backend/api/topup/truewallet.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voucher_link: link })
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: data.message,
                    confirmButtonColor: '#F97316'
                });
                linkInput.value = '';

                if (data.updated_balance && typeof window.updateUserBalance === 'function') {
                    window.updateUserBalance(data.updated_balance);
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สำเร็จ',
                    text: data.message,
                    confirmButtonColor: '#d33'
                });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'การเชื่อมต่อล้มเหลว' });
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.fetchTopupRates = () => window.TopupWallet.fetchRates();
window.submitVoucher = () => window.TopupWallet.submit();

if (document.getElementById('tw-voucher-link')) {
    window.TopupWallet.init();
}
