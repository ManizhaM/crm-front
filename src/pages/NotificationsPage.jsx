import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiBell, 
  FiCheck, 
  FiCheckCircle, 
  FiTrash2, 
  FiAlertCircle,
  FiMessageSquare,
  FiUserPlus,
  FiRefreshCw
} from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, unread

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const response = await api.notifications.getAll(filter === 'unread', 100);
      return response.data;
    },
    refetchInterval: 10000, // Обновление каждые 10 секунд
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.notifications.getUnreadCount();
      return response.data;
    },
    refetchInterval: 10000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
      toast.success('Все уведомления отмечены как прочитанные');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications-unread-count']);
      toast.success('Уведомление удалено');
    },
  });

  const clearReadMutation = useMutation({
    mutationFn: () => api.notifications.clearRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Прочитанные уведомления удалены');
    },
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_TICKET':
        return <FiBell />;
      case 'TICKET_ASSIGNED':
        return <FiUserPlus />;
      case 'TICKET_TRANSFERRED':
        return <FiRefreshCw />;
      case 'MESSAGE_RECEIVED':
        return <FiMessageSquare />;
      default:
        return <FiAlertCircle />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'NEW_TICKET':
        return 'info';
      case 'TICKET_ASSIGNED':
        return 'success';
      case 'TICKET_TRANSFERRED':
        return 'warning';
      case 'MESSAGE_RECEIVED':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Уведомления</h1>
          <p>У вас {unreadCount || 0} непрочитанных уведомлений</p>
        </div>
        <div className="notifications-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={!unreadCount || markAllAsReadMutation.isLoading}
            icon={<FiCheckCircle />}
          >
            Отметить все
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearReadMutation.mutate()}
            disabled={clearReadMutation.isLoading}
            icon={<FiTrash2 />}
          >
            Очистить прочитанные
          </Button>
        </div>
      </div>

      <div className="notifications-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Непрочитанные ({unreadCount || 0})
        </button>
      </div>

      <div className="notifications-list">
        {isLoading ? (
          <div className="notifications-loading">
            <div className="spinner-large"></div>
            <p>Загрузка уведомлений...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <FiBell size={64} />
            <h3>Нет уведомлений</h3>
            <p>Здесь будут отображаться ваши уведомления</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                layout
              >
                <div className={`notification-icon ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <span className="notification-time">
                      {formatDistanceToNow(new Date(notification.createdAt), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {notification.relatedTicketId && (
                    <a 
                      href={`/tickets?id=${notification.relatedTicketId}`}
                      className="notification-link"
                    >
                      Открыть заявку #{notification.relatedTicketId}
                    </a>
                  )}
                </div>
                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="notification-action-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Отметить как прочитанное"
                    >
                      <FiCheck />
                    </button>
                  )}
                  <button
                    className="notification-action-btn delete"
                    onClick={() => handleDelete(notification.id)}
                    title="Удалить"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
