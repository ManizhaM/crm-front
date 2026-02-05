import React from 'react';
import './Badge.css';

export const ChatStatusBadge = ({ status, size = 'md' }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 1: // Pending
      case 'Pending':
        return { label: 'Ожидает', className: 'badge-warning' };
      case 2: // Assigned
      case 'Assigned':
        return { label: 'Назначен', className: 'badge-info' };
      case 3: // Active
      case 'Active':
        return { label: 'Активный', className: 'badge-success' };
      case 4: // Completed
      case 'Completed':
        return { label: 'Завершен', className: 'badge-secondary' };
      case 5: // Archived
      case 'Archived':
        return { label: 'Архивирован', className: 'badge-secondary' };
      default:
        return { label: 'Неизвестен', className: 'badge-secondary' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`badge ${config.className} badge-${size}`}>
      {config.label}
    </span>
  );
};

export default ChatStatusBadge;