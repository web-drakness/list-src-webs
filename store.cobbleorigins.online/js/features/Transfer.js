
window.Transfer = {
    async handle(e) {
        e.preventDefault();
        const recipient = document.getElementById('transfer-recipient').value;
        const amount = document.getElementById('transfer-amount').value;

        if (!amount || amount <= 0) {
            Toast.error('ข้อผิดพลาด', 'จำนวนพอยต์ไม่ถูกต้อง');
            return;
        }

        if (!recipient) {
            Toast.error('ข้อผิดพลาด', 'กรุณาระบุชื่อผู้รับ');
            return;
        }

        try {
            const apiBase = window.App?.apiBase || '/backend/api';
            const response = await fetch(`${apiBase}/transfer.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_username: recipient, amount: amount })
            });

            const data = await response.json();

            if (data.success) {
                closeModal('transfer-modal');
                document.getElementById('transfer-form').reset();
                Toast.success('สำเร็จ', data.message);

                if (data.balance !== undefined) {
                    if (window.updateUserBalance) window.updateUserBalance({ point: data.balance });
                } else {
                    if (window.Auth) window.Auth.check();
                }
            } else {
                Toast.error('ล้มเหลว', data.message || 'การโอนพอยต์ไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Transfer Error:', error);
            Toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    }
};

window.handleTransfer = (e) => window.Transfer.handle(e);
