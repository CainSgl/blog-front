<template>
  <a-drawer
    :visible="authStore.showLoginModal"
    placement="bottom"
    :height="'100vh'"
    :mask-closable="false"
    :closable="false"
    :hide-cancel="true"
    :footer="false"
    :header="false"
    @close="authStore.closeLogin"
    :wrap-style="{ padding: 0, margin: 0 }"
    :body-style="{ padding: 0, margin: 0, overflow: 'hidden' }"
  >
    <div class="login-modal">
      <!-- 渐变背景组件 -->
      <GradientBackground />
      
      <!-- 右侧登录区域 -->
      <div class="login-right">
        <div class="login-header">
          <h2>登录</h2>
          <a-button
            type="text"
            shape="circle"
            size="large"
            @click="authStore.closeLogin"
          >
            <template #icon>
              <IconClose />
            </template>
          </a-button>
        </div>
        
        <div class="login-content">
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
              <a-input-password
                v-model="loginForm.password"
                placeholder="请输入密码"
                size="large"
                allow-clear
              />
            </a-form-item>
            
            <a-form-item>
              <a-button
                type="primary"
                size="large"
                long
                :loading="authStore.isLoading"
                @click="handleLogin"
              >
                登录
              </a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { reactive } from 'vue';
import { useAuthStore } from '@/store/auth';
import { IconClose } from '@arco-design/web-vue/es/icon';
import GradientBackground from './children/GradientBackground.vue';

const authStore = useAuthStore();

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
});

// 处理登录
const handleLogin = async () => 
{
  if (!loginForm.username || !loginForm.password) 
  {
    return;
  }
  
  const result = await authStore.login(loginForm);
  if (result.success) 
  {
    // 清空表单
    loginForm.username = '';
    loginForm.password = '';
  }
};
</script>

<style scoped>
.login-modal {
  height: 100%;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 渐变背景区域 */
:deep(.character-flow-background) {
  flex: 0 0 50%;
  max-width: 50%;
  z-index: 1;
}

/* 右侧登录区域 */
.login-right {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 24px 32px;
  border-bottom: 1px solid var(--color-border);
}

.login-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-1);
}

.login-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

:deep(.arco-form) {
  width: 100%;
  max-width: 400px;
}
</style>