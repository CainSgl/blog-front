<template>
  <a-drawer :visible="authStore.showLoginModal" placement="bottom" :height="'100vh'"
    :mask-closable="authStore.allowClose" :closable="false" :hide-cancel="true" :footer="false" :header="false"
    @close="authStore.closeLogin" :wrap-style="{ padding: 0, margin: 0 }"
    :body-style="{ padding: 0, margin: 0, overflow: 'hidden' }">
    <div class="login-modal" v-if="authStore.showLoginModal">
      <!-- 渐变背景组件 - 仅在模态框显示时渲染 -->
      <GradientBackground v-if="authStore.showLoginModal" :has-border-radius="!isMobile" />

      <!-- 关闭按钮 - 移动到右上角 -->
      <div v-if="authStore.allowClose" class="close-button">
        <a-button type="text" shape="circle" size="large" @click="authStore.closeLogin">
          <template #icon>
            <IconClose />
          </template>
        </a-button>
      </div>

      <!-- 右侧登录区域 -->
      <div class="login-right">
        <div class="login-content">
          <div class="login-title">登录</div>
          <a-tabs v-model:active-key="activeTab" size="large">
            <a-tab-pane key="password" title="密码登录">
              <PasswordLogin :is-loading="authStore.isLoading" @login-success="handleLoginSuccess" />

            </a-tab-pane>

            <a-tab-pane key="code" title="验证码登录">
              <CodeLogin :is-loading="authStore.isLoading" @login-success="handleLoginSuccess" />
            </a-tab-pane>
          </a-tabs>
          <a-link>
            用户协议
          </a-link>
          <a-link :href="registerUrl">
            立即注册
          </a-link>
          <div>
            <ThirdPartyLogin></ThirdPartyLogin>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import {computed, defineAsyncComponent, onMounted, onUnmounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '@/store/auth';
import {IconClose} from '@arco-design/web-vue/es/icon';
import PasswordLogin from './children/PasswordLogin.vue';
import CodeLogin from './children/CodeLogin.vue';
import ThirdPartyLogin from './children/third/ThirdPartyLogin.vue';
// 懒加载 GradientBackground，延迟加载 three.js
const GradientBackground = defineAsyncComponent(() =>
  import('./children/common/GradientBackground.vue')
);

const router = useRouter();
const authStore = useAuthStore();

// 标签页控制
const activeTab = ref('password');

// 检测是否为移动端
const isMobile = ref(window.innerWidth <= 768);

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 生成注册链接，带上当前页面URL作为returnUrl
const registerUrl = computed(() => {
  const currentUrl = encodeURIComponent(window.location.href);
  return `/register?returnUrl=${currentUrl}`;
});

// 处理登录成功
const handleLoginSuccess = () => {
  // 登录成功后刷新页面
  console.log('登录成功');
  window.location.reload();
};


</script>

<style scoped lang="less">
@import "@/assets/style/global.less";

.login-modal {
  height: 100%;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 关闭按钮 - 定位在右上角 */
.close-button {
  position: absolute;
  top: @size-5;
  right: @size-5;
  z-index: 10;
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
  background: @color-bg-white;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
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

.login-title {
  font-weight: @font-weight-600;
  color: @color-text-1;
  margin-bottom: 24px;
  font-size: 24px;
  text-align: center;
}

:deep(.arco-form) {
  width: 100%;
  max-width: 400px;
}

/* 修复输入框焦点导致的布局跳动问题 */
:deep(.arco-input-wrapper),
:deep(.arco-input) {
  transition: none;
}

/* 确保标签页容器不会因为内容变化而跳动 */
:deep(.arco-tabs) {
  width: 100%;
  max-width: 400px;
}

:deep(.arco-tabs-content) {
  min-height: 200px;
}

/* 标签页样式 */
:deep(.arco-tabs-tab) {
  color: @color-text-2;
  font-size: @font-size-body-3;

  &:hover {
    color: @primary-6;
  }
}

:deep(.arco-tabs-tab-active) {
  color: @primary-6;
}

:deep(.arco-tabs-ink-bar) {
  background-color: @primary-6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-modal {
    display: block;
  }

  /* 背景占满整个屏幕 */
  :deep(.character-flow-background) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: 100%;
    flex: none;
    z-index: 1;
  }

  /* 登录区域叠加在背景上 */
  .login-right {
    position: absolute;
    inset: 0;
    background: transparent;
    z-index: 2;
  }

  .login-content {
    padding: @size-5;
    background: fade(@color-bg-white, 95%);
    border-radius: @size-4;
    margin: @size-5;
    box-shadow: 0 8px 32px fade(@color-text-1, 10%);
    backdrop-filter: blur(10px);
  }

  .login-title {
    color: @color-text-1;
  }

  :deep(.arco-tabs-tab) {
    color: @color-text-2;
  }

  :deep(.arco-tabs-tab-active) {
    color: @primary-6;
  }
}
</style>