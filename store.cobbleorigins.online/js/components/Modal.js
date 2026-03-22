

window.Modal = {
    init() {
        
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.close(overlay.id);
            });
        });

        
        window.openModal = (id) => this.open(id);
        window.closeModal = (id) => this.close(id);

        
        
    },

    open(id) {
        
        if (id === 'transfer-modal' && window.SiteConfig && window.SiteConfig.pointTransferSystem === false) {
            if (typeof Toast !== 'undefined') Toast.error('ระบบปิดปรับปรุง', 'ระบบโอนพอยต์ถูกปิดการใช้งานชั่วคราว');
            return;
        }

        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
        } else {
            console.warn(`Modal with ID '${id}' not found.`);
        }
    },

    close(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');

            
            if (id === 'login-modal') {
                this.clearLoginForm();
            }
        }
    },

    clearLoginForm() {
        const usernameField = document.getElementById('login-username');
        const passwordField = document.getElementById('login-password');
        const toggleIcon = document.getElementById('password-toggle-icon'); 

        if (usernameField) usernameField.value = '';
        if (passwordField) {
            passwordField.value = '';
            passwordField.type = 'password';
        }
        
        
        const icons = document.querySelectorAll('#login-form .fa-eye-slash');
        icons.forEach(icon => {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    
    
});
