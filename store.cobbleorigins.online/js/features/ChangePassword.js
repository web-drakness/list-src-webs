
window.ChangePassword = {
    async handle(e) {
        e.preventDefault();

        const currentPass = document.getElementById('cp-current').value.trim();
        const newPass = document.getElementById('cp-new').value.trim();
        const confirmPass = document.getElementById('cp-confirm').value.trim();

        if (!currentPass || !newPass || !confirmPass) {
            Toast.error('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        if (newPass !== confirmPass) {
            Toast.error('ข้อผิดพลาด', 'รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }

        if (newPass.length < 6) {
            Toast.error('ข้อผิดพลาด', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }

        try {
            const res = await fetch('/backend/api/auth.php?action=change_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPass,
                    new_password: newPass
                })
            });

            const data = await res.json();

            if (data.success) {
                closeModal('ChangePasswordModal');
                document.getElementById('changepass-form').reset();
                Toast.success('สำเร็จ', data.message);
            } else {
                Toast.error('ข้อผิดพลาด', data.message);
            }
        } catch (error) {
            console.error(error);
            Toast.error('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
    },

    validateInput(input) {
        
        
        input.value = input.value.replace(/[^\x21-\x7E]/g, '');
    }
};

window.handleChangePassword = (e) => window.ChangePassword.handle(e);
