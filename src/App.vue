<template>
  <RequestProgressBar />
  <router-view />
  <LoginModal v-if="authStore.showLoginModal" />
</template>

<script setup>
import {defineAsyncComponent, onMounted} from 'vue';
import {useAuthStore} from '@/store/auth';
import {useThemeStore} from '@/store/theme';
import {Modal} from '@arco-design/web-vue';
import RequestProgressBar from '@/components/base/RequestProgressBar.vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();

// 初始化主题
themeStore.initTheme();

// 检测 PWA 模式并添加 body class
onMounted(() => {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                window.navigator.standalone === true;
  
  if (isPWA) {
    document.body.classList.add('pwa-mode');
  }

});

// 懒加载 LoginModal，只在需要时才加载 three.js 等重资源
const LoginModal = defineAsyncComponent(() => 
  import('@/components/loginModal/LoginModal.vue')
);


</script>

<style>
</style>
