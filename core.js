const SUPABASE_URL = 'https://rutjwvhdvxvqzsrehdkr.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_DqQDIe_ouatcErPlW3H7tw_lo6y3Vmi';

// Create the Supabase client once. The CDN script must load before this file.
let sbClient = null;
try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.sb = sbClient;          // preferred name
    window.supabase = sbClient;    // kept so other pages (script.js) keep working
  } else if (window.supabase && window.supabase.auth) {
    sbClient = window.supabase;    // already a client
    window.sb = sbClient;
  } else {
    console.error('Supabase library not loaded. Check the CDN script tag comes before core.js.');
  }
} catch (e) {
  console.error('Supabase initialization error:', e);
}

// Market simulation and utility variables
const MK=[
 {name:'Volatility 100 (1s) Index',n:'100',s1:1,price:1036.67,vol:.0009},
 {name:'Volatility 25 Index',n:'25',price:2781.20,vol:.0005},
 {name:'Volatility 10 (1s) Index',n:'10',s1:1,price:9380.47,vol:.0003},
 {name:'Volatility 25 (1s) Index',n:'25',s1:1,price:912238.10,vol:.0005},
 {name:'Volatility 50 Index',n:'50',price:245.88,vol:.0007},
 {name:'Volatility 75 (1s) Index',n:'75',s1:1,price:4510.32,vol:.0008}
];
const PAYOUT=1.95;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
let S;try{S=JSON.parse(localStorage.getItem('astrol'))}catch(e){}
S=S||{mode:'demo',bal:{real:0,demo:10000},pos:[],fav:[]};
S.cfd=S.cfd||{real:0,demo:0};S.exch=S.exch||{real:0,demo:0};
const save=()=>{try{localStorage.setItem('astrol',JSON.stringify(S))}catch(e){}};

// ---- Load balances from the Supabase "profiles" table (edit them there, site follows) ----
async function loadProfile(){
  try{
    const c=window.sb;if(!c||!c.auth)return false;
    const {data:{session}}=await c.auth.getSession();
    if(!session)return false;
    const {data,error}=await c.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
    if(error||!data)return false;
    const n=v=>Number(v)||0;
    S.bal.real=n(data.real_balance);S.bal.demo=n(data.demo_balance);
    S.cfd.real=n(data.real_cfd);S.cfd.demo=n(data.demo_cfd);
    S.exch.real=n(data.real_exchange);S.exch.demo=n(data.demo_exchange);
    if(data.active_account_type==='real'||data.active_account_type==='demo')S.mode=data.active_account_type;
    save();return true;
  }catch(e){console.warn('Profile load skipped:',e&&e.message);return false}
}
async function pullProfile(){
  const before=S.mode;
  const ok=await loadProfile();
  if(ok){if(S.mode!==before)renderHead();else renderBal();window.onProfile&&window.onProfile()}
  return ok;
}
MK.forEach(m=>{let p=m.price;m.hist=[];for(let i=0;i<150;i++){m.hist.unshift(p);p/=1+(Math.random()-.5)*2*m.vol}});
function toast(t){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';document.body.append(e)}e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2200)}
function settle(){const now=Date.now();let ch=false;
 S.pos.forEach(p=>{if(p.status!=='open'||now<p.end)return;
  const x=MK[p.m].price,d=Math.floor(x*100)%10;let w;
  if(p.side==='Rise')w=x>p.entry;else if(p.side==='Fall')w=x<p.entry;
  else if(p.side==='Even')w=d%2===0;else if(p.side==='Odd')w=d%2===1;
  else if(p.side==='Over 4')w=d>4;else w=d<5;
  p.status=w?'won':'lost';p.exit=x;p.pnl=w?+(p.stake*(PAYOUT-1)).toFixed(2):-p.stake;
  if(w)S.bal[p.mode]+=p.stake*PAYOUT;ch=true;toast((w?'Won ':'Lost ')+fmt(Math.abs(p.pnl))+' USD')});
 if(ch)save();return ch}
function renderHead(){
 if(!$('#head'))return; // landing page has no platform header
 $('#head').innerHTML=`<div class="hrow"><a class="brand" href="index.html">COBRA</a>
 <div class="toggle"><button data-m="real">Real</button><button data-m="demo">Demo</button></div></div>
 <div class="bl">Total trading value</div>
 <div class="bv"><span id="bv"></span> <small>USD</small><button class="fund" id="fund">+ Add</button></div>`;
 $$('.toggle button').forEach(b=>b.onclick=()=>{S.mode=b.dataset.m;save();renderHead();window.onMode&&window.onMode()});
 $('#fund').onclick=()=>{if(S.mode==='demo'){S.bal.demo+=10000;save();renderBal();toast('Added 10,000.00 demo funds')}else toast('Real deposits are not available in the simulation')};
 $$('.toggle button').forEach(b=>b.classList.toggle('on',b.dataset.m===S.mode));renderBal()}
function renderBal(){const e=$('#bv');if(e)e.textContent=fmt(S.bal[S.mode])}
function renderNav(page){
 if(!$('#nav'))return; // landing page has no bottom nav
 $('#nav').innerHTML=[['index.html','Home','home'],['markets.html','Markets','markets'],['trade.html','Trade','trade'],['positions.html','Positions','positions']]
 .map(l=>`<a href="${l[0]}" class="${l[2]===page?'on':''}">${l[1]}</a>`).join('')}
function spark(m){const h=m.hist.slice(-30),lo=Math.min(...h),hi=Math.max(...h),r=hi-lo||1;
 return h.map((p,k)=>`${k/29*70},${34-(p-lo)/r*32}`).join(' ')}
const chg=m=>(m.price/m.hist[m.hist.length-31]-1)*100;
setInterval(()=>{MK.forEach(m=>{m.price*=1+(Math.random()-.5)*2*m.vol;m.hist.push(m.price);m.hist.shift()});
 if(settle())renderBal();window.onTick&&window.onTick()},1000);
document.addEventListener('DOMContentLoaded',()=>{renderHead();renderNav(document.body.dataset.page);window.init&&window.init();pullProfile()});
setInterval(pullProfile,15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)pullProfile()});
