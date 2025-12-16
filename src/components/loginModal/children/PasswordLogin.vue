<template>
  <a-form :model="loginForm" @submit="handleLogin">
    <a-form-item field="username" label="用户名">
      <a-input
        v-model="loginForm.username"
        placeholder="请输入用户名"
        size="large"
        allow-clear
      />
    </a-form-item>
    
    <a-form-item field="password" label="密码">
      <a-input
        v-model="loginForm.password"
        type="password"
        placeholder="请输入密码"
        size="large"
        :allow-clear="false"
      />
    </a-form-item>
    
    <a-form-item>
      <a-button
        type="primary"
        size="large"
        long
        :loading="isLoading"
        @click="handleLogin"
      >
        登录
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { reactive } from 'vue';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();

// 定义组件属性
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['login-success']);

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
});

// 处理登录
const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    return;
  }
  
  const result = await authStore.login(loginForm);
  if (result.success) {
    // 清空表单
    loginForm.username = '';
    loginForm.password = '';
    // 发送登录成功事件
    emit('login-success');
  }
};
</script>

<style scoped>
/* 隐藏所有可能的眼睛图标 */
:deep(input[type="password"]) {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

:deep(input::-ms-reveal) {
  display: none;
}

:deep(input::-webkit-credentials-auto-fill-button) {
  display: none !important;
}

:deep(.arco-input-password-icon) {
  display: none !important;
}
</style>