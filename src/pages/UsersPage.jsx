import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiUsers, FiMail, FiShield } from 'react-icons/fi';
import { api } from '../services/api';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import './UsersPage.css';

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.users.getAll()).data,
  });

  const users = Array.isArray(usersData) ? usersData : [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.users.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Статус обновлен');
    },
  });

  const filteredUsers = users?.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    updateStatusMutation.mutate({ id: user.id, status: newStatus });
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>Пользователи</h1>
          <p>Всего пользователей: {users?.length || 0}</p>
        </div>
        <div className="users-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="users-grid">
        {isLoading ? (
          <div className="users-loading">Загрузка...</div>
        ) : (
          filteredUsers?.map(user => (
            <motion.div
              key={user.id}
              className="user-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
            >
              <div className="user-avatar">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h3>{user.username}</h3>
                <p><FiMail size={14} /> {user.email || 'Не указан'}</p>
                <div className="user-meta">
                  <Badge variant={user.role === 'Admin' ? 'danger' : 'primary'}>
                    <FiShield size={12} /> {user.role}
                  </Badge>
                  <Badge variant={user.status === 'Active' ? 'success' : 'default'}>
                    {user.status === 'Active' ? 'Активен' : 'Неактивен'}
                  </Badge>
                </div>
              </div>
              <div className="user-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(user)}
                >
                  {user.status === 'Active' ? 'Деактивировать' : 'Активировать'}
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersPage;
