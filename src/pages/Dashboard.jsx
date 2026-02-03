import { motion } from 'framer-motion';
import { 
  FiClipboard, 
  FiClock, 
  FiCheckCircle, 
  FiTrendingUp,
  FiUsers,
  FiMessageSquare 
} from 'react-icons/fi';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell 
} from 'recharts';
import './Dashboard.css';

/**
 * Главная страница дашборда с аналитикой
 */
const Dashboard = () => {
  // Данные для карточек статистики
  const stats = [
    {
      id: 1,
      title: 'Всего заявок',
      value: '234',
      change: '+12%',
      trend: 'up',
      icon: <FiClipboard />,
      color: 'primary'
    },
    {
      id: 2,
      title: 'В работе',
      value: '42',
      change: '+5%',
      trend: 'up',
      icon: <FiClock />,
      color: 'warning'
    },
    {
      id: 3,
      title: 'Решено сегодня',
      value: '18',
      change: '+8%',
      trend: 'up',
      icon: <FiCheckCircle />,
      color: 'success'
    },
    {
      id: 4,
      title: 'Средн. время',
      value: '15м',
      change: '-3м',
      trend: 'up',
      icon: <FiTrendingUp />,
      color: 'info'
    },
  ];

  // Данные для графика заявок
  const ticketsData = [
    { name: 'Пн', value: 45 },
    { name: 'Вт', value: 52 },
    { name: 'Ср', value: 48 },
    { name: 'Чт', value: 61 },
    { name: 'Пт', value: 55 },
    { name: 'Сб', value: 38 },
    { name: 'Вс', value: 28 },
  ];

  // Данные для распределения по статусам
  const statusData = [
    { name: 'Новые', value: 25, color: '#3b82f6' },
    { name: 'В работе', value: 42, color: '#f59e0b' },
    { name: 'Решены', value: 156, color: '#10b981' },
    { name: 'Закрыты', value: 87, color: '#6b7280' },
  ];

  // Топ операторов
  const topOperators = [
    { id: 1, name: 'Иван Иванов', tickets: 45, rating: 4.9, avatar: 'И' },
    { id: 2, name: 'Мария Петрова', tickets: 42, rating: 4.8, avatar: 'М' },
    { id: 3, name: 'Петр Сидоров', tickets: 38, rating: 4.7, avatar: 'П' },
    { id: 4, name: 'Анна Смирнова', tickets: 35, rating: 4.6, avatar: 'А' },
    { id: 5, name: 'Дмитрий Козлов', tickets: 32, rating: 4.5, avatar: 'Д' },
  ];

  // Последняя активность
  const recentActivity = [
    { id: 1, type: 'ticket', text: 'Заявка #1234 решена', time: '2 мин назад', user: 'И. Иванов' },
    { id: 2, type: 'chat', text: 'Новое сообщение в чате #5678', time: '5 мин назад', user: 'Клиент' },
    { id: 3, type: 'ticket', text: 'Заявка #9012 назначена', time: '10 мин назад', user: 'М. Петрова' },
    { id: 4, type: 'rating', text: 'Получена оценка 5★', time: '15 мин назад', user: 'Клиент' },
    { id: 5, type: 'ticket', text: 'Создана новая заявка #3456', time: '20 мин назад', user: 'Система' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Дашборд</h1>
          <p className="dashboard-subtitle">Обзор активности за сегодня</p>
        </div>
        <div className="dashboard-actions">
          <button className="dashboard-action-btn">
            <FiMessageSquare />
            <span>Новый чат</span>
          </button>
          <button className="dashboard-action-btn primary">
            <FiClipboard />
            <span>Новая заявка</span>
          </button>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="dashboard-stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            className={`stat-card stat-card-${stat.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-card-icon">{stat.icon}</div>
            <div className="stat-card-content">
              <div className="stat-card-title">{stat.title}</div>
              <div className="stat-card-value">{stat.value}</div>
              <div className={`stat-card-change ${stat.trend}`}>
                <FiTrendingUp size={14} />
                <span>{stat.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Графики */}
      <div className="dashboard-charts-grid">
        {/* График заявок */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="chart-card-header">
            <h3>Заявки за неделю</h3>
            <select className="chart-period-select">
              <option>7 дней</option>
              <option>30 дней</option>
              <option>90 дней</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ticketsData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Распределение по статусам */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="chart-card-header">
            <h3>Распределение по статусам</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Нижняя секция */}
      <div className="dashboard-bottom-grid">
        {/* Топ операторы */}
        <motion.div
          className="info-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="info-card-header">
            <h3>Топ операторы</h3>
            <FiUsers />
          </div>
          <div className="operators-list">
            {topOperators.map((operator, index) => (
              <div key={operator.id} className="operator-item">
                <div className="operator-rank">#{index + 1}</div>
                <div className="operator-avatar">{operator.avatar}</div>
                <div className="operator-info">
                  <div className="operator-name">{operator.name}</div>
                  <div className="operator-stats">
                    {operator.tickets} заявок • ⭐ {operator.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Последняя активность */}
        <motion.div
          className="info-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="info-card-header">
            <h3>Последняя активность</h3>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon activity-icon-${activity.type}`}>
                  {activity.type === 'ticket' && <FiClipboard />}
                  {activity.type === 'chat' && <FiMessageSquare />}
                  {activity.type === 'rating' && <FiCheckCircle />}
                </div>
                <div className="activity-content">
                  <div className="activity-text">{activity.text}</div>
                  <div className="activity-meta">
                    {activity.user} • {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
