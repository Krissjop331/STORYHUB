
/*! auth-utils.js
 * Simple auth helper for static hosting using /users.json
 * Stores session in sessionStorage key STORYHUB_user_data (compatible with existing code).
 */
(function () {
  const SESSION_KEY = 'STORYHUB_user_data';
  const USERS_URL = '/users.json';

  async function loadUsers(noCache = false) {
    const url = noCache ? `${USERS_URL}?_=${Date.now()}` : USERS_URL;
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error(`Не удалось загрузить users.json (${res.status})`);
    }
    return await res.json();
  }

  async function sha256Hex(text) {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const arr = Array.from(new Uint8Array(hash));
    return arr.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function saveSession(user) {
    const payload = {
      username: user.username,
      role: user.role,
      fullName: user.fullName || user.username,
      userId: user.id,
      loginAt: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    // optional: redirect to login
  }

  // Guard helpers
  function requireAuth() {
    const s = getSession();
    if (!s) {
      // Try to be graceful if used on static page
      alert('Нужно войти в систему.');
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }

  function requireAdmin() {
    const s = getSession();
    if (!s || s.role !== 'admin') {
      alert('Недостаточно прав (только администратор).');
      window.location.href = '/index.html';
      return false;
    }
    return true;
  }

  async function login(username, password) {
    const users = await loadUsers(true);
    const target = users.find(u => u.username.trim().toLowerCase() === String(username).trim().toLowerCase() && u.active !== false);
    if (!target) return { ok: false, reason: 'not_found' };
    const hash = await sha256Hex(password);
    if (hash !== target.passwordHash) return { ok: false, reason: 'bad_password' };
    saveSession(target);
    return { ok: true, user: target };
  }

  window.Auth = { loadUsers, sha256Hex, saveSession, getSession, logout, requireAuth, requireAdmin, login };
})();
