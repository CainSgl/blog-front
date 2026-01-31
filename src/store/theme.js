import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false
  }),
  
  actions: {
    toggleTheme() {
      this.isDark = !this.isDark;
      // 立即同步应用主题，不等待响应式更新
      const theme = this.isDark ? 'dark' : 'light';
      if (this.isDark) {
        document.body.setAttribute('arco-theme', 'dark');
      } else {
        document.body.removeAttribute('arco-theme');
      }
      localStorage.setItem('theme', theme);
    },
    
    applyTheme() {
      if (this.isDark) {
        document.body.setAttribute('arco-theme', 'dark');
      } else {
        document.body.removeAttribute('arco-theme');
      }
    },
    
    initTheme() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.isDark = true;
      }
      this.applyTheme();
    }
  }
});
