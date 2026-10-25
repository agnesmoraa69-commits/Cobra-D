const $ = (s) => document.querySelector(s);

$('.mobile-toggle').onclick = () => $('.nav-links').classList.toggle('open');
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => $('.nav-links').classList.remove('open')));

let mode = 'signup';
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  mode = b.dataset.mode;
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  const title = $('#formTitle');
  if (title) title.textContent = mode === 'signup' ? 'Create your practice account' : 'Welcome back';
  const goBtn = $('#go');
  if (goBtn) goBtn.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  const errEl = $('#err');
  if (errEl) errEl.textContent = '';
});

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  const name = $('#name') ? $('#name').value.trim() : 'Trader';
  const email = $('#email') ? $('#email').value.trim() : '';
  const errEl = $('#err');

  const showError = (msg) => {
    console.error('Auth Error:', msg);
    if (errEl) errEl.textContent = msg;
    else alert(msg);
  };

  if (!name) return showError('Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return showError('Enter a valid email address.');

  const client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);

  if (!client || !client.auth) {
    showError('Supabase is still connecting. Please wait a second and try again.');
    return;
  }

  const defaultPassword = 'CobraFXPassword123!';

  try {
    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({
        email: email,
        password: defaultPassword,
        options: { data: { full_name: name } }
      });
      if (error) return showError(error.message);
    } else {
      const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: defaultPassword
      });
      if (error) return showError(error.message);
    }

    try { localStorage.setItem('astrol-user', JSON.stringify({ name, email })); } catch (x) {}
    location.href = 'home.html';
  } catch (err) {
    showError(err.message || 'An unexpected error occurred.');
  }
});
