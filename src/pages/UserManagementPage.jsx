import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiUsers,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiKey,
  FiCheck,
  FiX,
  FiShield,
  FiFilter,
  FiUserCheck,
  FiUserX,
  FiAlertTriangle
} from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import './UserManagementPage.css';

// Импорт модальных окон
import { EditUserModal, ResetPasswordModal, DeleteUserModal } from './UserManagementModals';

const UserManagementPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Загрузка пользователей
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', roleFilter, statusFilter],
    queryFn: async () => {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.active = statusFilter === 'active';
      
      const response = await api.auth.getAllUsers(params);
      return response.data;
    },
  });

  const users = usersData?.users || [];
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phoneNumber?.includes(searchQuery)
  );

  // Создание пользователя
  const createUserMutation = useMutation({
    mutationFn: (data) => api.auth.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Пользователь создан');
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка создания пользователя');
    },
  });

  // Обновление пользователя
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.auth.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Пользователь обновлен');
      setShowEditModal(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления');
    },
  });

  // Удаление пользователя
  const deleteUserMutation = useMutation({
    mutationFn: (id) => api.auth.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Пользователь удален');
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    },
  });

  // Сброс пароля
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }) => api.auth.adminResetPassword(id, newPassword),
    onSuccess: () => {
      toast.success('Пароль сброшен');
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка сброса пароля');
    },
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'purple';
      case 'ADMIN': return 'blue';
      case 'OPERATOR': return 'green';
      case 'ANALYST': return 'yellow';
      case 'TECHNICAL_SUPPORT': return 'orange';
      case 'CLEARING_SPECIALIST': return 'pink';
      default: return 'gray';
    }
  };

  const getRoleName = (role) => {
    const names = {
      'SUPER_ADMIN': 'Суперадмин',
      'ADMIN': 'Администратор',
      'OPERATOR': 'Оператор',
      'ANALYST': 'Аналитик',
      'TECHNICAL_SUPPORT': 'Тех. поддержка',
      'CLEARING_SPECIALIST': 'Клиринг'
    };
    return names[role] || role;
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div>
          <h1><FiUsers /> Управление пользователями</h1>
          <p>Всего пользователей: {users.length}</p>
        </div>
        <Button
          variant="primary"
          icon={<FiPlus />}
          onClick={() => setShowCreateModal(true)}
        >
          Создать пользователя
        </Button>
      </div>

      {/* Фильтры и поиск */}
      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Поиск по имени, логину или телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все роли</option>
            <option value="SUPER_ADMIN">Суперадмин</option>
            <option value="ADMIN">Администратор</option>
            <option value="OPERATOR">Оператор</option>
            <option value="ANALYST">Аналитик</option>
            <option value="TECHNICAL_SUPPORT">Тех. поддержка</option>
            <option value="CLEARING_SPECIALIST">Клиринг</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="users-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Загрузка пользователей...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <FiUsers size={64} />
            <h3>Пользователи не найдены</h3>
            <p>Измените параметры поиска или создайте нового пользователя</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Телефон</th>
                <th>Статус</th>
                <th>Активность</th>
                <th>Заявок</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <td>
                    <div className="user-cell">
                      <div className={`user-avatar ${user.isOnline ? 'online' : ''}`}>
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="user-name">{user.fullName}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeColor(user.role)}`}>
                      <FiShield size={14} />
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td>{user.phoneNumber || '—'}</td>
                  <td>
                    <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                      {user.active ? <FiUserCheck /> : <FiUserX />}
                      {user.active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    {user.lastActivityAt ? (
                      <span className="activity-time">
                        {formatDistanceToNow(new Date(user.lastActivityAt), {
                          addSuffix: true,
                          locale: ru
                        })}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span className="tickets-count">{user.activeTicketsCount}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        title="Редактировать"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="action-btn reset"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetPasswordModal(true);
                        }}
                        title="Сбросить пароль"
                      >
                        <FiKey />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        title="Удалить"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Модальные окна */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(data) => createUserMutation.mutate(data)}
            isLoading={createUserMutation.isLoading}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onUpdate={(data) => updateUserMutation.mutate({ id: selectedUser.id, data })}
            isLoading={updateUserMutation.isLoading}
          />
        )}

        {showResetPasswordModal && selectedUser && (
          <ResetPasswordModal
            user={selectedUser}
            onClose={() => {
              setShowResetPasswordModal(false);
              setSelectedUser(null);
            }}
            onReset={(newPassword) => resetPasswordMutation.mutate({ id: selectedUser.id, newPassword })}
            isLoading={resetPasswordMutation.isLoading}
          />
        )}

        {showDeleteModal && selectedUser && (
          <DeleteUserModal
            user={selectedUser}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onDelete={() => deleteUserMutation.mutate(selectedUser.id)}
            isLoading={deleteUserMutation.isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Модальное окно создания пользователя
const CreateUserModal = ({ onClose, onCreate, isLoading }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    role: 'OPERATOR'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    onCreate({
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      role: formData.role
    });
  };

  return (
    <Modal title="Создать пользователя" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-content">
          <div className="form-group">
            <label>Логин *</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="username"
            />
          </div>

          <div className="form-group">
            <label>Полное имя *</label>
            <input
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="Иванов Иван Иванович"
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
            <label>Роль *</label>
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
            <label>Пароль *</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="form-group">
            <label>Подтверждение пароля *</label>
            <input
              type="password"
              className="form-input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
              placeholder="Повторите пароль"
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} type="button">
            Отмена
          </Button>
          <Button variant="primary" icon={<FiCheck />} type="submit" loading={isLoading}>
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Остальные модальные окна в следующем сообщении...

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

export default UserManagementPage;
