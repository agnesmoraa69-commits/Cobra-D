// Link script.js directly to the global engine state S from core.js
if (typeof S === 'undefined') {
  var S = { mode: 'demo', bal: { real: 0, demo: 10000 }, pos: [], fav: [] };
}
const uiState = { hidden: false, action: 'deposit' };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function renderBalance() {
  const v = state.hidden ? '****' : fmt(state.balance[state.mode]);
  $$('.bal').forEach(e => e.textContent = v);
  $$('.bal-acc').forEach(e => {
    const t = e.dataset.type;
    const share = t === 'options' ? state.balance[state.mode] : 0;
    e.textContent = state.hidden ? '****' : fmt(share);
  });
  $$('.toggle button').forEach(b => b.classList.toggle('on', b.dataset.mode === state.mode));
}

function showTab(name) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === name));
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  window.scrollTo(0, 0);
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 2200);
}

function openSheet(action) {
  state.action = action;
  $('#sheetTitle').textContent = action[0].toUpperCase() + action.slice(1);
  $('#amount').value = '';
  $('#sheet').hidden = false;
  $('#amount').focus();
}

$$('#tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
$$('[data-go]').forEach(b => b.onclick = () => showTab(b.dataset.go));
$$('.toggle button').forEach(b => b.onclick = () => { state.mode = b.dataset.mode; renderBalance(); });
$$('.eye').forEach(b => b.onclick = () => { state.hidden = !state.hidden; renderBalance(); });
$$('.refresh').forEach(b => b.onclick = () => { renderBalance(); toast('Balance updated'); });
$$('.open-deposit').forEach(b => b.onclick = () => openSheet('deposit'));
$$('.open-withdraw').forEach(b => b.onclick = () => openSheet('withdraw'));
$$('.open-transfer').forEach(b => b.onclick = () => openSheet('transfer'));
$('#tradeBtn').onclick = () => $('#markets').scrollIntoView({ behavior: 'smooth' });
$('#cancel').onclick = () => $('#sheet').hidden = true;
$('#sheet').onclick = e => { if (e.target.id === 'sheet') e.currentTarget.hidden = true; };

$('#confirm').onclick = () => {
  const amt = parseFloat($('#amount').value);
  if (!amt || amt <= 0) return toast('Enter an amount above 0');
  const cur = state.balance[state.mode];
  if (state.action === 'deposit') state.balance[state.mode] += amt;
  else if (amt > cur) return toast('Amount is higher than your balance');
  else if (state.action === 'withdraw') state.balance[state.mode] -= amt;
  $('#sheet').hidden = true;
  renderBalance();
  toast(state.action[0].toUpperCase() + state.action.slice(1) + ' complete');
};

/* Simulated markets */
const markets = [
  { name: 'Volatility 100 (1s) Index', n: '100', s1: true, price: 1036.67, vol: 0.0009 },
  { name: 'Volatility 25 Index', n: '25', price: 2781.20, vol: 0.0005 },
  { name: 'Volatility 10 (1s) Index', n: '10', s1: true, price: 9380.47, vol: 0.0003 },
  { name: 'Volatility 25 (1s) Index', n: '25', s1: true, price: 912238.10, vol: 0.0005 },
  { name: 'Volatility 50 Index', n: '50', price: 245.88, vol: 0.0007 },
  { name: 'Volatility 75 (1s) Index', n: '75', s1: true, price: 4510.32, vol: 0.0008 }
];
markets.forEach(m => { m.hist = Array.from({ length: 30 }, () => m.price); });

function buildMarkets() {
  $('#markets').innerHTML = markets.map((m, i) => `
    <div class="mk" data-i="${i}">
      <div class="ico"><span class="num">${m.n}</span>${m.s1 ? '<span class="s1">1s</span>' : ''}</div>
      <div class="nm">${m.name}</div>
      <div class="px"></div>
      <div class="ft"><svg viewBox="0 0 70 40" preserveAspectRatio="none"><polyline/></svg><span class="pc"></span></div>
    </div>`).join('');
}

function tick() {
  markets.forEach((m, i) => {
    m.price *= 1 + (Math.random() - 0.5) * 2 * m.vol;
    m.hist.push(m.price); m.hist.shift();
    const card = $(`.mk[data-i="${i}"]`);
    if (!card) return;
    const lo = Math.min(...m.hist), hi = Math.max(...m.hist), rng = hi - lo || 1;
    const pts = m.hist.map((p, k) => `${(k / 29) * 70},${38 - ((p - lo) / rng) * 36}`).join(' ');
    const chg = (m.price / m.hist[0] - 1) * 100;
    const cls = chg >= 0 ? 'up' : 'dn';
    $('.px', card).textContent = fmt(m.price);
    const pl = $('polyline', card); pl.setAttribute('points', pts); pl.style.stroke = chg >= 0 ? '#00a79e' : '#cc2e3d';
    const pc = $('.pc', card); pc.className = 'pc ' + cls;
    pc.innerHTML = `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% <span class="muted">(5m)</span>`;
  });
}

buildMarkets(); tick(); renderBalance();
setInterval(tick, 1000);

/* Home page extras */
let au = {}; try { au = JSON.parse(localStorage.getItem('astrol-user')) || {}; } catch (e) {}
const uname = au.name || 'Astrol trader';
const ini = uname.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
['#avatar', '#pav'].forEach(s => $(s).textContent = ini);
$('#pname').textContent = uname;

const slides = [['Make your first deposit', 'Deposit now', 'deposit'], ['Practise with demo funds', 'Start trading', 'options']];
let si = 0;
function setSlide(i) { si = i; $('#bt').textContent = slides[i][0]; $('#bc').textContent = slides[i][1]; $$('#banner .dots i').forEach((d, k) => d.classList.toggle('on', k === i)); }
$('#bc').onclick = () => slides[si][2] === 'deposit' ? openSheet('deposit') : showTab('options');
setInterval(() => setSlide((si + 1) % slides.length), 5000);

$$('[data-go]').forEach(b => b.onclick = () => showTab(b.dataset.go));
$$('[data-toast]').forEach(b => b.onclick = () => toast(b.dataset.toast));
$('#addAcc').onclick = () => toast('Extra accounts are not available in the simulation');
$('#avatar').onclick = () => showTab('profile');
$('#bellBtn').onclick = () => showTab('notifs');
$('.bell2').onclick = () => showTab('notifs');
$$('.back').forEach(b => b.onclick = () => showTab('home'));
$('#idpill').onclick = () => { try { navigator.clipboard.writeText('as01....7f2c'); } catch (e) {} toast('Account ID copied'); };
$('#mobcard .x').onclick = () => $('#mobcard').remove();
$('#closeAcc').onclick = () => { state.balance.demo = 10000; state.balance.real = 0; renderBalance(); toast('Demo account reset'); };
$$('.eye').forEach(b => b.addEventListener('click', () => $$('.eye use').forEach(u => u.setAttribute('href', state.hidden ? '#i-eye-off' : '#i-eye'))));

function buildDots() {
  const n = $$('#promos .promo').length, box = $('#pdots');
  if (!n) { $('#promos').remove(); box.remove(); return; }
  box.innerHTML = '<i></i>'.repeat(n); markDot();
}
function markDot() {
  const p = $('#promos'); if (!p) return;
  const c = $$('#promos .promo'); if (!c.length) return;
  const idx = Math.min(c.length - 1, Math.round(p.scrollLeft / (c[0].offsetWidth + 14)));
  $$('#pdots i').forEach((d, k) => d.classList.toggle('on', k === idx));
}
$('#promos').addEventListener('scroll', markDot);
$$('#promos .x').forEach(b => b.onclick = () => { b.closest('.promo').remove(); buildDots(); });
buildDots();

$('#hln').onclick = () => $('#hl').scrollBy({ left: 260, behavior: 'smooth' });
$('#hlp').onclick = () => $('#hl').scrollBy({ left: -260, behavior: 'smooth' });
/* ===== EXCHANGE PAGE (add at the very bottom of script.js) ===== */
(function () {
  const root = document.getElementById('exchange');
  const x = s => root.querySelector(s);
  let quote = 'ETH', filter = 'Trending';
  const balance = 0; // exchange spot balance

  /* quote currency chips */
  const qBox = x('#exQuote');
  qBox.innerHTML = ['ETH', 'BTC', 'USDC', 'USDT'].map(c => `<button class="ex-chip ${c === quote ? 'on' : ''}">${c}</button>`).join('');
  qBox.onclick = e => {
    if (!e.target.classList.contains('ex-chip')) return;
    quote = e.target.textContent;
    qBox.querySelectorAll('.ex-chip').forEach(b => b.classList.toggle('on', b === e.target));
    x('#exBalLbl').textContent = quote + ' Spot balance';
    x('#exCur').innerHTML = quote + ' &#8644;';
    validate();
  };

  /* amount, percent chips, error message */
  const inp = x('#exIn'), box = x('#exAmt'), err = x('#exErr');
  function validate() {
    const v = parseFloat(inp.value) || 0;
    const bad = balance <= 0 || v > balance;
    box.classList.toggle('err', bad);
    err.innerHTML = balance <= 0
      ? `No funds available in ${quote} Spot. <a href="#">Add funds</a>`
      : v > balance ? 'Amount exceeds your balance.' : '';
  }
  inp.oninput = validate;
  err.onclick = e => { if (e.target.tagName === 'A') { e.preventDefault(); openSheet('deposit'); } };
  root.querySelectorAll('.ex-pct button').forEach(b => b.onclick = () => {
    inp.value = (balance * parseFloat(b.dataset.p)).toFixed(5);
    validate();
  });
  x('.ex-buy').onclick = () => {
    const v = parseFloat(inp.value) || 0;
    if (balance <= 0) return toast('No funds available in ' + quote + ' Spot');
    if (v <= 0) return toast('Enter an amount');
    if (v > balance) return toast('Amount exceeds your balance');
    toast('Order placed (simulation)');
  };
  [x('.ex-pair'), x('.ex-adv'), x('.ex-more'), x('#exCur'), x('.actions .circle:not(.red)')]
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
  function spark(seed, up) {
    let y = 18; const pts = [];
    for (let i = 0; i < 24; i++) {
      y += Math.sin(i * seed * 0.7) * 3 + (up ? -0.25 : 0.25);
      pts.push(`${(i * 80 / 23).toFixed(1)},${Math.min(27, Math.max(3, y)).toFixed(1)}`);
    }
    return `<svg viewBox="0 0 80 30"><polyline points="${pts.join(' ')}" fill="none" stroke="${up ? '#00a79e' : '#cc2e3d'}" stroke-width="1.5"/></svg>`;
  }
  function render() {
    const term = x('#exQ').value.trim().toLowerCase();
    let rows = data.filter(r => r[0].toLowerCase().includes(term));
    if (filter === 'Gainers') rows = rows.filter(r => r[3] > 0);
    if (filter === 'Losers') rows = rows.filter(r => r[3] < 0);
    x('#exList').innerHTML = rows.map(r => `
      <div class="ex-row">
        <div class="nm"><span class="ex-coin" style="background:${r[4]}">${r[5]}</span><div><b>${r[0]}</b><small>Vol ${r[1]}</small></div></div>
        <div>${spark(r[6], r[3] > 0)}</div>
        <div class="px"><b>${r[2]}</b><small class="${r[3] > 0 ? 'up' : 'dn'}">${r[3] > 0 ? '+' : ''}${r[3].toFixed(2)}%</small></div>
      </div>`).join('') || '<p class="muted" style="text-align:center;padding:24px 0">No pairs found</p>';
  }
  const tabs = x('#exTabs');
  tabs.innerHTML = ['Trending', 'Gainers', 'Losers'].map(t => `<button class="ex-chip ${t === filter ? 'on' : ''}">${t}</button>`).join('');
  tabs.onclick = e => {
    if (!e.target.classList.contains('ex-chip')) return;
    filter = e.target.textContent;
    tabs.querySelectorAll('.ex-chip').forEach(b => b.classList.toggle('on', b === e.target));
    render();
  };
  x('#exQ').oninput = render;
  render();
})();
