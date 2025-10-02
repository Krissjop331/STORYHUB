// auth-guard.js - Универсальная система защиты страниц
// Подключается первым скриптом на каждой защищенной странице

(function () {
  'use strict';

  // Утилиты для работы с sessionStorage
  const SessionUtils = {
    set: function (name, value) {
      try {
        sessionStorage.setItem(name, value);
        return true;
      } catch (error) {
        console.error('Ошибка записи в sessionStorage:', error);
        return false;
      }
    },

    get: function (name) {
      try {
        return sessionStorage.getItem(name);
      } catch (error) {
        console.error('Ошибка чтения из sessionStorage:', error);
        return null;
      }
    },

    remove: function (name) {
      try {
        sessionStorage.removeItem(name);
        return true;
      } catch (error) {
        console.error('Ошибка удаления из sessionStorage:', error);
        return false;
      }
    },

    clear: function () {
      try {
        sessionStorage.clear();
        return true;
      } catch (error) {
        console.error('Ошибка очистки sessionStorage:', error);
        return false;
      }
    },
  };

  // Константы
  const AUTH_TOKEN = 'STORYHUB_auth_token';
  const USER_DATA = 'STORYHUB_user_data';
  const SESSION_START = 'STORYHUB_session_start';

  // Проверка валидности сессионного токена
  function validateSessionToken(token) {
    if (!token) {
      return false;
    }

    try {
      const tokenData = JSON.parse(atob(token));

      if (!tokenData.sessionId || !tokenData.username || !tokenData.createdAt) {
        return false;
      }

      const sessionStart = SessionUtils.get(SESSION_START);
      if (!sessionStart || tokenData.createdAt < sessionStart) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Очистка сессии
  function clearSession() {
    SessionUtils.remove(AUTH_TOKEN);
    SessionUtils.remove(USER_DATA);
  }

  // Получение данных текущего пользователя
  function getCurrentUser() {
    const token = SessionUtils.get(AUTH_TOKEN);
    const userData = SessionUtils.get(USER_DATA);

    if (token && userData && validateSessionToken(token)) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        return null;
      }
    }
    return null;
  }

  // Проверка авторизации
  function requireAuth(redirectUrl = 'index.html') {
    const token = SessionUtils.get(AUTH_TOKEN);
    const userData = SessionUtils.get(USER_DATA);

    if (!token || !userData || !validateSessionToken(token)) {
      console.log('Пользователь не авторизован, перенаправление на:', redirectUrl);
      clearSession();
      window.location.href = redirectUrl;
      return false;
    }

    return true;
  }

  // Выход из системы
  function logout(redirectUrl = 'index.html') {
    console.log('Выход из системы...');
    clearSession();
    window.location.href = redirectUrl;
  }

  // Инициализация системы защиты пользователя
  function initUserDisplay() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      logout();
      return;
    }

    // Обновляем имя пользователя во всех элементах с классом 'nameuser'
    const userNameElements = document.querySelectorAll('.nameuser');
    userNameElements.forEach((element) => {
      element.textContent = currentUser.name;
      element.classList.remove('loading');
    });

    // Настраиваем кнопки выхода
    const logoutButtons = document.querySelectorAll('.iconexit, [data-action="logout"]');
    logoutButtons.forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault();

        if (confirm('Вы действительно хотите выйти из системы?')) {
          logout();
        }
      });
    });

    console.log('Пользователь авторизован:', currentUser.name);
    return currentUser;
  }

  // Периодическая проверка авторизации
  function startAuthMonitoring() {
    setInterval(function () {
      if (!getCurrentUser() || !validateSessionToken(SessionUtils.get(AUTH_TOKEN))) {
        console.log('Сессия истекла, принудительный выход');
        alert('Ваша сессия истекла. Необходимо войти заново.');
        logout();
      }
    }, 60000); // Проверка каждую минуту
  }

  // КРИТИЧЕСКАЯ ПРОВЕРКА: выполняется сразу при загрузке скрипта
  if (!requireAuth()) {
    // Если пользователь не авторизован, скрываем страницу полностью
    document.documentElement.style.display = 'none';
    return;
  }

  // Экспорт функций в глобальную область видимости
  window.STORYHUB_AUTH = {
    getCurrentUser: getCurrentUser,
    requireAuth: requireAuth,
    logout: logout,
    validateToken: validateSessionToken,
    clearSession: clearSession,
  };

  // Инициализация после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initUserDisplay();
      startAuthMonitoring();
      console.log('🔐 STORYHUB Auth Guard активирован');
    });
  } else {
    // DOM уже загружен
    initUserDisplay();
    startAuthMonitoring();
    console.log('🔐 STORYHUB Auth Guard активирован');
  }

  // Совместимость с существующими глобальными функциями
  window.logout = logout;
  window.getCurrentUser = getCurrentUser;
  window.requireAuth = requireAuth;
})();
