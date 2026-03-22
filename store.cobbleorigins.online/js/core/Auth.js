

window.Auth = {
    init() {
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const usernameInput = document.getElementById('login-username');
                const passwordInput = document.getElementById('login-password');
                const username = usernameInput.value.trim();
                const password = passwordInput.value.trim();

                
                usernameInput.classList.remove('error');
                passwordInput.classList.remove('error');

                let hasError = false;
                if (!username) {
                    usernameInput.classList.add('error');
                    hasError = true;
                }
                if (!password) {
                    passwordInput.classList.add('error');
                    hasError = true;
                }

                if (hasError) {
                    Toast.error('ข้อผิดพลาด', 'กรุณาระบุข้อมูลให้ครบถ้วน');
                    return;
                }

                await this.login(username, password);
            });
        }
    },

    async check() {
        
        const cachedUser = sessionStorage.getItem('user');
        if (cachedUser) {
            window.App.user = JSON.parse(cachedUser);
            this.updateUI();
        }

        
        try {
            const response = await fetch(`${window.App.apiBase}/auth.php?action=check`);
            const data = await response.json();

            if (data.success && data.user) {
                const oldData = JSON.stringify(window.App.user);
                const newData = JSON.stringify(data.user);

                if (oldData !== newData) {
                    window.App.user = data.user;
                    sessionStorage.setItem('user', newData);
                    this.updateUI();
                }
            } else if (!data.success && window.App.user) {
                this.logout();
            }
        } catch (error) {
            
        }
    },

    async login(username, password) {
        try {
            const response = await fetch(`${window.App.apiBase}/auth.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', username, password })
            });
            const data = await response.json();
            if (data.success) {
                window.App.user = data.user;
                sessionStorage.setItem('user', JSON.stringify(data.user));
                this.updateUI();
                if (window.Modal) window.Modal.clearLoginForm();
                window.closeModal('login-modal');
                Toast.success('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${data.user.username}!`);
            } else { Toast.error('เข้าสู่ระบบไม่สำเร็จ', data.message); }
        } catch (error) { Toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าสู่ระบบได้'); }
    },

    async logout() {
        try {
            
            window.App.user = null;
            sessionStorage.removeItem('user');
            this.updateUI();
            if (window.Modal) window.Modal.clearLoginForm();
            Toast.success('ออกจากระบบสำเร็จ', 'แล้วพบกันใหม่!');

            
            await fetch(`${window.App.apiBase}/auth.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' })
            });
        } catch (error) { console.error('Logout error:', error); }
    },

    updateUI() {
        const guestActions = document.getElementById('guest-actions');
        const userActions = document.getElementById('user-actions');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (window.App.user) {
            guestActions?.classList.add('hidden');
            userActions?.classList.remove('hidden');

            if (userName) userName.textContent = window.App.user.username;
            if (userAvatar) userAvatar.src = getAvatarUrl(window.App.user.username, 32);

            
            const statusDot = document.getElementById('user-status-dot');
            if (statusDot) {
                const isCheckEnabled = window.App.user.online_check_enabled;
                const isLogged = window.App.user.is_logged === 1;

                statusDot.classList.toggle('hidden', !isCheckEnabled);
                statusDot.style.backgroundColor = isLogged ? '#10b981' : '#6b7280'; 
            }

            if (window.updateUserBalance) {
                window.updateUserBalance({
                    point: window.App.user.points || window.App.user.point,
                    rp: window.App.user.rp
                });
            }

            
            const adminMenu = document.getElementById('admin-menu-item');
            if (adminMenu) {
                const role = (window.App.user.role || '').toLowerCase();
                const allowedRoles = ['owner', 'admin', 'staff'];
                adminMenu.classList.toggle('hidden', !allowedRoles.includes(role));
            }
        } else {
            guestActions?.classList.remove('hidden');
            userActions?.classList.add('hidden');
        }

        
        if (window.Refund && window.Refund.checkVisibility) {
            window.Refund.checkVisibility();
        }
    }
};

window.checkAuth = () => window.Auth.check();
window.login = (u, p) => window.Auth.login(u, p);
window.logout = () => window.Auth.logout();
window.updateUserUI = () => window.Auth.updateUI();
