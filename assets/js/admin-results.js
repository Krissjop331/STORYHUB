/*! admin-results.js — единый рендер таблицы, адаптированный под темную тему */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function _normLogin(s) {
    return String(s || '')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase();
  }
  function el(html) {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }

  const CARD_HTML = `
  <section id="results-section" class="card" style="margin-top:18px">
    <div class="card-header header-hero">
      <h2 class="title">Результаты тестов</h2>
      <div class="results-toolbar" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button id="connect-fs" class="btn" type="button">📁 Папка проекта</button>
        <label class="btn" style="cursor:pointer">
          <input id="results-import-input" type="file" accept=".xlsx,.xls" multiple style="display:none">
          📤 Импорт файлов
        </label>
        <button id="clear-project" class="btn btn-outline" type="button">🗑️ Очистить проект</button>
        <div id="fs-status" class="badge badge-ghost" style="font-size:11px;padding:4px 8px"></div>
      </div>
    </div>
    <div class="card-content">
      <div id="results-dropzone" class="dropzone-area">
        <div class="dropzone-icon">📁</div>
        <div class="dropzone-text">Перетащите сюда файлы .xlsx для импорта</div>
        <div class="dropzone-hint">или нажмите "Импорт файлов"</div>
      </div>
      <div class="table-wrap">
        <table class="table" id="results-table">
          <thead><tr><th>#</th><th>ФИО</th><th>Логин</th><th>Класс</th><th>РЕЗУЛЬТАТЫ ТЕСТОВ</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </section>`;

  // Добавляем стили прямо в head
  const styles = `
    <style>
    #results-section .card-header {
      border-bottom: 1px solid var(--outline);
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    
    .dropzone-area {
      border: 2px dashed var(--outline);
      border-radius: 12px;
      padding: 32px 20px;
      margin: 16px 0;
      text-align: center;
      background: rgba(255,255,255,.02);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .dropzone-area:hover, .dropzone-area.dragover {
      border-color: var(--primary);
      background: rgba(91, 140, 255, 0.05);
    }
    
    .dropzone-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.7;
    }
    
    .dropzone-text {
      color: var(--text);
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .dropzone-hint {
      color: var(--muted);
      font-size: 12px;
    }
    
    #results-table {
      font-size: 13px;
    }
    
    #results-table thead th:last-child {
      min-width: 400px;
    }
    
    .test-cell {
      min-width: 380px;
      max-width: 500px;
    }
    
    .test-info {
      background: rgba(91, 140, 255, 0.1);
      color: var(--primary);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 12px;
      display: inline-block;
      border: 1px solid rgba(91, 140, 255, 0.2);
    }
    
    .test-select {
      width: 100%;
      min-width: 350px;
      border: 1px solid var(--outline);
      border-radius: 8px;
      padding: 8px;
      background: rgba(255,255,255,.03);
      color: var(--text);
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 12px;
      resize: vertical;
    }
    
    .test-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.2);
    }
    
    .test-select option {
      background: var(--card);
      color: var(--text);
      padding: 4px;
    }
    
    .test-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .test-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .test-btn:hover {
      background: var(--primary-600);
      transform: translateY(-1px);
    }
    
    .test-btn.danger {
      background: var(--danger);
    }
    
    .test-btn.danger:hover {
      background: #ff5252;
    }
    
    .test-loading {
      color: var(--muted);
      font-style: italic;
      position: relative;
      padding-left: 24px;
    }
    
    .test-loading::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      border: 2px solid var(--outline);
      border-top: 2px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .test-empty {
      color: var(--muted);
      font-style: italic;
      text-align: center;
      padding: 16px;
      opacity: 0.7;
    }
    
    @keyframes spin {
      0% { transform: translateY(-50%) rotate(0deg); }
      100% { transform: translateY(-50%) rotate(360deg); }
    }
    
    .user-row {
      transition: background 0.2s ease;
    }
    
    .user-row:hover {
      background: rgba(255,255,255,.04);
    }
    
    .user-name {
      font-weight: 500;
      color: var(--text);
    }
    
    .user-login {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
      color: var(--primary);
      background: rgba(91, 140, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(91, 140, 255, 0.2);
    }
    
    .user-class {
      color: var(--ok);
      font-weight: 500;
      text-align: center;
    }
    
    #fs-status.connected {
      color: var(--ok);
      border-color: var(--ok);
      background: rgba(63, 209, 159, 0.1);
    }
    
    #fs-status.disconnected {
      color: var(--muted);
      border-color: var(--outline);
    }
    </style>
  `;

  async function fetchUsers() {
    try {
      const res = await fetch('users.json', { cache: 'no-store' });
      const data = await res.json();
      return Array.isArray(data) ? data : data.users || [];
    } catch (e) {
      console.error('users.json error', e);
      return [];
    }
  }

  function rowTpl(i, u) {
    const cls = u.class || u.classNumber || '';
    const full = u.fullName || u.name || `${u.lastName || ''} ${u.firstName || ''}`.trim();
    const username = u.username || u.login || '';
    return `<tr class="user-row" data-username="${username}">
      <td class="cell-id">${i + 1}</td>
      <td class="user-name">${full || '-'}</td>
      <td><span class="user-login">@${username}</span></td>
      <td class="user-class">${cls || '-'}</td>
      <td class="test-cell" data-col="test"><div class="test-loading">Загрузка...</div></td>
    </tr>`;
  }

  async function renderUserTestsCell(cell, login) {
    cell.innerHTML = '<div class="test-empty">Тестов нет</div>';

    const list = await ResultsStore.listByUsername(_normLogin(login));
    if (!list || !list.length) return;

    cell.innerHTML = '';
    list.sort((a, b) => (b.ts || 0) - (a.ts || 0));

    // Информация о количестве
    const info = document.createElement('div');
    info.className = 'test-info';
    info.textContent = `Найдено: ${list.length} файл${
      list.length === 1 ? '' : list.length < 5 ? 'а' : 'ов'
    }`;
    cell.appendChild(info);

    // Select для файлов
    const select = document.createElement('select');
    select.className = 'test-select';
    select.multiple = true;
    select.size = Math.min(6, Math.max(3, list.length));

    for (const rec of list) {
      const opt = document.createElement('option');
      opt.value = rec.id;
      opt.textContent = rec.normName || rec.filename;
      select.appendChild(opt);
    }
    cell.appendChild(select);

    // Контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'test-buttons';

    // Кнопка "Скачать выбранные"
    const btnSel = document.createElement('button');
    btnSel.className = 'test-btn';
    btnSel.textContent = '📥 Скачать выбранные';
    btnSel.onclick = async () => {
      const ids = Array.from(select.selectedOptions).map((o) => o.value);
      if (!ids.length) return alert('Выберите файл(ы) для скачивания');
      await ResultsStore.downloadSelectedZipByIds(ids);
    };

    // Кнопка "Скачать все"
    const btnAll = document.createElement('button');
    btnAll.className = 'test-btn';
    btnAll.textContent = '📦 Скачать все';
    btnAll.onclick = async () => {
      await ResultsStore.downloadAllZip(_normLogin(login));
    };

    // Кнопка "Удалить всё"
    const btnDel = document.createElement('button');
    btnDel.className = 'test-btn danger';
    btnDel.textContent = '🗑️ Удалить всё';
    btnDel.onclick = async () => {
      if (
        !confirm(
          `Удалить все результаты для @${_normLogin(login)}?\n\nЭто действие нельзя отменить.`
        )
      )
        return;
      await ResultsStore.clearUser(_normLogin(login));
      await renderUserTestsCell(cell, login);
    };

    buttonsContainer.appendChild(btnSel);
    buttonsContainer.appendChild(btnAll);
    buttonsContainer.appendChild(btnDel);
    cell.appendChild(buttonsContainer);
  }

  async function refresh() {
    const users = (await fetchUsers()).filter((u) => (u.role || 'user') === 'user');
    const tbody = document.querySelector('#results-table tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map((u, i) => rowTpl(i, u)).join('');

    // Рендерим ячейки тестов последовательно для лучшей производительности
    const rows = tbody.querySelectorAll('tr');
    for (const tr of rows) {
      const username = tr.getAttribute('data-username');
      const cell = tr.querySelector('[data-col="test"]');
      await renderUserTestsCell(cell, username);
    }
  }

  async function updateFsStatus() {
    const el = document.getElementById('fs-status');
    if (!el) return;

    try {
      const st = await ResultsStore.ensurePermission?.();
      if (st === 'granted') {
        el.textContent = '✅ Подключена';
        el.className = 'badge connected';
        el.title = 'Папка проекта подключена — /test/result';
      } else if (st === 'none') {
        el.textContent = '❌ Не подключена';
        el.className = 'badge disconnected';
        el.title = 'Папка проекта не подключена';
      } else {
        el.textContent = `⚠️ ${st}`;
        el.className = 'badge badge-ghost';
        el.title = `Статус доступа: ${st}`;
      }
    } catch {
      el.textContent = '❌ Недоступна';
      el.className = 'badge disconnected';
      el.title = 'Файловая система недоступна';
    }
  }

  function wire() {
    // Обработчик импорта файлов
    const input = document.getElementById('results-import-input');
    input?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      let ok = 0,
        fail = 0,
        overwriteForAll = null;

      for (const f of files) {
        let u = ResultsStore.guessUsername?.(f.name) || '';
        if (!u) {
          u = prompt(`Введите логин пользователя для файла "${f.name}":`) || '';
        }
        if (!u) {
          fail++;
          continue;
        }

        const list = await ResultsStore.listByUsername(u);
        if (list.length && overwriteForAll === null) {
          overwriteForAll = confirm(
            `У пользователя "${u}" уже есть ${list.length} файл${
              list.length === 1 ? '' : list.length < 5 ? 'а' : 'ов'
            }.\n\n` + `Нажмите ОК для перезаписи или Отмена для добавления новых.`
          );
        }

        try {
          await ResultsStore.importFile(f, u, { overwrite: overwriteForAll === true });
          ok++;
        } catch (error) {
          console.error(`Ошибка импорта ${f.name}:`, error);
          fail++;
        }
      }

      alert(`Импорт завершён:\n✅ Успешно: ${ok}\n${fail ? `❌ Ошибок: ${fail}` : ''}`);
      e.target.value = '';
      refresh();
    });

    // Drag & Drop для dropzone
    const dz = document.getElementById('results-dropzone');
    dz?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('dragover');
    });

    dz?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
    });

    dz?.addEventListener('drop', async (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');

      const files = Array.from(e.dataTransfer.files || []).filter(
        (f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );

      if (!files.length) {
        alert('Пожалуйста, перетащите файлы Excel (.xlsx или .xls)');
        return;
      }

      for (const f of files) {
        const u =
          ResultsStore.guessUsername?.(f.name) ||
          prompt(`Введите логин пользователя для файла "${f.name}":`) ||
          '';
        if (!u) continue;

        try {
          await ResultsStore.importFile(f, u);
        } catch (e) {
          alert(`Ошибка импорта ${f.name}: ${e.message || e}`);
        }
      }
      refresh();
    });

    // Подключение папки проекта
    document.getElementById('connect-fs')?.addEventListener('click', async () => {
      try {
        await ResultsStore.connectProjectDirectory();
      } catch (e) {
        if (e?.name !== 'AbortError') {
          alert(`Ошибка подключения папки: ${e.message || e}`);
        }
        return;
      }

      updateFsStatus();

      try {
        const n = await ResultsStore.scanAndImportAll();
        if (n > 0) {
          alert(`✅ Импортировано из папки проекта: ${n} файл${n === 1 ? '' : n < 5 ? 'а' : 'ов'}`);
        }
      } catch (e) {
        console.error('Ошибка сканирования папки:', e);
      }

      refresh();
    });

    // Очистка проекта
    document.getElementById('clear-project')?.addEventListener('click', async () => {
      if (
        !confirm(
          '⚠️ ВНИМАНИЕ!\n\nВы действительно хотите удалить ВСЕ результаты тестов?\n\nЭто действие нельзя отменить.'
        )
      )
        return;

      try {
        await ResultsStore.clearAll();
        alert('✅ Все результаты успешно удалены.\n\nСтраница будет перезагружена.');
        location.reload();
      } catch (e) {
        alert(`Ошибка очистки: ${e.message || e}`);
      }
    });
  }

  function injectCard() {
    if (document.getElementById('results-section')) return;

    // Добавляем стили в head
    if (!document.querySelector('style[data-admin-results]')) {
      const styleEl = document.createElement('div');
      styleEl.innerHTML = styles;
      styleEl.firstElementChild.setAttribute('data-admin-results', '');
      document.head.appendChild(styleEl.firstElementChild);
    }

    const app = document.getElementById('app') || document.body;
    const firstCard = app.querySelector('.card');
    const card = el(CARD_HTML);

    if (firstCard?.parentNode) {
      firstCard.parentNode.insertBefore(card, firstCard.nextSibling);
    } else {
      app.appendChild(card);
    }

    wire();
    updateFsStatus();
    refresh();
  }

  ready(() => {
    injectCard();

    // Наблюдатель для SPA/переключения вкладок
    const mo = new MutationObserver(() => {
      const appTitle = document.querySelector('#app h2')?.textContent || '';
      if (/Ученики/i.test(appTitle)) {
        injectCard();
      }
    });

    mo.observe(document.getElementById('app') || document.body, {
      childList: true,
      subtree: true,
    });
  });
})();
