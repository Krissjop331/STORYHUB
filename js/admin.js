
/*! admin.js
 * Admin UI for managing /users.json on a static host.
 * Note: cannot write server files directly; provides "Download users.json" to re-upload via hosting.
 */
(function () {
  const tableBody = () => document.querySelector('#usersTable tbody');
  const addForm = () => document.getElementById('addUserForm');
  const downloadBtn = () => document.getElementById('downloadJsonBtn');
  const importInput = () => document.getElementById('importJsonInput');
  const toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return alert(msg);
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2200);
  };

  let users = [];
  let nextId = 2; // updated after load
  let dirty = false;

  function render() {
    const tbody = tableBody();
    tbody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${escapeHtml(u.fullName || '')}</td>
        <td>${escapeHtml(u.username)}</td>
        <td><span class="role ${u.role}">${u.role}</span></td>
        <td>${u.active === false ? 'Нет' : 'Да'}</td>
        <td>${formatDate(u.updatedAt || u.createdAt)}</td>
        <td>
          <button class="btn danger small" data-action="delete" data-id="${u.id}">Удалить</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById('dirtyBadge').classList.toggle('hidden', !dirty);
  }

  function formatDate(s) {
    if (!s) return '';
    try { return new Date(s).toLocaleString(); } catch { return s; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.json';
    a.click();
    URL.revokeObjectURL(url);
    dirty = false;
    render();
    toast('Файл users.json скачан. Загрузите его в корень сайта на хостинге.');
  }

  async function onAddUser(e) {
    e.preventDefault();
    const form = addForm();
    const fullName = form.fullName.value.trim();
    const username = form.username.value.trim().toLowerCase();
    const password = form.password.value;
    const role = form.role.value;
    if (!fullName || !username || !password) {
      toast('Заполните ФИО, логин и пароль.');
      return;
    }
    if (users.some(u => u.username.toLowerCase() == username)) {
      toast('Пользователь с таким логином уже существует.');
      return;
    }
    const hash = await Auth.sha256Hex(password);
    const now = new Date().toISOString();
    const user = {
      id: nextId++,
      username,
      fullName,
      role,
      passwordHash: hash,
      createdAt: now,
      updatedAt: now,
      active: true
    };
    users.push(user);
    dirty = true;
    form.reset();
    render();
  }

  function onDeleteClick(e) {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const u = users.find(x => x.id === id);
    if (!u) return;
    const me = Auth.getSession();
    if (u.role === 'admin' && users.filter(x => x.role === 'admin').length <= 1) {
      toast('Нельзя удалить единственного администратора.');
      return;
    }
    if (me && me.userId === u.id) {
      toast('Нельзя удалить себя.');
      return;
    }
    if (!confirm(`Удалить пользователя "${u.fullName}" (${u.username})?`)) return;
    users = users.filter(x => x.id !== id);
    dirty = true;
    render();
  }

  function onImportJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('Некорректный формат');
        users = data;
        nextId = users.reduce((m, u) => Math.max(m, Number(u.id)||0), 0) + 1;
        dirty = true;
        render();
        toast('Импортирован локальный users.json (не забывайте скачать и перезалить на хостинг).');
      } catch (err) {
        alert('Ошибка чтения файла: ' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  async function init() {
    if (!Auth.requireAdmin()) return;
    try {
      const data = await Auth.loadUsers(true);
      users = Array.isArray(data) ? data : [];
      nextId = users.reduce((m, u) => Math.max(m, Number(u.id)||0), 0) + 1;
      render();
    } catch (e) {
      alert('Не удалось загрузить users.json: ' + e.message);
    }

    addForm().addEventListener('submit', onAddUser);
    document.getElementById('usersTable').addEventListener('click', onDeleteClick);
    downloadBtn().addEventListener('click', downloadJson);
    importInput().addEventListener('change', onImportJson);
  }

  // expose for debugging
  window.AdminUsers = { init };
  document.addEventListener('DOMContentLoaded', init);
})();
