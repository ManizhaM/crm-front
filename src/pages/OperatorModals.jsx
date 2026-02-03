import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiX,
  FiSend,
  FiPaperclip,
  FiImage,
  FiFile,
  FiPhone,
  FiMail,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiClock
} from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Модальное окно создания заявки вручную
export const CreateTicketModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    description: '',
    channel: 'PHONE',
    topicId: '',
    subcategoryId: ''
  });

  // Загрузка тем
  const { data: topics } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.topics.getAll();
      return response.data;
    },
  });

  // Загрузка подкатегорий
  const { data: subcategories } = useQuery({
    queryKey: ['subcategories', formData.topicId],
    queryFn: async () => {
      if (!formData.topicId) return [];
      const response = await api.subcategories.getAll(formData.topicId);
      return response.data;
    },
    enabled: !!formData.topicId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.tickets.createManually(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['operator-tickets']);
      toast.success('Заявка создана');
      onClose();
    },
    onError: () => toast.error('Ошибка создания заявки'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      topicId: formData.topicId ? parseInt(formData.topicId) : null,
      subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal modal-large"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Создать заявку вручную</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-row">
              <div className="form-group">
                <label>ФИО клиента *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div className="form-group">
                <label>Телефон клиента *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  required
                  placeholder="+992XXXXXXXXX"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Канал обращения *</label>
              <select
                className="form-select"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                required
              >
                <option value="PHONE">Телефонный звонок</option>
                <option value="EMAIL">Email</option>
                <option value="WEB">Веб-сайт</option>
                <option value="MOBILE_APP">Мобильное приложение</option>
                <option value="TELEGRAM">Telegram</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Тема обращения</label>
                <select
                  className="form-select"
                  value={formData.topicId}
                  onChange={(e) => {
                    setFormData({ ...formData, topicId: e.target.value, subcategoryId: '' });
                  }}
                >
                  <option value="">Выберите тему</option>
                  {topics?.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>

              {formData.topicId && (
                <div className="form-group">
                  <label>Подкатегория</label>
                  <select
                    className="form-select"
                    value={formData.subcategoryId}
                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                  >
                    <option value="">Выберите подкатегорию</option>
                    {subcategories?.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Описание проблемы *</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={5}
                placeholder="Подробно опишите проблему клиента..."
              />
            </div>

            <div className="info-box">
              <FiMessageSquare />
              <div>
                <strong>Совет:</strong> Укажите как можно больше деталей для быстрого решения проблемы.
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} type="button">
              Отмена
            </Button>
            <Button 
              variant="primary" 
              icon={<FiSend />} 
              type="submit" 
              loading={createMutation.isLoading}
            >
              Создать заявку
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Модальное окно деталей заявки с чатом
export const TicketDetailModal = ({ ticket, onClose, onComplete, onTransfer }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Загрузка истории чата
  const { data: chatMessages } = useQuery({
    queryKey: ['chat-messages', ticket.chatId],
    queryFn: async () => {
      if (!ticket.chatId) return [];
      const response = await api.chats.getById(ticket.chatId);
      return response.data.messages || [];
    },
    enabled: !!ticket.chatId,
    refetchInterval: 5000,
  });

  // Загрузка комментариев
  const { data: comments } = useQuery({
    queryKey: ['ticket-comments', ticket.id],
    queryFn: async () => {
      const response = await api.tickets.getComments(ticket.id);
      return response.data;
    },
  });

  // Отправка сообщения
  const sendMessageMutation = useMutation({
    mutationFn: (text) => api.chats.sendMessage(ticket.chatId, text),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages']);
      setMessage('');
      toast.success('Сообщение отправлено');
    },
    onError: () => toast.error('Ошибка отправки'),
  });

  // Добавление комментария
  const addCommentMutation = useMutation({
    mutationFn: (content) => api.tickets.addComment(ticket.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket-comments']);
      toast.success('Комментарий добавлен');
    },
  });

  // Изменение статуса
  const changeStatusMutation = useMutation({
    mutationFn: (status) => api.tickets.changeStatus(ticket.id, status, ''),
    onSuccess: () => {
      queryClient.invalidateQueries(['operator-tickets']);
      toast.success('Статус изменен');
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    if (ticket.chatId) {
      sendMessageMutation.mutate(message);
    } else {
      addCommentMutation.mutate(message);
      setMessage('');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // TODO: Реализовать загрузку файлов
      toast.info('Загрузка файлов будет реализована в следующей версии');
    }
  };

  const handleStatusChange = (status) => {
    setNewStatus(status);
    changeStatusMutation.mutate(status);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal modal-fullscreen"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3>Заявка #{ticket.id}</h3>
            <StatusBadge status={ticket.status} />
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="ticket-detail-container">
          {/* Левая панель - информация о заявке */}
          <div className="ticket-info-panel">
            <div className="info-section">
              <h4>Информация о клиенте</h4>
              <div className="info-item">
                <FiUser />
                <div>
                  <label>Клиент</label>
                  <span>{ticket.clientName || ticket.chat?.name || 'Не указано'}</span>
                </div>
              </div>
              <div className="info-item">
                <FiPhone />
                <div>
                  <label>Телефон</label>
                  <span>{ticket.client?.phone || 'Не указан'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h4>Детали заявки</h4>
              <div className="info-item">
                <FiCalendar />
                <div>
                  <label>Создана</label>
                  <span>{format(new Date(ticket.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                </div>
              </div>
              {ticket.topic && (
                <div className="info-item">
                  <FiMessageSquare />
                  <div>
                    <label>Тема</label>
                    <span>{ticket.topic.name}</span>
                  </div>
                </div>
              )}
              {ticket.assignedOperator && (
                <div className="info-item">
                  <FiUser />
                  <div>
                    <label>Оператор</label>
                    <span>{ticket.assignedOperator.fullName}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="info-section">
              <h4>Управление</h4>
              <div className="status-controls">
                <label>Статус заявки</label>
                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="New">Новая</option>
                  <option value="InProgress">В работе</option>
                  <option value="WaitingForClient">Ожидание клиента</option>
                  <option value="Resolved">Решена</option>
                  <option value="Closed">Закрыта</option>
                </select>
              </div>

              <Button
                variant="success"
                icon={<FiSend />}
                onClick={onComplete}
                fullWidth
              >
                Завершить заявку
              </Button>

              <Button
                variant="warning"
                icon={<FiMessageSquare />}
                onClick={() => setShowTransferModal(true)}
                fullWidth
              >
                Передать в техподдержку
              </Button>
            </div>
          </div>

          {/* Правая панель - чат */}
          <div className="ticket-chat-panel">
            <div className="chat-messages">
              {chatMessages?.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${msg.type === 'Outgoing' ? 'operator' : 'client'}`}
                >
                  <div className="message-content">{msg.text}</div>
                  <div className="message-time">
                    {format(new Date(msg.timestamp), 'HH:mm')}
                  </div>
                </div>
              ))}

              {comments?.map((comment) => (
                <div key={comment.id} className="chat-message internal">
                  <div className="message-author">{comment.author?.fullName}</div>
                  <div className="message-content">{comment.content}</div>
                  <div className="message-time">
                    {format(new Date(comment.createdAt), 'dd.MM HH:mm')}
                  </div>
                </div>
              ))}
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="file"
                id="file-input"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <button
                type="button"
                className="attach-btn"
                onClick={() => document.getElementById('file-input').click()}
              >
                <FiPaperclip />
              </button>

              <input
                type="text"
                className="chat-input"
                placeholder="Введите сообщение..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                type="submit"
                className="send-btn"
                disabled={!message.trim()}
              >
                <FiSend />
              </button>
            </form>

            {selectedFile && (
              <div className="selected-file">
                <FiFile />
                <span>{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)}>
                  <FiX />
                </button>
              </div>
            )}
          </div>
        </div>

        {showTransferModal && (
          <TransferModal
            onClose={() => setShowTransferModal(false)}
            onTransfer={(reason, comment) => {
              onTransfer(reason, comment);
              setShowTransferModal(false);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

// Модальное окно передачи
const TransferModal = ({ onClose, onTransfer }) => {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Укажите причину передачи');
      return;
    }
    onTransfer(reason, comment);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal modal-small"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Передать в техподдержку</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Причина передачи *</label>
              <input
                type="text"
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Например: требуется специалист по..."
                required
              />
            </div>

            <div className="form-group">
              <label>Комментарий</label>
              <textarea
                className="form-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>
          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} type="button">
              Отмена
            </Button>
            <Button variant="warning" type="submit">
              Передать
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <motion.div
    className="modal-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="modal"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>
          <FiX size={20} />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export default Modal;
