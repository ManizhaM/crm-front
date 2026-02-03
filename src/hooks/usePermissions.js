import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { hasPermission, hasAnyPermission, hasAllPermissions, canAccessResource, getAvailableActions } from '../utils/permissions';

/**
 * Хук для удобной работы с разрешениями
 */
export const usePermissions = () => {
  const { permissions } = useAuthStore();

  // Мемоизация для оптимизации
  const permissionHelpers = useMemo(() => {
    if (!permissions) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        canAccessResource: () => false,
        getAvailableActions: () => [],
        
        // Пользователи
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,

        // Заявки
        canViewTickets: false,
        canCreateTickets: false,
        canEditTickets: false,
        canDeleteTickets: false,
        canAssignTickets: false,

        // Аналитика
        canViewAnalytics: false,

        // Справочники
        canViewReferences: false,
        canCreateReferences: false,
        canEditReferences: false,
        canDeleteReferences: false,

        // Чаты
        canViewChats: false,
        canEditChats: false,

        // Настройки
        canViewSettings: false,
        canEditSettings: false,

        // Уведомления
        canViewNotifications: false,
        canCreateNotifications: false,

        // Роли
        canViewRoles: false,
        canCreateRoles: false,
        canEditRoles: false,
        canDeleteRoles: false,

        permissions: null
      };
    }

    return {
      // Функции проверки
      hasPermission: (resource, action) => hasPermission(permissions, resource, action),
      hasAnyPermission: (requiredPermissions) => hasAnyPermission(permissions, requiredPermissions),
      hasAllPermissions: (requiredPermissions) => hasAllPermissions(permissions, requiredPermissions),
      canAccessResource: (resource) => canAccessResource(permissions, resource),
      getAvailableActions: (resource) => getAvailableActions(permissions, resource),

      // Пользователи
      canViewUsers: hasPermission(permissions, 'users', 'view'),
      canCreateUsers: hasPermission(permissions, 'users', 'create'),
      canEditUsers: hasPermission(permissions, 'users', 'edit'),
      canDeleteUsers: hasPermission(permissions, 'users', 'delete'),

      // Заявки
      canViewTickets: hasPermission(permissions, 'tickets', 'view'),
      canCreateTickets: hasPermission(permissions, 'tickets', 'create'),
      canEditTickets: hasPermission(permissions, 'tickets', 'edit'),
      canDeleteTickets: hasPermission(permissions, 'tickets', 'delete'),
      canAssignTickets: hasPermission(permissions, 'tickets', 'assign'),

      // Аналитика
      canViewAnalytics: hasPermission(permissions, 'analytics', 'view'),

      // Справочники
      canViewReferences: hasPermission(permissions, 'references', 'view'),
      canCreateReferences: hasPermission(permissions, 'references', 'create'),
      canEditReferences: hasPermission(permissions, 'references', 'edit'),
      canDeleteReferences: hasPermission(permissions, 'references', 'delete'),

      // Чаты
      canViewChats: hasPermission(permissions, 'chats', 'view'),
      canEditChats: hasPermission(permissions, 'chats', 'edit'),

      // Настройки
      canViewSettings: hasPermission(permissions, 'settings', 'view'),
      canEditSettings: hasPermission(permissions, 'settings', 'edit'),

      // Уведомления
      canViewNotifications: hasPermission(permissions, 'notifications', 'view'),
      canCreateNotifications: hasPermission(permissions, 'notifications', 'create'),

      // Роли и права
      canViewRoles: hasPermission(permissions, 'roles', 'view'),
      canCreateRoles: hasPermission(permissions, 'roles', 'create'),
      canEditRoles: hasPermission(permissions, 'roles', 'edit'),
      canDeleteRoles: hasPermission(permissions, 'roles', 'delete'),

      // Объект разрешений
      permissions
    };
  }, [permissions]);

  return permissionHelpers;
};

export default usePermissions;
