/*!
 * TestResults v1.0
 * Собирает результаты трёх тестов урока и экспортирует в Excel (XLSX).
 * Зависимости: SheetJS (XLSX) через CDN.
 */
(function () {
  const TEST_TYPES = {
    knowledge:  'knowledge',
    motivation: 'motivation',
    engagement: 'engagement',
  };

  const SHEET_TITLES_RU = {
    [TEST_TYPES.knowledge]:  'Знания',
    [TEST_TYPES.motivation]: 'Мотивация',
    [TEST_TYPES.engagement]: 'Вовлечённость',
  };

  function nowStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      '-' +
      pad(d.getHours()) +
      pad(d.getMinutes())
    );
  }

  
  function getLogin() {
    // Попытка достать логин из популярных мест
    const ss = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;

    // STORYHUB формат: JSON в sessionStorage 'STORYHUB_user_data' с полем username
    let storyhubUser = null;
    try {
      const raw = ss?.getItem('STORYHUB_user_data') || ls?.getItem('STORYHUB_user_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        storyhubUser = parsed?.username || parsed?.name || null;
      }
    } catch {}

    const fromSS = ss?.getItem('currentUser') || ss?.getItem('user');
    const fromLS = ls?.getItem('currentUser') || ls?.getItem('user');
    const fromCookie = (document.cookie.match(/(?:^|;)\s*username=([^;]+)/) || [])[1];

    return storyhubUser || fromSS || fromLS || fromCookie || null;
  }


  function storageKey(login, lessonId) {
    return `quizResults:v1:${login}:lesson-${lessonId}`;
  }

  function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  function deepFreeze(obj) {
    if (obj && typeof obj === 'object') {
      Object.freeze(obj);
      Object.keys(obj).forEach(k => deepFreeze(obj[k]));
    }
    return obj;
  }

  const TestResults = {
    _lessonId: null,
    _login: null,
    _requireAuth: false,

    init({ lessonId, requireAuth = false } = {}) {
      if (typeof lessonId !== 'number') {
        console.warn('[TestResults] lessonId должен быть числом, пример: { lessonId: 1 }');
      }
      this._lessonId = lessonId ?? 1;
      this._requireAuth = !!requireAuth;
      this._login = getLogin();

      if (this._requireAuth && !this._login) {
        console.warn('[TestResults] Пользователь не авторизован. Экспорт будет заблокирован.');
      }

      // Инициализируем пустой контейнер результатов, если не был сохранён
      const key = storageKey(this._login || 'guest', this._lessonId);
      const current = safeParse(localStorage.getItem(key), null);
      if (!current) {
        localStorage.setItem(key, JSON.stringify({}));
      }
    },

    /**
     * Сохранить результат одного теста.
     * @param {object} opts
     * @param {'knowledge'|'motivation'|'engagement'} opts.testType
     * @param {Array<{index:number,question:string,answer:string,correct:boolean,correctAnswer?:string}>} opts.questions
     * @param {object} [opts.meta]
     */
    saveTest({ testType, questions, meta } = {}) {
      if (!Object.values(TEST_TYPES).includes(testType)) {
        throw new Error(`[TestResults] Неверный testType: ${testType}`);
      }
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('[TestResults] questions должен быть непустым массивом.');
      }

      const login = this._login || 'guest';
      const key = storageKey(login, this._lessonId);
      const payload = safeParse(localStorage.getItem(key), {}) || {};

      // Нормализация вопросов (на всякий случай)
      const normalized = questions.map((q, i) => ({
        index: typeof q.index === 'number' ? q.index : i + 1,
        question: String(q.question ?? '').trim(),
        answer: String(q.answer ?? '').trim(),
        correct: !!q.correct,
        correctAnswer: q.correctAnswer == null ? '' : String(q.correctAnswer).trim(),
      }));

      payload[testType] = {
        savedAt: new Date().toISOString(),
        count: normalized.length,
        correct: normalized.filter(q => q.correct).length,
        questions: normalized,
        meta: meta || null,
      };

      localStorage.setItem(key, JSON.stringify(payload));
      return deepFreeze(payload[testType]);
    },

    /** Проверка: все три теста завершены */
    isAllDone() {
      const login = this._login || 'guest';
      const key = storageKey(login, this._lessonId);
      const payload = safeParse(localStorage.getItem(key), {}) || {};
      return Boolean(payload.knowledge && payload.motivation && payload.engagement);
    },

    /** Собирает объект результатов целиком (иммутабельная копия) */
    getAll() {
      const login = this._login || 'guest';
      const key = storageKey(login, this._lessonId);
      const payload = safeParse(localStorage.getItem(key), {}) || {};
      return deepFreeze(payload);
    },

    /** Создаёт кнопку/диалог скачивания в контейнере */
    renderDownloadUI(containerSelector, { showDialogAfterSave = false, autoEnableWhenAllDone = true } = {}) {
      const root = document.querySelector(containerSelector);
      if (!root) {
        console.warn(`[TestResults] Контейнер ${containerSelector} не найден.`);
        return;
      }

      root.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.gap = '12px';
      wrap.style.alignItems = 'center';

      const btn = document.createElement('button');
      btn.textContent = 'Скачать результаты (Excel)';
      btn.style.padding = '10px 16px';
      btn.style.fontSize = '16px';
      btn.style.cursor = 'pointer';
      btn.style.borderRadius = '8px';
      btn.style.border = '1px solid #ccc';
      btn.style.background = '#f0f0f0';
      btn.disabled = !this.isAllDone();

      const hint = document.createElement('span');
      hint.style.fontSize = '14px';
      hint.style.color = '#666';
      hint.textContent = btn.disabled
        ? 'Завершите все 3 теста, чтобы скачать файл.'
        : 'Готово к скачиванию.';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this._requireAuth && !this._login) {
          alert('Выполните вход, чтобы скачать результаты.');
          return;
        }
        if (!this.isAllDone()) {
          alert('Нужно пройти все 3 теста (Знания, Мотивация, Вовлечённость).');
          return;
        }
        this.exportExcel();
      });

      wrap.appendChild(btn);
      wrap.appendChild(hint);
      root.appendChild(wrap);

      if (autoEnableWhenAllDone) {
        // Небольшой наблюдатель: если на странице пользователь завершает тест и мы тут же дозаписываем —
        // перерисуем состояние
        setTimeout(() => {
          if (this.isAllDone()) {
            btn.disabled = false;
            hint.textContent = 'Готово к скачиванию.';
          }
        }, 100);
      }

      if (showDialogAfterSave && this.isAllDone()) {
        // Нативный alert-диалог; при желании можно заменить на красивую модалку
        setTimeout(() => {
          if (confirm('Все 3 теста завершены. Скачать результаты (Excel) сейчас?')) {
            this.exportExcel();
          }
        }, 50);
      }
    },

    /** Экспорт в Excel: 3 листа, итог в конце каждого */
    exportExcel() {
      if (typeof XLSX === 'undefined') {
        alert('Библиотека XLSX не подключена.');
        return;
      }
      if (this._requireAuth && !this._login) {
        alert('Выполните вход, чтобы скачать результаты.');
        return;
      }
      const all = this.getAll();
      const missing = Object.values(TEST_TYPES).filter(t => !all[t]);
      if (missing.length) {
        alert('Не все тесты завершены. Нельзя экспортировать.');
        return;
      }

      const wb = XLSX.utils.book_new();
      const order = [TEST_TYPES.knowledge, TEST_TYPES.motivation, TEST_TYPES.engagement];

      order.forEach((t) => {
        const data = all[t];
        const rows = [
          ['Вопрос #', 'Вопрос', 'Ответ ученика', 'Правильно', 'Правильный ответ'],
        ];

        data.questions.forEach((q) => {
          rows.push([
            q.index,
            q.question,
            q.answer,
            q.correct ? 'Да' : 'Нет',
            q.correctAnswer || '',
          ]);
        });

        // Итоговая строка
        const total = data.questions.length;
        const correct = data.questions.filter(q => q.correct).length;
        const percent = Math.round((correct / total) * 100) + '%';

        rows.push([]);
        rows.push(['', 'Итог', `${correct} из ${total}`, percent, '']);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Немного ширины колонок
        ws['!cols'] = [
          { wch: 9 },   // #
          { wch: 60 },  // Вопрос
          { wch: 30 },  // Ответ ученика
          { wch: 12 },  // Правильно
          { wch: 30 },  // Правильный ответ
        ];

        XLSX.utils.book_append_sheet(wb, ws, SHEET_TITLES_RU[t]);
      });

      const fileName = `lesson-${this._lessonId}-results-${(this._login || 'guest')}-${nowStamp()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    },
  };

  // Экспорт в глобальный объект
  window.TestResults = TestResults;
})();