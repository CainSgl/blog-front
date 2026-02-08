import { defineStore } from 'pinia';

export const useRequestProgressStore = defineStore('requestProgress', {
  state: () => ({
    total: 0,        // 总请求数
    completed: 0,    // 已完成请求数
    simulated: 0,    // 模拟进度（0-0.99之间）
  }),

  getters: {
    // 实际进度百分比
    progress: (state) => {
      if (state.total === 0) return 0;
      const realProgress = state.completed / state.total;
      const currentProgress = (state.completed + state.simulated) / state.total;
      return Math.min(currentProgress * 100, 100);
    },
    
    // 是否显示进度条
    isLoading: (state) => state.total > 0 && state.completed < state.total,
  },

  actions: {
    // 开始一个新请求
    startRequest() {
      this.total++;
      this.simulated = 0;
      this.startSimulation();
    },

    // 完成一个请求
    completeRequest() {
      this.completed++;
      this.simulated = 0;
      
      // 如果全部完成，重置
      if (this.completed >= this.total) {
        setTimeout(() => {
          this.reset();
        }, 300);
      } else {
        // 继续模拟下一个请求
        this.startSimulation();
      }
    },

    // 模拟进度增长
    startSimulation() {
      if (this.completed >= this.total) return;
      
      const interval = setInterval(() => {
        if (this.completed >= this.total || this.simulated >= 0.99) {
          clearInterval(interval);
          return;
        }
        
        // 模拟进度缓慢增长，最多到 0.99
        const increment = Math.random() * 0.1;
        this.simulated = Math.min(this.simulated + increment, 0.99);
      }, 300);
    },

    // 重置状态
    reset() {
      this.total = 0;
      this.completed = 0;
      this.simulated = 0;
    },
  },
});
