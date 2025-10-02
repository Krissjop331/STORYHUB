// Подсказки для слайдеров компонентов компьютера
const tooltips = {
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
    'Корпус — защищает компоненты и обеспечивает правильное охлаждение системы.',
};

// Обработчики для кнопок подсказок
document.addEventListener('DOMContentLoaded', () => {
  // Добавляем обработчики для кнопок подсказок
  document.addEventListener('click', e => {
    if (e.target.classList.contains('tooltip-btn')) {
      const id = e.target.dataset.id;
      const text = tooltips[id] || 'Описание недоступно.';

      const modal = document.getElementById('tooltipModal');
      const overlay = document.getElementById('tooltipOverlay');

      if (modal && overlay) {
        modal.innerText = text;
        modal.classList.add('active');
        overlay.classList.add('active');
      }
    }
  });

  // Закрытие модального окна при клике на оверлей
  const overlay = document.getElementById('tooltipOverlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      const modal = document.getElementById('tooltipModal');
      if (modal) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
      }
    });
  }
});

// Обработчик для формы алгоритма
document.addEventListener('DOMContentLoaded', () => {
  const algorithmForm = document.getElementById('algorithmForm');
  if (algorithmForm) {
    algorithmForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const inputs = this.querySelectorAll("input[type='text']");
      const resultBox = document.getElementById('resultBox');

      let allFilled = true;
      let steps = [];

      inputs.forEach((input, index) => {
        const value = input.value.trim();
        if (!value) {
          allFilled = false;
        } else {
          steps.push(`${index + 1}. ${value}`);
        }
      });

      if (!resultBox) return;

      if (!allFilled) {
        resultBox.style.display = 'block';
        resultBox.textContent = 'Пожалуйста, заполни все шаги!';
        resultBox.style.color = 'red';
        resultBox.style.backgroundColor = '#ffe6e6';
        resultBox.style.padding = '15px';
        resultBox.style.borderRadius = '8px';
        resultBox.style.border = '1px solid red';
      } else {
        resultBox.style.display = 'block';
        resultBox.style.color = '#333';
        resultBox.style.backgroundColor = '#e8f5e8';
        resultBox.style.padding = '15px';
        resultBox.style.borderRadius = '8px';
        resultBox.style.border = '1px solid #4D36DB';
        resultBox.innerHTML = `<strong>Твой алгоритм:</strong><br>${steps.join(
          '<br>'
        )}`;
      }
    });
  }
});

// Обработчик для проверки двоичных чисел
document.addEventListener('DOMContentLoaded', () => {
  const binaryCheckBtn = document.getElementById('binaryCheckBtn');
  const binaryInput = document.getElementById('binaryInput');
  const binaryResult = document.getElementById('binaryResult');

  if (binaryCheckBtn && binaryInput && binaryResult) {
    binaryCheckBtn.addEventListener('click', () => {
      const input = binaryInput.value.trim();

      if (!input) {
        binaryResult.textContent = 'Введите число!';
        binaryResult.style.color = 'red';
        return;
      }

      // Проверяем, является ли введенное число двоичным
      const isBinary = /^[01]+$/.test(input);

      if (isBinary) {
        const decimal = parseInt(input, 2);
        binaryResult.innerHTML = `
          <span style="color: green;">✓ Это двоичное число!</span><br>
          В десятичной системе: <strong>${decimal}</strong>
        `;
      } else {
        binaryResult.innerHTML = `
          <span style="color: red;">✗ Это не двоичное число!</span><br>
          Двоичные числа содержат только цифры 0 и 1.
        `;
      }
    });

    // Проверка при нажатии Enter
    binaryInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        binaryCheckBtn.click();
      }
    });
  }
});

// Функции для мини-игр
window.GameUtils = {
  // Функция для создания интерактивных элементов
  createInteractiveElement: function (config) {
    const element = document.createElement('div');
    element.className = config.className || 'interactive-element';
    element.innerHTML = config.content || '';

    if (config.clickHandler) {
      element.addEventListener('click', config.clickHandler);
    }

    return element;
  },

  // Функция для показа результата игры
  showGameResult: function (message, isSuccess = true) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'game-result';
    resultDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${isSuccess ? '#d4edda' : '#f8d7da'};
      color: ${isSuccess ? '#155724' : '#721c24'};
      padding: 20px;
      border-radius: 10px;
      border: 1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'};
      z-index: 1001;
      font-family: "Montserrat", sans-serif;
      font-weight: 500;
      text-align: center;
      min-width: 300px;
    `;
    resultDiv.textContent = message;

    document.body.appendChild(resultDiv);

    setTimeout(() => {
      document.body.removeChild(resultDiv);
    }, 3000);
  },

  // Функция для генерации случайного числа
  randomInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};
