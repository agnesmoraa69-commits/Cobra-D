(function () {
const $ = (s) => document.querySelector(s);

$('.mobile-toggle').onclick = () => $('.nav-links').classList.toggle('open');
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => $('.nav-links').classList.remove('open')));

let mode = 'signup';

function applyMode() {
  const title = $('#formTitle');
  if (title) title.textContent = mode === 'signup' ? 'Create your practice account' : 'Welcome back';
  const goBtn = $('#go');
  if (goBtn) goBtn.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  const nameWrap = $('#nameWrap');
  if (nameWrap) nameWrap.style.display = mode === 'signup' ? '' : 'none';
  const errEl = $('#err');
  if (errEl) errEl.textContent = '';
}

document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  mode = b.dataset.mode;
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  applyMode();
});

// Find the real Supabase client (created in core.js), not the CDN library.
function getClient() {
  const candidates = [window.sb, window.supabaseClient, window.supabase];
  for (const c of candidates) {
    if (c && c.auth && typeof c.auth.signUp === 'function') return c;
  }
  return null;
}

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();

  const name = $('#name') ? $('#name').value.trim() : '';
  const email = $('#email') ? $('#email').value.trim() : '';
  const password = $('#password') ? $('#password').value : '';
  const errEl = $('#err');
  const goBtn = $('#go');

  const showError = (msg) => {
    console.error('Auth Error:', msg);
    if (errEl) errEl.textContent = msg;
    else alert(msg);
  };

  if (errEl) errEl.textContent = '';

  if (mode === 'signup' && !name) return showError('Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return showError('Enter a valid email address.');
  if (password.length < 6) return showError('Password must be at least 6 characters.');

  const client = getClient();
  if (!client) {
    return showError('Supabase client not found. In core.js, add: window.sb = window.supabase.createClient(URL, ANON_KEY);');
  }

  if (goBtn) goBtn.disabled = true;

  try {
    let userName = name;

    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) return showError(error.message);

      // Supabase returns an empty identities list when the email already exists.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return showError('This email is already registered. Use the Sign in tab.');
      }

      // No session means email confirmation is switched on in Supabase.
      if (!data.session) {
        if (errEl) errEl.textContent = '';
        alert('Account created. Check your email and confirm it, then sign in.');
        return;
      }
    } else {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return showError(error.message);
      userName = (data.user && data.user.user_metadata && data.user.user_metadata.full_name) || 'Trader';
    }

    try { localStorage.setItem('astrol-user', JSON.stringify({ name: userName, email })); } catch (x) {}
    location.href = 'home.html';
  } catch (err) {
    showError(err.message || 'Authentication failed.');
  } finally {
    if (goBtn) goBtn.disabled = false;
  }
});

applyMode();
})();
