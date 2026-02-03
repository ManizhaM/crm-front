import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://bankcrm-1.onrender.com/api';

// Создаем инстанс axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор для обработки ответов
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка 401 (не авторизован)
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      window.location.href = '/login';
    }
    
    // Обработка 403 (нет прав доступа)
    if (error.response?.status === 403) {
      // Можно показать тост или редирект на страницу 403
      console.error('Доступ запрещен');
    }
    
    return Promise.reject(error);
  }
);

// API методы
export const api = {
  // Аутентификация
  auth: {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    register: (userData) => axiosInstance.post('/auth/register', userData),
    resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
    getAllUsers: (params) => axiosInstance.get('/auth/users', { params }),
    getUserById: (id) => axiosInstance.get(`/auth/user/${id}`),
    updateUser: (id, data) => axiosInstance.put(`/auth/user/${id}`, data),
    deleteUser: (id) => axiosInstance.delete(`/auth/user/${id}`),
    adminResetPassword: (id, data) => axiosInstance.post(`/auth/user/${id}/reset-password`, data),
  },

  // Роли и разрешения
  roles: {
    // Роли
    getRoles: () => axiosInstance.get('/roles'),
    getRole: (id) => axiosInstance.get(`/roles/${id}`),
    createRole: (data) => axiosInstance.post('/roles', data),
    updateRole: (id, data) => axiosInstance.put(`/roles/${id}`, data),
    deleteRole: (id) => axiosInstance.delete(`/roles/${id}`),
    
    // Разрешения
    getPermissions: () => axiosInstance.get('/permissions'),
    getGroupedPermissions: () => axiosInstance.get('/permissions/grouped'),
    
    // Назначение ролей пользователям
    assignRoleToUser: (userId, roleId) => 
      axiosInstance.post(`/users/${userId}/roles`, { userId, roleId }),
    removeRoleFromUser: (userId, roleId) => 
      axiosInstance.delete(`/users/${userId}/roles/${roleId}`),
  },

  // Пользователи
  users: {
    getMyPermissions: () => axiosInstance.get('/users/me/permissions'),
    checkPermission: (resource, action) => 
      axiosInstance.post('/users/me/permissions/check', { resource, action }),
  },

  // Заявки
  tickets: {
    getTickets: (params) => axiosInstance.get('/tickets', { params }),
    getTicket: (id) => axiosInstance.get(`/tickets/${id}`),
    createTicket: (data) => axiosInstance.post('/tickets', data),
    updateTicket: (id, data) => axiosInstance.put(`/tickets/${id}`, data),
    deleteTicket: (id) => axiosInstance.delete(`/tickets/${id}`),
    assignTicket: (id, operatorId) => axiosInstance.post(`/tickets/${id}/assign`, { operatorId }),
    transferTicket: (id, data) => axiosInstance.post(`/tickets/${id}/transfer`, data),
    closeTicket: (id, data) => axiosInstance.post(`/tickets/${id}/close`, data),
    addInternalComment: (ticketId, comment) => 
      axiosInstance.post(`/tickets/${ticketId}/comments`, { comment }),
  },

  // Аналитика
  analytics: {
    getDashboardStats: () => axiosInstance.get('/analytics/dashboard'),
    getOperatorStats: (params) => axiosInstance.get('/analytics/operators', { params }),
    getTicketStats: (params) => axiosInstance.get('/analytics/tickets', { params }),
  },

  // Чаты
  chats: {
    getChats: (params) => axiosInstance.get('/chats', { params }),
    getChat: (id) => axiosInstance.get(`/chats/${id}`),
    sendMessage: (chatId, message) => axiosInstance.post(`/chats/${chatId}/messages`, message),
    markAsRead: (chatId) => axiosInstance.post(`/chats/${chatId}/read`),
  },

  // Справочники
  references: {
    // Темы
    getTopics: () => axiosInstance.get('/topics'),
    createTopic: (data) => axiosInstance.post('/topics', data),
    updateTopic: (id, data) => axiosInstance.put(`/topics/${id}`, data),
    deleteTopic: (id) => axiosInstance.delete(`/topics/${id}`),
    
    // Шаблоны ответов
    getCannedResponses: () => axiosInstance.get('/canned-responses'),
    createCannedResponse: (data) => axiosInstance.post('/canned-responses', data),
    updateCannedResponse: (id, data) => axiosInstance.put(`/canned-responses/${id}`, data),
    deleteCannedResponse: (id) => axiosInstance.delete(`/canned-responses/${id}`),
  },

  // Уведомления
  notifications: {
    getNotifications: (params) => axiosInstance.get('/notifications', { params }),
    markAsRead: (id) => axiosInstance.post(`/notifications/${id}/read`),
    markAllAsRead: () => axiosInstance.post('/notifications/read-all'),
    deleteNotification: (id) => axiosInstance.delete(`/notifications/${id}`),
  },

  // Операторы
  operators: {
    getAvailableOperators: () => axiosInstance.get('/operator/available'),
    getMyTickets: () => axiosInstance.get('/operator/my-tickets'),
    takeTicket: (ticketId) => axiosInstance.post(`/operator/take-ticket/${ticketId}`),
    releaseTicket: (ticketId) => axiosInstance.post(`/operator/release-ticket/${ticketId}`),
  },
};

export default axiosInstance;
