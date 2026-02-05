import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiMessageSquare, 
  FiSend, 
  FiCheck, 
  FiX,
  FiClock,
  FiUser,
  FiAlertCircle,
  FiInbox,
  FiActivity,
  FiMaximize2,
  FiMinimize2
} from 'react-icons/fi';
import { api } from '../services/api';
import { ChatStatusBadge } from '../components/common/ChatStatusBadge';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import './ChatsPage.css';

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

const ChatsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [chatToDecline, setChatToDecline] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Refs для автоскролла
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Загрузка чатов
  const { data: pendingChatsData, isLoading: pendingLoading } = useQuery({
    queryKey: ['chats', 'pending'],
    queryFn: async () => {
      const response = await api.chats.getPending();
      return response.data;
    },
    refetchInterval: 5000,
  });

  const { data: activeChatsData, isLoading: activeLoading } = useQuery({
    queryKey: ['chats', 'active'],
    queryFn: async () => {
      const response = await api.chats.getMyActive();
      return response.data;
    },
    refetchInterval: 5000,
  });

  const { data: allChatsData, isLoading: allLoading } = useQuery({
    queryKey: ['chats', 'all'],
    queryFn: async () => {
      const response = await api.chats.getAll();
      return response.data;
    },
    refetchInterval: 10000,
    enabled: activeTab === 'all',
  });

  const { data: messagesData } = useQuery({
    queryKey: ['chat-messages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat?.id) return [];
      const response = await api.chats.getById(selectedChat.id);
      return response.data;
    },
    enabled: !!selectedChat?.id,
    refetchInterval: 3000,
  });

  const { data: assignmentHistoryData } = useQuery({
    queryKey: ['assignment-history', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat?.id) return [];
      const response = await api.chats.getAssignmentHistory(selectedChat.id);
      return response.data;
    },
    enabled: !!selectedChat?.id && activeTab === 'all',
  });

  const pendingChats = Array.isArray(pendingChatsData) ? pendingChatsData : [];
  const activeChats = Array.isArray(activeChatsData) ? activeChatsData : [];
  const allChats = Array.isArray(allChatsData) ? allChatsData : [];
  const messages = Array.isArray(messagesData) ? messagesData : [];
  const assignmentHistory = Array.isArray(assignmentHistoryData) ? assignmentHistoryData : [];

  // Автоскролл вниз при новых сообщениях
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Мутации
  const acceptChatMutation = useMutation({
    mutationFn: (chatId) => api.chats.acceptChat(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries(['chats']);
      const chat = pendingChats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        setActiveTab('active');
      }
      toast.success('Чат принят успешно!');
    },
    onError: () => {
      toast.error('Ошибка при принятии чата');
    }
  });

  const declineChatMutation = useMutation({
    mutationFn: ({ chatId, reason }) => api.chats.declineChat(chatId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['chats']);
      toast.success('Чат передан другому оператору');
      setShowDeclineModal(false);
      setDeclineReason('');
      setChatToDecline(null);
      if (selectedChat?.id === chatToDecline) {
        setSelectedChat(null);
      }
    },
    onError: () => {
      toast.error('Ошибка при отклонении чата');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, text }) => api.chats.sendMessage(chatId, text),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages']);
      setMessage('');
      toast.success('Сообщение отправлено');
    },
    onError: () => {
      toast.error('Ошибка при отправке сообщения');
    }
  });

  const handleAcceptChat = (chatId) => {
    acceptChatMutation.mutate(chatId);
  };

  const handleDeclineChat = (chatId) => {
    setChatToDecline(chatId);
    setShowDeclineModal(true);
  };

  const confirmDecline = () => {
    if (!declineReason.trim()) {
      toast.error('Укажите причину отклонения');
      return;
    }
    declineChatMutation.mutate({ chatId: chatToDecline, reason: declineReason });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;
    sendMessageMutation.mutate({ chatId: selectedChat.id, text: message });
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    if (chat.unread) {
      api.chats.markAsRead(chat.id).then(() => {
        queryClient.invalidateQueries(['chats']);
      });
    }
  };

  const getCurrentChats = () => {
    switch (activeTab) {
      case 'pending':
        return pendingChats;
      case 'active':
        return activeChats;
      case 'all':
        return allChats;
      default:
        return [];
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case 'pending':
        return pendingLoading;
      case 'active':
        return activeLoading;
      case 'all':
        return allLoading;
      default:
        return false;
    }
  };

  const currentChats = getCurrentChats();

  return (
    <div className="chats-page">
      {/* Шапка */}
      <div className="chats-header">
        <div className="chats-header-content">
          <div className="chats-header-info">
            <h1 className="chats-title">
              <FiMessageSquare className="chats-title-icon" />
              Чаты
            </h1>
            <p className="chats-subtitle">
              Управление входящими чатами от клиентов
            </p>
          </div>

          {/* Вкладки в шапке */}
          <div className="chats-tabs-modern">
            <button
              className={`tab-modern ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <div className="tab-icon">
                <FiClock size={20} />
              </div>
              <div className="tab-content">
                <span className="tab-label">Ожидают принятия</span>
                {pendingChats.length > 0 && (
                  <span className="tab-count">{pendingChats.length}</span>
                )}
              </div>
            </button>

            <button
              className={`tab-modern ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <div className="tab-icon">
                <FiActivity size={20} />
              </div>
              <div className="tab-content">
                <span className="tab-label">Мои активные</span>
                {activeChats.length > 0 && (
                  <span className="tab-count">{activeChats.length}</span>
                )}
              </div>
            </button>

            <button
              className={`tab-modern ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <div className="tab-icon">
                <FiInbox size={20} />
              </div>
              <div className="tab-content">
                <span className="tab-label">Все чаты</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className={`chats-container ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Список чатов */}
        <div className="chats-list-wrapper">
          <div className="chats-list">
            {isLoading() ? (
              <div className="chats-loading">
                <div className="spinner-large"></div>
                <p>Загрузка чатов...</p>
              </div>
            ) : currentChats.length === 0 ? (
              <div className="chats-empty">
                <div className="empty-icon">
                  <FiMessageSquare size={64} />
                </div>
                <h3>Чатов нет</h3>
                <p>
                  {activeTab === 'pending' && 'Нет чатов, ожидающих принятия'}
                  {activeTab === 'active' && 'У вас нет активных чатов'}
                  {activeTab === 'all' && 'Чаты отсутствуют'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {currentChats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    className={`chat-card-modern ${selectedChat?.id === chat.id ? 'selected' : ''} ${chat.unread ? 'unread' : ''}`}
                    onClick={() => handleChatSelect(chat)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.02 }}
                    layout
                  >
                    <div className="chat-card-main">
                      <div className="chat-avatar-wrapper">
                        <div className="chat-card-avatar">
                          {chat.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="unread-indicator">{chat.unreadCount}</div>
                        )}
                      </div>

                      <div className="chat-card-body">
                        <div className="chat-card-row">
                          <span className="chat-card-name">{chat.name || 'Неизвестный'}</span>
                          <ChatStatusBadge status={chat.status} size="sm" />
                        </div>

                        {chat.phoneNumber && (
                          <div className="chat-card-detail">
                            <FiUser size={14} />
                            <span>{chat.phoneNumber}</span>
                          </div>
                        )}

                        {chat.assignedOperatorName && (
                          <div className="chat-card-detail operator">
                            <FiUser size={14} />
                            <span>{chat.assignedOperatorName}</span>
                          </div>
                        )}

                        {chat.lastMessageTime && (
                          <div className="chat-card-time">
                            <FiClock size={12} />
                            {formatDistanceToNow(new Date(chat.lastMessageTime), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Кнопки принятия/отклонения */}
                    {activeTab === 'pending' && (chat.status === 2 || chat.status === 1) && (
                      <div className="chat-card-actions-modern" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="success"
                          size="sm"
                          icon={<FiCheck size={16} />}
                          onClick={() => handleAcceptChat(chat.id)}
                          loading={acceptChatMutation.isLoading}
                        >
                          Принять
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<FiX size={16} />}
                          onClick={() => handleDeclineChat(chat.id)}
                          loading={declineChatMutation.isLoading}
                        >
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Панель сообщений */}
        <AnimatePresence>
          {selectedChat && (
            <motion.div
              className="chat-panel-modern"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Шапка панели чата */}
              <div className="chat-panel-header-modern">
                <div className="chat-panel-info">
                  <div className="chat-avatar-large">
                    {selectedChat.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="chat-info-details">
                    <h3>{selectedChat.name || 'Неизвестный'}</h3>
                    <div className="chat-meta-row">
                      <ChatStatusBadge status={selectedChat.status} />
                      {selectedChat.phoneNumber && (
                        <span className="chat-phone-badge">{selectedChat.phoneNumber}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="chat-panel-actions">
                  <button
                    className="icon-button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? 'Свернуть' : 'Развернуть'}
                  >
                    {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
                  </button>
                  <button
                    className="icon-button close"
                    onClick={() => setSelectedChat(null)}
                    title="Закрыть"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* Сообщения */}
              <div className="chat-messages-modern" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                  <div className="chat-messages-empty">
                    <FiMessageSquare size={48} />
                    <p>Нет сообщений</p>
                    <span>Начните диалог с клиентом</span>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        // ИСПРАВЛЕНО: 
                        // type 1 = Outgoing (от оператора) → справа, синий
                        // type 0 = Incoming (от клиента) → слева, белый
                        className={`chat-message-modern ${msg.type === 1 ? 'incoming' : 'outgoing'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="message-bubble">
                          <div className="message-text">{msg.text}</div>
                          <div className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString('ru', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {/* Якорь для автоскролла */}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Форма отправки */}
              {selectedChat.status === 3 ? (
                <div className="chat-input-wrapper-modern">
                  <div className="chat-input-container-modern">
                    <input
                      type="text"
                      className="chat-input-modern"
                      placeholder="Введите сообщение..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    <button
                      className={`send-button ${message.trim() ? 'active' : ''}`}
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isLoading}
                    >
                      <FiSend size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="chat-inactive-warning-modern">
                  <FiAlertCircle size={20} />
                  <span>
                    {selectedChat.status === 1 && 'Чат ожидает назначения оператору'}
                    {selectedChat.status === 2 && 'Примите чат для отправки сообщений'}
                    {selectedChat.status === 4 && 'Чат завершен'}
                    {selectedChat.status === 5 && 'Чат архивирован'}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Модальное окно отклонения */}
      <AnimatePresence>
        {showDeclineModal && (
          <Modal title="Отклонить чат" onClose={() => setShowDeclineModal(false)}>
            <div className="modal-content">
              <p className="modal-description">
                Укажите причину, почему вы не можете принять этот чат. 
                Он будет передан другому доступному оператору.
              </p>
              <div className="form-group">
                <label>Причина отклонения *</label>
                <textarea
                  className="form-textarea"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Например: Занят другим приоритетным чатом..."
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDeclineModal(false)}
                >
                  Отмена
                </Button>
                <Button
                  variant="danger"
                  icon={<FiX />}
                  onClick={confirmDecline}
                  disabled={!declineReason.trim()}
                  loading={declineChatMutation.isLoading}
                >
                  Отклонить и передать
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatsPage;