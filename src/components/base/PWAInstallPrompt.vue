<template>
  <!-- 完整的 PWA 安装区域 -->
  <div class="pwa-section">
    <div class="pwa-info">
      <icon-apps :size="24" :style="{ color: canInstall ? 'var(--color-text-2)' : 'var(--color-text-4)' }" />
      <div>
        <div class="pwa-title">安装桌面应用</div>
        <div class="pwa-desc">{{ statusMessage }}</div>
      </div>
    </div>
    <a-button
      v-if="canInstall"
      type="primary"
      @click="handleInstall"
    >
      <template #icon>
        <icon-download />
      </template>
      安装应用
    </a-button>
    <a-tag v-else :color="isInstalled ? 'green' : 'gray'">
      {{ isInstalled ? '已安装' : '不可用' }}
    </a-tag>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { IconDownload, IconApps } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';

const canInstall = ref(false);
const isInstalled = ref(false);
let deferredPrompt = null;

// 状态提示信息
const statusMessage = computed(() => {
  if (canInstall.value) {
    return '将网站安装到桌面，获得更快的加载速度和离线访问能力';
  }
  if (isInstalled.value) {
    return '应用已安装到您的设备上';
  }
  return '当前浏览器不支持 PWA 安装，或需要通过浏览器菜单手动安装';
});

const handleBeforeInstallPrompt = (e) => {
  e.preventDefault();
  deferredPrompt = e;
  canInstall.value = true;
  console.log('PWA 可安装，已捕获安装提示事件');
};

const handleAppInstalled = () => {
  canInstall.value = false;
  isInstalled.value = true;
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
    await deferredPrompt.prompt();
    
    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      Message.success('开始安装应用...');
    } else {
      Message.info('已取消安装');
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
    isInstalled.value = true;
    canInstall.value = false;
    console.log('PWA 已安装，不显示安装按钮');
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

<style lang="less" scoped>
.pwa-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--color-fill-2);
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
  transition: all 0.3s ease;

  .pwa-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    .pwa-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
      margin-bottom: 4px;
    }

    .pwa-desc {
      font-size: 12px;
      color: var(--color-text-3);
      line-height: 1.5;
      max-width: 400px;
    }
  }
}
</style>
