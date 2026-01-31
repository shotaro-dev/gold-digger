/**
 * Shared nav: show Log in / Sign up when guest, show user name + Log out when logged in.
 * Include this script on every page that has #nav-guest and #nav-user.
 */
(function () {
  function updateNav() {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (user) {
        var guest = document.getElementById('nav-guest');
        var userSpan = document.getElementById('nav-user');
        var nameEl = document.getElementById('nav-user-name');
        var logoutBtn = document.getElementById('nav-logout');
        if (user && guest && userSpan) {
          guest.hidden = true;
          userSpan.hidden = false;
          if (nameEl) nameEl.textContent = user.name;
          if (logoutBtn) {
            logoutBtn.onclick = function () {
              fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                .then(function () { window.location.href = '/'; });
            };
          }
        } else if (guest && userSpan) {
          guest.hidden = false;
          userSpan.hidden = true;
        }
      })
      .catch(function () {
        var guest = document.getElementById('nav-guest');
        var userSpan = document.getElementById('nav-user');
        if (guest && userSpan) {
          guest.hidden = false;
          userSpan.hidden = true;
        }
      });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNav);
  } else {
    updateNav();
  }
})();
