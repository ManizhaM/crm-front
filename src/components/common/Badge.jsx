import React from 'react';
import clsx from 'clsx';
import './Badge.css';

/**
 * Компонент Badge для отображения статусов и меток
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  className,
  ...rest
}) => {
  const badgeClasses = clsx(
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    {
      'badge-rounded': rounded,
    },
    className
  );

  return (
    <span className={badgeClasses} {...rest}>
      {children}
    </span>
  );
};

/**
 * Badge для статусов заявок с предопределенными цветами
 */
export const StatusBadge = ({ status, ...rest }) => {
  const statusConfig = {
    1: { variant: 'info', label: 'Новая', icon: '🔵' },
    2: { variant: 'warning', label: 'В работе', icon: '🟡' },
    3: { variant: 'secondary', label: 'Ждем клиента', icon: '🟠' },
    4: { variant: 'success', label: 'Решена', icon: '🟢' },
    5: { variant: 'default', label: 'Закрыта', icon: '⚪' },
    6: { variant: 'danger', label: 'Эскалирована', icon: '🔴' }
  };

  const config = statusConfig[status] || statusConfig.New;

  return (
    <Badge variant={config.variant} {...rest}>
      <span className="status-icon">{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
};

export default Badge;
