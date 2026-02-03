import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false
  }),
  
  actions: {
    toggleTheme() {
      this.isDark = !this.isDark;
      this.applyTheme();
    },
    
    setTheme(theme) {
      // theme 可以是 'dark', 'auto', 或空字符串/null（浅色）
      if (theme === 'dark') {
        this.isDark = true;
      } else if (theme === 'auto') {
        // 跟随系统
        this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        // 浅色或默认
        this.isDark = false;
      }
      this.applyTheme();
    },
    
    applyTheme() {
      if (this.isDark) {
        document.body.setAttribute('arco-theme', 'dark');
      } else {
        document.body.removeAttribute('arco-theme');
      }
    },
    
    initTheme() {
      // 优先从 userSettings 读取主题设置
      try {
        const userSettings = localStorage.getItem('userSettings');
        if (userSettings) {
          const settings = JSON.parse(userSettings);
          if (settings.theme) {
            this.setTheme(settings.theme);
            return;
          }
        }
      } catch (error) {
        console.error('读取用户设置主题失败:', error);
      }
      
      // 降级：从旧的 theme 键读取
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.setTheme(savedTheme);
      } else {
        // 默认浅色
        this.applyTheme();
      }
    }
  }
});
