import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Компонент для защиты роутов на основе разрешений
 * 
 * @example
 * // Требуется разрешение на просмотр пользователей
 * <Route path="/users" element={
 *   <RoleBasedRoute resource="users" action="view">
 *     <UsersPage />
 *   </RoleBasedRoute>
 * } />
 * 
 * @example
 * // Требуется любое из разрешений
 * <Route path="/admin" element={
 *   <RoleBasedRoute anyOf={[
 *     { resource: 'users', action: 'create' },
 *     { resource: 'roles', action: 'edit' }
 *   ]}>
 *     <AdminPage />
 *   </RoleBasedRoute>
 * } />
 */
const RoleBasedRoute = ({ 
  children, 
  resource, 
  action,
  anyOf,
  allOf,
  redirectTo = '/dashboard',
  showForbidden = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, permissions } = usePermissions();

  // Если разрешения еще не загружены, показываем загрузку
  if (!permissions) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

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
  // Если ничего не указано, разрешаем доступ
  else {
    hasAccess = true;
  }

  // Если есть доступ, показываем компонент
  if (hasAccess) {
    return <>{children}</>;
  }

  // Если нет доступа, редиректим или показываем страницу 403
  if (showForbidden) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Navigate to={redirectTo} replace />;
};

export default RoleBasedRoute;
