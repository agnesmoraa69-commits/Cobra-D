const $=(s)=>document.querySelector(s);
$('.mobile-toggle').onclick=()=>$('.nav-links').classList.toggle('open');
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>$('.nav-links').classList.remove('open')));
let mode='signup';
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  mode=b.dataset.mode;
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  $('#formTitle').textContent=mode==='signup'?'Create your practice account':'Welcome back';
  $('#go').textContent=mode==='signup'?'Create account':'Sign in';
  $('#err').textContent='';
});
$('#authForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('#name').value.trim(),email=$('#email').value.trim();
  if(!name){$('#err').textContent='Enter your name.';return}
  if(!/^\S+@\S+\.\S+$/.test(email)){$('#err').textContent='Enter a valid email address.';return}
  try{localStorage.setItem('astrol-user',JSON.stringify({name,email}))}catch(x){}
  location.href='home.html';
});
