// Этот файл содержит дополнительные модальные окна для TicketsPage
// Добавьте эти состояния и модальные окна в TicketsPage.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiRefreshCw } from 'react-icons/fi';
import Button from '../components/common/Button';

// ============================================
// МОДАЛЬНОЕ ОКНО ДЛЯ СОЗДАНИЯ ЗАЯВКИ ВРУЧНУЮ
// ============================================

export const CreateTicketModal = ({ onClose, onCreate, isLoading, topics, subcategories }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    description: '',
    channel: 'PHONE',
    topicId: '',
    subcategoryId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
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
            <div className="form-group">
              <label>Имя клиента *</label>
              <input
                type="text"
                className="form-input"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                placeholder="Введите имя клиента"
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

            <div className="form-group">
              <label>Канал обращения *</label>
              <select
                className="form-select"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                required
              >
                <option value="PHONE">Телефон</option>
                <option value="EMAIL">Email</option>
                <option value="WEB">Веб-сайт</option>
                <option value="MOBILE_APP">Мобильное приложение</option>
                <option value="TELEGRAM">Telegram</option>
              </select>
            </div>

            <div className="form-group">
              <label>Тема</label>
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

            <div className="form-group">
              <label>Описание проблемы *</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                placeholder="Опишите проблему клиента..."
              />
            </div>
          </div>
          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} type="button">
              Отмена
            </Button>
            <Button variant="primary" icon={<FiSend />} type="submit" loading={isLoading}>
              Создать заявку
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// МОДАЛЬНОЕ ОКНО ДЛЯ ПЕРЕДАЧИ ЗАЯВКИ
// ============================================

export const TransferTicketModal = ({ onClose, onTransfer, isLoading, operators, ticket }) => {
  const [transferData, setTransferData] = useState({
    toUserId: '',
    toDepartment: '',
    reason: '',
    comment: ''
  });

  const [transferType, setTransferType] = useState('operator'); // operator or department

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = transferType === 'operator'
      ? { toUserId: parseInt(transferData.toUserId), reason: transferData.reason, comment: transferData.comment }
      : { toDepartment: transferData.toDepartment, reason: transferData.reason, comment: transferData.comment };
    
    onTransfer(ticket.id, data);
  };

  return (
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
          <h3>Передать заявку #{ticket?.id}</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-group">
              <label>Тип передачи</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="operator"
                    checked={transferType === 'operator'}
                    onChange={(e) => setTransferType(e.target.value)}
                  />
                  <span>Оператору</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="department"
                    checked={transferType === 'department'}
                    onChange={(e) => setTransferType(e.target.value)}
                  />
                  <span>В отдел</span>
                </label>
              </div>
            </div>

            {transferType === 'operator' ? (
              <div className="form-group">
                <label>Выберите оператора *</label>
                <select
                  className="form-select"
                  value={transferData.toUserId}
                  onChange={(e) => setTransferData({ ...transferData, toUserId: e.target.value })}
                  required
                >
                  <option value="">Выберите оператора</option>
                  {operators?.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.fullName} ({op.activeTicketsCount} активных заявок)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Выберите отдел *</label>
                <select
                  className="form-select"
                  value={transferData.toDepartment}
                  onChange={(e) => setTransferData({ ...transferData, toDepartment: e.target.value })}
                  required
                >
                  <option value="">Выберите отдел</option>
                  <option value="TECHNICAL_SUPPORT">Техническая поддержка</option>
                  <option value="CLEARING_SPECIALIST">Отдел клиринга</option>
                  <option value="ANALYST">Аналитика</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Причина передачи *</label>
              <input
                type="text"
                className="form-input"
                value={transferData.reason}
                onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                required
                placeholder="Укажите причину передачи"
              />
            </div>

            <div className="form-group">
              <label>Комментарий</label>
              <textarea
                className="form-textarea"
                value={transferData.comment}
                onChange={(e) => setTransferData({ ...transferData, comment: e.target.value })}
                rows={3}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>
          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} type="button">
              Отмена
            </Button>
            <Button variant="warning" icon={<FiRefreshCw />} type="submit" loading={isLoading}>
              Передать
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// ИНСТРУКЦИЯ ПО ИНТЕГРАЦИИ
// ============================================

/*
В TicketsPage.jsx добавьте:

1. Импорты:
import { CreateTicketModal, TransferTicketModal } from './TicketModals';

2. Состояния:
const [showCreateModal, setShowCreateModal] = useState(false);
const [showTransferModal, setShowTransferModal] = useState(false);

3. Мутации:
const createTicketMutation = useMutation({
  mutationFn: (data) => api.tickets.createManually(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['tickets']);
    toast.success('Заявка создана');
    setShowCreateModal(false);
  },
  onError: () => toast.error('Ошибка создания заявки')
});

const transferTicketMutation = useMutation({
  mutationFn: ({ id, data }) => api.tickets.transfer(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries(['tickets']);
    toast.success('Заявка передана');
    setShowTransferModal(false);
    setSelectedTicket(null);
  },
  onError: () => toast.error('Ошибка передачи заявки')
});

4. Кнопки в интерфейсе:
// В заголовке страницы:
<Button variant="primary" icon={<FiPlus />} onClick={() => setShowCreateModal(true)}>
  Новая заявка
</Button>

// В детальной панели заявки:
<Button variant="outline" size="sm" icon={<FiRefreshCw />} onClick={() => setShowTransferModal(true)}>
  Передать
</Button>

5. Модальные окна в конце компонента:
<AnimatePresence>
  {showCreateModal && (
    <CreateTicketModal
      onClose={() => setShowCreateModal(false)}
      onCreate={(data) => createTicketMutation.mutate(data)}
      isLoading={createTicketMutation.isLoading}
      topics={topics}
      subcategories={subcategories}
    />
  )}
</AnimatePresence>

<AnimatePresence>
  {showTransferModal && selectedTicket && (
    <TransferTicketModal
      onClose={() => setShowTransferModal(false)}
      onTransfer={(id, data) => transferTicketMutation.mutate({ id, data })}
      isLoading={transferTicketMutation.isLoading}
      operators={operators}
      ticket={selectedTicket}
    />
  )}
</AnimatePresence>
*/
