import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiShield,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiCheck,
  FiX,
  FiLock,
  FiUnlock,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import ProtectedComponent from '../components/common/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import './RolesManagementPage.css';
// Импорт модальных окон
import { CreateRoleModal, EditRoleModal, DeleteRoleModal } from './RolesManagementModals';
/**
 * Страница управления ролями и разрешениями
 */
const RolesManagementPage = () => {
  const queryClient = useQueryClient();
  const { canCreateRoles, canEditRoles, canDeleteRoles } = usePermissions();
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedResources, setExpandedResources] = useState({});

  // Загрузка ролей
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.roles.getRoles();
      return response.data;
    },
  });

  // Загрузка сгруппированных разрешений
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: async () => {
      const response = await api.roles.getGroupedPermissions();
      return response.data;
    },
  });

  // Создание роли
  const createRoleMutation = useMutation({
    mutationFn: (data) => api.roles.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Роль создана');
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка создания роли');
    },
  });

  // Обновление роли
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => api.roles.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Роль обновлена');
      setShowEditModal(false);
      setSelectedRole(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления роли');
    },
  });

  // Удаление роли
  const deleteRoleMutation = useMutation({
    mutationFn: (id) => api.roles.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Роль удалена');
      setShowDeleteModal(false);
      setSelectedRole(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления роли');
    },
  });

  const roles = rolesData || [];

  const toggleResourceExpand = (resource) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  if (rolesLoading) {
    return (
      <div className="roles-page-loading">
        <div className="spinner"></div>
        <p>Загрузка ролей...</p>
      </div>
    );
  }

  return (
    <div className="roles-management-page">
      {/* Заголовок */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <FiShield className="page-icon" />
            <div>
              <h1 className="page-title">Роли и разрешения</h1>
              <p className="page-subtitle">
                Управление ролями пользователей и их правами доступа
              </p>
            </div>
          </div>
          
          <ProtectedComponent resource="roles" action="create">
            <Button
              variant="primary"
              icon={<FiPlus />}
              onClick={() => setShowCreateModal(true)}
              disabled={!canCreateRoles}
            >
              Создать роль
            </Button>
          </ProtectedComponent>
        </div>
      </div>

      {/* Список ролей */}
      <div className="roles-grid">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onEdit={() => {
              setSelectedRole(role);
              setShowEditModal(true);
            }}
            onDelete={() => {
              setSelectedRole(role);
              setShowDeleteModal(true);
            }}
            canEdit={canEditRoles}
            canDelete={canDeleteRoles && !role.isSystem}
          />
        ))}
      </div>

      {/* Модальные окна */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoleModal
            permissions={permissionsData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={(data) => createRoleMutation.mutate(data)}
            isLoading={createRoleMutation.isLoading}
          />
        )}

        {showEditModal && selectedRole && (
          <EditRoleModal
            role={selectedRole}
            permissions={permissionsData}
            onClose={() => {
              setShowEditModal(false);
              setSelectedRole(null);
            }}
            onSubmit={(data) => updateRoleMutation.mutate({ id: selectedRole.id, data })}
            isLoading={updateRoleMutation.isLoading}
          />
        )}

        {showDeleteModal && selectedRole && (
          <DeleteRoleModal
            role={selectedRole}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedRole(null);
            }}
            onConfirm={() => deleteRoleMutation.mutate(selectedRole.id)}
            isLoading={deleteRoleMutation.isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Карточка роли
const RoleCard = ({ role, onEdit, onDelete, canEdit, canDelete }) => {
  return (
    <motion.div
      className="role-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <div className="role-card-header">
        <div className="role-card-icon">
          <FiShield />
        </div>
        <div className="role-card-info">
          <h3 className="role-card-title">{role.displayName}</h3>
          <p className="role-card-name">{role.name}</p>
        </div>
        {role.isSystem && (
          <span className="role-system-badge">
            <FiLock /> Системная
          </span>
        )}
      </div>

      {role.description && (
        <p className="role-card-description">{role.description}</p>
      )}

      <div className="role-card-stats">
        <div className="role-stat">
          <FiShield className="role-stat-icon" />
          <span>{role.permissionsCount} разрешений</span>
        </div>
        <div className="role-stat">
          <FiUsers className="role-stat-icon" />
          <span>{role.usersCount} пользователей</span>
        </div>
      </div>

      <div className="role-card-status">
        {role.isActive ? (
          <span className="status-badge status-active">
            <FiCheck /> Активна
          </span>
        ) : (
          <span className="status-badge status-inactive">
            <FiX /> Неактивна
          </span>
        )}
      </div>

      <div className="role-card-actions">
        {canEdit && (
          <Button
            variant="secondary"
            size="small"
            icon={<FiEdit />}
            onClick={onEdit}
          >
            Редактировать
          </Button>
        )}
        {canDelete && (
          <Button
            variant="danger"
            size="small"
            icon={<FiTrash2 />}
            onClick={onDelete}
          >
            Удалить
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default RolesManagementPage;
