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
    New: { variant: 'info', label: 'Новая', icon: '🔵' },
    InProgress: { variant: 'warning', label: 'В работе', icon: '🟡' },
    WaitingForClient: { variant: 'secondary', label: 'Ждем клиента', icon: '🟠' },
    Resolved: { variant: 'success', label: 'Решена', icon: '🟢' },
    Closed: { variant: 'default', label: 'Закрыта', icon: '⚪' },
    Escalated: { variant: 'danger', label: 'Эскалирована', icon: '🔴' }
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
