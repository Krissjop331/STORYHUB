(() => {
  const app = document.getElementById('app');
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const sideLinks = Array.from(document.querySelectorAll('.side-link'));
  const logoutBtn = document.getElementById('logoutBtn');
  const exportUsersBtn = document.getElementById('exportUsersBtn');
  const exportLessonsBtn = document.getElementById('exportLessonsBtn');

  // Read auth from both storages (do not touch user's login design)
  const currentUser = JSON.parse(
    sessionStorage.getItem('STORYHUB_user_data') || localStorage.getItem('currentUser') || 'null'
  );
  if (!currentUser) {
    location.href = 'index.html';
  }

  let users = [];
  let lessons = [];

  function setActive(view) {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.view === view));
    sideLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.view === view));
  }
  function roleLabel(role) {
    return role === 'admin'
      ? 'Админ'
      : role === 'teacher' || role === 'Учитель'
      ? 'Учитель'
      : 'Ученик';
  }
  function roleClass(role) {
    return role === 'admin'
      ? 'admin'
      : role === 'teacher' || role === 'Учитель'
      ? 'teacher'
      : 'user';
  }

  async function loadUsers() {
    const r = await fetch('users.json');
    users = await r.json();
  }
  async function loadLessons() {
    const r = await fetch('data/lessons.json');
    lessons = await r.json();
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function navigateByRole(role) {
    if (role === 'admin') location.href = 'admin.html';
    else if (role === 'teacher' || role === 'Учитель') location.href = 'teacher.html';
    else location.href = 'lesson0.html';
  }

  function renderDashboard() {
    setActive('dashboard');
    const total = users.length;
    const students = users.filter((u) => u.role === 'user').length;
    const teachers = users.filter((u) => u.role === 'teacher').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const totalLessons = lessons.length;

    app.innerHTML = `
      <div class="header-hero">
        <div class="title">Админ-панель</div>
        <div class="chips">
          <span class="chip ok">Онлайн</span>
          <span class="chip warn">Demo</span>
        </div>
      </div>

      <div class="grid grid-4 section">
        <div class="card kpi soft"><div><h3>Всего пользователей</h3><div class="value">${total}</div></div></div>
        <div class="card kpi soft"><div><h3>Всего уроков</h3><div class="value">${totalLessons}</div></div></div>
        <div class="card kpi soft"><div><h3>Ученики</h3><div class="value">${students}</div></div></div>
        <div class="card kpi soft"><div><h3>Учителя / Админы</h3><div class="value">${teachers} / ${admins}</div></div></div>
      </div>

      <div class="grid grid-2 section">
        <div class="card">
          <h3>Последние уроки</h3>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>ID</th><th>Название</th><th>Ссылка</th></tr></thead>
              <tbody>
                ${lessons
                  .slice(-10)
                  .map(
                    (l) => `
                  <tr>
                    <td class="cell-id">#${l.id}</td>
                    <td>${l.title}</td>
                    <td>${l.url ? `<a href="${l.url}">Открыть</a>` : ''}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <h3>Новые пользователи</h3>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>ID</th><th>Пользователь</th><th>Роль</th></tr></thead>
              <tbody>
                ${users
                  .slice(-10)
                  .reverse()
                  .map(
                    (u) => `
                  <tr>
                    <td class="cell-id">#${u.id || '-'}</td>
                    <td><div class="user"><span class="avatar"></span><div><div style="font-weight:600">${
                      u.fullName || u.username
                    }</div><div class="student-meta">@${u.username}</div></div></div></td>
                    <td><span class="role ${roleClass(u.role)}">${roleLabel(u.role)}</span></td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderUsersByRole(role) {
    const view = role === 'user' ? 'students' : role === 'teacher' ? 'teachers' : 'admins';
    setActive(view);
    const title = role === 'user' ? 'Ученики' : role === 'teacher' ? 'Учителя' : 'Администраторы';
    const addLabel = role === 'user' ? 'Добавить ученика' : 'Добавить учителя';
    const filtered = users.filter((u) => u.role === role);

    app.innerHTML = `
      <div class="card" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">${title}</h2>
        <div style="display:flex;gap:8px">
          ${
            role !== 'admin'
              ? `<button id="addUserBtn" class="btn btn-primary">${addLabel}</button>`
              : ''
          }
          <button id="toAdminsBtn" class="btn btn-outline" ${
            role === 'admin' ? 'disabled' : ''
          }>Показать админов</button>
        </div>
      </div>

      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th>ID</th><th>Пользователь</th><th>Роль</th><th>Статус</th><th style="text-align:right">Действия</th></tr></thead>
          <tbody>
            ${filtered
              .map(
                (u) => `
              <tr>
                <td class="cell-id">#${u.id}</td>
                <td>
                  <div class="user">
                    <span class="avatar" title="${u.username}"></span>
                    <div>
                      <div style="font-weight:600">${u.fullName || u.username}</div>
                      <div style="font-size:12px;color:var(--muted)">@${u.username}</div>
                    </div>
                  </div>
                </td>
                <td><span class="role ${roleClass(u.role)}">${roleLabel(u.role)}</span></td>
                <td class="status">${u.active !== false ? 'Активен' : 'Отключен'}</td>
                <td>
                  <div class="actions">
                    <button class="action" data-act="view" data-id="${u.id}">Просмотр</button>
                    <button class="action" data-act="toggle" data-id="${u.id}">${
                  u.active !== false ? 'Отключить' : 'Включить'
                }</button>
                    <button class="action" data-act="open" data-id="${u.id}">Открыть как</button>
                  </div>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => openUserModal(role));
    }
    const toAdminsBtn = document.getElementById('toAdminsBtn');
    toAdminsBtn && toAdminsBtn.addEventListener('click', () => renderUsersByRole('admin'));

    app.querySelectorAll('.action').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = Number(btn.dataset.id);
        const act = btn.dataset.act;
        const user = users.find((x) => x.id === id);
        if (!user) return;
        if (act === 'view') {
          alert(`Пользователь: ${user.fullName || user.username}\nРоль: ${roleLabel(user.role)}`);
        }
        if (act === 'toggle') {
          user.active = !user.active;
          renderUsersByRole(role);
        }
        if (act === 'open') {
          const data = {
            username: user.username,
            role: user.role,
            name: user.fullName || user.username,
            loginTime: new Date().toISOString(),
          };
          sessionStorage.setItem('STORYHUB_user_data', JSON.stringify(data));
          localStorage.setItem(
            'currentUser',
            JSON.stringify({
              id: user.id,
              username: user.username,
              role: user.role,
              fullName: user.fullName || user.username,
            })
          );
          navigateByRole(user.role);
        }
      });
    });
  }

  function openUserModal(defaultRole) {
    const dlg = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    form.reset();
    form.role.value = defaultRole;
    dlg.showModal();
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const id = Math.max(0, ...users.map((u) => u.id || 0)) + 1;
      const now = new Date().toISOString();
      const hash = await sha256(data.password);
      users.push({
        id,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        passwordHash: hash,
        createdAt: now,
        updatedAt: now,
        active: true,
        class: parseInt(data.class || 5),
      });
      dlg.close();
      renderUsersByRole(data.role);
    };
  }

  async function sha256(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function exportUsers() {
    downloadJson('users.json', users);
  }
  function exportLessons() {
    downloadJson('lessons.json', lessons);
  }

  function renderLessons() {
    setActive('lessons');
    app.innerHTML = `
      <div class="card" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">Уроки</h2>
        <div style="display:flex;gap:8px">
          <button id="addLessonBtn" class="btn btn-primary">Добавить урок</button>
          <button id="exportLessonsTop" class="btn btn-outline">Экспорт уроков</button>
        </div>
      </div>

      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th>ID</th><th>Название</th><th>Описание</th><th>Тесты</th><th>Статус</th><th>Ссылка</th></tr></thead>
          <tbody id="lessonsBody">
            ${lessons
              .map(
                (l) => `
              <tr>
                <td class="cell-id">#${l.id}</td>
                <td>${l.title}</td>
                <td>${l.description || ''}</td>
                <td>${l.tests || 0}</td>
                <td><span class="role ${l.status === 'Готов' ? 'user' : 'teacher'}">${
                  l.status || 'Готов'
                }</span></td>
                <td>${l.url ? `<a href="${l.url}">Открыть</a>` : ''}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <p style="color:var(--muted);margin-top:10px">Этот список построен из ваших реальных файлов (lesson*.html). Добавление ниже — демо (в памяти), потом экспортируй в <code>lessons.json</code>.</p>
      </div>
    `;

    document.getElementById('addLessonBtn').addEventListener('click', () => {
      const dlg = document.getElementById('lessonModal');
      const form = document.getElementById('lessonForm');
      form.reset();
      dlg.showModal();
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const id = Math.max(0, ...lessons.map((l) => l.id || 0)) + 1;
        const obj = {
          id,
          title: data.title,
          description: data.description || '',
          tests: Number(data.tests || 0),
          status: data.status || 'Готов',
          url: data.url || '',
        };
        lessons.push(obj);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="cell-id">#${obj.id}</td><td>${obj.title}</td><td>${
          obj.description
        }</td><td>${obj.tests}</td><td><span class="role ${
          obj.status === 'Готов' ? 'user' : 'teacher'
        }">${obj.status}</span></td><td>${
          obj.url ? `<a href="${obj.url}">Открыть</a>` : ''
        }</td>`;
        document.getElementById('lessonsBody').appendChild(tr);
        dlg.close();
      };
    });

    document.getElementById('exportLessonsTop').onclick = exportLessons;
  }

  function renderDocs() {
    setActive('docs');
    app.innerHTML = `
      <div class="card docs">
        <h2>Документация</h2>
        <div class="step"><span class="num">1</span><div><b>Экспорт пользователей</b> — сохраняется в <code>users.json</code>.</div></div>
        <div class="step"><span class="num">2</span><div><b>Экспорт уроков</b> — сохраняется в <code>lessons.json</code>.</div></div>
        <div class="step"><span class="num">3</span><div><b>Маршруты</b> — админ: <code>admin.html</code>, учитель: <code>teacher.html</code>, ученик: <code>lesson0.html</code>.</div></div>
        <div class="step"><span class="num">4</span><div><b>Список уроков</b> строится из ваших файлов <code>lesson*.html</code> (см. <code>data/lessons.json</code>).</div></div>
      </div>
    `;
  }

  tabs.forEach((btn) =>
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v === 'dashboard') renderDashboard();
      else if (v === 'students') renderUsersByRole('user');
      else if (v === 'teachers') renderUsersByRole('teacher');
      else if (v === 'admins') renderUsersByRole('admin');
      else if (v === 'lessons') renderLessons();
      else if (v === 'docs') renderDocs();
    })
  );
  sideLinks.forEach((a) =>
    a.addEventListener('click', () => {
      const v = a.dataset.view;
      if (v === 'dashboard') renderDashboard();
      else if (v === 'students') renderUsersByRole('user');
      else if (v === 'teachers') renderUsersByRole('teacher');
      else if (v === 'admins') renderUsersByRole('admin');
      else if (v === 'lessons') renderLessons();
      else if (v === 'docs') renderDocs();
    })
  );

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('STORYHUB_user_data');
    sessionStorage.removeItem('STORYHUB_auth_token');
    sessionStorage.removeItem('STORYHUB_session_start');
    localStorage.removeItem('currentUser');
    location.href = 'index.html';
  });
  exportUsersBtn.addEventListener('click', () => downloadJson('users.json', users));
  exportLessonsBtn.addEventListener('click', () => downloadJson('lessons.json', lessons));

  (async function init() {
    await Promise.all([loadUsers(), loadLessons()]);
    renderDashboard();
  })();
})();


// === Results UI tweaks: remove folder picker, keep only Import ===
;(() => {
  const app = document.getElementById('app');
  function removePick(){
    if (!app) return;
    const btn = app.querySelector('#results-pick-dir');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }
  const mo = new MutationObserver(removePick);
  if (app) mo.observe(app, { childList: true, subtree: true });
  removePick();
})();