import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiMessageSquare, 
  FiClipboard,
  FiDatabase,
  FiUsers,
  FiSettings,
  FiBarChart2,
  FiHelpCircle,
  FiShield
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { filterByPermissions } from '../../utils/permissions';
import './Sidebar.css';

/**
 * Современная боковая панель навигации с проверкой прав доступа
 */
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions } = usePermissions();

  // Конфигурация пунктов меню
  const allMenuItems = [
    { 
      id: 'dashboard', 
      label: 'Дашборд', 
      icon: <FiHome />, 
      path: '/dashboard',
      badge: null,
      requiredPermission: null // Доступно всем
    },
    { 
      id: 'tickets', 
      label: 'Заявки', 
      icon: <FiClipboard />, 
      path: '/tickets',
      badge: null,
      requiredPermission: { resource: 'tickets', action: 'view' }
    },
    { 
      id: 'chats', 
      label: 'Чаты', 
      icon: <FiMessageSquare />, 
      path: '/chats',
      badge: null,
      requiredPermission: { resource: 'chats', action: 'view' }
    },
    { 
      id: 'references', 
      label: 'Справочники', 
      icon: <FiDatabase />, 
      path: '/references',
      badge: null,
      requiredPermission: { resource: 'references', action: 'view' }
    },
    { 
      id: 'analytics', 
      label: 'Аналитика', 
      icon: <FiBarChart2 />, 
      path: '/analytics',
      badge: null,
      requiredPermission: { resource: 'analytics', action: 'view' }
    },
    { 
      id: 'users', 
      label: 'Пользователи', 
      icon: <FiUsers />, 
      path: '/user-management',
      badge: null,
      requiredPermission: { resource: 'users', action: 'view' }
    },
    { 
      id: 'roles', 
      label: 'Роли и права', 
      icon: <FiShield />, 
      path: '/roles',
      badge: null,
      requiredPermission: { resource: 'roles', action: 'view' }
    },
    { 
      id: 'settings', 
      label: 'Настройки', 
      icon: <FiSettings />, 
      path: '/settings',
      badge: null,
      requiredPermission: { resource: 'settings', action: 'view' }
    },
    { 
      id: 'help', 
      label: 'Помощь', 
      icon: <FiHelpCircle />, 
      path: '/help',
      badge: null,
      requiredPermission: null // Доступно всем
    },
  ];

  // Фильтруем пункты меню по разрешениям
  const menuItems = useMemo(() => {
    if (!permissions) {
      // Если разрешения еще не загружены, показываем только базовые пункты
      return allMenuItems.filter(item => item.requiredPermission === null);
    }
    return filterByPermissions(allMenuItems, permissions);
  }, [permissions]);

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay для мобильных */}
      <AnimatePresence>
        {isOpen && window.innerWidth < 1024 && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Сайдбар */}
      <motion.aside
        className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        initial={false}
        animate={{
          x: isOpen || window.innerWidth >= 1024 ? 0 : -280,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-content">
          {/* Навигационное меню */}
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <motion.button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  title={item.label}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-nav-badge">{item.badge}</span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Статистика оператора - показываем только если есть доступ к заявкам */}
          {permissions && permissions.permissionsByResource?.tickets?.canView && (
            <div className="sidebar-stats">
              <div className="sidebar-stats-title">Моя статистика</div>
              <div className="sidebar-stats-grid">
                <div className="sidebar-stat-item">
                  <div className="sidebar-stat-value">24</div>
                  <div className="sidebar-stat-label">Активные</div>
                </div>
                <div className="sidebar-stat-item">
                  <div className="sidebar-stat-value">156</div>
                  <div className="sidebar-stat-label">Решено</div>
                </div>
                <div className="sidebar-stat-item">
                  <div className="sidebar-stat-value">4.8</div>
                  <div className="sidebar-stat-label">Рейтинг</div>
                </div>
                <div className="sidebar-stat-item">
                  <div className="sidebar-stat-value">12м</div>
                  <div className="sidebar-stat-label">Ср. время</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
