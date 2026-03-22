

document.addEventListener('DOMContentLoaded', () => {
    
    const isMobileOrTablet = window.innerWidth <= 1024;

    if (!isMobileOrTablet) return; 

    
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    if (navbarToggler && navbarCollapse) {
        
        navbarToggler.addEventListener('click', (e) => {
            e.stopPropagation(); 
            navbarCollapse.classList.toggle('show');

            
        });

        
        document.addEventListener('click', (e) => {
            if (!navbarCollapse.contains(e.target) && !navbarToggler.contains(e.target) && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        });

        
        navbarCollapse.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navbarCollapse.classList.remove('show');
            });
        });
    }

    
    
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            row.querySelectorAll('td').forEach((td, index) => {
                if (headers[index]) {
                    td.setAttribute('data-label', headers[index]);
                }
            });
        });
    });

    
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        
        img.setAttribute('loading', 'lazy');
    });

    
    
    if (window.pJSDom && window.pJSDom.length > 0) {
        
        const particleCanvas = document.querySelector('.particles-js-canvas-el');
        if (particleCanvas) {
            particleCanvas.style.display = 'none'; 
        }
    }

    
    
    document.querySelectorAll('input[name="phone"], input[name="amount"]').forEach(input => {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
    });

    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80, 
                    behavior: 'smooth'
                });
            }
        });
    });

});
