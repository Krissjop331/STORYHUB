// Улучшенная система навигации и управления уроками
class LessonManager {
  constructor() {
    this.currentPage = window.location.pathname.split('/').pop();
    this.lessonConfig = {
      0: { count: 3 },
      1: { count: 10 },
      2: { count: 13 },
      3: { count: 8 },
      4: { count: 5 },
      5: { count: 7 },
      6: { count: 8 },
    };

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () =>
        this.initializeComponents()
      );
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    console.log('Инициализация компонентов для страницы:', this.currentPage);

    this.setupMenuHighlight();
    this.setupNavigation();
    this.setupClassSwitcher();
    this.setupTestHandlers();
    this.initializeSliders();
    this.syncHeights();
  }

  getCurrentLessonNumber(page) {
    if (page === 'lesson1.html') return 1;
    if (page === 'lesson0.html') return 0;

    const match = page.match(/lesson(\d+)(?:-\d+)?\.html/);
    return match ? parseInt(match[1]) : null;
  }

  setupMenuHighlight() {
    const menuItems = document.querySelectorAll('.lesson-list li');
    const currentLesson = this.getCurrentLessonNumber(this.currentPage);

    menuItems.forEach(item => {
      const href = item.getAttribute('data-href');
      if (!href) return;

      const hrefMatch = href.match(/lesson(\d+)/);
      const hrefLesson = hrefMatch ? parseInt(hrefMatch[1]) : null;

      // Логика подсветки активного пункта
      const isActive =
        (href === 'lesson1.html' && currentLesson === 1) ||
        (hrefLesson && currentLesson && hrefLesson === currentLesson) ||
        href === this.currentPage;

      if (isActive) {
        item.classList.add('active');
      }

      // Добавляем обработчик клика
      item.addEventListener('click', () => {
        if (href) window.location.href = href;
      });
    });
  }

  setupNavigation() {
    // Единый обработчик для всех элементов навигации
    document.addEventListener('click', e => {
      if (
        e.target.closest('.arrow') ||
        e.target.classList.contains('yes-button')
      ) {
        console.log('Навигация вперед:', e.target.className);
        e.preventDefault();
        e.stopPropagation();

        if (
          e.target.classList.contains('yes-button') &&
          this.currentPage === 'lesson0-2.html'
        ) {
          window.location.href = 'lesson0-3.html';
        } else {
          this.navigateToNext();
        }
      }

      // Обработчик для стрелки "Назад"
      if (
        e.target.closest('.arrow-back') ||
        e.target.classList.contains('back-button')
      ) {
        console.log('Навигация назад:', e.target.className);
        e.preventDefault();
        e.stopPropagation();
        this.navigateToPrevious();
      }
    });
  }

  navigateToNext() {
    console.log('Переход со страницы:', this.currentPage);

    // Специальные переходы
    const specialTransitions = {
      'lesson0.html': 'lesson0-2.html',
      'lesson0-2.html': 'lesson0-3.html',
      'lesson0-3.html': 'lesson1.html',
      'lesson1.html': 'lesson1-1.html',
      'lesson2.html': 'lesson2-2.html',
      'lesson3.html': 'lesson3-2.html',
      'lesson4.html': 'lesson4-2.html',
      'lesson4-2.html': 'lesson4-3.html',
      'lesson5.html': 'lesson5-2.html',
      'lesson6.html': 'lesson6-2.html',
    };

    if (specialTransitions[this.currentPage]) {
      this.navigateToPage(specialTransitions[this.currentPage]);
      return;
    }

    // Общая логика навигации
    this.handleGeneralNavigation();
  }

  navigateToPrevious() {
    console.log('Возврат с страницы:', this.currentPage);

    // Специальные переходы назад
    const specialBackTransitions = {
      'lesson0-2.html': 'lesson0.html',
      'lesson0-3.html': 'lesson0-2.html',
      'lesson1.html': 'lesson0-3.html',
      'lesson1-1.html': 'lesson1.html',
      'lesson2-2.html': 'lesson2.html',
      'lesson3-2.html': 'lesson3.html',
      'lesson4-2.html': 'lesson4.html',
      'lesson4-3.html': 'lesson4-2.html',
      'lesson5-2.html': 'lesson5.html',
      'lesson6-2.html': 'lesson6.html',
    };

    if (specialBackTransitions[this.currentPage]) {
      this.navigateToPage(specialBackTransitions[this.currentPage]);
      return;
    }

    // Общая логика обратной навигации
    this.handleGeneralBackNavigation();
  }

  handleGeneralBackNavigation() {
    const lessonTaskMatch = this.currentPage.match(/lesson(\d+)-(\d+)\.html/);
    const lessonOnlyMatch = this.currentPage.match(/lesson(\d+)\.html/);

    let lesson, task;

    if (lessonTaskMatch) {
      lesson = parseInt(lessonTaskMatch[1]);
      task = parseInt(lessonTaskMatch[2]);
    } else if (lessonOnlyMatch) {
      lesson = parseInt(lessonOnlyMatch[1]);
      task = 0;
    } else {
      console.warn('Не удалось определить структуру страницы для возврата');
      return;
    }

    if (task === 0) {
      // Если мы на главной странице урока, возвращаемся к предыдущему уроку
      this.navigateToPreviousLesson(lesson);
    } else if (task === 1) {
      // Если это первая подстраница урока, возвращаемся на главную страницу урока
      this.navigateToPage(`lesson${lesson}.html`);
    } else {
      // Возвращаемся к предыдущей подстранице
      this.navigateToPage(`lesson${lesson}-${task - 1}.html`);
    }
  }

  navigateToPreviousLesson(currentLesson) {
    if (currentLesson === 0) {
      // Если мы во введении, некуда возвращаться
      alert('Это начало курса!');
      return;
    }

    const previousLesson = currentLesson - 1;
    const previousConfig = this.lessonConfig[previousLesson];

    if (previousConfig) {
      // Переходим к последней странице предыдущего урока
      this.navigateToPage(
        `lesson${previousLesson}-${previousConfig.count}.html`
      );
    } else {
      // Если конфигурация не найдена, переходим на главную страницу предыдущего урока
      this.navigateToPage(`lesson${previousLesson}.html`);
    }
  }

  navigateToPage(page) {
    // Сохраняем страницу перед переходом
    localStorage.setItem('currentPage', page);
    window.location.href = page;
  }

  handleGeneralNavigation() {
    const lessonTaskMatch = this.currentPage.match(/lesson(\d+)-(\d+)\.html/);
    const lessonOnlyMatch = this.currentPage.match(/lesson(\d+)\.html/);

    let lesson, task;

    if (lessonTaskMatch) {
      lesson = parseInt(lessonTaskMatch[1]);
      task = parseInt(lessonTaskMatch[2]);
    } else if (lessonOnlyMatch) {
      lesson = parseInt(lessonOnlyMatch[1]);
      task = 0;
    } else {
      console.warn('Не удалось определить структуру страницы');
      return;
    }

    const config = this.lessonConfig[lesson];
    if (!config) {
      alert('Урок не найден в конфигурации');
      return;
    }

    const nextTask = task + 1;

    if (task === 0) {
      this.navigateToPage(`lesson${lesson}-1.html`);
    } else if (nextTask <= config.count) {
      this.navigateToPage(`lesson${lesson}-${nextTask}.html`);
    } else {
      this.navigateToNextLesson(lesson);
    }
  }

  navigateToNextLesson(currentLesson) {
    const nextLesson = currentLesson + 1;
    const nextConfig = this.lessonConfig[nextLesson];

    if (nextConfig) {
      this.navigateToPage(`lesson${nextLesson}.html`);
    } else {
      alert('Вы прошли все уроки 5 класса!');
    }
  }

  setupClassSwitcher() {
    const classButtons = document.querySelectorAll('.switch-btn');
    const is5class =
      !this.currentPage.startsWith('2lesson') &&
      this.currentPage !== '2lesson1.html';

    classButtons.forEach(btn => {
      btn.classList.remove('active');

      const href = btn.getAttribute('data-href');
      if (
        (is5class && href === 'lesson0.html') ||
        (!is5class && href === '2lesson.html')
      ) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-href');
        if (target) window.location.href = target;
      });
    });
  }

  setupTestHandlers() {
    const testElements = {
      form: document.getElementById('testForm'),
      result: document.getElementById('testResult'),
      startBtn: document.getElementById('startTestBtn'),
      block: document.getElementById('testBlock'),
      nextBtn: document.getElementById('nextLessonBtn'),
    };

    if (testElements.startBtn && testElements.block) {
      testElements.startBtn.addEventListener('click', () => {
        testElements.startBtn.style.display = 'none';
        testElements.block.style.display = 'block';
        testElements.block.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }

    if (testElements.form && testElements.result) {
      this.setupTestValidation(testElements);
    }

    if (testElements.nextBtn) {
      this.setupNextLessonButton(testElements.nextBtn);
    }
  }

  setupTestValidation(elements) {
    let testPassed = false;

    elements.form.addEventListener('submit', e => {
      e.preventDefault();

      const answers = { q1: '25', q2: 'no', q3: 'shock' };
      let correct = 0;
      const total = Object.keys(answers).length;

      Object.entries(answers).forEach(([question, correctAnswer]) => {
        const selected = elements.form.querySelector(
          `input[name="${question}"]:checked`
        );
        if (selected?.value === correctAnswer) correct++;
      });

      if (correct === total) {
        testPassed = true;
        elements.form.style.display = 'none';
        elements.result.style.display = 'block';
      } else {
        alert(
          `Ты ответил правильно на ${correct} из ${total} вопросов. Попробуй ещё раз.`
        );
      }
    });

    // Возвращаем функцию проверки для использования в других методах
    return () => testPassed;
  }

  setupNextLessonButton(button) {
    button.addEventListener('click', () => {
      // Здесь нужно проверить testPassed, но он локальный в setupTestValidation
      // Можно использовать data-атрибут или другой способ
      const lessonMatch = this.currentPage.match(/lesson(\d+)/);
      const lessonNum = lessonMatch ? parseInt(lessonMatch[1]) : 1;
      const nextLesson = lessonNum + 1;

      window.location.href = `lesson${nextLesson}.html`;
    });
  }

  initializeSliders() {
    const sliderConfigs = {
      slider1: ['Процессор', 'Охлаждение', 'Радиатор'],
      slider2: ['Оперативная память', 'SSD', 'HDD'],
      slider3: ['Видеокарта', 'Сетевая карта', 'Звуковая карта'],
      slider4: ['Блок питания', 'UPS', 'Инвертор'],
      slider5: ['Материнская плата', 'Чипсет', 'BIOS'],
      slider6: ['Корпус', 'Кулеры', 'USB-порты'],
    };

    Object.entries(sliderConfigs).forEach(([id, options]) => {
      this.createSlider(id, options);
    });
  }

  createSlider(id, options) {
    const container = document.getElementById(id);
    if (!container) return;

    let index = 0;

    container.innerHTML = `
      <button class="prev">◀</button>
      <span class="component">${options[index]}</span>
      <button class="next">▶</button>
      <span class="tooltip-btn" data-id="${id}">❓</span>
    `;

    const label = container.querySelector('.component');

    container.querySelector('.prev').addEventListener('click', () => {
      index = (index - 1 + options.length) % options.length;
      label.textContent = options[index];
    });

    container.querySelector('.next').addEventListener('click', () => {
      index = (index + 1) % options.length;
      label.textContent = options[index];
    });

    const tooltipBtn = container.querySelector('.tooltip-btn');
    tooltipBtn.addEventListener('click', () => {
      // Предполагается, что tooltips определен где-то еще
      const text = window.tooltips?.[id] || 'Описание недоступно.';
      const modal = document.getElementById('tooltipModal');
      const overlay = document.getElementById('tooltipOverlay');

      if (modal && overlay) {
        modal.textContent = text;
        modal.classList.add('active');
        overlay.classList.add('active');
      }
    });
  }

  syncHeights() {
    const syncFunction = () => {
      const menu = document.querySelector('.menu');
      const content = document.querySelector('.content_games');

      if (menu && content) {
        content.style.height = 'auto';
        requestAnimationFrame(() => {
          content.style.height = `${menu.offsetHeight}px`;
        });
      }
    };

    // Синхронизация при загрузке и изменении размера
    window.addEventListener('load', syncFunction);
    window.addEventListener('resize', this.debounce(syncFunction, 250));

    // Первоначальная синхронизация
    setTimeout(syncFunction, 100);
  }

  // Утилита для ограничения частоты вызовов функции
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Проверка, есть ли предыдущая страница
  hasPreviousPage() {
    // Если это lesson0.html - нет предыдущей страницы
    if (this.currentPage === 'lesson0.html') {
      return false;
    }

    return true;
  }

  // Проверка, есть ли следующая страница
  hasNextPage() {
    const lessonTaskMatch = this.currentPage.match(/lesson(\d+)-(\d+)\.html/);
    const lessonOnlyMatch = this.currentPage.match(/lesson(\d+)\.html/);

    let lesson, task;

    if (lessonTaskMatch) {
      lesson = parseInt(lessonTaskMatch[1]);
      task = parseInt(lessonTaskMatch[2]);
    } else if (lessonOnlyMatch) {
      lesson = parseInt(lessonOnlyMatch[1]);
      task = 0;
    } else {
      return false;
    }

    const config = this.lessonConfig[lesson];
    if (!config) return false;

    // Если это последний урок и последняя страница
    if (lesson === 6 && task === config.count) {
      return false;
    }

    return true;
  }
}

// Инициализация
const lessonManager = new LessonManager();
