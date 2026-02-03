import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiSearch, 
  FiPlus,
  FiClock,
  FiUser,
  FiMessageSquare,
  FiEdit,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/Badge';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import './TicketsPage.css';

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

const TicketsPage = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOperator, setSelectedOperatorId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  
  const [filters, setFilters] = useState({
    status: 'all',
    operator: 'all',
    search: ''
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const response = await api.tickets.getAll();
      return response.data;
    },
  });

  const tickets = Array.isArray(ticketsData) ? ticketsData : [];

  const { data: operatorsData } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const response = await api.users.getOperators();
      return response.data;
    },
  });

  const operators = Array.isArray(operatorsData) ? operatorsData : [];

  const { data: topicsData } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.topics.getAll();
      return response.data;
    },
  });

  const topics = Array.isArray(topicsData) ? topicsData : [];

  const { data: subcategoriesData } = useQuery({
    queryKey: ['subcategories', selectedTopicId],
    queryFn: async () => {
      if (!selectedTopicId) return [];
      const response = await api.subcategories.getAll(selectedTopicId);
      return response.data;
    },
    enabled: !!selectedTopicId,
  });

  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];

  const { data: commentsData } = useQuery({
    queryKey: ['comments', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      const response = await api.tickets.getComments(selectedTicket.id);
      return response.data;
    },
    enabled: !!selectedTicket?.id,
  });

  const comments = Array.isArray(commentsData) ? commentsData : [];

  const { data: historyData } = useQuery({
    queryKey: ['history', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      const response = await api.tickets.getHistory(selectedTicket.id);
      return response.data;
    },
    enabled: !!selectedTicket?.id,
  });

  const history = Array.isArray(historyData) ? historyData : [];

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status, comment }) => 
      api.tickets.changeStatus(id, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets']);
      queryClient.invalidateQueries(['history']);
      toast.success('Статус успешно изменен');
      setShowStatusModal(false);
      setComment('');
    },
    onError: () => {
      toast.error('Ошибка при изменении статуса');
    }
  });

  const assignOperatorMutation = useMutation({
    mutationFn: ({ id, operatorId }) => 
      api.tickets.assignOperator(id, operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets']);
      queryClient.invalidateQueries(['history']);
      toast.success('Оператор назначен');
      setShowAssignModal(false);
    },
    onError: () => {
      toast.error('Ошибка при назначении оператора');
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ id, content }) => 
      api.tickets.addComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments']);
      toast.success('Комментарий добавлен');
      setShowCommentModal(false);
      setComment('');
    },
    onError: () => {
      toast.error('Ошибка при добавлении комментария');
    }
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, topicId, subcategoryId }) => 
      api.tickets.setTopic(id, topicId, subcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets']);
      toast.success('Заявка обновлена');
      setShowTopicModal(false);
    },
    onError: () => {
      toast.error('Ошибка при обновлении заявки');
    }
  });

  const handleStatusChange = () => {
    if (!selectedTicket || !selectedStatus) return;
    changeStatusMutation.mutate({
      id: selectedTicket.id,
      status: selectedStatus,
      comment: comment || 'Статус изменен'
    });
  };

  const handleAssignOperator = () => {
    if (!selectedTicket || !selectedOperator) return;
    assignOperatorMutation.mutate({ 
      id: selectedTicket.id, 
      operatorId: parseInt(selectedOperator) 
    });
  };

  const handleAddComment = () => {
    if (!selectedTicket || !comment.trim()) return;
    addCommentMutation.mutate({
      id: selectedTicket.id,
      content: comment
    });
  };

  const handleUpdateTopic = () => {
    if (!selectedTicket) return;
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      topicId: selectedTopicId ? parseInt(selectedTopicId) : null,
      subcategoryId: selectedSubcategoryId ? parseInt(selectedSubcategoryId) : null
    });
  };

  const filteredTickets = tickets?.filter(ticket => {
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    if (filters.operator !== 'all' && ticket.assignedOperatorId !== parseInt(filters.operator)) return false;
    if (filters.search && !ticket.id.toString().includes(filters.search)) return false;
    return true;
  });

  const statusOptions = [
    { value: 'New', label: 'Новая' },
    { value: 'InProgress', label: 'В работе' },
    { value: 'WaitingForClient', label: 'Ожидание клиента' },
    { value: 'Resolved', label: 'Решена' },
    { value: 'Closed', label: 'Закрыта' },
    { value: 'Escalated', label: 'Эскалирована' }
  ];

  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <div>
          <h1 className="tickets-title">Заявки</h1>
          <p className="tickets-subtitle">Всего: {filteredTickets?.length || 0} заявок</p>
        </div>
        <Button variant="primary" icon={<FiPlus />}>Новая заявка</Button>
      </div>

      <div className="tickets-filters">
        <div className="filter-search">
          <FiSearch className="filter-search-icon" />
          <input
            type="text"
            placeholder="Поиск по номеру заявки..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="filter-search-input"
          />
        </div>

        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="filter-select">
          <option value="all">Все статусы</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select value={filters.operator} onChange={(e) => setFilters({ ...filters, operator: e.target.value })} className="filter-select">
          <option value="all">Все операторы</option>
          {operators?.map(op => (
            <option key={op.id} value={op.id}>{op.username}</option>
          ))}
        </select>
      </div>

      <div className="tickets-container">
        <div className="tickets-list">
          {isLoading ? (
            <div className="tickets-loading">
              <div className="spinner-large"></div>
              <p>Загрузка заявок...</p>
            </div>
          ) : filteredTickets?.length === 0 ? (
            <div className="tickets-empty">
              <FiAlertCircle size={48} />
              <h3>Заявок не найдено</h3>
              <p>Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredTickets?.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  className={`ticket-card ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -2 }}
                  layout
                >
                  <div className="ticket-card-header">
                    <div className="ticket-card-id">#{ticket.id}</div>
                    <StatusBadge status={ticket.status} size="sm" />
                  </div>
                  <div className="ticket-card-body">
                    <div className="ticket-card-title">{ticket.topic?.name || 'Без темы'}</div>
                    {ticket.subcategory && (
                      <div className="ticket-card-subcategory">{ticket.subcategory.name}</div>
                    )}
                    <div className="ticket-card-meta">
                      <span>
                        <FiClock size={14} />
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ru })}
                      </span>
                      {ticket.assignedOperator && (
                        <span>
                          <FiUser size={14} />
                          {ticket.assignedOperator.username}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <AnimatePresence>
          {selectedTicket && (
            <motion.div className="ticket-details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="ticket-details-header">
                <div>
                  <h2>Заявка #{selectedTicket.id}</h2>
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <button className="ticket-details-close" onClick={() => setSelectedTicket(null)}>
                  <FiX size={20} />
                </button>
              </div>

              <div className="ticket-details-body">
                <div className="ticket-detail-section">
                  <h3>Информация</h3>
                  <div className="ticket-detail-grid">
                    <div className="ticket-detail-item">
                      <label>Создана</label>
                      <span>{new Date(selectedTicket.createdAt).toLocaleString('ru')}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <label>Обновлена</label>
                      <span>{new Date(selectedTicket.updatedAt).toLocaleString('ru')}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <label>Тема</label>
                      <span>{selectedTicket.topic?.name || 'Не указана'}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <label>Подкатегория</label>
                      <span>{selectedTicket.subcategory?.name || 'Не указана'}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <label>Оператор</label>
                      <span>{selectedTicket.assignedOperator?.username || 'Не назначен'}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <label>Клиент</label>
                      <span>ID: {selectedTicket.clientId || 'Не указан'}</span>
                    </div>
                  </div>
                </div>

                <div className="ticket-detail-section">
                  <h3>Действия</h3>
                  <div className="ticket-actions-grid">
                    <Button variant="outline" size="sm" icon={<FiUser />} onClick={() => setShowAssignModal(true)}>Назначить</Button>
                    <Button variant="outline" size="sm" icon={<FiEdit />} onClick={() => { setSelectedStatus(selectedTicket.status); setShowStatusModal(true); }}>Статус</Button>
                    <Button variant="outline" size="sm" icon={<FiMessageSquare />} onClick={() => setShowCommentModal(true)}>Комментарий</Button>
                    <Button variant="outline" size="sm" icon={<FiEdit />} onClick={() => { setSelectedTopicId(selectedTicket.topicId?.toString() || ''); setSelectedSubcategoryId(selectedTicket.subcategoryId?.toString() || ''); setShowTopicModal(true); }}>Тема</Button>
                  </div>
                </div>

                <div className="ticket-detail-section">
                  <h3>Внутренние комментарии ({comments?.length || 0})</h3>
                  <div className="ticket-comments-list">
                    {comments?.length === 0 ? (
                      <div className="ticket-comments-empty">
                        <FiMessageSquare size={32} />
                        <p>Комментариев пока нет</p>
                      </div>
                    ) : (
                      comments?.map((comment) => (
                        <div key={comment.id} className="ticket-comment">
                          <div className="ticket-comment-header">
                            <div className="ticket-comment-author">
                              <div className="ticket-comment-avatar">{comment.user?.username?.charAt(0).toUpperCase()}</div>
                              <div>
                                <div className="ticket-comment-name">{comment.user?.username}</div>
                                <div className="ticket-comment-time">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru })}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ticket-comment-content">{comment.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="ticket-detail-section">
                  <h3>История изменений</h3>
                  <div className="ticket-history-list">
                    {history?.length === 0 ? (
                      <div className="ticket-history-empty">
                        <FiClock size={32} />
                        <p>История пуста</p>
                      </div>
                    ) : (
                      history?.map((item) => (
                        <div key={item.id} className="ticket-history-item">
                          <div className="ticket-history-dot"></div>
                          <div className="ticket-history-content">
                            <div className="ticket-history-text">
                              <StatusBadge status={item.fromStatus} size="sm" />
                              <span>→</span>
                              <StatusBadge status={item.toStatus} size="sm" />
                            </div>
                            <div className="ticket-history-meta">
                              {item.changedByUser?.username} • {formatDistanceToNow(new Date(item.changedAt), { addSuffix: true, locale: ru })}
                            </div>
                            {item.comment && <div className="ticket-history-comment">{item.comment}</div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAssignModal && (
          <Modal title="Назначить оператора" onClose={() => setShowAssignModal(false)}>
            <div className="modal-content">
              <div className="form-group">
                <label>Выберите оператора</label>
                <select value={selectedOperator} onChange={(e) => setSelectedOperatorId(e.target.value)} className="form-select">
                  <option value="">Выберите оператора</option>
                  {operators?.map(op => (
                    <option key={op.id} value={op.id}>{op.username} - {op.role}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Отмена</Button>
                <Button variant="primary" onClick={handleAssignOperator} disabled={!selectedOperator} loading={assignOperatorMutation.isLoading}>Назначить</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStatusModal && (
          <Modal title="Изменить статус" onClose={() => setShowStatusModal(false)}>
            <div className="modal-content">
              <div className="form-group">
                <label>Новый статус</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="form-select">
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Комментарий (опционально)</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Введите комментарий..." className="form-textarea" rows={3} />
              </div>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setShowStatusModal(false)}>Отмена</Button>
                <Button variant="primary" onClick={handleStatusChange} loading={changeStatusMutation.isLoading}>Изменить</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCommentModal && (
          <Modal title="Добавить комментарий" onClose={() => setShowCommentModal(false)}>
            <div className="modal-content">
              <div className="form-group">
                <label>Комментарий</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Введите комментарий..." className="form-textarea" rows={4} autoFocus />
              </div>
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setShowCommentModal(false)}>Отмена</Button>
                <Button variant="primary" onClick={handleAddComment} disabled={!comment.trim()} loading={addCommentMutation.isLoading}>Добавить</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTopicModal && (
          <Modal title="Изменить тему обращения" onClose={() => setShowTopicModal(false)}>
            <div className="modal-content">
              <div className="form-group">
                <label>Тема</label>
                <select value={selectedTopicId} onChange={(e) => { setSelectedTopicId(e.target.value); setSelectedSubcategoryId(''); }} className="form-select">
                  <option value="">Выберите тему</option>
                  {topics?.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>
              {selectedTopicId && (
                <div className="form-group">
                  <label>Подкатегория</label>
                  <select value={selectedSubcategoryId} onChange={(e) => setSelectedSubcategoryId(e.target.value)} className="form-select">
                    <option value="">Выберите подкатегорию</option>
                    {subcategories?.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <Button variant="ghost" onClick={() => setShowTopicModal(false)}>Отмена</Button>
                <Button variant="primary" onClick={handleUpdateTopic} loading={updateTicketMutation.isLoading}>Сохранить</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketsPage;
