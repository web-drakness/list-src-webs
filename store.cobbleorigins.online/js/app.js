

window.App = {
    user: null,
    apiBase: '/backend/api',
    currentPage: 'home'
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    
    if (window.Toast) window.Toast.init();
    if (window.Navbar) window.Navbar.init();
    if (window.Modal) window.Modal.init();
    if (window.Router) window.Router.init();
    if (window.Auth) window.Auth.init();
    if (window.ServerSelector) window.ServerSelector.init();

    
    if (window.Auth) window.Auth.check();
}

(function () {
    
    console.log(
        "%c Developed and Powered by Verity ",
        "background: #f97316; color: #fff; border-radius: 5px; padding: 10px; font-weight: bold; font-size: 1.2rem; text-shadow: 0 1px 0 rgba(0,0,0,0.3);"
    );

    
    document.addEventListener('contextmenu', e => e.preventDefault());

    
    document.addEventListener('keydown', e => {
        
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        
        
        
        
        if (e.ctrlKey && (e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) || e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }

        
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });
})();

