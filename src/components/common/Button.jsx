import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import './Button.css';

/**
 * Универсальный компонент кнопки
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className,
  ...rest
}) => {
  const buttonClasses = clsx(
    'button',
    `button-${variant}`,
    `button-${size}`,
    {
      'button-disabled': disabled,
      'button-loading': loading,
      'button-full-width': fullWidth,
      'button-with-icon': icon,
    },
    className
  );

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      type={type}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...rest}
    >
      {loading && (
        <span className="button-spinner">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle
              className="spinner-circle"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        </span>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="button-icon button-icon-left">{icon}</span>
      )}
      
      <span className="button-text">{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="button-icon button-icon-right">{icon}</span>
      )}
    </motion.button>
  );
};

export default Button;
