import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

/**
 * Store для управления аутентификацией и разрешениями
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: null, // Объект с разрешениями пользователя
      
      // Вход в систему
      login: async (userData, token) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        set({
          user: {
            ...userData,
            avatar: userData.username?.charAt(0).toUpperCase() || 'U'
          },
          token,
          isAuthenticated: true
        });

        // Загрузить разрешения пользователя
        await get().loadPermissions();
      },
      
      // Выход из системы
      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          permissions: null
        });
      },
      
      // Обновление данных пользователя
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      // Проверка токена
      checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user: {
                ...user,
                avatar: user.username?.charAt(0).toUpperCase() || 'U'
              },
              token,
              isAuthenticated: true
            });

            // Загрузить разрешения
            await get().loadPermissions();
            return true;
          } catch (error) {
            console.error('Ошибка при восстановлении сессии:', error);
            get().logout();
            return false;
          }
        }
        return false;
      },

      // Загрузить разрешения пользователя с сервера
      loadPermissions: async () => {
        try {
          const response = await api.users.getMyPermissions();
          const permissionsData = response.data;
          
          localStorage.setItem('permissions', JSON.stringify(permissionsData));
          set({ permissions: permissionsData });
          
          return permissionsData;
        } catch (error) {
          console.error('Ошибка при загрузке разрешений:', error);
          // Если не удалось загрузить, попробовать из локального хранилища
          const cachedPermissions = localStorage.getItem('permissions');
          if (cachedPermissions) {
            try {
              const permissions = JSON.parse(cachedPermissions);
              set({ permissions });
            } catch (e) {
              console.error('Ошибка при парсинге кэшированных разрешений:', e);
            }
          }
          return null;
        }
      },

      // Проверить разрешение
      hasPermission: (resource, action) => {
        const { permissions } = get();
        if (!permissions || !permissions.permissionsByResource) {
          return false;
        }

        const resourcePerms = permissions.permissionsByResource[resource];
        if (!resourcePerms) {
          return false;
        }

        switch (action) {
          case 'view':
            return resourcePerms.canView;
          case 'create':
            return resourcePerms.canCreate;
          case 'edit':
            return resourcePerms.canEdit;
          case 'delete':
            return resourcePerms.canDelete;
          default:
            return resourcePerms.customActions?.includes(action) || false;
        }
      },

      // Проверить доступ к ресурсу
      canAccessResource: (resource) => {
        return get().hasPermission(resource, 'view');
      }
    }),
    {
      name: 'auth-storage',
      // Не сохраняем permissions в persist, загружаем с сервера
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
