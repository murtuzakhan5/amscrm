import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('ams_theme') === 'dark',

  toggleTheme: () => {
    set((state) => {
      const nextDark = !state.isDark;
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ams_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('ams_theme', 'light');
      }
      return { isDark: nextDark };
    });
  },

  initTheme: () => {
    const isDark = localStorage.getItem('ams_theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark });
  },
}));
