/**
 * CodeShop - Main JS
 * Requires: jQuery, SweetAlert2, Remix Icons
 */

/* ============================================================
   Globals
   ============================================================ */
const SITE_URL = document.querySelector('meta[name="site-url"]')?.content || '';
const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content || '';

// AJAX helper with CSRF
function ajax(url, data = {}, method = 'POST') {
    return $.ajax({
        url,
        method,
        data: { ...data, _csrf_token: CSRF_TOKEN },
        dataType: 'json',
    });
}

/* ============================================================
   Navbar Scroll Effect
   ============================================================ */
$(window).on('scroll', function () {
    $('.navbar').toggleClass('scrolled', $(this).scrollTop() > 20);
});

/* ============================================================
   Tab Switching (Dashboard Topup Tabs)
   ============================================================ */
$(document).on('click', '.tabs .tab', function () {
    const tabName = $(this).data('tab');
    $('.tabs .tab').removeClass('active');
    $(this).addClass('active');
    
    // Hide all tab content
    $('[id^="tab-"]').hide();
    
    // Show selected tab
    $(`#tab-${tabName}`).show();
});

/* ============================================================
   Mobile Sidebar
   ============================================================ */
$('.nav-hamburger').on('click', function () {
    $(this).toggleClass('active');
    $('.mobile-sidebar').toggleClass('open');
    $('.sidebar-overlay').toggleClass('active');
    $('body').toggleClass('overflow-hidden');
});

$('.sidebar-overlay, .sidebar-close').on('click', closeSidebar);

function closeSidebar() {
    $('.nav-hamburger').removeClass('active');
    $('.mobile-sidebar').removeClass('open');
    $('.sidebar-overlay').removeClass('active');
    $('body').removeClass('overflow-hidden');
}

/* ============================================================
   User Dropdown
   ============================================================ */
$(document).on('click', function (e) {
    if (!$(e.target).closest('.nav-user').length) {
        $('.user-dropdown').removeClass('open');
    }
});
$('.nav-user-btn').on('click', function (e) {
    e.stopPropagation();
    $('.user-dropdown').toggleClass('open');
});

/* ============================================================
   Search Autocomplete (AJAX)
   ============================================================ */
let searchTimeout;
$('.nav-search input').on('input', function () {
    const q = $(this).val().trim();
    clearTimeout(searchTimeout);

    if (q.length < 2) {
        $('.search-dropdown').removeClass('active').html('');
        return;
    }

    searchTimeout = setTimeout(() => {
        $.ajax({
            url: SITE_URL + '/ajax/search.php',
            method: 'GET',
            data: { q },
            dataType: 'json',
            success(res) {
                renderSearchResults(res);
            }
        });
    }, 250);
});

function renderSearchResults(results) {
    const $dd = $('.search-dropdown');
    if (!results || results.length === 0) {
        $dd.html('<div class="search-empty"><i class="ri-search-line"></i><br>ไม่พบสินค้า</div>').addClass('active');
        return;
    }
    let html = '';
    results.forEach(item => {
        const img = item.main_image
            ? `<img src="${SITE_URL}/uploads/${item.main_image}" alt="${escHtml(item.name)}" loading="lazy">`
            : `<div style="width:48px;height:48px;background:var(--bg-3);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="ri-code-line" style="color:var(--primary)"></i></div>`;
        const price = parseFloat(item.price) === 0 ? '<span style="color:var(--success)">ฟรี</span>' : '฿' + parseFloat(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 });
        html += `<div class="search-item" onclick="location.href='${SITE_URL}/code/${item.slug}'">${img}<div class="search-item-info"><div class="search-item-name">${escHtml(item.name)}</div><div class="search-item-price">${price}</div></div></div>`;
    });
    $dd.html(html).addClass('active');
}

$(document).on('click', function (e) {
    if (!$(e.target).closest('.nav-search').length) {
        $('.search-dropdown').removeClass('active');
    }
});

$('.nav-search input').on('keydown', function (e) {
    if (e.key === 'Enter') {
        const q = $(this).val().trim();
        if (q) location.href = SITE_URL + '/search?q=' + encodeURIComponent(q);
    }
});

/* ============================================================
   Wishlist Toggle
   ============================================================ */
$(document).on('click', '.product-card-wishlist', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn()) {
        Swal.fire({ icon: 'info', title: 'กรุณาเข้าสู่ระบบ', text: 'คุณต้องเข้าสู่ระบบก่อนใช้งาน Wishlist', confirmButtonColor: '#ff0000' });
        return;
    }
    const $btn = $(this);
    const productId = $btn.data('id');
    ajax(SITE_URL + '/ajax/wishlist.php', { product_id: productId }).done(res => {
        if (res.success) {
            $btn.toggleClass('wishlisted', res.wishlisted);
            $btn.find('i').toggleClass('ri-heart-line', !res.wishlisted).toggleClass('ri-heart-fill', res.wishlisted);
            showToast(res.wishlisted ? 'เพิ่มใน Wishlist แล้ว' : 'นำออกจาก Wishlist แล้ว', 'success');
        }
    });
});

/* ============================================================
   Product Gallery
   ============================================================ */
$(document).on('click', '.product-thumb', function () {
    const src = $(this).attr('src');
    $('.product-main-img').attr('src', src);
    $('.product-thumb').removeClass('active');
    $(this).addClass('active');
});

/* ============================================================
   Coupon Apply
   ============================================================ */
$('#apply-coupon').on('click', function () {
    const code  = $('#coupon-input').val().trim();
    const prodId = $(this).data('product');
    if (!code) return;
    ajax(SITE_URL + '/ajax/coupon.php', { code, product_id: prodId }).done(res => {
        if (res.success) {
            $('#coupon-result').html(`<span class="text-success"><i class="ri-check-line"></i> ส่วนลด ฿${res.discount}</span>`);
            $('#final-price').text('฿' + parseFloat(res.final_price).toFixed(2));
            $('#hidden-coupon').val(code);
        } else {
            $('#coupon-result').html(`<span class="text-danger"><i class="ri-close-line"></i> ${res.message}</span>`);
        }
    });
});

/* ============================================================
   Buy Product
   ============================================================ */
$(document).on('click', '#btn-buy', function () {
    if (!isLoggedIn()) {
        Swal.fire({ icon: 'info', title: 'กรุณาเข้าสู่ระบบ', text: 'คุณต้องเข้าสู่ระบบก่อนซื้อสินค้า', confirmButtonColor: '#ff0000' });
        return;
    }
    const productId = $(this).data('id');
    const coupon    = $('#hidden-coupon').val() || '';

    Swal.fire({
        title: 'ยืนยันการซื้อ?',
        text: 'ยอดเงินจะถูกหักจากบัญชีของคุณ',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff0000',
        cancelButtonText: 'ยกเลิก',
        confirmButtonText: 'ยืนยัน',
    }).then(result => {
        if (!result.isConfirmed) return;
        ajax(SITE_URL + '/ajax/purchase.php', { product_id: productId, coupon })
            .done(res => {
                if (res.success) {
                    Swal.fire({
                        icon: 'success', title: 'ซื้อสำเร็จ!', text: 'กำลังดาวน์โหลดไฟล์...',
                        confirmButtonColor: '#ff0000', confirmButtonText: 'ดาวน์โหลด',
                    }).then(() => { window.location.href = res.download_url; });
                } else {
                    Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: res.message, confirmButtonColor: '#ff0000' });
                }
            });
    });
});

/* ============================================================
   Review / Rating
   ============================================================ */
let selectedRating = 0;
$(document).on('mouseover', '.star-input i', function () {
    const val = $(this).data('val');
    highlightStars(val);
}).on('mouseout', '.star-input', function () {
    highlightStars(selectedRating);
}).on('click', '.star-input i', function () {
    selectedRating = $(this).data('val');
    $('#rating-value').val(selectedRating);
    highlightStars(selectedRating);
});

function highlightStars(val) {
    $('.star-input i').each(function () {
        const v = $(this).data('val');
        $(this).removeClass('ri-star-fill ri-star-line')
               .addClass(v <= val ? 'ri-star-fill' : 'ri-star-line');
    });
}

$('#review-form').on('submit', function (e) {
    e.preventDefault();
    const data = {
        product_id: $(this).data('product'),
        rating: selectedRating,
        comment: $('#review-comment').val(),
    };
    if (!data.rating) { showToast('กรุณาเลือกคะแนน', 'error'); return; }
    ajax(SITE_URL + '/ajax/review.php', data).done(res => {
        if (res.success) {
            showToast('รีวิวสำเร็จ', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(res.message, 'error');
        }
    });
});

/* ============================================================
   Topup Modal
   ============================================================ */
$('#btn-topup, .btn-topup').on('click', function () {
    $('#topup-modal').addClass('active');
});
$('.modal-close, .modal-overlay').on('click', function (e) {
    if ($(e.target).is('.modal-overlay') || $(e.target).is('.modal-close')) {
        $('.modal-overlay').removeClass('active');
    }
});

// Generate PromptPay QR
$('#btn-generate-qr').on('click', function () {
    const amount = parseFloat($('#topup-amount').val());
    if (!amount || amount < 10) { showToast('จำนวนเงินขั้นต่ำ 10 บาท', 'error'); return; }

    $(this).addClass('btn-loading').prop('disabled', true);
    ajax(SITE_URL + '/ajax/topup_promptpay.php', { amount }).done(res => {
        $(this).removeClass('btn-loading').prop('disabled', false);
        if (res.success) {
            $('#qr-section').show();
            $('#qr-image').attr('src', res.qr_url);
            $('#qr-amount').text('฿' + parseFloat(res.display_amount || res.amount).toFixed(2));
            startPolling(res.transaction_id, res.expires_at);
        } else {
            showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
        }
    });
});

// TrueWallet redeem
$('#btn-redeem-tw').on('click', function () {
    const link = $('#tw-voucher-link').val().trim();
    if (!link) { showToast('กรุณากรอก Voucher Link', 'error'); return; }
    $(this).addClass('btn-loading').prop('disabled', true);
    ajax(SITE_URL + '/ajax/topup_truewallet.php', { voucher_link: link }).done(res => {
        $(this).removeClass('btn-loading').prop('disabled', false);
        if (res.success) {
            Swal.fire({ icon: 'success', title: 'เติมเงินสำเร็จ!', text: `เติมเงิน ฿${parseFloat(res.amount).toFixed(2)} เรียบร้อย`, confirmButtonColor: '#ff0000' })
                .then(() => location.reload());
        } else {
            showToast(res.message, 'error');
        }
    });
});

// Poll PromptPay status
let pollInterval;
let countdownInterval;
let currentTxId = null;

function showPaymentResult(type, msg) {
    const cfg = {
        success: { icon: 'ri-checkbox-circle-fill', color: 'var(--success)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)' },
        error:   { icon: 'ri-close-circle-fill',    color: 'var(--danger)',  bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)' },
        warning: { icon: 'ri-time-fill',             color: 'var(--warning)', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.3)' },
        pending: { icon: 'ri-loader-4-line',         color: 'var(--text-muted)', bg: 'var(--bg)',          border: 'var(--border)' },
    };
    const c = cfg[type] || cfg.pending;
    const spinStyle = type === 'pending' ? 'animation:spin .8s linear infinite;display:inline-block;' : '';
    $('#check-result').html(`
        <div style="display:flex;align-items:center;gap:10px;padding:13px 16px;
                    background:${c.bg};border-radius:10px;border:1px solid ${c.border};
                    font-size:0.88rem;text-align:left;margin-top:2px;">
            <i class="${c.icon}" style="color:${c.color};font-size:1.3rem;flex-shrink:0;${spinStyle}"></i>
            <span style="color:${c.color};font-weight:600;line-height:1.4;">${msg}</span>
        </div>
    `);
}

function startCountdown(expiresAt) {
    clearInterval(countdownInterval);
    if (!expiresAt) return;
    const $timer  = $('#qr-timer');
    const $countdown = $('#timer-countdown');
    $timer.show();
    countdownInterval = setInterval(() => {
        const diff = Math.floor((expiresAt * 1000 - Date.now()) / 1000);
        if (diff <= 0) {
            clearInterval(countdownInterval);
            $countdown.text('หมดอายุแล้ว');
            return;
        }
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        $countdown.text(`${m}:${s.toString().padStart(2,'0')}`);
    }, 1000);
}

function stopAll() {
    clearInterval(pollInterval);
    clearInterval(countdownInterval);
}

function handlePaymentSuccess(amount) {
    stopAll();
    $('#polling-status').hide();
    $('#btn-check-payment').prop('disabled', false)
        .html('<i class="ri-shield-check-line" style="font-size:1.2rem;"></i> ยืนยันการโอนเงิน');
    showPaymentResult('success', `✅ ชำระเงินสำเร็จ! เติมเงิน ฿${parseFloat(amount).toFixed(2)} เรียบร้อย`);
    setTimeout(() => {
        Swal.fire({
            icon: 'success',
            title: 'เติมเงินสำเร็จ! 🎉',
            html: `<div style="font-size:1.5rem;font-weight:900;color:#ff0000;">฿${parseFloat(amount).toFixed(2)}</div><div style="color:#666;margin-top:6px;">เพิ่มเข้ายอดเงินของคุณแล้ว</div>`,
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#ff0000',
            timer: 5000,
            timerProgressBar: true,
        }).then(() => location.reload());
    }, 400);
}

function startPolling(txId, expiresAt) {
    stopAll();
    currentTxId = txId;
    window._currentTxId = txId; // share กับ inline script ใน dashboard
    $('#polling-status').show();
    $('#check-result').html('');
    startCountdown(expiresAt);

    pollInterval = setInterval(() => {
        ajax(SITE_URL + '/ajax/check_payment.php', { transaction_id: txId }).done(res => {
            if (res.status === 'success') {
                handlePaymentSuccess(res.amount);
            } else if (res.status === 'error') {
                stopAll();
                $('#polling-status').hide();
                showPaymentResult('error', res.message || 'เกิดข้อผิดพลาดจาก API');
            }
            // pending = รอต่อไป
        });
    }, 4000);

    // หยุด auto-poll เมื่อ QR หมดอายุ แต่ปุ่มกดเองยังใช้ได้
    if (expiresAt) {
        const diff = (expiresAt * 1000) - Date.now();
        if (diff > 0) setTimeout(() => {
            clearInterval(pollInterval);
            $('#polling-status').hide();
            showPaymentResult('warning', 'QR หมดอายุแล้ว — กดปุ่มยืนยันเพื่อตรวจสอบอีกครั้ง');
        }, diff + 2000);
    }
}

// ปุ่มยืนยันการโอนเงิน — ใช้ global function เพื่อให้ onclick inline ทำงานได้แน่นอน
function doCheckPayment() {
    console.log('[doCheckPayment] called, currentTxId=', currentTxId);

    if (!currentTxId) {
        showPaymentResult('error', 'กรุณาสร้าง QR Code ก่อน');
        return;
    }

    const $btn = $('#btn-check-payment');
    $btn.prop('disabled', true)
        .html('<i class="ri-loader-4-line" style="font-size:1.2rem;display:inline-block;animation:spin .8s linear infinite;"></i> กำลังตรวจสอบ...');
    showPaymentResult('pending', 'กำลังเชื่อมต่อกับระบบ กรุณารอสักครู่...');

    ajax(SITE_URL + '/ajax/check_payment.php', { transaction_id: currentTxId })
    .done(function(res) {
        console.log('[check_payment] response:', res);

        $btn.prop('disabled', false)
            .html('<i class="ri-shield-check-line" style="font-size:1.2rem;"></i> ยืนยันการโอนเงิน');

        if (res.status === 'success') {
            handlePaymentSuccess(res.amount);

        } else if (res.status === 'error' || res.success === false) {
            const msg  = res.message || 'ยังไม่พบการชำระเงิน';
            const code = res.code ? ' (' + res.code + ')' : '';
            showPaymentResult('error', msg + code);

        } else if (res.status === 'pending') {
            const mins    = res.time_remaining ? Math.ceil(res.time_remaining / 60) : null;
            const timeMsg = mins ? ' (เหลือเวลา ~' + mins + ' นาที)' : '';
            showPaymentResult('warning', 'ยังไม่พบการโอนเงิน' + timeMsg + ' — กรุณารอสักครู่แล้วกดใหม่');

        } else {
            showPaymentResult('warning', 'ยังไม่สามารถยืนยันได้ — กรุณาลองใหม่อีกครั้ง');
        }
    })
    .fail(function(xhr) {
        console.error('[check_payment] fail:', xhr.status, xhr.responseText);
        $btn.prop('disabled', false)
            .html('<i class="ri-shield-check-line" style="font-size:1.2rem;"></i> ยืนยันการโอนเงิน');
        let msg = 'เชื่อมต่อระบบไม่ได้ (HTTP ' + xhr.status + ')';
        try {
            const r = JSON.parse(xhr.responseText);
            if (r.message) msg = r.message;
        } catch(e) {}
        showPaymentResult('error', msg);
    });
}

// Alias สำหรับ event delegation (fallback)
$(document).on('click', '#btn-check-payment', function(e) {
    e.preventDefault();
    doCheckPayment();
});

/* ============================================================
   Lazy Load Images
   ============================================================ */
const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            lazyObserver.unobserve(img);
        }
    });
}, { rootMargin: '100px' });

document.querySelectorAll('img.lazy[data-src]').forEach(img => lazyObserver.observe(img));

/* ============================================================
   Toast Notifications
   ============================================================ */
function showToast(msg, type = 'info') {
    const icons = { success: 'ri-check-circle-line', error: 'ri-error-warning-line', info: 'ri-information-line', warning: 'ri-alert-line' };
    const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--info)', warning: 'var(--warning)' };
    const $toast = $(`
        <div style="
            background:var(--bg-card);
            border:1px solid var(--border);
            border-left:3px solid ${colors[type]};
            border-radius:var(--radius-sm);
            padding:12px 16px;
            display:flex;
            align-items:center;
            gap:10px;
            font-size:0.88rem;
            font-weight:500;
            box-shadow:var(--shadow);
            animation:slideUp 0.3s ease;
            pointer-events:all;
            max-width:300px;
            min-width:220px;
        ">
            <i class="${icons[type]}" style="color:${colors[type]};font-size:1.1rem;flex-shrink:0;"></i>
            <span>${msg}</span>
        </div>
    `);
    if (!$('.toast-area').length) $('body').append('<div class="toast-area"></div>');
    $('.toast-area').append($toast);
    setTimeout(() => $toast.fadeOut(300, function () { $(this).remove(); }), 3000);
}

/* ============================================================
   Mark Notifications Read
   ============================================================ */
$('.notif-badge').on('click', function () {
    ajax(SITE_URL + '/ajax/mark_notif.php', { action: 'read_all' }).done(() => {
        $('.badge-dot').remove();
    });
});

/* ============================================================
   Admin: Delete confirm
   ============================================================ */
$(document).on('click', '.btn-delete', function (e) {
    e.preventDefault();
    const url = $(this).data('url') || $(this).attr('href');
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'ไม่สามารถกู้คืนได้',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff0000',
        cancelButtonText: 'ยกเลิก',
        confirmButtonText: 'ลบเลย',
    }).then(r => { if (r.isConfirmed) location.href = url; });
});

/* ============================================================
   Admin: Toggle product status
   ============================================================ */
$(document).on('click', '.toggle-status', function () {
    const id = $(this).data('id');
    ajax(SITE_URL + '/ajax/admin/toggle_product.php', { id }).done(res => {
        if (res.success) {
            $(this).closest('tr').find('.status-badge')
                .toggleClass('badge-success badge-danger')
                .text(res.is_active ? 'เปิด' : 'ปิด');
            showToast('เปลี่ยนสถานะสำเร็จ', 'success');
        }
    });
});

/* ============================================================
   Admin: Ban User
   ============================================================ */
$(document).on('click', '.btn-ban', function () {
    const id = $(this).data('id');
    const action = $(this).data('action'); // ban | unban
    Swal.fire({
        title: action === 'ban' ? 'แบน User?' : 'ปลดแบน User?',
        input: action === 'ban' ? 'text' : undefined,
        inputLabel: action === 'ban' ? 'เหตุผล' : undefined,
        showCancelButton: true,
        confirmButtonColor: '#ff0000',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
    }).then(r => {
        if (!r.isConfirmed) return;
        ajax(SITE_URL + '/ajax/admin/ban_user.php', { id, action, reason: r.value || '' }).done(res => {
            if (res.success) { showToast('สำเร็จ', 'success'); setTimeout(() => location.reload(), 1000); }
        });
    });
});

/* ============================================================
   PIN Input auto-advance
   ============================================================ */
$(document).on('input', '.pin-input, .otp-input', function () {
    const val = $(this).val();
    $(this).val(val.slice(-1)); // keep only last char
    if (val) $(this).next('.pin-input, .otp-input').focus();
}).on('keydown', '.pin-input, .otp-input', function (e) {
    if (e.key === 'Backspace' && !$(this).val()) {
        $(this).prev('.pin-input, .otp-input').focus();
    }
});

/* ============================================================
   Password Visibility Toggle
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    // Handle password toggle clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('password-toggle') || e.target.closest('.password-toggle')) {
            const toggle = e.target.classList.contains('password-toggle') ? e.target : e.target.closest('.password-toggle');
            const input = toggle.previousElementSibling;
            
            if (input && input.tagName === 'INPUT') {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                const icon = toggle.querySelector('i') || toggle;
                icon.classList.toggle('ri-eye-off-line');
                icon.classList.toggle('ri-eye-line');
            }
        }
    });
});

/* ============================================================
   Utility
   ============================================================ */
function isLoggedIn() {
    return document.body.dataset.loggedin === '1';
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Animate elements on scroll
const animObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = `${i * 0.05}s`;
            entry.target.classList.add('animate-in');
            animObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .ranking-item, .stat-card').forEach(el => {
    animObserver.observe(el);
});

/* ============================================================
   SweetAlert2 Global Defaults
   ============================================================ */
if (typeof Swal !== 'undefined') {
    const SwalBase = Swal.mixin({
        customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-ghost' },
        buttonsStyling: false,
        background: 'var(--bg-card)',
        color: 'var(--text)',
    });
    window.SwalBase = SwalBase;
}

/* ============================================================
   DOM Ready
   ============================================================ */
$(function () {
    // Navbar active link
    const path = location.pathname;
    $('.nav-link').each(function () {
        const href = $(this).attr('href');
        if (href && path.startsWith(href) && href !== '/') {
            $(this).addClass('active');
        }
    });

    // Show alert messages from URL params
    const params = new URLSearchParams(location.search);
    if (params.get('success')) showToast(decodeURIComponent(params.get('success')), 'success');
    if (params.get('error')) showToast(decodeURIComponent(params.get('error')), 'error');
    if (params.get('banned')) {
        Swal.fire({ icon: 'error', title: 'บัญชีถูกแบน', text: 'บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแล', confirmButtonColor: '#ff0000' });
    }
});
