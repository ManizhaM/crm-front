import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiBell, 
  FiMenu, 
  FiX,
  FiUser,
  FiSettings,
  FiLogOut 
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import ThemeToggle from './ThemeToggle';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import './Navbar.css';

/**
 * Современный навигационный бар с реальными уведомлениями
 */
const Navbar = ({ onMenuToggle, menuOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка уведомлений
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: async () => {
      const response = await api.notifications.getAll(false, 5);
      return response.data;
    },
    refetchInterval: 10000, // Обновление каждые 10 секунд
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.notifications.getUnreadCount();
      return response.data;
    },
    refetchInterval: 10000,
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tickets?search=${searchQuery}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
    setNotificationsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Левая часть - Лого и меню */}
        <div className="navbar-left">
          <button 
            className="navbar-menu-btn"
            onClick={onMenuToggle}
            aria-label="Меню"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          
          <div className="navbar-brand">
            <span className="navbar-brand-icon">🏦</span>
            <h1 className="navbar-brand-text">BankCRM</h1>
            <span className="navbar-brand-version">2.0</span>
          </div>
        </div>

        {/* Центр - Поиск */}
        <div className="navbar-center">
          <form onSubmit={handleSearch} className="navbar-search">
            <FiSearch className="navbar-search-icon" />
            <input
              type="text"
              placeholder="Поиск заявок, чатов... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="navbar-search-clear"
              >
                <FiX size={16} />
              </button>
            )}
          </form>
        </div>

        {/* Правая часть - Действия */}
        <div className="navbar-right">
          {/* Уведомления */}
          <div className="navbar-action-wrapper">
            <button
              className="navbar-action-btn"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Уведомления"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="navbar-badge">{unreadCount}</span>
              )}
            </button>

            {notificationsOpen && (
              <motion.div
                className="navbar-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="navbar-dropdown-header">
                  <h3>Уведомления</h3>
                  <button className="navbar-dropdown-close" onClick={() => setNotificationsOpen(false)}>
                    <FiX size={16} />
                  </button>
                </div>
                <div className="navbar-dropdown-content">
                  {notifications.length === 0 ? (
                    <div className="notification-item empty">
                      <div className="notification-text">Нет уведомлений</div>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => {
                          if (notif.relatedTicketId) {
                            navigate(`/tickets?id=${notif.relatedTicketId}`);
                            setNotificationsOpen(false);
                          }
                        }}
                        style={{ cursor: notif.relatedTicketId ? 'pointer' : 'default' }}
                      >
                        <div className="notification-text">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ru })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="navbar-dropdown-footer">
                  <button className="navbar-dropdown-footer-btn" onClick={handleViewAllNotifications}>
                    Посмотреть все
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Переключатель темы */}
          <ThemeToggle />

          {/* Профиль пользователя */}
          <div className="navbar-action-wrapper">
            <button
              className="navbar-profile-btn"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="Профиль"
            >
              <div className="navbar-profile-avatar">
                {user?.avatar || 'U'}
              </div>
              <div className="navbar-profile-info">
                <span className="navbar-profile-name">{user?.username || 'Пользователь'}</span>
                <span className="navbar-profile-role">{user?.role || 'Оператор'}</span>
              </div>
            </button>

            {profileMenuOpen && (
              <motion.div
                className="navbar-dropdown navbar-dropdown-right"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="navbar-dropdown-content">
                  <button className="navbar-dropdown-item">
                    <FiUser size={18} />
                    <span>Мой профиль</span>
                  </button>
                  <button className="navbar-dropdown-item">
                    <FiSettings size={18} />
                    <span>Настройки</span>
                  </button>
                  <div className="navbar-dropdown-divider"></div>
                  <button 
                    className="navbar-dropdown-item navbar-dropdown-item-danger"
                    onClick={logout}
                  >
                    <FiLogOut size={18} />
                    <span>Выйти</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
