
window.FrontendConfirm = {
    callback: null,

    show(title, message, callback, type = 'confirm') {
        const modal = document.getElementById('frontend-confirm-modal');
        if (!modal) return;

        const titleEl = document.getElementById('fe-confirm-title');
        const msgEl = document.getElementById('fe-confirm-message');
        const iconContainer = modal.querySelector('.modal-content div:first-child');
        const icon = iconContainer.querySelector('i');
        const btn = document.getElementById('fe-confirm-btn-action');

        titleEl.textContent = title;
        msgEl.textContent = message;
        this.callback = callback;

        
        if (btn) {
            btn.onclick = () => {
                if (this.callback) this.callback();
                this.close();
            };
        }

        if (type === 'delete') {
            icon.className = 'fas fa-trash-alt';
            icon.style.color = '#ef4444';
            iconContainer.style.background = 'rgba(239, 68, 68, 0.1)';
            iconContainer.style.animation = 'pulse-red 2s infinite';
            btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            btn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
            btn.textContent = 'ลบทิ้ง';
        } else {
            icon.className = 'fas fa-gift';
            icon.style.color = '#3b82f6';
            iconContainer.style.background = 'rgba(59, 130, 246, 0.1)';
            iconContainer.style.animation = 'pulse-blue 2s infinite';
            btn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
            btn.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
            btn.textContent = 'ยืนยัน';
        }

        modal.style.display = 'flex';
        
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    },

    close() {
        const modal = document.getElementById('frontend-confirm-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); 
        }
        this.callback = null;
        
        const btn = document.getElementById('fe-confirm-btn-action');
        if (btn) btn.onclick = null;
    }
};

window.showFrontendConfirm = (t, m, c, ty) => window.FrontendConfirm.show(t, m, c, ty);
window.closeFrontendConfirm = () => window.FrontendConfirm.close();

