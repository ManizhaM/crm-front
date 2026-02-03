import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store для управления темой приложения
 */
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // 'light' | 'dark'
      
      // Переключение темы
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        return { theme: newTheme };
      }),
      
      // Установка конкретной темы
      setTheme: (theme) => set(() => {
        document.documentElement.setAttribute('data-theme', theme);
        return { theme };
      }),
      
      // Инициализация темы при загрузке
      initTheme: () => set((state) => {
        const savedTheme = state.theme || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        return { theme: savedTheme };
      })
    }),
    {
      name: 'theme-storage', // ключ в localStorage
    }
  )
);
