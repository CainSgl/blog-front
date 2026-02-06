import {createApp} from 'vue';
import {createPinia} from 'pinia';
import App from './App.vue';
import router from './router';
import '@arco-design/web-vue/dist/arco.css';
import './assets/style/global.less';
import './assets/style/pwa-titlebar.css';

// 注册 PWA Service Worker
import { registerSW } from 'virtual:pwa-register';

// 导入 PWA 链接处理器
import { initPWALinkHandler } from './utils/pwaLinkHandler';

// 导入 PWA 诊断工具（开发环境）
if (import.meta.env.DEV) {
  import('./utils/pwaDiagnostics');
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.config.errorHandler = (err, instance, info) => 
{
  console.error('全局异常:', err, '组件:', instance, '位置:', info);
};

window.addEventListener('unhandledrejection', (event) => 
{
  console.error('全局Promise异常:', event.reason);
  event.preventDefault(); // 阻止浏览器默认报错提示
});

app.mount('#app');

// 初始化 PWA 链接拦截器（在应用挂载后）
// 开发环境启用调试
initPWALinkHandler({
  debug: import.meta.env.DEV,
  showNotification: false
});

// 注册 Service Worker（在应用挂载后）
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('发现新版本，准备更新...');
    },
    onOfflineReady() {
      console.log('应用已准备好离线使用');
    },
    onRegistered(registration) {
      console.log('Service Worker 注册成功');
      // 每小时检查一次更新
      setInterval(() => {
        registration?.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('Service Worker 注册失败:', error);
    }
  });
}

