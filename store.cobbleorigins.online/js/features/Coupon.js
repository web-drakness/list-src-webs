
window.Coupon = {
    format(input) {
        let value = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        let formatted = '';

        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 5 === 0) {
                formatted += '-';
            }
            formatted += value[i];
        }

        input.value = formatted.substring(0, 17);
    },

    async handle(e) {
        e.preventDefault();
        const codeInput = document.getElementById('coupon-code');
        const code = codeInput.value.trim();

        if (!code) {
            Toast.error('ข้อผิดพลาด', 'กรุณาระบุรหัสคูปองที่ต้องการใช้งาน');
            return;
        }

        if (code.length < 5) {
            Toast.error('ข้อผิดพลาด', 'รหัสคูปองไม่ถูกต้อง (สั้นเกินไป)');
            return;
        }

        const btn = document.querySelector('#coupon-form button[type="submit"]');
        const originalBtnText = btn ? btn.innerHTML : 'ใช้งานคูปอง';

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
        }

        try {
            const response = await fetch('/backend/api/redeem.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            let data;
            try {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Raw Response:', text); 
                    throw new Error('Invalid JSON: ' + text.substring(0, 100));
                }
            } catch (e) { throw e; }

            if (data.success) {
                closeModal('coupon-modal');
                document.getElementById('coupon-form').reset();
                Toast.success('สำเร็จ', data.message);

                
                if (data.updated_balance && typeof window.updateUserBalance === 'function') {
                    window.updateUserBalance(data.updated_balance);
                }

            } else {
                Toast.error('ไม่สำเร็จ', data.message);
            }

        } catch (err) {
            console.error('Coupon Error:', err);
            Toast.error('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับระบบได้');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalBtnText;
            }
        }
    }
};

window.formatCoupon = (i) => window.Coupon.format(i);
window.handleCoupon = (e) => window.Coupon.handle(e);
