// Модуль мини-игр
class MiniGames {
  constructor() {
    this.initializeGames();
  }

  initializeGames() {
    // Слайдеры компонентов компьютера
    this.setupComponentSliders();

    // Система подсказок
    this.setupTooltipSystem();

    // Форма алгоритма
    this.setupAlgorithmForm();

    // Проверка двоичных чисел
    this.setupBinaryCheck();

    // Drag & Drop игры
    this.setupDragDropGames();
  }

  // Слайдеры компонентов компьютера
  setupComponentSliders() {
    const sliders = {
      slider1: ['Процессор', 'Охлаждение', 'Радиатор'],
      slider2: ['Оперативная память', 'SSD', 'HDD'],
      slider3: ['Видеокарта', 'Сетевая карта', 'Звуковая карта'],
      slider4: ['Блок питания', 'UPS', 'Инвертор'],
      slider5: ['Материнская плата', 'Чипсет', 'BIOS'],
      slider6: ['Корпус', 'Кулеры', 'USB-порты'],
    };

    Object.entries(sliders).forEach(([id, options]) => {
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

    container.querySelector('.prev').onclick = () => {
      index = (index - 1 + options.length) % options.length;
      label.textContent = options[index];
    };

    container.querySelector('.next').onclick = () => {
      index = (index + 1) % options.length;
      label.textContent = options[index];
    };

    // Добавляем обработчик для подсказки
    const tooltipBtn = container.querySelector('.tooltip-btn');
    if (tooltipBtn) {
      tooltipBtn.addEventListener('click', () => {
        this.showTooltip(id);
      });
    }
  }

  // Система подсказок
  setupTooltipSystem() {
    this.tooltips = {
      slider1:
        'Процессор — это мозг компьютера, обрабатывающий все команды и вычисления.',
      slider2:
        'Оперативная память — временное хранилище данных для быстрого доступа процессора.',
      slider3:
        'Видеокарта — устройство для обработки графики и вывода изображения на экран.',
      slider4:
        'Блок питания — обеспечивает электричеством все компоненты компьютера.',
      slider5:
        'Материнская плата — объединяет все части компьютера и обеспечивает их взаимодействие.',
      slider6:
        'Корпус — защищает компоненты от повреждений и обеспечивает правильное охлаждение.',
    };

    // Создаем модальное окно для подсказок, если его нет
    this.createTooltipModal();

    // Обработчик закрытия модального окна
    const overlay = document.getElementById('tooltipOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.hideTooltip();
      });
    }
  }

  createTooltipModal() {
    if (document.getElementById('tooltipModal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tooltipOverlay';
    overlay.className = 'tooltip-overlay';

    const modal = document.createElement('div');
    modal.id = 'tooltipModal';
    modal.className = 'tooltip-modal';

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }

  showTooltip(id) {
    const text = this.tooltips[id] || 'Описание недоступно.';
    const modal = document.getElementById('tooltipModal');
    const overlay = document.getElementById('tooltipOverlay');

    if (modal && overlay) {
      modal.innerText = text;
      modal.classList.add('active');
      overlay.classList.add('active');
    }
  }

  hideTooltip() {
    const modal = document.getElementById('tooltipModal');
    const overlay = document.getElementById('tooltipOverlay');

    if (modal && overlay) {
      modal.classList.remove('active');
      overlay.classList.remove('active');
    }
  }

  // Форма создания алгоритма
  setupAlgorithmForm() {
    const algorithmForm = document.getElementById('algorithmForm');
    if (!algorithmForm) return;

    algorithmForm.addEventListener('submit', e => {
      e.preventDefault();

      const inputs = algorithmForm.querySelectorAll('input');
      const resultBox = document.getElementById('resultBox');

      let allFilled = true;
      let steps = [];

      inputs.forEach((input, index) => {
        const value = input.value.trim();
        if (!value) allFilled = false;
        steps.push(`${index + 1}. ${value}`);
      });

      if (!allFilled) {
        this.showResult(resultBox, 'Пожалуйста, заполни все шаги!', 'red');
      } else {
        const resultHTML = `<strong>Твой алгоритм:</strong><br>${steps.join(
          '<br>'
        )}`;
        this.showResult(resultBox, resultHTML, '#333');
      }
    });
  }

  showResult(resultBox, content, color) {
    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.style.color = color;
      resultBox.innerHTML = content;
    }
  }

  // Проверка двоичных чисел
  setupBinaryCheck() {
    const binaryTask = document.querySelector('.binary-check-task');
    if (!binaryTask) return;

    const input = binaryTask.querySelector('input');
    const button = binaryTask.querySelector('button');
    const result = binaryTask.querySelector('.binary-result');

    if (button && input && result) {
      button.addEventListener('click', () => {
        const value = input.value.trim();

        if (this.isBinary(value)) {
          const decimal = parseInt(value, 2);
          result.innerHTML = `✅ Правильно! ${value} в двоичной = ${decimal} в десятичной`;
          result.style.color = 'green';
        } else {
          result.innerHTML = `❌ Это не двоичное число! Используй только 0 и 1`;
          result.style.color = 'red';
        }
      });
    }
  }

  isBinary(str) {
    return /^[01]+$/.test(str) && str.length > 0;
  }

  // Drag & Drop игры
  setupDragDropGames() {
    this.setupSafetyGame();
    this.setupErgonomicsGame();
  }

  // Игра по безопасности
  setupSafetyGame() {
    const gameContainer = document.getElementById('safetyGame');
    if (!gameContainer) return;

    const items = [
      { id: 'water', text: 'Вода рядом с компьютером', safe: false },
      { id: 'cable', text: 'Аккуратно разложенные кабели', safe: true },
      { id: 'food', text: 'Еда за компьютером', safe: false },
      { id: 'posture', text: 'Правильная осанка', safe: true },
    ];

    this.createDragDropGame(
      gameContainer,
      items,
      'Перетащи безопасные действия в зеленую зону:'
    );
  }

  // Игра по эргономике
  setupErgonomicsGame() {
    const gameContainer = document.getElementById('ergonomicsGame');
    if (!gameContainer) return;

    const items = [
      { id: 'monitor', text: 'Монитор на уровне глаз', correct: true },
      { id: 'chair', text: 'Удобное кресло', correct: true },
      { id: 'lighting', text: 'Хорошее освещение', correct: true },
      { id: 'breaks', text: 'Регулярные перерывы', correct: true },
    ];

    this.createDragDropGame(
      gameContainer,
      items,
      'Выбери элементы правильного рабочего места:'
    );
  }

  createDragDropGame(container, items, instruction) {
    container.innerHTML = `
      <h3>${instruction}</h3>
      <div class="drag-items">
        ${items
          .map(
            item =>
              `<div class="drag-item" draggable="true" data-id="${
                item.id
              }" data-correct="${item.safe || item.correct}">
            ${item.text}
          </div>`
          )
          .join('')}
      </div>
      <div class="drop-zones">
        <div class="drop-zone correct" data-type="correct">✅ Правильно</div>
        <div class="drop-zone incorrect" data-type="incorrect">❌ Неправильно</div>
      </div>
      <div class="game-result"></div>
    `;

    this.initializeDragDrop(container);
  }

  initializeDragDrop(container) {
    const dragItems = container.querySelectorAll('.drag-item');
    const dropZones = container.querySelectorAll('.drop-zone');
    const result = container.querySelector('.game-result');

    // Добавляем обработчики для перетаскивания
    dragItems.forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', item.dataset.id);
        e.dataTransfer.setData('correct', item.dataset.correct);
      });
    });

    // Добавляем обработчики для зон сброса
    dropZones.forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
      });

      zone.addEventListener('drop', e => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const isCorrect = e.dataTransfer.getData('correct') === 'true';
        const zoneType = zone.dataset.type;

        const draggedItem = container.querySelector(`[data-id="${itemId}"]`);

        if (draggedItem) {
          zone.appendChild(draggedItem);

          // Проверяем правильность размещения
          const isPlacedCorrectly =
            (isCorrect && zoneType === 'correct') ||
            (!isCorrect && zoneType === 'incorrect');

          draggedItem.style.backgroundColor = isPlacedCorrectly
            ? '#d4edda'
            : '#f8d7da';

          this.checkGameCompletion(container);
        }
      });
    });
  }

  checkGameCompletion(container) {
    const dragItems = container.querySelectorAll('.drag-item');
    const result = container.querySelector('.game-result');

    let allPlaced = true;
    let correctPlacements = 0;

    dragItems.forEach(item => {
      const parent = item.parentElement;
      if (!parent.classList.contains('drop-zone')) {
        allPlaced = false;
        return;
      }

      const isCorrect = item.dataset.correct === 'true';
      const zoneType = parent.dataset.type;
      const isPlacedCorrectly =
        (isCorrect && zoneType === 'correct') ||
        (!isCorrect && zoneType === 'incorrect');

      if (isPlacedCorrectly) correctPlacements++;
    });

    if (allPlaced) {
      const percentage = Math.round(
        (correctPlacements / dragItems.length) * 100
      );
      result.innerHTML = `Игра завершена! Правильно: ${correctPlacements}/${dragItems.length} (${percentage}%)`;

      if (percentage === 100) {
        result.style.color = 'green';
        result.innerHTML += ' 🎉 Отлично!';
      } else if (percentage >= 70) {
        result.style.color = 'orange';
        result.innerHTML += ' 👍 Хорошо!';
      } else {
        result.style.color = 'red';
        result.innerHTML += ' 📚 Нужно повторить материал.';
      }
    }
  }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  window.miniGames = new MiniGames();
});

// Экспорт для использования в других модулях
window.MiniGames = MiniGames;
