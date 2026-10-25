// ---- Supabase setup ----
const SUPABASE_URL = "https://bcfdxpkmusxprwbastcl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cKzbQZxpnEiK1-WbjC-LAg_HJJeUQog";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
// ---- end Supabase setup ----

const $ = (s) => document.querySelector(s);

$('.mobile-toggle').onclick = () => $('.nav-links').classList.toggle('open');
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => $('.nav-links').classList.remove('open')));

let mode = 'signup';
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  mode = b.dataset.mode;
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#formTitle').textContent = mode === 'signup' ? 'Create your practice account' : 'Welcome back';
  $('#go').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  $('#err').textContent = '';
});

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  const password = $('#password').value;

  if (mode === 'signup' && !name) { 
    $('#err').textContent = 'Enter your name.'; 
    return; 
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) { 
    $('#err').textContent = 'Enter a valid email address.'; 
    return; 
  }
  if (!password || password.length < 6) { 
    $('#err').textContent = 'Password must be at least 6 characters.'; 
    return; 
  }

  try {
    let result;
    if (mode === 'signup') {
      result = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: name } }
      });
    } else {
      result = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });
    }

    if (result.error) {
      $('#err').textContent = result.error.message;
      return;
    }

    localStorage.setItem('astrol-user', JSON.stringify({ name: name || email, email }));
    location.href = 'home.html';
  } catch (err) {
    $('#err').textContent = 'An unexpected error occurred.';
    console.error(err);
  }
});
