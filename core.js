const SUPABASE_URL = 'https://rutjwvhdvxvqzsrehdkr.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_DqQDIe_ouatcErPlW3H7tw_lo6y3Vmi';

// Safely initialize supabase client globally with retry/fallback
let supabase;
try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabase = supabase;
  }
} catch (e) {
  console.error("Supabase direct init error:", e);
}

// Fallback: If window.supabase.createClient wasn't ready yet, attach a helper loader
if (!window.supabase || typeof window.supabase.auth?.signUp !== 'function') {
  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.supabase && typeof window.supabase.createClient === 'function' && !supabase?.auth) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = supabase;
      }
    } catch (err) {
      console.error("Delayed Supabase init error:", err);
    }
  });
}

// Balance and market simulation utilities below
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
const save=()=>{try{localStorage.setItem('astrol',JSON.stringify(S))}catch(e){}};
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
 $('#head').innerHTML=`<div class="hrow"><a class="brand" href="index.html">ASTROL</a>
 <div class="toggle"><button data-m="real">Real</button><button data-m="demo">Demo</button></div></div>
 <div class="bl">Total trading value</div>
 <div class="bv"><span id="bv"></span> <small>USD</small><button class="fund" id="fund">+ Add</button></div>`;
 $$('.toggle button').forEach(b=>b.onclick=()=>{S.mode=b.dataset.m;save();renderHead();window.onMode&&window.onMode()});
 $('#fund').onclick=()=>{if(S.mode==='demo'){S.bal.demo+=10000;save();renderBal();toast('Added 10,000.00 demo funds')}else toast('Real deposits are not available in the simulation')};
 $$('.toggle button').forEach(b=>b.classList.toggle('on',b.dataset.m===S.mode));renderBal()}
function renderBal(){const e=$('#bv');if(e)e.textContent=fmt(S.bal[S.mode])}
function renderNav(page){$('#nav').innerHTML=[['index.html','Home','home'],['markets.html','Markets','markets'],['trade.html','Trade','trade'],['positions.html','Positions','positions']]
 .map(l=>`<a href="${l[0]}" class="${l[2]===page?'on':''}">${l[1]}</a>`).join('')}
function spark(m){const h=m.hist.slice(-30),lo=Math.min(...h),hi=Math.max(...h),r=hi-lo||1;
 return h.map((p,k)=>`${k/29*70},${34-(p-lo)/r*32}`).join(' ')}
const chg=m=>(m.price/m.hist[m.hist.length-31]-1)*100;
setInterval(()=>{MK.forEach(m=>{m.price*=1+(Math.random()-.5)*2*m.vol;m.hist.push(m.price);m.hist.shift()});
 if(settle())renderBal();window.onTick&&window.onTick()},1000);
document.addEventListener('DOMContentLoaded',()=>{renderHead();renderNav(document.body.dataset.page);window.init&&window.init()});
