'use strict';
/* ── Theme toggle ── */
const Theme = (() => {
  const KEY = 'oleser_theme';
  function get() { return localStorage.getItem(KEY) || 'dark'; }
  function set(t) {
    localStorage.setItem(KEY, t);
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = t === 'dark' ? sunSVG() : moonSVG();
  }
  function toggle() { set(get() === 'dark' ? 'light' : 'dark'); }
  function init() {
    const t = get();
    document.documentElement.setAttribute('data-theme', t);
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('theme-btn');
      if (btn) { btn.innerHTML = t === 'dark' ? sunSVG() : moonSVG(); btn.addEventListener('click', toggle); }
    });
  }
  function sunSVG() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`; }
  function moonSVG() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`; }
  return { init, toggle, get, set };
})();
Theme.init();

/* ── Toast ── */
const Toast = (() => {
  const icons = { ok:'✓', err:'✕', info:'ℹ', warn:'⚠' };
  function root() {
    let r = document.getElementById('toast-root');
    if (!r) { r = document.createElement('div'); r.id = 'toast-root'; document.body.appendChild(r); }
    return r;
  }
  function show(msg, type = 'info', dur = 4000) {
    const t = document.createElement('div');
    t.className = `toast t-${type === 'success' ? 'ok' : type}`;
    t.innerHTML = `<span style="font-size:15px;flex-shrink:0">${icons[type==='success'?'ok':type]||icons.info}</span><span style="flex:1">${msg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--t3);cursor:pointer;padding:2px;font-size:16px;line-height:1;margin-left:4px">×</button>`;
    root().appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 280); }, dur);
    return t;
  }
  return { show, success:(m,d)=>show(m,'ok',d), error:(m,d)=>show(m,'err',d), info:(m,d)=>show(m,'info',d), warn:(m,d)=>show(m,'warn',d) };
})();

/* ── Copy ── */
function copyText(text, label = 'คัดลอกแล้ว!') {
  navigator.clipboard?.writeText(text).then(() => Toast.success(label)).catch(() => {
    const el = document.createElement('textarea');
    el.value = text; document.body.appendChild(el); el.select();
    document.execCommand('copy'); el.remove(); Toast.success(label);
  });
}

/* ── Fetch helper ── */
async function apiFetch(url, data = {}, method = 'POST') {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } };
    if (method !== 'GET') opts.body = JSON.stringify(data);
    const res = await fetch(url, opts);
    return await res.json();
  } catch { return { status: 'error', message: 'เกิดข้อผิดพลาด' }; }
}

/* ── Form helpers ── */
function setLoading(btn, on) {
  if (on) { btn.dataset.orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span> กำลังดำเนินการ…`; }
  else { btn.disabled = false; btn.innerHTML = btn.dataset.orig || btn.innerHTML; }
}

/* ── Password toggle ── */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-pw]');
  if (!btn) return;
  const inp = document.querySelector(btn.dataset.pw);
  if (!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.innerHTML = show
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
});

/* ── Music Player ── */
const MusicPlayer = (() => {
  let list=[], idx=0, audio=null, playing=false;
  function init(songs, startIdx, startPos, shouldPlay) {
    if (!songs || !songs.length) return;
    list = songs;
    idx  = (startIdx >= 0 && startIdx < songs.length) ? startIdx : 0;
    audio = new Audio();
    audio.volume = parseFloat(localStorage.getItem('mp_vol') || '.5');
    render();
    // Restore position
    if (startPos > 0) {
      audio.src = list[idx].url;
      audio.addEventListener('loadedmetadata', function onLoaded() {
        audio.currentTime = startPos;
        audio.removeEventListener('loadedmetadata', onLoaded);
      }, {once:true});
    }
    // Auto-play if was playing before
    var pref = localStorage.getItem('music_enabled');
    if (pref !== '0' && shouldPlay !== false) {
      setTimeout(function() { play(); }, 800);
    }
    audio.addEventListener('ended', function() { next(); });
    document.querySelector('#mp-play')?.addEventListener('click', toggle);
    document.querySelector('#mp-next')?.addEventListener('click', next);
    document.querySelector('#mp-prev')?.addEventListener('click', prev);
    var vol = document.querySelector('#mp-vol');
    if (vol) { vol.value = audio.volume; vol.addEventListener('input', function(e) { audio.volume = e.target.value; localStorage.setItem('mp_vol', e.target.value); }); }
  }
  function render() {
    var s = list[idx];
    if (!s) return;
    var el = function(n) { return document.querySelector(n); };
    if (el('#mp-title'))  el('#mp-title').textContent  = s.title  || '—';
    if (el('#mp-artist')) el('#mp-artist').textContent = s.artist || '';
    if (el('#mp-cover') && s.cover_url) { el('#mp-cover').src = s.cover_url; el('#mp-cover').style.display=''; }
    else if (el('#mp-cover')) el('#mp-cover').style.display='none';
  }
  function play()  {
    if (!audio || !list.length) return;
    if (!audio.src || !audio.src.includes(list[idx].url)) audio.src = list[idx].url;
    audio.play().catch(function(){});
    playing = true;
    document.querySelector('#mp-play')?.classList.add('active');
  }
  function pause() { audio?.pause(); playing=false; document.querySelector('#mp-play')?.classList.remove('active'); }
  function toggle(){ playing ? pause() : play(); }
  function next()  { idx=(idx+1)%list.length; render(); play(); }
  function prev()  { idx=(idx-1+list.length)%list.length; render(); play(); }
  function getState() { return audio ? {idx:idx, pos:audio.currentTime||0, playing:playing} : null; }
  return { init, play, pause, toggle, next, prev, getState };
})();

/* ── Contact panel ── */
document.addEventListener('click', e => {
  const fab   = e.target.closest('.cfab');
  const panel = document.querySelector('.cpanel');
  if (fab && panel) { panel.classList.toggle('open'); return; }
  if (panel?.classList.contains('open') && !e.target.closest('#cfab-wrap')) panel.classList.remove('open');
});

/* ── Sync cfab position with music player ── */
function syncCfabPosition() {
  var mp = document.getElementById('music-player');
  var cfab = document.getElementById('cfab-wrap');
  if (!cfab) return;
  if (mp && mp.offsetParent !== null) {
    // Music player visible — bump cfab up above it
    var mpH = mp.offsetHeight;
    var base = window.innerWidth <= 768 ? 16 : 24;
    cfab.style.bottom = (base + mpH + 12) + 'px';
  } else {
    var base2 = window.innerWidth <= 768 ? '16px' : '24px';
    cfab.style.bottom = base2;
  }
}
// Run on load and on resize
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(syncCfabPosition, 500);
  window.addEventListener('resize', syncCfabPosition);
});

/* ── Announce close ── */
document.addEventListener('click', e => {
  // ann-close handled by dismissAnn() in header now
  
});

/* ── Scroll reveal ── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; revealObs.unobserve(e.target); } });
}, { threshold:.08, rootMargin:'0px 0px -30px 0px' });

/* ── Dropdown user menu ── */
document.addEventListener('DOMContentLoaded', () => {
  // Announce banner
  // announcements handled by cookie via dismissAnn()

  // Reveal
  document.querySelectorAll('.fade-up').forEach(el => revealObs.observe(el));

  // Mobile nav
  const tog = document.querySelector('.nav-toggle');
  const mob = document.querySelector('.mobile-nav');
  tog?.addEventListener('click', () => { mob?.classList.toggle('open'); tog.setAttribute('aria-expanded', !!mob?.classList.contains('open')); });

  // Active link
  const cur = location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a,.mobile-nav a').forEach(a => {
    if (a.getAttribute('href')?.split('/').pop() === cur) a.classList.add('active');
  });

  // User dropdown
  const pill = document.getElementById('user-pill');
  const drop = document.getElementById('user-drop');
  pill?.addEventListener('click', e => { e.stopPropagation(); drop?.classList.toggle('open'); });
  document.addEventListener('click', () => drop?.classList.remove('open'));
  drop?.addEventListener('click', e => e.stopPropagation());
});

/* ── Counter animation ── */
function animateCount(el, target, ms=1200) {
  const start = performance.now();
  const from  = parseFloat(el.textContent.replace(/,/g,'')) || 0;
  const step  = now => {
    const p = Math.min((now-start)/ms, 1);
    const e = 1-Math.pow(1-p,3);
    el.textContent = target%1===0 ? Math.round(from+(target-from)*e).toLocaleString() : (from+(target-from)*e).toFixed(2);
    if (p<1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ── Countdown ── */
function startCountdown(target, id) {
  const el = document.getElementById(id);
  if (!el) return;
  (function tick() {
    const d = new Date(target) - new Date();
    if (d<=0) { el.innerHTML='<span style="color:var(--brand)">เปิดตัวแล้ว! 🎉</span>'; return; }
    const dd=Math.floor(d/86400000), hh=Math.floor(d%86400000/3600000), mm=Math.floor(d%3600000/60000), ss=Math.floor(d%60000/1000);
    el.innerHTML=`<div class="countdown">${[['วัน',dd],['ชั่วโมง',hh],['นาที',mm],['วินาที',ss]].map(([l,v])=>`<div class="cd-i"><div class="cd-n">${String(v).padStart(2,'0')}</div><div class="cd-l">${l}</div></div>`).join('')}</div>`;
    setTimeout(tick,1000);
  })();
}

/* ── Tab switcher ── */
function initTabs(wrap) {
  const btns = wrap.querySelectorAll('.tab-btn');
  const panels = wrap.querySelectorAll('.tab-panel');
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    wrap.querySelector('#' + btn.dataset.tab)?.classList.add('active');
  }));
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tabs]').forEach(initTabs);
});

/* ── Popup announce ── */
function showPopup(html) {
  if (localStorage.getItem('popup_off')==='1') return;
  const bd = document.createElement('div');
  bd.className='popup-bd';
  bd.innerHTML=html;
  document.body.appendChild(bd);
  bd.addEventListener('click', e => { if(e.target===bd) closePopup(bd); });
}
function closePopup(bd) {
  bd.style.cssText+=';transition:opacity .3s;opacity:0';
  setTimeout(()=>bd.remove(),300);
}

/* ── Code copy ── */
document.addEventListener('click', e => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const pre = btn.closest('.code-block')?.querySelector('pre');
  if (pre) { copyText(pre.textContent, 'คัดลอกโค้ดแล้ว!'); btn.textContent='✓ คัดลอกแล้ว'; setTimeout(()=>btn.textContent='คัดลอก',2000); }
});
