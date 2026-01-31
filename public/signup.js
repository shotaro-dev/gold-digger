const signupForm = document.getElementById('signup-form');
const authMessageEl = document.getElementById('auth-message');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!name || !username || !email || !password) {
      if (authMessageEl) authMessageEl.textContent = 'Name, username, email and password are required.';
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, username, email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = 'login.html';
      } else {
        if (authMessageEl) authMessageEl.textContent = data.error || 'Registration failed.';
      }
    } catch (err) {
      console.error(err);
      if (authMessageEl) authMessageEl.textContent = 'Registration failed.';
    }
  });
}
