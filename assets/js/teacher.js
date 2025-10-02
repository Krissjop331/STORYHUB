// assets/js/teacher.js
(() => {
  const app = document.getElementById('app');
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const sideLinks = Array.from(document.querySelectorAll('.side-link'));
  const logoutBtn = document.getElementById('logoutBtn');

  // Пускаем только учителя
  const me =
    JSON.parse(sessionStorage.getItem('STORYHUB_user_data')) ||
    JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!me || !(me.role === 'teacher' || me.role === 'Учитель')) {
    location.href = 'index.html';
    return;
  }

  let lessons = [];
  let users = [];
  let results = []; // [{username, fullName, class, lesson, score, max, date, question, correct, answer}]
  let activeLessonFilter = 'all';

  // ---------- Data loaders ----------
  async function loadLessons() {
    try {
      const res = await fetch('data/lessons.json');
      lessons = await res.json();
    } catch {
      lessons = [];
    }
  }
  async function loadUsers() {
    try {
      const res = await fetch('users.json');
      users = await res.json();
    } catch {
      users = [];
    }
  }

  // ---------- UI helpers ----------
  function setActive(view) {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.view === view));
    sideLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.view === view));
  }
  const kpi = (title, value, sub = '') =>
    `<div class="card kpi"><div><h3>${title}</h3><div class="value">${value}</div>${
      sub ? `<div class="sub">${sub}</div>` : ''
    }</div></div>`;

  // ---------- Stats ----------
  const pct = (score, max) =>
    score == null || max == null || !Number(max)
      ? null
      : Math.round((Number(score) / Number(max)) * 100);

  const overallAvg = (rows) => {
    const vals = rows.map((r) => pct(r.score, r.max)).filter((v) => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };

  function avgByLesson(rows) {
    const map = new Map();
    for (const r of rows) {
      const key = r.lesson || '—';
      const p = pct(r.score, r.max);
      if (p == null) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return Array.from(map.entries()).map(([k, arr]) => ({
      lesson: k,
      avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
      count: arr.length,
    }));
  }

  function avgByStudent(rows) {
    const map = new Map(); // key: username or fullName
    for (const r of rows) {
      const key = (r.username || r.fullName || '').toString().trim().toLowerCase();
      if (!key) continue;
      const p = pct(r.score, r.max);
      const obj = map.get(key) || {
        username: r.username || '',
        fullName: r.fullName || '',
        class: r.class || '',
        items: [],
      };
      if (p != null) obj.items.push({ pct: p, date: r.date || '', lesson: r.lesson || '' });
      map.set(key, obj);
    }
    return Array.from(map.values()).map((o) => ({
      username: o.username,
      fullName: o.fullName,
      class: o.class,
      avg: o.items.length ? Math.round(o.items.reduce((a, b) => a + b.pct, 0) / o.items.length) : 0,
      last: o.items.length ? o.items[o.items.length - 1] : null,
      count: o.items.length,
    }));
  }

  const distribution = (rows) => {
    const bins = [0, 0, 0, 0, 0]; // 0–20, 20–40, 40–60, 60–80, 80–100
    for (const r of rows) {
      const p = pct(r.score, r.max);
      if (p == null) continue;
      const i = Math.min(4, Math.max(0, Math.floor(p / 20)));
      bins[i]++;
    }
    return bins;
  };

  // ---------- Charts ----------
  function drawCharts() {
    const ctx1 = document.getElementById('avgByLesson');
    if (ctx1) {
      const data1 = avgByLesson(results);
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: data1.map((d) => d.lesson),
          datasets: [{ label: 'Средний %', data: data1.map((d) => d.avg) }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 100 } },
        },
      });
    }

    const ctx2 = document.getElementById('distChart');
    if (ctx2) {
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['0–20', '20–40', '40–60', '60–80', '80–100'],
          datasets: [{ label: 'Кол-во', data: distribution(results) }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }
  }

  // ---------- Views ----------
  function renderDashboard() {
    setActive('dashboard');
    const students = users.filter((u) => u.role === 'user');
    const avg = overallAvg(results);

    app.innerHTML = `
      <div class="header-hero"><div class="title">Teacher Dashboard</div></div>
      <div class="teacher-kpis">
        ${kpi('Ученики', students.length)}
        ${kpi('Всего уроков', lessons.length)}
        ${kpi('Загружено результатов', results.length)}
        ${kpi('Средний %', avg + '%')}
      </div>

      <div class="grid grid-2 section">
        <div class="card chart-card">
          <header><h3>Средний результат по урокам</h3></header>
          <div class="canvas-wrap"><canvas id="avgByLesson"></canvas></div>
        </div>
        <div class="card chart-card">
          <header><h3>Распределение результатов</h3></header>
          <div class="canvas-wrap"><canvas id="distChart"></canvas></div>
        </div>
      </div>
    `;
    drawCharts();
  }

  function renderStudents() {
    setActive('students');
    app.innerHTML = `
      <div class="card" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <h2 style="margin:0">Ученики</h2>
        <div style="font-size:12px;color:var(--muted)">Импортируйте результаты и скачивайте тесты как в админке</div>
      </div>
      <div id="studentsResultsHook"></div>
    `;
  }

  function renderLessons() {
    setActive('lessons');
    app.innerHTML = `
      <div class="card" style="margin-bottom:12px">
        <h2 style="margin:0">Уроки</h2>
        <p style="color:var(--muted);margin:6px 0 0">Просмотр доступных уроков (читает <code>data/lessons.json</code>)</p>
      </div>
      <div id="lessonsList"></div>
    `;
    const list = document.getElementById('lessonsList');
    list.innerHTML = lessons
      .map(
        (l) => `
      <div class="lesson-card">
        <div>
          <div class="lesson-title">${l.title}</div>
          ${l.description ? `<div class="student-meta">${l.description}</div>` : ''}
        </div>
        <a class="link-pill" href="${
          l.url
        }">Открыть <span class="arrow">→</span></a>
      </div>
    `
      )
      .join('');
  }

  function renderResults() {
    setActive('results');
    const chips = buildLessonChips();

    app.innerHTML = `
      <div class="card">
        <h3>Импорт и просмотр результатов</h3>
        <div class="results-actions" style="gap:12px;flex-wrap:wrap">
          <label class="btn btn-outline" style="cursor:pointer">
            <input type="file" id="importFile" accept=".xlsx,.xls" style="display:none">
            Импорт Excel
          </label>
          <button id="clearResults" class="btn btn-ghost">Очистить</button>
          <div id="lessonChips" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${chips}</div>
        </div>

        <div class="table-wrap">
          <table class="table" id="resultsTable">
            <thead>
              <tr>
                <th>Логин</th><th>ФИО</th><th>Класс</th><th>Урок</th>
                <th class="right">Баллы</th><th class="right">Макс</th><th class="right">%</th><th>Дата</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <!-- ИТОГИ ПО УЧЕНИКАМ -->
      <div class="card section">
        <h3>Итоги по ученикам</h3>
        <div class="table-wrap">
          <table class="table" id="byStudentTable">
            <thead>
              <tr><th>Логин</th><th>ФИО</th><th>Класс</th><th class="right">Средний %</th><th class="right">Попыток</th><th>Последний (%, урок, дата)</th></tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <!-- ИТОГИ ПО УРОКАМ -->
      <div class="card section">
        <h3>Итоги по урокам</h3>
        <div class="table-wrap">
          <table class="table" id="byLessonTable">
            <thead>
              <tr><th>Урок</th><th class="right">Средний %</th><th class="right">Записей</th></tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <!-- ДЕТАЛИЗАЦИЯ ПО ВОПРОСАМ -->
      <div class="card section" id="questionsCard" style="display:none">
        <h3>Детализация по вопросам</h3>
        <div class="table-wrap">
          <table class="table" id="questionsTable">
            <thead>
              <tr>
                <th>Урок</th><th>Логин</th><th>ФИО</th>
                <th>Вопрос</th><th>Правильный ответ</th><th>Ответ ученика</th><th>Верно?</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('clearResults').onclick = () => {
      results = [];
      activeLessonFilter = 'all';
      redrawResultTables();
      renderResults();
    };
    document.getElementById('importFile').addEventListener('change', onImport);

    document.querySelectorAll('[data-lesson-chip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeLessonFilter = btn.dataset.lessonChip;
        document
          .querySelectorAll('[data-lesson-chip]')
          .forEach((x) => (x.className = 'btn btn-ghost'));
        btn.className = 'chip ok';
        redrawResultTables();
      });
    });

    redrawResultTables();
  }

  function buildLessonChips() {
    const set = new Set(results.map((r) => r.lesson || '—'));
    const items = ['all', ...Array.from(set)];
    return items
      .map(
        (v, i) =>
          `<button data-lesson-chip="${v}" class="${
            activeLessonFilter === v || (activeLessonFilter === 'all' && i === 0)
              ? 'chip ok'
              : 'btn btn-ghost'
          }">${v === 'all' ? 'Все тесты' : v}</button>`
      )
      .join('');
  }

  // ---------- Results rendering ----------
  function redrawResultTables() {
    const filtered =
      activeLessonFilter === 'all'
        ? results
        : results.filter((r) => (r.lesson || '—') === activeLessonFilter);

    // Главная таблица
    const tb = app.querySelector('#resultsTable tbody');
    tb.innerHTML = filtered
      .map((r) => {
        const p = pct(r.score, r.max);
        return `<tr>
        <td>${r.username || ''}</td>
        <td>${r.fullName || ''}</td>
        <td>${r.class || ''}</td>
        <td>${r.lesson || ''}</td>
        <td class="right">${r.score ?? ''}</td>
        <td class="right">${r.max ?? ''}</td>
        <td class="right">${p != null ? p + '%' : ''}</td>
        <td>${r.date || ''}</td>
      </tr>`;
      })
      .join('');

    // Итоги по ученикам
    const byStudent = avgByStudent(filtered);
    const tbs = app.querySelector('#byStudentTable tbody');
    tbs.innerHTML = byStudent
      .map((s) => {
        const last = s.last ? `${s.last.pct}% • ${s.last.lesson} • ${s.last.date}` : '';
        return `<tr>
        <td>${s.username}</td><td>${s.fullName}</td><td>${s.class}</td>
        <td class="right">${s.avg}%</td><td class="right">${s.count}</td><td>${last}</td>
      </tr>`;
      })
      .join('');

    // Итоги по урокам
    const byLesson = avgByLesson(filtered);
    const tbl = app.querySelector('#byLessonTable tbody');
    tbl.innerHTML = byLesson
      .map(
        (l) =>
          `<tr><td>${l.lesson}</td><td class="right">${l.avg}%</td><td class="right">${l.count}</td></tr>`
      )
      .join('');

    // --- Детализация по вопросам с группами и разделителями ---
    const qCard = document.getElementById('questionsCard');
    const qtb = document.querySelector('#questionsTable tbody');
    const hasQA = filtered.some((r) => r.question || r.correct || r.answer);

    if (hasQA) {
      qCard.style.display = '';

      // группировка по уроку/тесту
      const groups = {};
      for (const r of filtered) (groups[r.lesson || '—'] ||= []).push(r);
      const ordered = Object.keys(groups).sort((a, b) => String(a).localeCompare(String(b), 'ru'));

      let html = '';
      for (const g of ordered) {
        const arr = groups[g];
        // заголовок группы
        html += `<tr class="q-group"><td colspan="7">${g}</td></tr>`;

        for (const r of arr) {
          const ok = r.correct && r.answer ? norm(r.correct) === norm(r.answer) : null;
          const isItog =
            String(r.question || '')
              .trim()
              .toLowerCase() === 'итог';

          const row = `
            <tr${isItog ? ' class="q-itog"' : ''}>
              <td>${r.lesson || ''}</td>
              <td>${r.username || ''}</td>
              <td>${r.fullName || ''}</td>
              <td>${r.question || ''}</td>
              <td>${r.correct || ''}</td>
              <td>${r.answer || ''}</td>
              <td>${ok == null ? '' : ok ? '✔' : '✖'}</td>
            </tr>`;

          html += row;

          // разделитель сразу после строки «Итог»
          if (isItog)
            html += `<tr class="q-sep"><td colspan="7"><div class="line"></div></td></tr>`;
        }

        // общий разделитель между группами
        html += `<tr class="q-sep"><td colspan="7"><div class="line"></div></td></tr>`;
      }
      qtb.innerHTML = html;
    } else {
      qCard.style.display = 'none';
      qtb.innerHTML = '';
    }
  }

  // «умная» нормализация текста ответа для сравнения
  function norm(v) {
    return String(v || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?"'()«»]/g, '');
  }

  // ---------- Import (много-листовой Excel + парсинг имени файла) ----------
  async function onImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Имя файла: lesson-<n>-results-<username>-YYYYMMDD-HHMM.xlsx
    const fname = file.name.toLowerCase();
    let lessonFromFile = '';
    let userFromFile = '';
    const m = fname.match(/lesson-(\d+)-results-([a-z0-9_]+)/);
    if (m) {
      lessonFromFile = 'Урок ' + m[1];
      userFromFile = m[2];
    }

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const all = [];

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      for (const r of rows) {
        const keys = Object.keys(r).reduce((m, k) => {
          m[k.toLowerCase().trim()] = r[k];
          return m;
        }, {});
        const pick = (cands) => {
          for (const c of cands) if (keys[c] !== undefined) return keys[c];
          const k = Object.keys(keys).find((kk) => cands.some((c) => kk.includes(c)));
          return k ? keys[k] : '';
        };

        const username = pick(['username', 'логин', 'email']) || userFromFile || '';
        const fullName =
          pick([
            'фио',
            'full name',
            'fullname',
            'имя',
            'name',
            'фамилия имя',
            'фамилия имя отчество',
          ]) || '';
        const klass = parseInt(pick(['class', 'класс', 'grade']) || '') || '';
        const lessonRaw =
          pick(['lesson', 'урок', 'lesson id']) || lessonFromFile || sheetName || '';
        const score = pick(['score', 'оценка', 'percent', 'процент']) || '';
        const max = pick(['max', 'максимум', 'макс']) || 100;
        const date = pick(['date', 'дата']) || '';

        // Вопросы/ответы
        const question = pick(['question', 'вопрос']);
        const correct = pick([
          'correct',
          'правильный ответ',
          'верный',
          'правильный',
          'correct answer',
        ]);
        const answer = pick(['ответ ученика', 'student answer', 'answer', 'ответ']) || '';

        all.push({
          username,
          fullName,
          class: klass,
          lesson: lessonRaw,
          score: Number(score),
          max: Number(max),
          date,
          question,
          correct,
          answer,
        });
      }
    }

    results = all;
    activeLessonFilter = 'all';
    renderResults(); // перерисуем с новыми чипсами и таблицами
  }

  function renderDocs() {
    setActive('docs');
    app.innerHTML = `
      <div class="card docs">
        <h2>Документация (Teacher)</h2>
        <div class="step"><span class="num">1</span><div><b>Ученики</b> — список всех users (как в админке), без редактирования.</div></div>
        <div class="step"><span class="num">2</span><div><b>Уроки</b> — просмотр уроков из <code>data/lessons.json</code> со ссылками.</div></div>
        <div class="step"><span class="num">3</span><div><b>Импорт Excel</b> во вкладке «Результаты». Поддерживаемые столбцы: username/логин, ФИО, class/класс, lesson/урок (или берётся из имени файла / имени листа), score/оценка/percent, max, date, question/вопрос, correct/правильный ответ, answer/ответ/ответ ученика.</div></div>
        <div class="step"><span class="num">4</span><div><b>Фильтр по тестам</b> — чипсы «Все тесты» и отдельные уроки. В таблице детализации строки «Итог» отделяются визуальным разделителем.</div></div>
      </div>
    `;
  }

  // ---------- Navigation ----------
  tabs.forEach((btn) =>
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v === 'dashboard') renderDashboard();
      else if (v === 'students') renderStudents();
      else if (v === 'lessons') renderLessons();
      
      else if (v === 'docs') renderDocs();
    })
  );
  sideLinks.forEach((a) =>
    a.addEventListener('click', () => {
      const v = a.dataset.view;
      if (v === 'dashboard') renderDashboard();
      else if (v === 'students') renderStudents();
      else if (v === 'lessons') renderLessons();
      
      else if (v === 'docs') renderDocs();
    })
  );

  // ---------- Logout ----------
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('STORYHUB_user_data');
    localStorage.removeItem('currentUser');
    location.href = 'index.html';
  });

  // ---------- Init ----------
  (async function init() {
    await Promise.all([loadLessons(), loadUsers()]);
    renderDashboard();
  })();
})();
