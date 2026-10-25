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
$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#name').value.trim(), email = $('#email').value.trim();
  const password = $('#password').value.trim(); // Make sure you have a password input in your HTML, or hardcode a default one for now
  
  if (!name) { $('#err').textContent = 'Enter your name.'; return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { $('#err').textContent = 'Enter a valid email address.'; return; }

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password || 'defaultPassword123', // temporary default if you don't have a password field yet
    options: {
      data: { full_name: name }
    }
  });

  if (error) {
    $('#err').textContent = error.message;
    return;
  }

  location.href = 'home.html';
});

