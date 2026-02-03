import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiInbox,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiPhone,
  FiMail,
  FiSend,
  FiRefreshCw,
  FiX,
  FiPaperclip,
  FiImage,
  FiFile
} from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CreateTicketModal, TicketDetailModal } from './OperatorModals';
import './OperatorDashboard.css';

const OperatorDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('incoming'); // incoming, active, history
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  // Загрузка текущего пользователя
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.users.getMe();
      return response.data;
    },
  });

  // Загрузка заявок оператора
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['operator-tickets', activeTab, statusFilter, dateFilter],
    queryFn: async () => {
      const params = {};
      
      if (activeTab === 'incoming') {
        params.status = 'New';
        params.assignedOperatorId = null; // Непринятые заявки
      } else if (activeTab === 'active') {
        params.assignedOperatorId = currentUser?.id;
        params.status = 'InProgress,WaitingForClient';
      } else if (activeTab === 'history') {
        params.assignedOperatorId = currentUser?.id;
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
      }

      const response = await api.tickets.getAll(params);
      return response.data;
    },
    enabled: !!currentUser,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  });

  const tickets = Array.isArray(ticketsData?.tickets) ? ticketsData.tickets : 
                  Array.isArray(ticketsData) ? ticketsData : [];

  // Принять заявку
  const acceptTicketMutation = useMutation({
    mutationFn: (ticketId) => api.tickets.assignOperator(ticketId, currentUser.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['operator-tickets']);
      queryClient.invalidateQueries(['notifications']);
      toast.success('Заявка принята в работу');
      setActiveTab('active');
    },
    onError: () => toast.error('Ошибка при принятии заявки'),
  });

  // Изменить статус заявки
  const changeStatusMutation = useMutation({
    mutationFn: ({ ticketId, newStatus, comment }) => 
      api.tickets.changeStatus(ticketId, newStatus, comment),
    onSuccess: () => {
      queryClient.invalidateQueries(['operator-tickets']);
      toast.success('Статус изменен');
    },
    onError: () => toast.error('Ошибка изменения статуса'),
  });

  // Передать заявку в техподдержку
  const transferTicketMutation = useMutation({
    mutationFn: ({ ticketId, reason, comment }) => 
      api.tickets.transfer(ticketId, {
        toDepartment: 'TECHNICAL_SUPPORT',
        reason,
        comment
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['operator-tickets']);
      toast.success('Заявка передана в техподдержку');
      setSelectedTicket(null);
    },
    onError: () => toast.error('Ошибка передачи заявки'),
  });

  // Статистика оператора
  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'New').length,
    inProgress: tickets.filter(t => t.status === 'InProgress').length,
    resolved: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  const handleAcceptTicket = (ticketId) => {
    acceptTicketMutation.mutate(ticketId);
  };

  const handleCompleteTicket = (ticketId) => {
    changeStatusMutation.mutate({
      ticketId,
      newStatus: 'Resolved',
      comment: 'Заявка завершена оператором'
    });
  };

  const handleTransferToSupport = (ticketId, reason, comment) => {
    transferTicketMutation.mutate({ ticketId, reason, comment });
  };

  return (
    <div className="operator-dashboard">
      {/* Шапка с приветствием и статистикой */}
      <div className="operator-header">
        <div className="operator-welcome">
          <h1>Добро пожаловать, {currentUser?.fullName}!</h1>
          <p>Личный кабинет оператора</p>
        </div>
        
        <div className="operator-stats">
          <StatCard
            icon={<FiInbox />}
            label="Входящие"
            value={stats.new}
            color="blue"
          />
          <StatCard
            icon={<FiClock />}
            label="В работе"
            value={stats.inProgress}
            color="orange"
          />
          <StatCard
            icon={<FiCheckCircle />}
            label="Завершено"
            value={stats.resolved}
            color="green"
          />
        </div>
      </div>

      {/* Вкладки */}
      <div className="operator-tabs">
        <button
          className={`tab ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          <FiInbox />
          Входящие ({stats.new})
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <FiClock />
          Мои заявки ({stats.inProgress})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiCheckCircle />
          История
        </button>
      </div>

      {/* Фильтры и поиск */}
      <div className="operator-filters">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Поиск по номеру заявки или клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'history' && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все статусы</option>
              <option value="Resolved">Решенные</option>
              <option value="Closed">Закрытые</option>
              <option value="Escalated">Эскалированные</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Весь период</option>
              <option value="today">Сегодня</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
            </select>
          </>
        )}

        <Button
          variant="primary"
          icon={<FiPhone />}
          onClick={() => setShowCreateTicketModal(true)}
        >
          Новая заявка
        </Button>
      </div>

      {/* Список заявок */}
      <div className="tickets-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Загрузка заявок...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <FiInbox size={64} />
            <h3>Заявок нет</h3>
            <p>
              {activeTab === 'incoming' && 'Новых входящих заявок пока нет'}
              {activeTab === 'active' && 'У вас нет активных заявок'}
              {activeTab === 'history' && 'История заявок пуста'}
            </p>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                activeTab={activeTab}
                onAccept={() => handleAcceptTicket(ticket.id)}
                onComplete={() => handleCompleteTicket(ticket.id)}
                onTransfer={(reason, comment) => handleTransferToSupport(ticket.id, reason, comment)}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <AnimatePresence>
        {showCreateTicketModal && (
          <CreateTicketModal
            onClose={() => setShowCreateTicketModal(false)}
          />
        )}

        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onComplete={() => handleCompleteTicket(selectedTicket.id)}
            onTransfer={(reason, comment) => handleTransferToSupport(selectedTicket.id, reason, comment)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Компонент карточки статистики
const StatCard = ({ icon, label, value, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

// Компонент карточки заявки
const TicketCard = ({ ticket, activeTab, onAccept, onComplete, onTransfer, onClick }) => {
  const [showTransferModal, setShowTransferModal] = useState(false);

  return (
    <motion.div
      className="ticket-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
    >
      <div className="ticket-card-header">
        <div className="ticket-number">#{ticket.id}</div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="ticket-card-body">
        <div className="ticket-client">
          <FiUser />
          <span>{ticket.clientName || ticket.chat?.name || 'Клиент'}</span>
        </div>
        
        {ticket.topic && (
          <div className="ticket-topic">
            <FiMessageSquare />
            <span>{ticket.topic.name}</span>
          </div>
        )}

        <div className="ticket-time">
          <FiClock />
          <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ru })}</span>
        </div>
      </div>

      <div className="ticket-card-actions" onClick={(e) => e.stopPropagation()}>
        {activeTab === 'incoming' && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAccept}
            fullWidth
          >
            Принять заявку
          </Button>
        )}

        {activeTab === 'active' && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={onComplete}
            >
              Завершить
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={() => setShowTransferModal(true)}
            >
              В техподдержку
            </Button>
          </>
        )}
      </div>

      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          onTransfer={onTransfer}
        />
      )}
    </motion.div>
  );
};

// Модальное окно передачи в техподдержку
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
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal modal-small"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
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
                placeholder="Техническая проблема, требуется специалист и т.д."
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
            <Button variant="warning" icon={<FiRefreshCw />} type="submit">
              Передать
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default OperatorDashboard;
