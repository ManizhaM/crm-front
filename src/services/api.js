import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5094';

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
      console.error('Доступ запрещен');
    }
    
    return Promise.reject(error);
  }
);

// API методы
export const api = {
  // Аутентификация
  auth: {
    login: (credentials) => axiosInstance.post('/api/auth/login', credentials),
    register: (userData) => axiosInstance.post('/api/auth/register', userData),
    resetPassword: (data) => axiosInstance.post('/api/auth/reset-password', data),
    getAllUsers: (params) => axiosInstance.get('/api/auth/users', { params }),
    getUserById: (id) => axiosInstance.get(`/api/auth/user/${id}`),
    updateUser: (id, data) => axiosInstance.put(`/api/auth/user/${id}`, data),
    deleteUser: (id) => axiosInstance.delete(`/api/auth/user/${id}`),
    adminResetPassword: (id, data) => axiosInstance.post(`/api/auth/user/${id}/reset-password`, data),
  },

  // Роли и разрешения
  roles: {
    // Роли
    getRoles: () => axiosInstance.get('/api/roles'),
    getRole: (id) => axiosInstance.get(`/api/roles/${id}`),
    createRole: (data) => axiosInstance.post('/api/roles', data),
    updateRole: (id, data) => axiosInstance.put(`/api/roles/${id}`, data),
    deleteRole: (id) => axiosInstance.delete(`/api/roles/${id}`),
    
    // Разрешения
    getPermissions: () => axiosInstance.get('/api/permissions'),
    getGroupedPermissions: () => axiosInstance.get('/api/permissions/grouped'),
    
    // Назначение ролей пользователям
    assignRoleToUser: (userId, roleId) => 
      axiosInstance.post(`/api/users/${userId}/roles`, { userId, roleId }),
    removeRoleFromUser: (userId, roleId) => 
      axiosInstance.delete(`/api/users/${userId}/roles/${roleId}`),
  },

  // Пользователи
  users: {
    getAll: () => axiosInstance.get('/api/users'),
    getById: (id) => axiosInstance.get(`/api/users/${id}`),
    getMe: () => axiosInstance.get('/api/users/me'),
    getOperators: () => axiosInstance.get('/api/users/operators'),
    getAvailableOperators: () => axiosInstance.get('/api/users/operators/available'),
    updateStatus: (id, active) => axiosInstance.put(`/api/users/${id}/status`, { active }),
    updateRole: (id, role) => axiosInstance.put(`/api/users/${id}/role`, { role }),
    getStats: (id) => axiosInstance.get(`/api/users/${id}/stats`),
    setOnlineStatus: (isOnline) => axiosInstance.put('/api/users/set-online-status', null, { params: { isOnline } }),
    getMyPermissions: () => axiosInstance.get('/api/users/me/permissions'),
    checkPermission: (resource, action) => 
      axiosInstance.post('/api/users/me/permissions/check', { resource, action }),
  },

  // Заявки
  tickets: {
    getAll: (params) => axiosInstance.get('/api/tickets', { params }),
    getById: (id) => axiosInstance.get(`/api/tickets/${id}`),
    createManually: (data) => axiosInstance.post('/api/tickets/create-manual', data),
    transfer: (id, data) => axiosInstance.post(`/api/tickets/${id}/transfer`, data),
    getTransfers: (id) => axiosInstance.get(`/api/tickets/${id}/transfers`),
    search: (query) => axiosInstance.get('/api/tickets/search', { params: { query } }),
    changeStatus: (id, newStatus, comment) => axiosInstance.put(`/api/tickets/${id}/status`, { newStatus, comment }),
    assignOperator: (id, operatorId) => axiosInstance.put(`/api/tickets/${id}/assign`, { operatorId }),
    setTopic: (id, topicId, subcategoryId) => axiosInstance.put(`/api/tickets/${id}/topic`, { topicId, subcategoryId }),
    addComment: (id, content) => axiosInstance.post(`/api/tickets/${id}/comments`, { content }),
    getComments: (id) => axiosInstance.get(`/api/tickets/${id}/comments`),
    getHistory: (id) => axiosInstance.get(`/api/tickets/${id}/history`),
    rate: (id, rating, comment) => axiosInstance.post(`/api/tickets/${id}/rate`, { rating, comment }),
  },

  // Аналитика
  analytics: {
    getDashboard: () => axiosInstance.get('/api/analytics/dashboard'),
    getOperators: () => axiosInstance.get('/api/analytics/operators'),
    getTicketsByStatus: () => axiosInstance.get('/api/analytics/tickets/by-status'),
    getTicketsByTopic: () => axiosInstance.get('/api/analytics/tickets/by-topic'),
    getResponseTime: () => axiosInstance.get('/api/analytics/response-time'),
    getResolutionTime: () => axiosInstance.get('/api/analytics/resolution-time'),
    getSatisfaction: () => axiosInstance.get('/api/analytics/satisfaction'),
    getTicketsChart: (period) => axiosInstance.get('/api/analytics/tickets/chart', { params: { period } }),
  },

 // Чаты
chats: {
  // Существующие методы
  getAll: () => axiosInstance.get('/api/telegrambot/chats'),
  getById: (id) => axiosInstance.get(`/api/telegrambot/chat/${id}`),
  markAsRead: (chatId) => axiosInstance.post(`/api/telegrambot/chat/${chatId}/markAsRead`),
  sendMessage: (chatId, text) => axiosInstance.post(`/api/telegrambot/chat/${chatId}/send`, { text }),
  
  // НОВЫЕ методы для системы очереди
  getPending: () => axiosInstance.get('/api/chats/pending'),  // Чаты ожидающие принятия текущим оператором
  getMyActive: () => axiosInstance.get('/api/chats/my-active'),  // Активные чаты текущего оператора
  acceptChat: (chatId) => axiosInstance.post(`/api/chats/${chatId}/accept`),  // Принять чат
  declineChat: (chatId, reason) => axiosInstance.post(`/api/chats/${chatId}/decline`, { reason }),  // Отклонить чат
  getAssignmentHistory: (chatId) => axiosInstance.get(`/api/chats/${chatId}/assignment-history`),  // История назначений
  getUnassigned: () => axiosInstance.get('/api/chats/unassigned'),  // Для админов - неназначенные чаты
},

  // Справочники
  references: {
    // Темы
    getTopics: () => axiosInstance.get('/api/topics'),
    createTopic: (data) => axiosInstance.post('/api/topics', data),
    updateTopic: (id, data) => axiosInstance.put(`/api/topics/${id}`, data),
    deleteTopic: (id) => axiosInstance.delete(`/api/topics/${id}`),
    
    // Подкатегории
    getSubcategories: (topicId) => axiosInstance.get('/api/Topics/subcategories', { params: { topicId } }),
    createSubcategory: (data) => axiosInstance.post('/api/Topics/subcategories', data),
    updateSubcategory: (id, data) => axiosInstance.put(`/api/Topics/subcategories/${id}`, data),
    deleteSubcategory: (id) => axiosInstance.delete(`/api/Topics/subcategories/${id}`),
    
    // Шаблоны ответов
    getCannedResponses: (params) => axiosInstance.get('/api/canned-responses', { params: params || {} }),
    createCannedResponse: (data) => axiosInstance.post('/api/canned-responses', data),
    updateCannedResponse: (id, data) => axiosInstance.put(`/api/canned-responses/${id}`, data),
    deleteCannedResponse: (id) => axiosInstance.delete(`/api/canned-responses/${id}`),
  },

  // Темы (для обратной совместимости)
  topics: {
    getAll: () => axiosInstance.get('/api/topics'),
    getById: (id) => axiosInstance.get(`/api/topics/${id}`),
    create: (data) => axiosInstance.post('/api/topics', data),
    update: (id, data) => axiosInstance.put(`/api/topics/${id}`, data),
    delete: (id) => axiosInstance.delete(`/api/topics/${id}`),
  },

  // Подкатегории (для обратной совместимости)
  subcategories: {
    getAll: (topicId) => axiosInstance.get(`/api/Topics/${topicId}/subcategories`),
    getById: (id) => axiosInstance.get(`/api/Topics/subcategories/${id}`),
    create: (data) => axiosInstance.post('/api/Topics/subcategories', data),
    update: (id, data) => axiosInstance.put(`/api/Topics/subcategories/${id}`, data),
    delete: (id) => axiosInstance.delete(`/api/Topics/subcategories/${id}`),
  },

  // Шаблоны ответов (для обратной совместимости)
  cannedResponses: {
    getAll: (params) => axiosInstance.get('/api/canned-responses', { params: params || {} }),
    getById: (id) => axiosInstance.get(`/api/canned-responses/${id}`),
    create: (data) => axiosInstance.post('/api/canned-responses', data),
    update: (id, data) => axiosInstance.put(`/api/canned-responses/${id}`, data),
    delete: (id) => axiosInstance.delete(`/api/canned-responses/${id}`),
  },

  // Уведомления
  notifications: {
    getMy: (params) => axiosInstance.get('/api/notifications', { params }),
    getUnreadCount: () => axiosInstance.get('/api/notifications/unread-count'),
    markAsRead: (id) => axiosInstance.post(`/api/notifications/${id}/mark-read`),
    markAllAsRead: () => axiosInstance.post('/api/notifications/mark-all-read'),
    create: (data) => axiosInstance.post('/api/notifications', data),
    delete: (id) => axiosInstance.delete(`/api/notifications/${id}`),
    clearRead: () => axiosInstance.delete('/api/notifications/clear-read'),
  },

  // Теги
  tags: {
    getAll: () => axiosInstance.get('/api/tags'),
    create: (data) => axiosInstance.post('/api/tags', data),
    update: (id, data) => axiosInstance.put(`/api/tags/${id}`, data),
    delete: (id) => axiosInstance.delete(`/api/tags/${id}`),
    addToTicket: (ticketId, tagId) => axiosInstance.post(`/api/tags/ticket/${ticketId}/add/${tagId}`),
    removeFromTicket: (ticketId, tagId) => axiosInstance.delete(`/api/tags/ticket/${ticketId}/remove/${tagId}`),
  },

  // Логи активности
 // Логи активности
activityLogs: {
  getAll: (params) => axiosInstance.get('/api/activitylogs', { params }),
  getById: (id) => axiosInstance.get(`/api/activitylogs/${id}`),
  getStatistics: (params) => axiosInstance.get('/api/activitylogs/statistics', { params }),
  getUserLogs: (userId, params) => axiosInstance.get(`/api/activitylogs/user/${userId}`, { params }),
  getActions: () => axiosInstance.get('/api/activitylogs/actions'),
  getEntityTypes: () => axiosInstance.get('/api/activitylogs/entity-types'),
  cleanup: (olderThanDays) => axiosInstance.delete('/api/activitylogs/cleanup', { params: { olderThanDays } }),
  exportCSV: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return `${API_URL}/api/activitylogs/export/csv?${queryString}`;
  }
},

  // Настройки бота
  botSettings: {
    get: () => axiosInstance.get('/api/botsettings'),
    updateToken: (botToken) => axiosInstance.put('/api/botsettings/token', { botToken }),
    toggle: (activate) => axiosInstance.post('/api/botsettings/toggle', null, { params: { activate } }),
    updateWelcomeMessage: (message) => axiosInstance.put('/api/botsettings/welcome-message', { message }),
    getStatus: () => axiosInstance.get('/api/botsettings/status'),
  },

  // Операторы
  operator: {
    getDashboard: () => axiosInstance.get('/api/operator/dashboard'),
    getTicketHistory: (params) => axiosInstance.get('/api/operator/tickets/history', { params }),
    getAvailableTickets: () => axiosInstance.get('/api/operator/tickets/available'),
    acceptTicket: (ticketId) => axiosInstance.post(`/api/operator/tickets/${ticketId}/accept`),
    completeTicket: (ticketId, comment) => axiosInstance.post(`/api/operator/tickets/${ticketId}/complete`, { comment }),
    changeTicketStatus: (ticketId, newStatus, comment) => 
      axiosInstance.put(`/api/operator/tickets/${ticketId}/status`, { newStatus: Number(newStatus), comment }),
    escalateTicket: (ticketId, reason, comment) => 
      axiosInstance.post(`/api/operator/tickets/${ticketId}/escalate`, { reason, comment }),
  },
};

export default axiosInstance;
