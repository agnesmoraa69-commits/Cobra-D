// script.js relies on core.js (loaded first) for: S, save, $, $$, fmt, toast, MK, chg.
// Do NOT redeclare those here, or the browser throws "already declared" and the page breaks.
// Visible warning (no console needed on a phone) if core.js is missing or old
if (typeof S === 'undefined' || typeof save !== 'function' || typeof MK === 'undefined') {
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="background:#c00;color:#fff;padding:12px;font:14px sans-serif;position:relative;z-index:9999">' +
    'Setup error: core.js did not load. Replace home.html and core.js on GitHub, then refresh.</div>');
  throw new Error('core.js missing');
}

const uiState = { hidden: false, action: 'deposit' };

// Save balances to the Supabase "profiles" table (skipped quietly if not signed in or table missing)
async function syncProfile(fields) {
  try {
    const c = window.sb || window.supabase;
    if (!c || !c.auth) return;
    const { data: { session } } = await c.auth.getSession();
    if (session) await c.from('profiles').update(fields).eq('id', session.user.id);
  } catch (e) {
    console.warn('Profile sync skipped:', e && e.message);
  }
}

function renderBalance() {
  const m = S.mode;
  const total = S.bal[m] + S.cfd[m] + S.exch[m];
  const show = n => uiState.hidden ? '****' : fmt(n);
  // Page headers: each account page shows its own account; Home/Portfolio show the total
  $$('.bal').forEach(e => {
    const v = e.closest('#exchange') ? S.exch[m]
            : e.closest('#cfds') ? S.cfd[m]
            : e.closest('#options') ? S.bal[m]
            : total;
    e.textContent = show(v);
  });
  $$('.bal-acc').forEach(e => {
    const t = e.dataset.type;
    const v = t === 'options' ? S.bal[m] : t === 'cfd' ? S.cfd[m] : S.exch[m];
    e.textContent = show(v);
  });
  $$('.toggle button').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
  // Mode applies to the whole page: body class + labels
  document.body.classList.toggle('mode-real', S.mode === 'real');
  document.body.classList.toggle('mode-demo', S.mode === 'demo');
  const label = S.mode === 'demo' ? 'Demo' : 'Real';
  $$('.upd').forEach(e => e.textContent = label + ' account \u00b7 updated just now');
}

function showTab(name) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === name));
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  window.scrollTo(0, 0);
}

function openSheet(action) {
  uiState.action = action;
  const title = $('#sheetTitle');
  if (title) title.textContent = action[0].toUpperCase() + action.slice(1);
  const amt = $('#amount');
  if (amt) { amt.value = ''; amt.focus(); }
  const sheet = $('#sheet');
  if (sheet) sheet.hidden = false;
}

$$('#tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
$$('[data-go]').forEach(b => b.onclick = () => showTab(b.dataset.go));
// One handler for every Real/Demo toggle (CFDs, Options, ...). Mode is shared site-wide via S.mode.
document.addEventListener('click', e => {
  const b = e.target.closest('.toggle button[data-mode]');
  if (!b) return;
  S.mode = b.dataset.mode;
  save();
  renderBalance();
  syncProfile({ active_account_type: S.mode });
  toast('Switched to ' + (S.mode === 'demo' ? 'Demo' : 'Real') + ' account');
});
$$('.eye').forEach(b => b.onclick = () => { uiState.hidden = !uiState.hidden; renderBalance(); });
$$('.refresh').forEach(b => b.onclick = async () => { await pullProfile(); renderBalance(); toast('Balance updated'); });
$$('.open-deposit').forEach(b => b.onclick = () => openSheet('deposit'));
$$('.open-withdraw').forEach(b => b.onclick = () => openSheet('withdraw'));
$$('.open-transfer').forEach(b => b.onclick = () => openSheet('transfer'));

if ($('#tradeBtn')) $('#tradeBtn').onclick = () => $('#markets').scrollIntoView({ behavior: 'smooth' });
if ($('#cancel')) $('#cancel').onclick = () => $('#sheet').hidden = true;
if ($('#sheet')) $('#sheet').onclick = e => { if (e.target.id === 'sheet') e.currentTarget.hidden = true; };

if ($('#confirm')) {
  $('#confirm').onclick = async () => {
    const amtInput = $('#amount');
    const amt = parseFloat(amtInput ? amtInput.value : 0);
    if (!amt || amt <= 0) return toast('Enter an amount above 0');
    const cur = S.bal[S.mode];

    if (uiState.action === 'deposit') {
      S.bal[S.mode] += amt;
    } else if (uiState.action === 'withdraw') {
      if (amt > cur) return toast('Amount is higher than your balance');
      S.bal[S.mode] -= amt;
    }

    save();
    syncProfile(S.mode === 'real' ? { real_balance: S.bal.real } : { demo_balance: S.bal.demo });

    if ($('#sheet')) $('#sheet').hidden = true;
    renderBalance();
    toast(uiState.action[0].toUpperCase() + uiState.action.slice(1) + ' complete');
  };
}

/* Simulated markets - uses the MK array from core.js */
function buildMarkets() {
  const el = $('#markets');
  if (!el || typeof MK === 'undefined') return;
  el.innerHTML = MK.map((m, i) => `
    <div class="mk" data-i="${i}">
      <div class="ico"><span class="num">${m.n}</span>${m.s1 ? '<span class="s1">1s</span>' : ''}</div>
      <div class="nm">${m.name}</div>
      <div class="px"></div>
      <div class="ft"><svg viewBox="0 0 70 40" preserveAspectRatio="none"><polyline/></svg><span class="pc"></span></div>
    </div>`).join('');
}

function tick() {
  if (typeof MK === 'undefined') return;
  MK.forEach((m, i) => {
    const card = $(`.mk[data-i="${i}"]`);
    if (!card) return;
    const lo = Math.min(...m.hist), hi = Math.max(...m.hist), rng = hi - lo || 1;
    const pts = m.hist.map((p, k) => `${(k / (m.hist.length - 1)) * 70},${38 - ((p - lo) / rng) * 36}`).join(' ');
    const chgVal = chg(m);
    const cls = chgVal >= 0 ? 'up' : 'dn';
    const px = $('.px', card);
    if (px) px.textContent = fmt(m.price);
    const pl = $('polyline', card);
    if (pl) { pl.setAttribute('points', pts); pl.style.stroke = chgVal >= 0 ? '#00a79e' : '#cc2e3d'; }
    const pc = $('.pc', card);
    if (pc) {
      pc.className = 'pc ' + cls;
      pc.innerHTML = `${chgVal >= 0 ? '+' : ''}${chgVal.toFixed(2)}% <span class="muted">(5m)</span>`;
    }
  });
}

buildMarkets();
renderBalance();
window.onTick = tick; // core.js calls this every second
window.onProfile = renderBalance; // core.js calls this after loading balances from Supabase

/* Home page extras */
let au = {}; try { au = JSON.parse(localStorage.getItem('astrol-user')) || {}; } catch (e) {}
const uname = au.name || 'COBRA trader';
const ini = uname.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
['#avatar', '#pav'].forEach(s => { const el = $(s); if (el) el.textContent = ini; });
if ($('#pname')) $('#pname').textContent = uname;

const slides = [['Make your first deposit', 'Deposit now', 'deposit'], ['Practise with demo funds', 'Start trading', 'options']];
let si = 0;
function setSlide(i) {
  si = i;
  if ($('#bt')) $('#bt').textContent = slides[i][0];
  if ($('#bc')) $('#bc').textContent = slides[i][1];
  $$('#banner .dots i').forEach((d, k) => d.classList.toggle('on', k === i));
}
if ($('#bc')) $('#bc').onclick = () => slides[si][2] === 'deposit' ? openSheet('deposit') : showTab('options');
setInterval(() => setSlide((si + 1) % slides.length), 5000);

$$('[data-toast]').forEach(b => b.onclick = () => toast(b.dataset.toast));
if ($('#addAcc')) $('#addAcc').onclick = () => toast('Extra accounts are not available in the simulation');
if ($('#avatar')) $('#avatar').onclick = () => showTab('profile');
if ($('#bellBtn')) $('#bellBtn').onclick = () => showTab('notifs');
if ($('.bell2')) $('.bell2').onclick = () => showTab('notifs');
$$('.back').forEach(b => b.onclick = () => showTab('home'));
if ($('#idpill')) $('#idpill').onclick = () => { try { navigator.clipboard.writeText('as01....7f2c'); } catch (e) {} toast('Account ID copied'); };
if ($('#mobcard .x')) $('#mobcard .x').onclick = () => $('#mobcard').remove();
if ($('#closeAcc')) $('#closeAcc').onclick = () => {
  S.bal.demo = 10000;
  S.bal.real = 0;
  S.cfd.demo = 0; S.cfd.real = 0;
  S.exch.demo = 0; S.exch.real = 0;
  save();
  renderBalance();
  syncProfile({ real_balance: 0, demo_balance: 10000, real_cfd: 0, demo_cfd: 0, real_exchange: 0, demo_exchange: 0 });
  toast('Demo account reset');
};
$$('.eye').forEach(b => b.addEventListener('click', () => $$('.eye use').forEach(u => u.setAttribute('href', uiState.hidden ? '#i-eye-off' : '#i-eye'))));

function buildDots() {
  const n = $$('#promos .promo').length, box = $('#pdots');
  if (!box) return;
  if (!n) { if ($('#promos')) $('#promos').remove(); box.remove(); return; }
  box.innerHTML = '<i></i>'.repeat(n); markDot();
}
function markDot() {
  const p = $('#promos'); if (!p) return;
  const c = $$('#promos .promo'); if (!c.length) return;
  const idx = Math.min(c.length - 1, Math.round(p.scrollLeft / (c[0].offsetWidth + 14)));
  $$('#pdots i').forEach((d, k) => d.classList.toggle('on', k === idx));
}
if ($('#promos')) $('#promos').addEventListener('scroll', markDot);
$$('#promos .x').forEach(b => b.onclick = () => { b.closest('.promo').remove(); buildDots(); });
buildDots();

if ($('#hln')) $('#hln').onclick = () => $('#hl').scrollBy({ left: 260, behavior: 'smooth' });
if ($('#hlp')) $('#hlp').onclick = () => $('#hl').scrollBy({ left: -260, behavior: 'smooth' });

/* ===== EXCHANGE PAGE ===== */
(function () {
  const root = document.getElementById('exchange');
  if (!root) return;
  const x = s => root.querySelector(s);
  let quote = 'ETH', filter = 'Trending';
  const balance = 0; // exchange spot balance

  /* quote currency chips */
  const qBox = x('#exQuote');
  if (qBox) {
    qBox.innerHTML = ['ETH', 'BTC', 'USDC', 'USDT'].map(c => `<button class="ex-chip ${c === quote ? 'on' : ''}">${c}</button>`).join('');
    qBox.onclick = e => {
      if (!e.target.classList.contains('ex-chip')) return;
      quote = e.target.textContent;
      qBox.querySelectorAll('.ex-chip').forEach(b => b.classList.toggle('on', b === e.target));
      if (x('#exBalLbl')) x('#exBalLbl').textContent = quote + ' Spot balance';
      if (x('#exCur')) x('#exCur').innerHTML = quote + ' &#8644;';
      validate();
    };
  }

  /* amount, percent chips, error message */
  const inp = x('#exIn'), box = x('#exAmt'), err = x('#exErr');
  function validate() {
    if (!inp || !box || !err) return;
    const v = parseFloat(inp.value) || 0;
    const bad = balance <= 0 || v > balance;
    box.classList.toggle('err', bad);
    err.innerHTML = balance <= 0
      ? `No funds available in ${quote} Spot. <a href="#">Add funds</a>`
      : v > balance ? 'Amount exceeds your balance.' : '';
  }
  if (inp) inp.oninput = validate;
  if (err) err.onclick = e => { if (e.target.tagName === 'A') { e.preventDefault(); openSheet('deposit'); } };
  root.querySelectorAll('.ex-pct button').forEach(b => b.onclick = () => {
    if (inp) inp.value = (balance * parseFloat(b.dataset.p)).toFixed(5);
    validate();
  });
  if (x('.ex-buy')) {
    x('.ex-buy').onclick = () => {
      const v = parseFloat(inp.value) || 0;
      if (balance <= 0) return toast('No funds available in ' + quote + ' Spot');
      if (v <= 0) return toast('Enter an amount');
      if (v > balance) return toast('Amount exceeds your balance');
      toast('Order placed (simulation)');
    };
  }
  [x('.ex-pair'), x('.ex-adv'), x('.ex-more'), x('#exCur'), x('.actions .circle:not(.red)')]
    .filter(Boolean)
    .forEach(b => b.addEventListener('click', () => toast('Not available in the simulation')));
  validate();

  /* markets list */
  const data = [
    ['DOGE/USDT', '197.52M', '0.07661',    0.88, '#c2a633', 'D', 1],
    ['DOGE/BTC',  '42.67M',  '0.00000095', 1.06, '#c2a633', 'D', 2],
    ['ADA/USDT',  '40.46M',  '0.2032',    -0.39, '#1f4fd8', 'A', 3],
    ['XRP/USDT',  '35.67M',  '1.2932',     1.76, '#111111', 'X', 4],
    ['TRX/USDT',  '22.35M',  '0.3288',    -0.21, '#e0243a', 'T', 5]
  ];
  function exSpark(seed, up) {
    let y = 18; const pts = [];
    for (let i = 0; i < 24; i++) {
      y += Math.sin(i * seed * 0.7) * 3 + (up ? -0.25 : 0.25);
      pts.push(`${(i * 80 / 23).toFixed(1)},${Math.min(27, Math.max(3, y)).toFixed(1)}`);
    }
    return `<svg viewBox="0 0 80 30"><polyline points="${pts.join(' ')}" fill="none" stroke="${up ? '#00a79e' : '#cc2e3d'}" stroke-width="1.5"/></svg>`;
  }
  function render() {
    const qEl = x('#exQ');
    if (!qEl || !x('#exList')) return;
    const term = qEl.value.trim().toLowerCase();
    let rows = data.filter(r => r[0].toLowerCase().includes(term));
    if (filter === 'Gainers') rows = rows.filter(r => r[3] > 0);
    if (filter === 'Losers') rows = rows.filter(r => r[3] < 0);
    x('#exList').innerHTML = rows.map(r => `
      <div class="ex-row">
        <div class="nm"><span class="ex-coin" style="background:${r[4]}">${r[5]}</span><div><b>${r[0]}</b><small>Vol ${r[1]}</small></div></div>
        <div>${exSpark(r[6], r[3] > 0)}</div>
        <div class="px"><b>${r[2]}</b><small class="${r[3] > 0 ? 'up' : 'dn'}">${r[3] > 0 ? '+' : ''}${r[3].toFixed(2)}%</small></div>
      </div>`).join('') || '<p class="muted" style="text-align:center;padding:24px 0">No pairs found</p>';
  }
  const tabs = x('#exTabs');
  if (tabs) {
    tabs.innerHTML = ['Trending', 'Gainers', 'Losers'].map(t => `<button class="ex-chip ${t === filter ? 'on' : ''}">${t}</button>`).join('');
    tabs.onclick = e => {
      if (!e.target.classList.contains('ex-chip')) return;
      filter = e.target.textContent;
      tabs.querySelectorAll('.ex-chip').forEach(b => b.classList.toggle('on', b === e.target));
      render();
    };
  }
  if (x('#exQ')) x('#exQ').oninput = render;
  render();
})();
