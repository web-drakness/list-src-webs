

window.formatNumber = function (num) {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('th-TH').format(num);
};

window.updateUserBalance = function (balance) {
    const pointEl = document.getElementById('user-points');
    const rpEl = document.getElementById('user-rp');

    if (pointEl && balance.point !== undefined) {
        pointEl.textContent = formatNumber(balance.point);
    } else if (pointEl && balance.points !== undefined) {
        pointEl.textContent = formatNumber(balance.points);
    }

    if (rpEl && balance.rp !== undefined) {
        rpEl.textContent = formatNumber(balance.rp);
    }

    
    if (window.App && window.App.user) {
        if (balance.point !== undefined) window.App.user.point = balance.point;
        if (balance.points !== undefined) window.App.user.points = balance.points;
        if (balance.rp !== undefined) window.App.user.rp = balance.rp;
    }
};

window.formatDate = function (dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

window.debounce = function (func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

window.getAvatarUrl = function (username, size = 64, type = 'avatar') {
    if (!username) username = 'MHF_Steve';
    
    
    return `/api/avatar.php?user=${username}&type=${type}`;
};
