const loginForm = document.getElementById('login-form');
const authMessageEl = document.getElementById('auth-message');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      if (authMessageEl) authMessageEl.textContent = 'Email and password are required.';
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = '/';
      } else {
        if (authMessageEl) authMessageEl.textContent = data.error || 'Login failed.';
      }
    } catch (err) {
      console.error(err);
      if (authMessageEl) authMessageEl.textContent = 'Login failed.';
    }
  });
}
