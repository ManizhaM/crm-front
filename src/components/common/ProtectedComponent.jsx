import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Компонент для условного отображения контента на основе разрешений
 * 
 * @example
 * // Показать только если есть разрешение
 * <ProtectedComponent resource="users" action="create">
 *   <Button>Создать пользователя</Button>
 * </ProtectedComponent>
 * 
 * @example
 * // Показать fallback, если нет разрешения
 * <ProtectedComponent 
 *   resource="tickets" 
 *   action="delete"
 *   fallback={<div>У вас нет прав</div>}
 * >
 *   <Button>Удалить</Button>
 * </ProtectedComponent>
 * 
 * @example
 * // Требуется хотя бы одно из разрешений
 * <ProtectedComponent 
 *   anyOf={[
 *     { resource: 'users', action: 'create' },
 *     { resource: 'users', action: 'edit' }
 *   ]}
 * >
 *   <AdminPanel />
 * </ProtectedComponent>
 * 
 * @example
 * // Требуются все разрешения
 * <ProtectedComponent 
 *   allOf={[
 *     { resource: 'users', action: 'view' },
 *     { resource: 'roles', action: 'edit' }
 *   ]}
 * >
 *   <SuperAdminPanel />
 * </ProtectedComponent>
 */
const ProtectedComponent = ({ 
  children, 
  resource, 
  action, 
  anyOf, 
  allOf,
  fallback = null,
  showFallback = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  // Проверка на одно разрешение
  if (resource && action) {
    hasAccess = hasPermission(resource, action);
  }
  // Проверка на любое из разрешений
  else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf);
  }
  // Проверка на все разрешения
  else if (allOf && allOf.length > 0) {
    hasAccess = hasAllPermissions(allOf);
  }
  // Если ничего не указано, показываем контент
  else {
    hasAccess = true;
  }

  // Если есть доступ, показываем контент
  if (hasAccess) {
    return <>{children}</>;
  }

  // Если нет доступа и нужно показать fallback
  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  // По умолчанию ничего не показываем
  return null;
};

export default ProtectedComponent;
