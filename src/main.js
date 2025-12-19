import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import './assets/style/global.less';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ArcoVue);
app.config.errorHandler = (err, instance, info) => {
  console.error('全局异常:', err, '组件:', instance, '位置:', info);
};
window.addEventListener('unhandledrejection', (event) => {
  console.error('全局Promise异常:', event.reason);
  event.preventDefault(); // 阻止浏览器默认报错提示
});
app.mount('#app');
