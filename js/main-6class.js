// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM загружен, инициализация 6 класса...');

  const img = document.querySelector('.content_games_img');
  const arrow = document.querySelector('.arrow');
  const arrowBack = document.querySelector('.arrow-back');
  const menuItems = document.querySelectorAll('.lesson-list li');
  const currentPage = window.location.pathname.split('/').pop();

  console.log('Текущая страница:', currentPage);
  console.log('Найденное изображение:', img);
  console.log('Найденная стрелка:', arrow);
  console.log('Найденная стрелка назад:', arrowBack);

  // Получаем номер текущего урока для 6 класса
  function getCurrentLessonNumber(page) {
    if (page === '2lesson.html') return 1;

    const match = page.match(/2lesson(\d+)(?:-\d+)?\.html/);
    return match ? parseInt(match[1]) : null;
  }

  const currentLesson = getCurrentLessonNumber(currentPage);

  // Подсветка активного пункта меню
  menuItems.forEach(item => {
    const href = item.getAttribute('data-href');

    const hrefMatch = href.match(/2lesson(\d+)/);
    const hrefLesson = hrefMatch ? parseInt(hrefMatch[1]) : null;

    // Особый случай для 2lesson.html (урок 1)
    if (href === '2lesson.html' && currentLesson === 1) {
      item.classList.add('active');
    }
    // Обычные уроки
    else if (hrefLesson && currentLesson && hrefLesson === currentLesson) {
      item.classList.add('active');
    }
    // Точное совпадение страниц
    else if (href === currentPage) {
      item.classList.add('active');
    }

    item.addEventListener('click', () => {
      if (href) window.location.href = href;
    });
  });

  // Конфигурация каждого урока (для 6 класса)
  const lessonConfig = {
    1: { count: 10 }, // Урок 1: 2lesson.html -> 2lesson1-2.html -> ... -> 2lesson1-10.html -> 2lesson2.html
    2: { count: 10 }, // Урок 2: 2lesson2.html -> 2lesson2-2.html -> ... -> 2lesson2-10.html -> 2lesson3.html
    3: { count: 12 }, // Урок 3: 2lesson3.html -> 2lesson3-2.html -> ... -> 2lesson3-12.html -> 2lesson4.html
    4: { count: 12 }, // Урок 4: 2lesson4.html -> 2lesson4-2.html -> ... -> 2lesson4-12.html -> 2lesson5.html
    5: { count: 10 }, // Урок 5: 2lesson5.html -> 2lesson5-2.html -> ... -> 2lesson5-10.html -> 2lesson6.html
    6: { count: 13 }, // Урок 6: 2lesson6.html -> 2lesson6-2.html -> ... -> 2lesson6-13.html -> конец
  };

  // Функция для выполнения перехода вперед
  function navigateToNext() {
    console.log('Выполняется переход с страницы:', currentPage);

    let lesson = null;
    let task = null;

    // Определяем текущий урок и задание
    if (currentPage === '2lesson.html') {
      lesson = 1;
      task = 0; // Стартовая страница урока
    } else if (currentPage === '2lesson2.html') {
      // С главной страницы урока 2 переходим к первому заданию
      window.location.href = '2lesson2-2.html';
      return;
    } else if (currentPage === '2lesson3.html') {
      // С главной страницы урока 3 переходим к первому заданию
      window.location.href = '2lesson3-2.html';
      return;
    } else if (currentPage === '2lesson4.html') {
      // С главной страницы урока 4 переходим к первому заданию
      window.location.href = '2lesson4-2.html';
      return;
    } else if (currentPage === '2lesson5.html') {
      // С главной страницы урока 5 переходим к первому заданию
      window.location.href = '2lesson5-2.html';
      return;
    } else if (currentPage === '2lesson6.html') {
      // С главной страницы урока 6 переходим к первому заданию
      window.location.href = '2lesson6-2.html';
      return;
    } else {
      const matchLessonTask = currentPage.match(/2lesson(\d+)-(\d+)\.html/);
      const matchOnlyLesson = currentPage.match(/2lesson(\d+)\.html/);

      if (matchLessonTask) {
        lesson = parseInt(matchLessonTask[1]);
        task = parseInt(matchLessonTask[2]);
      } else if (matchOnlyLesson) {
        lesson = parseInt(matchOnlyLesson[1]);
        task = 0; // Стартовая страница урока
      }
    }

    const config = lessonConfig[lesson];
    if (!config) {
      alert('Урок не найден в конфигурации');
      return;
    }

    const nextTask = task + 1;

    if (lesson === 1 && task === 0) {
      // Урок 1 стартовая страница
      window.location.href = '2lesson1-2.html';
    } else if (nextTask <= config.count) {
      // Обычные задания внутри урока
      window.location.href = `2lesson${lesson}-${nextTask}.html`;
    } else {
      // Переход к следующему уроку
      const nextLesson = lesson + 1;
      const nextConfig = lessonConfig[nextLesson];

      if (nextConfig) {
        window.location.href = `2lesson${nextLesson}.html`;
      } else {
        alert('Вы прошли все уроки 6 класса!');
      }
    }
  }

  // Функция для выполнения перехода назад
  function navigateToPrevious() {
    console.log('Выполняется переход назад с страницы:', currentPage);

    // Специальные переходы назад для главных страниц уроков
    const specialBackTransitions = {
      '2lesson2.html': '2lesson1-10.html', // Урок 2 → последняя страница урока 1
      '2lesson3.html': '2lesson2-10.html', // Урок 3 → последняя страница урока 2
      '2lesson4.html': '2lesson3-12.html', // Урок 4 → последняя страница урока 3
      '2lesson5.html': '2lesson4-12.html', // Урок 5 → последняя страница урока 4
      '2lesson6.html': '2lesson5-10.html', // Урок 6 → последняя страница урока 5
      '2lesson1-2.html': '2lesson.html', // Первая подстраница урока 1 → главная страница урока 1
      '2lesson2-2.html': '2lesson2.html', // Первая подстраница урока 2 → главная страница урока 2
      '2lesson3-2.html': '2lesson3.html', // Первая подстраница урока 3 → главная страница урока 3
      '2lesson4-2.html': '2lesson4.html', // Первая подстраница урока 4 → главная страница урока 4
      '2lesson5-2.html': '2lesson5.html', // Первая подстраница урока 5 → главная страница урока 5
      '2lesson6-2.html': '2lesson6.html', // Первая подстраница урока 6 → главная страница урока 6
    };

    if (specialBackTransitions[currentPage]) {
      window.location.href = specialBackTransitions[currentPage];
      return;
    }

    // Для страницы 2lesson.html нет возврата (это начало)
    if (currentPage === '2lesson.html') {
      alert('Это начало курса 6 класса!');
      return;
    }

    // Общая логика обратной навигации для подстраниц
    const matchLessonTask = currentPage.match(/2lesson(\d+)-(\d+)\.html/);

    if (matchLessonTask) {
      const lesson = parseInt(matchLessonTask[1]);
      const task = parseInt(matchLessonTask[2]);

      if (task > 2) {
        // Возвращаемся к предыдущей подстранице
        window.location.href = `2lesson${lesson}-${task - 1}.html`;
      } else {
        // Возвращаемся к главной странице урока (уже обработано в specialBackTransitions)
        window.location.href = `2lesson${lesson}.html`;
      }
    }
  }

  // Переход по клику на изображение
  if (img) {
    img.addEventListener('click', e => {
      console.log('Клик по изображению');
      e.preventDefault();
      navigateToNext();
    });
  } else {
    console.log('Изображение не найдено!');
  }

  // Переход по клику на стрелку вперед
  if (arrow) {
    arrow.addEventListener('click', e => {
      console.log('Клик по стрелке вперед');
      e.preventDefault();
      e.stopPropagation();
      navigateToNext();
    });
  } else {
    console.log('Стрелка вперед не найдена!');
  }

  // Переход по клику на стрелку назад
  if (arrowBack) {
    arrowBack.addEventListener('click', e => {
      console.log('Клик по стрелке назад');
      e.preventDefault();
      e.stopPropagation();
      navigateToPrevious();
    });
  } else {
    console.log('Стрелка назад не найдена!');
  }

  // Дополнительный обработчик для всех элементов с классами навигации
  document.addEventListener('click', e => {
    if (
      e.target.classList.contains('arrow') &&
      !e.target.classList.contains('arrow-back')
    ) {
      console.log('Клик по стрелке вперед через делегирование');
      e.preventDefault();
      e.stopPropagation();
      navigateToNext();
    }

    if (
      e.target.classList.contains('arrow-back') ||
      e.target.classList.contains('back-button')
    ) {
      console.log('Клик по стрелке назад через делегирование');
      e.preventDefault();
      e.stopPropagation();
      navigateToPrevious();
    }

    // Обработчики для кнопок навигации
    if (
      e.target.id === 'nextLessonBtn' ||
      e.target.classList.contains('next-lesson-btn')
    ) {
      console.log('Клик по кнопке "Следующий урок"');
      e.preventDefault();
      e.stopPropagation();
      navigateToNext();
    }

    if (
      e.target.id === 'prevLessonBtn' ||
      e.target.classList.contains('prev-lesson-btn')
    ) {
      console.log('Клик по кнопке "Предыдущий урок"');
      e.preventDefault();
      e.stopPropagation();
      navigateToPrevious();
    }
  });

  // Переключение между классами
  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-href');
      if (target) window.location.href = target;
    });
  });

  // Подсветка активной кнопки класса
  const classButtons = document.querySelectorAll('.switch-btn');
  classButtons.forEach(btn => btn.classList.remove('active'));

  // Определяем, какой класс активен (6 класс)
  const is6class =
    currentPage.startsWith('2lesson') || currentPage === '2index.html';

  classButtons.forEach(btn => {
    const href = btn.getAttribute('data-href');
    if (!is6class && href === 'index.html') {
      btn.classList.add('active');
    } else if (is6class && href === '2lesson.html') {
      btn.classList.add('active');
    }
  });

  // Обработчики для тестов и интерактивных элементов
  let testPassed = false;

  const testForm = document.getElementById('testForm');
  const testResult = document.getElementById('testResult');
  const startTestBtn = document.getElementById('startTestBtn');
  const testBlock = document.getElementById('testBlock');

  // Показываем тест при клике
  if (startTestBtn && testBlock) {
    startTestBtn.addEventListener('click', () => {
      startTestBtn.style.display = 'none';
      testBlock.style.display = 'block';
      testBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Проверка теста
  if (testForm && testResult) {
    testForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Ответы для теста двоичной системы
      const answers = {
        q1: 'binary',
        q2: '2',
        q3: '5',
      };

      let correct = 0;
      let total = Object.keys(answers).length;

      for (let q in answers) {
        const selected = testForm.querySelector(`input[name="${q}"]:checked`);
        if (selected && selected.value === answers[q]) {
          correct++;
        }
      }

      if (correct === total) {
        testPassed = true;
        testForm.style.display = 'none';
        testResult.style.display = 'block';
      } else {
        alert(
          `Ты ответил правильно на ${correct} из ${total} вопросов. Попробуй ещё раз.`
        );
      }
    });
  }

  // Обработчики для специальных кнопок навигации
  const nextLessonBtn = document.getElementById('nextLessonBtn');
  if (nextLessonBtn) {
    nextLessonBtn.addEventListener('click', () => {
      console.log('Клик по специальной кнопке "Следующий урок"');
      navigateToNext();
    });
  }

  const prevLessonBtn = document.getElementById('prevLessonBtn');
  if (prevLessonBtn) {
    prevLessonBtn.addEventListener('click', () => {
      console.log('Клик по специальной кнопке "Предыдущий урок"');
      navigateToPrevious();
    });
  }

  // Слайдеры для компонентов компьютера (если есть)
  const sliders = {
    slider1: ['Процессор', 'Охлаждение', 'Радиатор'],
    slider2: ['Оперативная память', 'SSD', 'HDD'],
    slider3: ['Видеокарта', 'Сетевая карта', 'Звуковая карта'],
    slider4: ['Блок питания', 'UPS', 'Инвертор'],
    slider5: ['Материнская плата', 'Чипсет', 'BIOS'],
    slider6: ['Корпус', 'Кулеры', 'USB-порты'],
  };

  function createSlider(id, options) {
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
    container.querySelector('.prev').onclick = () => {
      index = (index - 1 + options.length) % options.length;
      label.textContent = options[index];
    };
    container.querySelector('.next').onclick = () => {
      index = (index + 1) % options.length;
      label.textContent = options[index];
    };

    const tooltipBtn = container.querySelector('.tooltip-btn');
    tooltipBtn.addEventListener('click', () => {
      const text = tooltips[id] || 'Описание недоступно.';
      const modal = document.getElementById('tooltipModal');
      const overlay = document.getElementById('tooltipOverlay');
      if (modal && overlay) {
        modal.innerText = text;
        modal.classList.add('active');
        overlay.classList.add('active');
      }
    });
  }

  Object.entries(sliders).forEach(([id, options]) => createSlider(id, options));

  // Функции для проверки доступности навигации
  function hasPreviousPage() {
    return currentPage !== '2lesson.html';
  }

  function hasNextPage() {
    const matchLessonTask = currentPage.match(/2lesson(\d+)-(\d+)\.html/);
    const matchOnlyLesson = currentPage.match(/2lesson(\d+)\.html/);

    let lesson, task;

    if (matchLessonTask) {
      lesson = parseInt(matchLessonTask[1]);
      task = parseInt(matchLessonTask[2]);
    } else if (matchOnlyLesson) {
      lesson = parseInt(matchOnlyLesson[1]);
      task = 0;
    } else {
      return false;
    }

    const config = lessonConfig[lesson];
    if (!config) return false;

    // Если это последний урок и последняя страница
    if (lesson === 6 && task === config.count) {
      return false;
    }

    return true;
  }

  // Создаем CSS-стрелку назад, если изображение не найдено
  if (!arrowBack && hasPreviousPage()) {
    console.log('Изображение стрелки назад не найдено, создаем CSS-версию');
  }

  // Делаем функции глобально доступными для использования в других скриптах
  window.navigateToNext = navigateToNext;
  window.navigateToPrevious = navigateToPrevious;
  window.hasPreviousPage = hasPreviousPage;
  window.hasNextPage = hasNextPage;

  console.log('✅ Инициализация 6 класса с навигацией завершена');
}); // Закрытие DOMContentLoaded

// Синхронизация высот меню и контента
function syncHeights() {
  setTimeout(() => {
    const menu = document.querySelector('.menu');
    const content = document.querySelector('.content_games');
    if (menu && content) {
      content.style.height = 'auto';
      content.style.height = menu.offsetHeight + 'px';
    }
  }, 100);
}

window.addEventListener('load', syncHeights);
window.addEventListener('resize', syncHeights);
