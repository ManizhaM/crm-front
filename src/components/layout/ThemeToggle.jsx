import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useThemeStore } from '../../store/themeStore';
import './ThemeToggle.css';

/**
 * Компонент переключения темы
 */
const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.button
      className={`theme-toggle ${className || ''}`}
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Переключить тему"
      title={isDark ? 'Светлая тема' : 'Темная тема'}
    >
      <motion.div
        className="theme-toggle-track"
        animate={{
          background: isDark 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        }}
      >
        <motion.div
          className="theme-toggle-thumb"
          animate={{
            x: isDark ? 28 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
        >
          {isDark ? (
            <FiMoon className="theme-icon" />
          ) : (
            <FiSun className="theme-icon" />
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
