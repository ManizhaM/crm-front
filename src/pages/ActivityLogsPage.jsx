import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiFilter, 
  FiDownload, 
  FiRefreshCw, 
  FiCalendar,
  FiUser,
  FiActivity,
  FiClock,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { api } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import './ActivityLogsPage.css';

const ActivityLogsPage = () => {
  // Фильтры
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 50
  });

  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState('logs'); // 'logs' или 'statistics'

  // Загрузка логов
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: async () => {
      const params = {
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: filters.page,
        pageSize: filters.pageSize
      };
    
      const response = await api.activityLogs.getAll(params);
      return response.data;
    },
    refetchInterval: 30000 // Обновление каждые 30 секунд
  });

  // Загрузка статистики
  const { data: statsData } = useQuery({
    queryKey: ['activity-statistics', filters.startDate, filters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/activitylogs/statistics?${params.toString()}`);
      return response.data;
    },
    enabled: activeView === 'statistics'
  });

  // Загрузка доступных действий для фильтра
  const { data: availableActions } = useQuery({
    queryKey: ['available-actions'],
    queryFn: async () => {
      const response = await api.get('/activitylogs/actions');
      return response.data;
    }
  });

  // Загрузка доступных типов сущностей
  const { data: availableEntityTypes } = useQuery({
    queryKey: ['available-entity-types'],
    queryFn: async () => {
      const response = await api.get('/activitylogs/entity-types');
      return response.data;
    }
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Сброс на первую страницу при изменении фильтров
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 50
    });
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      window.open(`${api.defaults.baseURL}/activitylogs/export/csv?${params.toString()}`, '_blank');
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
    }
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      'LOGIN': 'success',
      'LOGOUT': 'secondary',
      'ASSIGN_TICKET': 'info',
      'SEND_MESSAGE': 'primary',
      'CHANGE_STATUS': 'warning',
      'CREATE_TICKET': 'success',
      'UPDATE_TICKET': 'info',
      'DELETE_TICKET': 'danger',
      'ACCEPT_CHAT': 'success',
      'DECLINE_CHAT': 'warning'
    };
    return colors[action] || 'secondary';
  };

  const renderLogs = () => {
    if (isLoading) {
      return (
        <div className="logs-loading">
          <div className="spinner"></div>
          <p>Загрузка логов...</p>
        </div>
      );
    }

    if (!logsData?.data?.length) {
      return (
        <div className="logs-empty">
          <FiActivity size={64} />
          <h3>Логи не найдены</h3>
          <p>Попробуйте изменить параметры фильтрации</p>
        </div>
      );
    }

    return (
      <>
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Тип сущности</th>
                <th>ID сущности</th>
                <th>IP адрес</th>
                <th>Детали</th>
              </tr>
            </thead>
            <tbody>
              {logsData.data.map((log) => (
                <tr key={log.id}>
                  <td className="log-date">
                    <FiClock size={14} />
                    <div>
                      <div>{new Date(log.createdAt).toLocaleString('ru')}</div>
                      <small>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ru })}</small>
                    </div>
                  </td>
                  <td className="log-user">
                    <FiUser size={14} />
                    <div>
                      <div className="user-fullname">{log.userFullName}</div>
                      <small className="user-username">@{log.userName}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {log.entityType && (
                      <span className="badge badge-secondary">{log.entityType}</span>
                    )}
                  </td>
                  <td className="log-entity-id">{log.entityId || '-'}</td>
                  <td className="log-ip">{log.ipAddress || '-'}</td>
              <td className="log-details">
                  {log.details && (
                    <details>
                      <summary>Показать</summary>
                      <pre>{(() => {
                        try {
                          // Пытаемся распарсить как JSON
                          const parsed = JSON.parse(log.details);
                          return JSON.stringify(parsed, null, 2);
                        } catch {
                          // Если не JSON - просто выводим как есть
                          return log.details;
                        }
                      })()}</pre>
                    </details>
                  )}
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        <div className="logs-pagination">
          <div className="pagination-info">
            Показано {((logsData.pagination.currentPage - 1) * logsData.pagination.pageSize) + 1} - {Math.min(logsData.pagination.currentPage * logsData.pagination.pageSize, logsData.pagination.totalCount)} из {logsData.pagination.totalCount}
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => handleFilterChange('page', filters.page - 1)}
              disabled={!logsData.pagination.hasPreviousPage}
            >
              <FiChevronLeft />
            </button>
            <span className="pagination-current">
              Страница {logsData.pagination.currentPage} из {logsData.pagination.totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => handleFilterChange('page', filters.page + 1)}
              disabled={!logsData.pagination.hasNextPage}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderStatistics = () => {
    if (!statsData) {
      return <div className="logs-loading"><div className="spinner"></div></div>;
    }

    return (
      <div className="statistics-grid">
        {/* Общая информация */}
        <div className="stat-card">
          <div className="stat-header">
            <FiActivity />
            <h3>Всего записей</h3>
          </div>
          <div className="stat-value">{statsData.totalLogs.toLocaleString()}</div>
        </div>

        {/* Статистика по действиям */}
        <div className="stat-card stat-card-wide">
          <div className="stat-header">
            <FiBarChart2 />
            <h3>Статистика по действиям</h3>
          </div>
          <div className="stat-list">
            {statsData.actionStatistics.map((stat) => (
              <div key={stat.action} className="stat-item">
                <span className={`badge badge-${getActionBadgeColor(stat.action)}`}>
                  {stat.action}
                </span>
                <div className="stat-bar">
                  <div 
                    className="stat-bar-fill" 
                    style={{ 
                      width: `${(stat.count / statsData.totalLogs) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="stat-count">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Топ пользователей */}
        <div className="stat-card">
          <div className="stat-header">
            <FiUser />
            <h3>Самые активные</h3>
          </div>
          <div className="stat-list">
            {statsData.topUsers.map((user, index) => (
              <div key={user.userId} className="stat-item">
                <div className="user-rank">#{index + 1}</div>
                <div className="user-info">
                  <div className="user-fullname">{user.fullName}</div>
                  <small>@{user.username}</small>
                </div>
                <span className="stat-count">{user.activityCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* График активности по дням */}
        <div className="stat-card stat-card-wide">
          <div className="stat-header">
            <FiCalendar />
            <h3>Активность по дням</h3>
          </div>
          <div className="daily-chart">
            {statsData.dailyActivity.map((day) => {
              const maxCount = Math.max(...statsData.dailyActivity.map(d => d.count));
              const height = (day.count / maxCount) * 100;
              
              return (
                <div key={day.date} className="daily-bar" title={`${new Date(day.date).toLocaleDateString('ru')}: ${day.count}`}>
                  <div className="daily-bar-fill" style={{ height: `${height}%` }}></div>
                  <small>{new Date(day.date).getDate()}</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="activity-logs-page">
      <div className="page-header">
        <div>
          <h1>Логи активности</h1>
          <p>Просмотр всех действий пользователей в системе</p>
        </div>
        <div className="header-actions">
          <button 
            className={`view-toggle ${activeView === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveView('logs')}
          >
            <FiActivity />
            Логи
          </button>
          <button 
            className={`view-toggle ${activeView === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveView('statistics')}
          >
            <FiBarChart2 />
            Статистика
          </button>
        </div>
      </div>

      {activeView === 'logs' && (
        <>
          <div className="filters-bar">
            <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <FiFilter />
              {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
            </button>
            <div className="filters-actions">
              <button className="btn-secondary" onClick={handleClearFilters}>
                Сбросить
              </button>
              <button className="btn-secondary" onClick={() => refetch()}>
                <FiRefreshCw />
                Обновить
              </button>
              <button className="btn-primary" onClick={handleExportCSV}>
                <FiDownload />
                Экспорт CSV
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>ID пользователя</label>
                <input
                  type="number"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  placeholder="Введите ID"
                />
              </div>

              <div className="filter-group">
                <label>Действие</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">Все действия</option>
                  {availableActions?.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Тип сущности</label>
                <select
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                >
                  <option value="">Все типы</option>
                  {availableEntityTypes?.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Начальная дата</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Конечная дата</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Записей на странице</label>
                <select
                  value={filters.pageSize}
                  onChange={(e) => handleFilterChange('pageSize', e.target.value)}
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      <div className="logs-content">
        {activeView === 'logs' ? renderLogs() : renderStatistics()}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
