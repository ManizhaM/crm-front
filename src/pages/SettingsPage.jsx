import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiBell, FiLock, FiGlobe, FiSave } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import './SettingsPage.css';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    notifications: true,
    emailNotifications: true,
  });

  const handleSave = () => {
    updateUser(formData);
    toast.success('Настройки сохранены');
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Настройки</h1>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Профиль
          </button>
          <button
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell /> Уведомления
          </button>
          <button
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
          >
            <FiLock /> Безопасность
          </button>
          <button
            className={activeTab === 'appearance' ? 'active' : ''}
            onClick={() => setActiveTab('appearance')}
          >
            <FiGlobe /> Внешний вид
          </button>
        </div>

        <motion.div className="settings-main" key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Профиль</h2>
              <div className="form-group">
                <label>Имя пользователя</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Роль</label>
                <input type="text" value={user?.role || 'Оператор'} disabled />
              </div>
              <Button variant="primary" icon={<FiSave />} onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Уведомления</h2>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                  />
                  <span>Включить уведомления</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                  />
                  <span>Email уведомления</span>
                </label>
              </div>
              <Button variant="primary" icon={<FiSave />} onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Безопасность</h2>
              <div className="form-group">
                <label>Текущий пароль</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label>Подтвердите пароль</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <Button variant="primary" icon={<FiSave />}>
                Изменить пароль
              </Button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>Внешний вид</h2>
              <div className="form-group">
                <label>Текущая тема</label>
                <p className="theme-current">{theme === 'dark' ? '🌙 Темная' : '☀️ Светлая'}</p>
                <p className="theme-hint">Используйте переключатель в навбаре для смены темы</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
