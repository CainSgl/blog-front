<template>
  <router-view />
  <LoginModal v-if="authStore.showLoginModal" />
</template>

<script setup>
import {defineAsyncComponent} from 'vue';
import {useAuthStore} from '@/store/auth';
import {useThemeStore} from '@/store/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();

// 初始化主题
themeStore.initTheme();

// 懒加载 LoginModal，只在需要时才加载 three.js 等重资源
const LoginModal = defineAsyncComponent(() => 
  import('@/components/loginModal/LoginModal.vue')
);

</script>

<style>
</style>
