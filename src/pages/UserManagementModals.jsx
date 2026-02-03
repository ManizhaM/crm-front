import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiKey, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// Компонент Modal (базовый)
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

// Модальное окно редактирования пользователя
export const EditUserModal = ({ user, onClose, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    active: user.active
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <Modal title={`Редактировать: ${user.fullName}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-content">
          <div className="form-group">
            <label>Полное имя</label>
            <input
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+992XXXXXXXXX"
            />
          </div>

          <div className="form-group">
            <label>Роль</label>
            <select
              className="form-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="OPERATOR">Оператор</option>
              <option value="ANALYST">Аналитик</option>
              <option value="TECHNICAL_SUPPORT">Техническая поддержка</option>
              <option value="CLEARING_SPECIALIST">Специалист клиринга</option>
              <option value="ADMIN">Администратор</option>
              <option value="SUPER_ADMIN">Суперадминистратор</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Активен</span>
            </label>
          </div>

          <div className="info-box">
            <FiAlertTriangle />
            <div>
              <strong>Логин:</strong> {user.username}
              <br />
              <small>Логин изменить нельзя. Для смены пароля используйте кнопку "Сбросить пароль"</small>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} type="button">
            Отмена
          </Button>
          <Button variant="primary" icon={<FiCheck />} type="submit" loading={isLoading}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Модальное окно сброса пароля
export const ResetPasswordModal = ({ user, onClose, onReset, isLoading }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    onReset(newPassword);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  return (
    <Modal title="Сброс пароля" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-content">
          <div className="info-box warning">
            <FiKey />
            <div>
              <strong>Сброс пароля для:</strong> {user.fullName} (@{user.username})
              <br />
              <small>Пользователь сможет войти с новым паролем сразу после сброса</small>
            </div>
          </div>

          <div className="form-group">
            <label>Новый пароль</label>
            <div className="password-input-group">
              <input
                type="text"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Минимум 6 символов"
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={generateRandomPassword}
              >
                Генерировать
              </Button>
            </div>
          </div>

          <div className="form-group">
            <label>Подтверждение пароля</label>
            <input
              type="text"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Повторите пароль"
            />
          </div>

          {newPassword && (
            <div className="password-strength">
              <small>
                Длина пароля: {newPassword.length} символов
                {newPassword.length >= 10 && ' ✓ Отлично'}
                {newPassword.length >= 8 && newPassword.length < 10 && ' ✓ Хорошо'}
                {newPassword.length >= 6 && newPassword.length < 8 && ' ⚠ Приемлемо'}
              </small>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} type="button">
            Отмена
          </Button>
          <Button variant="warning" icon={<FiKey />} type="submit" loading={isLoading}>
            Сбросить пароль
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Модальное окно удаления пользователя
export const DeleteUserModal = ({ user, onClose, onDelete, isLoading }) => {
  const [confirmText, setConfirmText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (confirmText !== 'УДАЛИТЬ') {
      toast.error('Введите "УДАЛИТЬ" для подтверждения');
      return;
    }

    onDelete();
  };

  return (
    <Modal title="Удалить пользователя" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-content">
          <div className="info-box danger">
            <FiAlertTriangle size={24} />
            <div>
              <strong>Внимание! Это действие необратимо!</strong>
              <br />
              Вы собираетесь удалить пользователя:
              <br />
              <strong>{user.fullName}</strong> (@{user.username})
            </div>
          </div>

          <div className="warning-list">
            <p><strong>Будет удалено:</strong></p>
            <ul>
              <li>Учетная запись пользователя</li>
              <li>История активности</li>
              <li>Все связанные данные</li>
            </ul>
            <p><strong>НЕ будет удалено:</strong></p>
            <ul>
              <li>Заявки, назначенные на этого пользователя</li>
              <li>Комментарии в заявках</li>
              <li>История изменений заявок</li>
            </ul>
          </div>

          {user.activeTicketsCount > 0 && (
            <div className="info-box danger">
              <FiAlertTriangle />
              <div>
                <strong>У пользователя {user.activeTicketsCount} активных заявок!</strong>
                <br />
                <small>Сначала переназначьте заявки другим операторам</small>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Для подтверждения введите: <strong>УДАЛИТЬ</strong></label>
            <input
              type="text"
              className="form-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="УДАЛИТЬ"
              required
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} type="button">
            Отмена
          </Button>
          <Button
            variant="danger"
            icon={<FiTrash2 />}
            type="submit"
            loading={isLoading}
            disabled={confirmText !== 'УДАЛИТЬ' || user.activeTicketsCount > 0}
          >
            Удалить пользователя
          </Button>
        </div>
      </form>
    </Modal>
  );
};
