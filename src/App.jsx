import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Layout
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Components
import RoleBasedRoute from './components/common/RoleBasedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TicketsPage from './pages/TicketsPage';
import ChatsPage from './pages/ChatsPage';
import ReferencesPage from './pages/ReferencesPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserManagementPage from './pages/UserManagementPage';
import OperatorDashboard from './pages/OperatorDashboard';
import ForbiddenPage from './pages/ForbiddenPage';
import RolesManagementPage from './pages/RolesManagementPage';

// Styles
import './styles/globals.css';
import './App.css';

// Create a client для React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

/**
 * Компонент для защищенных роутов
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * Главный компонент приложения
 */
function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Проверка авторизации при загрузке
  useEffect(() => {
    checkAuth();
    initTheme();
  }, [checkAuth, initTheme]);

  // Управление сайдбаром на мобильных
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          {isAuthenticated && (
            <>
              <Navbar 
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                menuOpen={sidebarOpen}
              />
              <Sidebar 
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </>
          )}

          <main className={`main-content ${isAuthenticated ? 'with-sidebar' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Routes>
              {/* Публичные роуты */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              
              {/* Главная страница */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } />
              
              {/* Дашборд - доступен всем */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Панель оператора - доступна всем */}
              <Route path="/operator" element={
                <ProtectedRoute>
                  <OperatorDashboard />
                </ProtectedRoute>
              } />
              
              {/* Заявки - требуется tickets.view */}
              <Route path="/tickets" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="tickets" action="view" showForbidden>
                    <TicketsPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Чаты - требуется chats.view */}
              <Route path="/chats" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="chats" action="view" showForbidden>
                    <ChatsPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Справочники - требуется references.view */}
              <Route path="/references" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="references" action="view" showForbidden>
                    <ReferencesPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Аналитика - требуется analytics.view */}
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="analytics" action="view" showForbidden>
                    <UsersPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Управление пользователями - требуется users.view */}
              <Route path="/user-management" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="users" action="view" showForbidden>
                    <UserManagementPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Управление ролями - требуется roles.view */}
              <Route path="/roles" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="roles" action="view" showForbidden>
                    <RolesManagementPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Уведомления - требуется notifications.view */}
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="notifications" action="view" showForbidden>
                    <NotificationsPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Настройки - требуется settings.view */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <RoleBasedRoute resource="settings" action="view" showForbidden>
                    <SettingsPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          {/* Toast уведомления */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--danger)',
                  secondary: 'white',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
