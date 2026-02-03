import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Базовый URL API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bankcrm-1.onrender.com';

/**
 * Создание экземпляра axios с настройками
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Интерцептор для добавления токена авторизации к каждому запросу
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Интерцептор для обработки ошибок
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если получен 401, выходим из системы
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

/**
 * API методы - ИСПРАВЛЕНО ДЛЯ СООТВЕТСТВИЯ БЭКЕНДУ
 */
export const api = {
  // Аутентификация
  auth: {
    login: (username, password) => 
      apiClient.post('/api/auth/login', { username, password }),
    
    register: (userData) => 
      apiClient.post('/api/auth/register', userData),
    
    resetPassword: (currentPassword, newPassword) =>
      apiClient.post('/api/auth/reset-password', { currentPassword, newPassword }),
  },
  
  // Пользователи - ИСПРАВЛЕНО!
  users: {
    // Получить всех пользователей (через AuthController)
    getAll: () => 
      apiClient.get('/api/auth/users'),
    
    // Получить пользователя по ID
    getById: (id) => 
      apiClient.get(`/api/auth/user/${id}`),
    
    // ВРЕМЕННОЕ РЕШЕНИЕ: Получить операторов из всех пользователей
    getOperators: async () => {
      const response = await apiClient.get('/api/auth/users');
      // Фильтруем только операторов на клиенте
      const operators = response.data.filter(user => 
        user.role === 'OPERATOR' && user.active
      );
      return { data: operators };
    },
    
    // ПРИМЕЧАНИЕ: Функции updateStatus нет в бэкенде!
    // Нужно добавить в бэкенд или убрать из фронтенда
  },
  
  // Чаты - ЭТО РАБОТАЕТ
  chats: {
    getAll: () => 
      apiClient.get('/api/telegrambot/chats'),
    
    getById: (id) => 
      apiClient.get(`/api/telegrambot/chat/${id}`),
    
    markAsRead: (chatId) => 
      apiClient.post(`/api/telegrambot/chat/${chatId}/markAsRead`),
  },
  
  // Заявки (Tickets) - ИСПРАВЛЕНО!
  tickets: {
    // Получить все заявки с пагинацией
    getAll: (params) => 
      apiClient.get('/api/tickets', { params }),
    
    // Получить заявку по ID
    getById: (id) => 
      apiClient.get(`/api/tickets/${id}`),
    
    // Изменить статус - ИСПРАВЛЕНО!
    changeStatus: (id, newStatus, comment) => 
      apiClient.put(`/api/tickets/${id}/status`, { 
        newStatus,  // Именно newStatus, не status!
        comment 
      }),
    
    // Назначить оператора - ИСПРАВЛЕНО!
    assignOperator: (id, operatorId) => 
      apiClient.put(`/api/tickets/${id}/assign`, { operatorId }),
    
    // Добавить комментарий
    addComment: (id, content) => 
      apiClient.post(`/api/tickets/${id}/comments`, { content }),
    
    // Получить комментарии
    getComments: (id) => 
      apiClient.get(`/api/tickets/${id}/comments`),
    
    // Получить историю
    getHistory: (id) => 
      apiClient.get(`/api/tickets/${id}/history`),
    
    // Установить тему/подкатегорию - ИСПРАВЛЕНО!
    setTopic: (id, topicId, subcategoryId) => 
      apiClient.put(`/api/tickets/${id}/topic`, { 
        topicId, 
        subcategoryId 
      }),
    
    // УДАЛЕНО: update() - такого эндпоинта нет!
    // Вместо него используйте setTopic()
  },
  
  // Темы обращений - НУЖНО ПРОВЕРИТЬ НАЛИЧИЕ В БЭКЕНДЕ
  topics: {
    getAll: () => 
      apiClient.get('/api/topics'),
    
    getById: (id) => 
      apiClient.get(`/api/topics/${id}`),
    
    create: (data) => 
      apiClient.post('/api/topics', data),
    
    update: (id, data) => 
      apiClient.put(`/api/topics/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`/api/topics/${id}`),
  },
  
  // Подкатегории - НУЖНО ПРОВЕРИТЬ НАЛИЧИЕ В БЭКЕНДЕ
  subcategories: {
    getAll: (topicId) => 
      apiClient.get('/api/subcategories', { params: { topicId } }),
    
    getById: (id) => 
      apiClient.get(`/api/subcategories/${id}`),
    
    create: (data) => 
      apiClient.post('/api/subcategories', data),
    
    update: (id, data) => 
      apiClient.put(`/api/subcategories/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`/api/subcategories/${id}`),
  },
  
  // Готовые ответы - НУЖНО ПРОВЕРИТЬ НАЛИЧИЕ В БЭКЕНДЕ
  cannedResponses: {
    getAll: (params) => 
      apiClient.get('/api/canned-responses', { params }),
    
    getById: (id) => 
      apiClient.get(`/api/canned-responses/${id}`),
    
    create: (data) => 
      apiClient.post('/api/canned-responses', data),
    
    update: (id, data) => 
      apiClient.put(`/api/canned-responses/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`/api/canned-responses/${id}`),
  },
  
  // Статистика - ВОЗМОЖНО НЕТ В БЭКЕНДЕ
  stats: {
    getDashboard: () => 
      apiClient.get('/api/stats/dashboard'),
    
    getOperatorStats: (operatorId) => 
      apiClient.get(`/api/stats/operator/${operatorId}`),
    
    getTicketsChart: (period) => 
      apiClient.get('/api/stats/tickets/chart', { params: { period } }),
  }
};

export default apiClient;
