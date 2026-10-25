const state = { mode: 'real', hidden: false, balance: { real: 0, demo: 10000 }, action: 'deposit' };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function renderBalance() {
  const v = state.hidden ? '****' : fmt(state.balance[state.mode]);
  $$('.bal').forEach(e => e.textContent = v);
  $$('.bal-acc').forEach(e => {
    const t = e.dataset.type;
    const share = t === 'cfd' ? 0 : state.balance[state.mode];
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
$$('.promo .x').forEach(b => b.onclick = () => { b.closest('.promo').remove(); if (!$('.promo')) $('#promos').remove(); });
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
