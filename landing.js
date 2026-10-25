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
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  
  if (!name) { $('#err').textContent = 'Enter your name.'; return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { $('#err').textContent = 'Enter a valid email address.'; return; }

  // Generate a reliable default password since there's no password input on the form
  const defaultPassword = 'CobraFXPassword123!';

  if (mode === 'signup') {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: defaultPassword,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      $('#err').textContent = error.message;
      return;
    }
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: defaultPassword
    });

    if (error) {
      $('#err').textContent = error.message;
      return;
    }
  }

  // Save user name locally for the avatar UI and head to home
  try { localStorage.setItem('astrol-user', JSON.stringify({ name, email })); } catch (x) {}
  location.href = 'home.html';
});

