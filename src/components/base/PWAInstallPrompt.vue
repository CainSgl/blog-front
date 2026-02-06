<template>
  <!-- 只在支持 PWA 安装时显示按钮 -->
  <a-button
    v-if="canInstall"
    v-bind="$attrs"
    @click="handleInstall"
  >
    <template #icon>
      <icon-download />
    </template>
    <slot>安装应用</slot>
  </a-button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { IconDownload } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';

const canInstall = ref(false);
let deferredPrompt = null;

const handleBeforeInstallPrompt = (e) => {
  deferredPrompt = e;
  canInstall.value = true;
};

const handleAppInstalled = () => {
  canInstall.value = false;
  deferredPrompt = null;
  Message.success('应用安装成功！');
};

const handleInstall = async () => {
  if (!deferredPrompt) {
    Message.info('请使用浏览器的安装功能');
    return;
  }

  try {
    // 显示安装提示
    deferredPrompt.prompt();
    
    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      Message.success('开始安装应用...');
    }
    
    // 清理
    deferredPrompt = null;
    canInstall.value = false;
  } catch (error) {
    console.error('安装失败:', error);
    Message.error('安装失败，请稍后重试');
  }
};

onMounted(() => {
  // 检查是否已经安装
  if (window.matchMedia('(display-mode: standalone)').matches) {
    canInstall.value = false;
    return;
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
});

// 暴露安装方法，供父组件调用
defineExpose({
  install: handleInstall,
  canInstall
});
</script>
