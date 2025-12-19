import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import './assets/style/global.less';
import VMdEditor from '@kangc/v-md-editor';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import '@kangc/v-md-editor/lib/theme/style/github.css';
const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ArcoVue);
app.use(VMdEditor);
app.config.errorHandler = (err, instance, info) => {
  console.error('全局异常:', err, '组件:', instance, '位置:', info);
};
window.addEventListener('unhandledrejection', (event) => {
  console.error('全局Promise异常:', event.reason);
  event.preventDefault(); // 阻止浏览器默认报错提示
});
app.mount('#app');
