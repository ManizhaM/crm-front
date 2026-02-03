/**
 * Утилиты для работы с разрешениями
 */

/**
 * Проверить, есть ли у пользователя разрешение
 * @param {Object} permissions - Объект с разрешениями пользователя
 * @param {string} resource - Ресурс (users, tickets, etc.)
 * @param {string} action - Действие (view, create, edit, delete)
 * @returns {boolean}
 */
export const hasPermission = (permissions, resource, action) => {
  if (!permissions || !permissions.permissionsByResource) {
    return false;
  }

  const resourcePerms = permissions.permissionsByResource[resource];
  if (!resourcePerms) {
    return false;
  }

  // Проверка стандартных действий
  switch (action) {
    case 'view':
      return resourcePerms.canView;
    case 'create':
      return resourcePerms.canCreate;
    case 'edit':
      return resourcePerms.canEdit;
    case 'delete':
      return resourcePerms.canDelete;
    default:
      // Проверка кастомных действий
      return resourcePerms.customActions?.includes(action) || false;
  }
};

/**
 * Проверить, есть ли хотя бы одно из разрешений
 * @param {Object} permissions - Объект с разрешениями пользователя
 * @param {Array} requiredPermissions - Массив объектов {resource, action}
 * @returns {boolean}
 */
export const hasAnyPermission = (permissions, requiredPermissions) => {
  return requiredPermissions.some(perm => 
    hasPermission(permissions, perm.resource, perm.action)
  );
};

/**
 * Проверить, есть ли все разрешения
 * @param {Object} permissions - Объект с разрешениями пользователя
 * @param {Array} requiredPermissions - Массив объектов {resource, action}
 * @returns {boolean}
 */
export const hasAllPermissions = (permissions, requiredPermissions) => {
  return requiredPermissions.every(perm => 
    hasPermission(permissions, perm.resource, perm.action)
  );
};

/**
 * Получить список доступных действий для ресурса
 * @param {Object} permissions - Объект с разрешениями пользователя
 * @param {string} resource - Ресурс
 * @returns {Array} - Массив доступных действий
 */
export const getAvailableActions = (permissions, resource) => {
  if (!permissions || !permissions.permissionsByResource) {
    return [];
  }

  const resourcePerms = permissions.permissionsByResource[resource];
  if (!resourcePerms) {
    return [];
  }

  const actions = [];
  if (resourcePerms.canView) actions.push('view');
  if (resourcePerms.canCreate) actions.push('create');
  if (resourcePerms.canEdit) actions.push('edit');
  if (resourcePerms.canDelete) actions.push('delete');
  if (resourcePerms.customActions) {
    actions.push(...resourcePerms.customActions);
  }

  return actions;
};

/**
 * Проверить, имеет ли пользователь доступ к ресурсу (хотя бы view)
 * @param {Object} permissions - Объект с разрешениями пользователя
 * @param {string} resource - Ресурс
 * @returns {boolean}
 */
export const canAccessResource = (permissions, resource) => {
  return hasPermission(permissions, resource, 'view');
};

/**
 * Фильтровать массив объектов по разрешениям
 * Полезно для фильтрации пунктов меню, кнопок и т.д.
 * @param {Array} items - Массив элементов с полем requiredPermission
 * @param {Object} permissions - Объект с разрешениями пользователя
 * @returns {Array} - Отфильтрованный массив
 */
export const filterByPermissions = (items, permissions) => {
  return items.filter(item => {
    if (!item.requiredPermission) {
      return true; // Если разрешение не требуется, показываем элемент
    }

    const { resource, action } = item.requiredPermission;
    return hasPermission(permissions, resource, action);
  });
};

/**
 * Константы ресурсов для удобства
 */
export const RESOURCES = {
  USERS: 'users',
  TICKETS: 'tickets',
  ANALYTICS: 'analytics',
  REFERENCES: 'references',
  CHATS: 'chats',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  ROLES: 'roles'
};

/**
 * Константы действий для удобства
 */
export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  ASSIGN: 'assign'
};

/**
 * Объект с предопределенными разрешениями для частого использования
 */
export const PERMISSIONS = {
  // Пользователи
  USERS_VIEW: { resource: RESOURCES.USERS, action: ACTIONS.VIEW },
  USERS_CREATE: { resource: RESOURCES.USERS, action: ACTIONS.CREATE },
  USERS_EDIT: { resource: RESOURCES.USERS, action: ACTIONS.EDIT },
  USERS_DELETE: { resource: RESOURCES.USERS, action: ACTIONS.DELETE },

  // Заявки
  TICKETS_VIEW: { resource: RESOURCES.TICKETS, action: ACTIONS.VIEW },
  TICKETS_CREATE: { resource: RESOURCES.TICKETS, action: ACTIONS.CREATE },
  TICKETS_EDIT: { resource: RESOURCES.TICKETS, action: ACTIONS.EDIT },
  TICKETS_DELETE: { resource: RESOURCES.TICKETS, action: ACTIONS.DELETE },
  TICKETS_ASSIGN: { resource: RESOURCES.TICKETS, action: ACTIONS.ASSIGN },

  // Аналитика
  ANALYTICS_VIEW: { resource: RESOURCES.ANALYTICS, action: ACTIONS.VIEW },

  // Справочники
  REFERENCES_VIEW: { resource: RESOURCES.REFERENCES, action: ACTIONS.VIEW },
  REFERENCES_CREATE: { resource: RESOURCES.REFERENCES, action: ACTIONS.CREATE },
  REFERENCES_EDIT: { resource: RESOURCES.REFERENCES, action: ACTIONS.EDIT },
  REFERENCES_DELETE: { resource: RESOURCES.REFERENCES, action: ACTIONS.DELETE },

  // Чаты
  CHATS_VIEW: { resource: RESOURCES.CHATS, action: ACTIONS.VIEW },
  CHATS_EDIT: { resource: RESOURCES.CHATS, action: ACTIONS.EDIT },

  // Настройки
  SETTINGS_VIEW: { resource: RESOURCES.SETTINGS, action: ACTIONS.VIEW },
  SETTINGS_EDIT: { resource: RESOURCES.SETTINGS, action: ACTIONS.EDIT },

  // Уведомления
  NOTIFICATIONS_VIEW: { resource: RESOURCES.NOTIFICATIONS, action: ACTIONS.VIEW },
  NOTIFICATIONS_CREATE: { resource: RESOURCES.NOTIFICATIONS, action: ACTIONS.CREATE },

  // Роли и права
  ROLES_VIEW: { resource: RESOURCES.ROLES, action: ACTIONS.VIEW },
  ROLES_CREATE: { resource: RESOURCES.ROLES, action: ACTIONS.CREATE },
  ROLES_EDIT: { resource: RESOURCES.ROLES, action: ACTIONS.EDIT },
  ROLES_DELETE: { resource: RESOURCES.ROLES, action: ACTIONS.DELETE }
};
