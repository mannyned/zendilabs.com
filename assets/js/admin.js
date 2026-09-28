(function () {
  'use strict';

  // Same Supabase project as the contact form (see assets/js/main.js for why).
  // Reading zendilabs_contact_messages requires a real signed-in session —
  // the publishable key alone does not grant read access (see
  // supabase/contact_messages.sql: the SELECT policy targets "authenticated",
  // not "anon"). Signing in below is what makes reads possible at all.
  var SUPABASE_URL = 'https://pyyurqyxcvvlsmmamcjm.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_pQDLD_sTOCCuZ_uL4dxxAA_manxN5rw';

  var loginView = document.getElementById('login-view');
  var dashboardView = document.getElementById('dashboard-view');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var signOutBtn = document.getElementById('sign-out-btn');
  var refreshBtn = document.getElementById('refresh-btn');
  var tbody = document.getElementById('messages-tbody');
  var emptyState = document.getElementById('empty-state');
  var loadingState = document.getElementById('loading-state');

  if (!loginView || typeof window.supabase === 'undefined') return;

  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value === null || value === undefined ? '' : String(value);
    return div.innerHTML;
  }

  function showLogin() {
    dashboardView.style.display = 'none';
    signOutBtn.style.display = 'none';
    loginView.style.display = 'block';
  }

  function showDashboard() {
    loginView.style.display = 'none';
    signOutBtn.style.display = 'inline-flex';
    dashboardView.style.display = 'block';
    loadMessages();
  }

  function loadMessages() {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    tbody.innerHTML = '';

    Promise.resolve(
      client
        .from('zendilabs_contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
    ).then(function (result) {
      loadingState.style.display = 'none';

      if (result.error) {
        tbody.innerHTML =
          '<tr><td colspan="10">Error loading messages: ' + escapeHtml(result.error.message) + '</td></tr>';
        return;
      }

      var rows = result.data || [];
      if (!rows.length) {
        emptyState.style.display = 'block';
        return;
      }

      rows.forEach(function (row) {
        var tr = document.createElement('tr');
        var date = row.created_at ? new Date(row.created_at).toLocaleString() : '';
        tr.innerHTML =
          '<td>' + escapeHtml(date) + '</td>' +
          '<td>' + escapeHtml(row.name) + '</td>' +
          '<td><a href="mailto:' + encodeURIComponent(row.email || '') + '">' + escapeHtml(row.email) + '</a></td>' +
          '<td>' + escapeHtml(row.company) + '</td>' +
          '<td>' + escapeHtml(row.phone) + '</td>' +
          '<td>' + escapeHtml(row.project_type) + '</td>' +
          '<td>' + escapeHtml(row.timeline) + '</td>' +
          '<td>' + escapeHtml(row.budget) + '</td>' +
          '<td>' + escapeHtml(row.contact_method) + '</td>' +
          '<td>' + escapeHtml(row.description) + '</td>';
        tbody.appendChild(tr);
      });
    });
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.style.display = 'none';

    var email = document.getElementById('admin-email').value.trim();
    var password = document.getElementById('admin-password').value;
    var submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    Promise.resolve(client.auth.signInWithPassword({ email: email, password: password }))
      .then(function (result) {
        if (result.error) {
          loginError.textContent = result.error.message;
          loginError.style.display = 'block';
          return;
        }
        showDashboard();
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      });
  });

  signOutBtn.addEventListener('click', function () {
    Promise.resolve(client.auth.signOut()).then(showLogin);
  });

  refreshBtn.addEventListener('click', loadMessages);

  Promise.resolve(client.auth.getSession()).then(function (result) {
    if (result.data && result.data.session) {
      showDashboard();
    } else {
      showLogin();
    }
  });

  client.auth.onAuthStateChange(function (_event, session) {
    if (session) {
      showDashboard();
    } else {
      showLogin();
    }
  });
})();
