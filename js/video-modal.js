/**
 * Модуль видео-плеера STORYHUB
 * Универсальный компонент для отображения видео с жестами
 */

class VideoModal {
  constructor(options = {}) {
    this.options = {
      videoUrl: options.videoUrl || '',
      buttonTitle: options.buttonTitle || 'Посмотреть видео с жестами',
      buttonIcon: options.buttonIcon || '👋',
      autoplay: options.autoplay !== false, // По умолчанию true
      controls: options.controls !== false, // По умолчанию true
      loop: options.loop || false,
      buttonPosition: options.buttonPosition || 'top-right', // top-right, top-left, bottom-right, bottom-left
      ...options,
    };

    this.isOpen = false;
    this.videoElement = null;
    this.init();
  }

  init() {
    this.createButton();
    this.createModal();
    this.attachEventListeners();
    console.log('🎥 VideoModal инициализирован');
  }

  createButton() {
    // Создаем кнопку
    this.button = document.createElement('button');
    this.button.className = `video-modal-btn video-modal-btn-${this.options.buttonPosition}`;
    this.button.innerHTML = `
      <span class="video-btn-icon">${this.options.buttonIcon}</span>
      <div class="video-btn-tooltip">${this.options.buttonTitle}</div>
    `;
    this.button.title = this.options.buttonTitle;

    // Добавляем кнопку в body
    document.body.appendChild(this.button);
  }

  createModal() {
    // Создаем overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'video-modal-overlay';

    // Создаем модальное окно
    this.modal = document.createElement('div');
    this.modal.className = 'video-modal';
    this.modal.innerHTML = `
      <div class="video-modal-content">
        <div class="video-modal-header">
          <h3>${this.options.buttonTitle}</h3>
          <button class="video-modal-close" title="Закрыть">×</button>
        </div>
        <div class="video-modal-body">
          <div class="video-container">
            ${
              this.options.videoUrl
                ? this.createVideoElement()
                : '<p>Видео не найдено</p>'
            }
          </div>
        </div>
      </div>
    `;

    // Добавляем в body
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.modal);

    // Находим видео элемент
    this.videoElement = this.modal.querySelector('video');
  }

  createVideoElement() {
    const autoplayAttr = this.options.autoplay ? 'autoplay' : '';
    const controlsAttr = this.options.controls ? 'controls' : '';
    const loopAttr = this.options.loop ? 'loop' : '';

    return `
      <video
        ${autoplayAttr}
        ${controlsAttr}
        ${loopAttr}
        muted
        preload="metadata"
        class="video-player"
      >
        <source src="${this.options.videoUrl}" type="video/mp4">
        <p>Ваш браузер не поддерживает видео.
           <a href="${this.options.videoUrl}" target="_blank">Скачать видео</a>
        </p>
      </video>
    `;
  }

  attachEventListeners() {
    // Открытие модального окна
    this.button.addEventListener('click', () => this.open());

    // Закрытие модального окна
    this.modal
      .querySelector('.video-modal-close')
      .addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());

    // Закрытие по Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Остановка видео при закрытии
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.overlay.classList.add('active');
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Предотвращаем прокрутку фона

    // Запускаем видео если включен autoplay
    if (this.videoElement && this.options.autoplay) {
      this.videoElement.currentTime = 0; // Начинаем с начала
      this.videoElement.play().catch(error => {
        console.warn('Не удалось автоматически запустить видео:', error);
      });
    }

    console.log('🎥 Видео модальное окно открыто');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.overlay.classList.remove('active');
    this.modal.classList.remove('active');
    document.body.style.overflow = ''; // Восстанавливаем прокрутку

    // Останавливаем и сбрасываем видео
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
    }

    console.log('🎥 Видео модальное окно закрыто');
  }

  // Методы для программного управления
  updateVideo(newVideoUrl) {
    this.options.videoUrl = newVideoUrl;
    const videoContainer = this.modal.querySelector('.video-container');
    videoContainer.innerHTML = this.createVideoElement();
    this.videoElement = this.modal.querySelector('video');
  }

  destroy() {
    // Очистка ресурсов
    if (this.videoElement) {
      this.videoElement.pause();
    }

    this.button.remove();
    this.overlay.remove();
    this.modal.remove();

    console.log('🎥 VideoModal уничтожен');
  }
}

// Функция для быстрого создания видео-плеера
window.createVideoModal = function (options) {
  return new VideoModal(options);
};

// CSS стили (автоматически добавляются при загрузке скрипта)
function injectStyles() {
  if (document.getElementById('video-modal-styles')) return; // Не добавляем дважды

  const styles = `
    <style id="video-modal-styles">
      /* Кнопка видео */
      .video-modal-btn {
        position: fixed;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        background: #582FF5;
        color: white;
        cursor: pointer;
        z-index: 999;
        box-shadow: 0 4px 15px #582FF5;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-family: 'Montserrat', sans-serif;
      }

      .video-modal-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px #582FF5;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% { transform: scale(1.1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1.1); }
      }

      /* Позиционирование кнопки */
      .video-modal-btn-top-right {
        top: 20%;
        right: 5%;
      }

      .video-modal-btn-top-left {
        top: 20px;
        left: 20px;
      }

      .video-modal-btn-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .video-modal-btn-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      /* Tooltip для кнопки */
      .video-btn-tooltip {
        position: absolute;
        right: 70px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .video-modal-btn:hover .video-btn-tooltip {
        opacity: 1;
      }

      /* Модальное окно */
      .video-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .video-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .video-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.7);
        background: white;
        border-radius: 15px;
        z-index: 9999;
        max-width: 20vw;
        max-height: 90vh;
        width: 800px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .video-modal.active {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, -50%) scale(1);
      }

      .video-modal-content {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .video-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
      }

      .video-modal-header h3 {
        margin: 0;
        color: #333;
        font-size: 18px;
        font-weight: 600;
      }

      .video-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .video-modal-close:hover {
        background: #582FF5;
        color: white;
        transform: rotate(90deg);
      }

      .video-modal-body {
        padding: 20px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .video-container {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .video-player {
        width: 100%;
        max-width: 100%;
        height: auto;
        border-radius: 10px;
        background: #000;
      }

      /* Адаптивность */
      @media (max-width: 768px) {
        .video-modal-btn {
          width: 50px;
          height: 50px;
          font-size: 20px;
        }

        .video-modal-btn-top-right,
        .video-modal-btn-bottom-right {
          right: 15px;
        }

        .video-modal-btn-top-left,
        .video-modal-btn-bottom-left {
          left: 15px;
        }

        .video-modal-btn-top-right,
        .video-modal-btn-top-left {
          top: 15px;
        }

        .video-modal-btn-bottom-right,
        .video-modal-btn-bottom-left {
          bottom: 15px;
        }

        .video-btn-tooltip {
          display: none; /* Скрываем tooltip на мобильных */
        }

        .video-modal {
          width: 85vw;
          height: 70vh;
        }

        .video-modal-header {
          padding: 15px;
        }

        .video-modal-header h3 {
          font-size: 16px;
        }

        .video-modal-body {
          padding: 15px;
        }
      }

      @media (max-width: 480px) {
        .video-modal {
          height: 60vh;
        }

        .video-modal-header {
          padding: 10px 15px;
        }

        .video-modal-body {
          padding: 10px;
        }
      }
    </style>
  `;

  document.head.insertAdjacentHTML('beforeend', styles);
}

// Автоматически добавляем стили при загрузке скрипта
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectStyles);
} else {
  injectStyles();
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoModal;
}
