// test-results.js - Система управления результатами тестов
// Подключается на страницах с тестами для сохранения результатов

(function () {
  'use strict';

  // Константы для хранения данных
  const TEST_RESULTS_KEY = 'STORYHUB_test_results';
  const USER_PROGRESS_KEY = 'STORYHUB_user_progress';

  // Утилиты для работы с localStorage
  const StorageUtils = {
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Ошибка записи в localStorage:', error);
        return false;
      }
    },

    get: function (key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Ошибка чтения из localStorage:', error);
        return null;
      }
    },

    append: function (key, newItem) {
      try {
        const existingData = this.get(key) || [];
        existingData.push(newItem);
        return this.set(key, existingData);
      } catch (error) {
        console.error('Ошибка добавления в localStorage:', error);
        return false;
      }
    },

    clear: function (key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Ошибка очистки localStorage:', error);
        return false;
      }
    },
  };

  // Получение данных текущего пользователя
  function getCurrentUser() {
    try {
      const userData = sessionStorage.getItem('STORYHUB_user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      return null;
    }
  }

  // Генерация уникального ID для результата теста
  function generateTestId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Сохранение результата теста
  function saveTestResult(testInfo) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error('Пользователь не авторизован');
      return false;
    }

    const testResult = {
      id: generateTestId(),
      userId: currentUser.username,
      userName: currentUser.name,
      userClass: currentUser.class,
      userRole: currentUser.role,
      testName: testInfo.testName,
      lessonNumber: testInfo.lessonNumber,
      className: testInfo.className || '5 класс', // По умолчанию 5 класс
      totalQuestions: testInfo.totalQuestions,
      correctAnswers: testInfo.correctAnswers,
      incorrectAnswers: testInfo.totalQuestions - testInfo.correctAnswers,
      score: testInfo.score, // Процент правильных ответов
      timeTaken: testInfo.timeTaken || null, // Время прохождения в секундах
      answers: testInfo.answers || [], // Детальные ответы
      completedAt: new Date().toISOString(),
      sessionId: sessionStorage.getItem('STORYHUB_auth_token') || 'unknown',
    };

    // Сохраняем результат
    const saved = StorageUtils.append(TEST_RESULTS_KEY, testResult);

    if (saved) {
      console.log('Результат теста сохранен:', testResult);

      // Обновляем прогресс пользователя
      updateUserProgress(currentUser.username, testInfo);

      // Показываем уведомление (только для студентов)
      if (currentUser.role === 'student') {
        showSaveNotification();
      }

      return testResult.id;
    } else {
      console.error('Ошибка сохранения результата теста');
      return false;
    }
  }

  // Обновление прогресса пользователя
  function updateUserProgress(userId, testInfo) {
    const progress = StorageUtils.get(USER_PROGRESS_KEY) || {};

    if (!progress[userId]) {
      progress[userId] = {
        userId: userId,
        testsCompleted: 0,
        totalScore: 0,
        averageScore: 0,
        lastActivity: null,
        completedLessons: [],
      };
    }

    const userProgress = progress[userId];
    userProgress.testsCompleted += 1;
    userProgress.totalScore += testInfo.score;
    userProgress.averageScore = Math.round(
      userProgress.totalScore / userProgress.testsCompleted
    );
    userProgress.lastActivity = new Date().toISOString();

    // Добавляем урок в список пройденных (если еще не добавлен)
    const lessonId = `${testInfo.className}_lesson${testInfo.lessonNumber}`;
    if (!userProgress.completedLessons.includes(lessonId)) {
      userProgress.completedLessons.push(lessonId);
    }

    progress[userId] = userProgress;
    StorageUtils.set(USER_PROGRESS_KEY, progress);
  }

  // Показ уведомления о сохранении
  function showSaveNotification() {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        z-index: 10000;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        animation: slideInRight 0.5s ease-out;
      ">
        ✅ Результат теста сохранен!
      </div>
    `;

    // Добавляем стили анимации
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
      notification.firstElementChild.style.animation =
        'slideOutRight 0.5s ease-out forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }

  // Получение всех результатов тестов
  function getAllTestResults() {
    return StorageUtils.get(TEST_RESULTS_KEY) || [];
  }

  // Получение результатов для конкретного пользователя
  function getUserTestResults(userId) {
    const allResults = getAllTestResults();
    return allResults.filter(result => result.userId === userId);
  }

  // Получение статистики по всем тестам
  function getTestStatistics() {
    const allResults = getAllTestResults();
    const userProgress = StorageUtils.get(USER_PROGRESS_KEY) || {};

    const stats = {
      totalTests: allResults.length,
      totalUsers: Object.keys(userProgress).length,
      averageScore: 0,
      testsByLesson: {},
      userStats: [],
    };

    // Вычисляем общую статистику
    if (allResults.length > 0) {
      const totalScore = allResults.reduce(
        (sum, result) => sum + result.score,
        0
      );
      stats.averageScore = Math.round(totalScore / allResults.length);
    }

    // Группируем по урокам
    allResults.forEach(result => {
      const lessonKey = `${result.className} - Урок ${result.lessonNumber}`;
      if (!stats.testsByLesson[lessonKey]) {
        stats.testsByLesson[lessonKey] = {
          count: 0,
          averageScore: 0,
          totalScore: 0,
        };
      }

      stats.testsByLesson[lessonKey].count += 1;
      stats.testsByLesson[lessonKey].totalScore += result.score;
      stats.testsByLesson[lessonKey].averageScore = Math.round(
        stats.testsByLesson[lessonKey].totalScore /
          stats.testsByLesson[lessonKey].count
      );
    });

    // Статистика по пользователям
    Object.values(userProgress).forEach(progress => {
      stats.userStats.push({
        userId: progress.userId,
        testsCompleted: progress.testsCompleted,
        averageScore: progress.averageScore,
        lastActivity: progress.lastActivity,
        completedLessons: progress.completedLessons.length,
      });
    });

    return stats;
  }

  // Очистка всех результатов (только для администраторов)
  function clearAllResults() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      console.error('Недостаточно прав для очистки результатов');
      return false;
    }

    const confirmed = confirm(
      'Вы действительно хотите удалить ВСЕ результаты тестов? Это действие необратимо!'
    );
    if (!confirmed) return false;

    StorageUtils.clear(TEST_RESULTS_KEY);
    StorageUtils.clear(USER_PROGRESS_KEY);

    console.log('Все результаты тестов очищены');
    return true;
  }

  // Экспорт в JSON для скачивания
  function exportResultsAsJSON() {
    const data = {
      exportDate: new Date().toISOString(),
      testResults: getAllTestResults(),
      userProgress: StorageUtils.get(USER_PROGRESS_KEY) || {},
      statistics: getTestStatistics(),
    };

    return JSON.stringify(data, null, 2);
  }

  // Публичный API
  window.TestResultsManager = {
    // Основные функции
    saveTestResult: saveTestResult,
    getAllTestResults: getAllTestResults,
    getUserTestResults: getUserTestResults,
    getTestStatistics: getTestStatistics,

    // Административные функции
    clearAllResults: clearAllResults,
    exportResultsAsJSON: exportResultsAsJSON,

    // Утилиты
    getCurrentUser: getCurrentUser,

    // Готовые форматтеры для интеграции с тестами
    formatTestInfo: function (
      testName,
      lessonNumber,
      totalQuestions,
      correctAnswers,
      answers,
      timeTaken,
      className
    ) {
      return {
        testName: testName,
        lessonNumber: lessonNumber,
        className: className || '5 класс',
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        score: Math.round((correctAnswers / totalQuestions) * 100),
        answers: answers,
        timeTaken: timeTaken,
      };
    },
  };

  console.log('📊 Система управления результатами тестов загружена');
})();
