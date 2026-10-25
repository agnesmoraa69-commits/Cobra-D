// ---- Supabase setup ----
const SUPABASE_URL = "https://bcfdxpkmusxprwbastcl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cKzbQZxpnEiK1-WbjC-LAg_HJJeUQog";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
// ---- end Supabase setup ----

const $ = (s) => document.querySelector(s);

// Mobile menu toggle
const mobileToggle = $('.mobile-toggle');
if (mobileToggle) {
  mobileToggle.onclick = () => $('.nav-links').classList.toggle('open');
}

document.querySelectorAll('.nav-links a').forEach(a => 
  a.addEventListener('click', () => {
    const navLinks = $('.nav-links');
    if (navLinks) navLinks.classList.remove('open');
  })
);

let mode = 'signup';
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  mode = b.dataset.mode;
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#formTitle').textContent = mode === 'signup' ? 'Create your practice account' : 'Welcome back';
  const goBtn = $('#go') || $('#authForm button[type="submit"]') || document.querySelector('.cta');
  if (goBtn) goBtn.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  $('#err').textContent = '';
});

// Handle button click directly instead of form submit
const handleAuth = async () => {
  const nameInput = $('#name');
  const emailInput = $('#email');
  const passwordInput = $('#password');
  const errDiv = $('#err');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (mode === 'signup' && !name) { 
    if (errDiv) errDiv.textContent = 'Enter your name.'; 
    return; 
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) { 
    if (errDiv) errDiv.textContent = 'Enter a valid email address.'; 
    return; 
  }
  if (!password || password.length < 6) { 
    if (errDiv) errDiv.textContent = 'Password must be at least 6 characters.'; 
    return; 
  }

  if (!supabaseClient) {
    if (errDiv) errDiv.textContent = 'Database connection error.';
    alert('Supabase client failed to initialize.');
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
      if (errDiv) errDiv.textContent = result.error.message;
      alert('Supabase Error: ' + result.error.message);
      return;
    }

    localStorage.setItem('astrol-user', JSON.stringify({ name: name || email, email }));
    window.location.href = 'home.html';
  } catch (err) {
    if (errDiv) errDiv.textContent = 'An unexpected error occurred.';
    alert('Error: ' + err.message);
    console.error(err);
  }
};

// Bind to form submit OR direct button click
const authForm = $('#authForm');
if (authForm) {
  authForm.addEventListener('submit', e => {
    e.preventDefault();
    handleAuth();
  });
}

// Fallback: Bind directly to the Create Account button just in case
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.includes('Create account') || btn.textContent.includes('Sign in')) {
    btn.addEventListener('click', e => {
      e.preventDefault();
      handleAuth();
    });
  }
});
