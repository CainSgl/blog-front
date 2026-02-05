<template>
  <a-modal
    v-model:visible="showPrompt"
    :footer="false"
    :closable="false"
    :mask-closable="false"
    :width="420"
    modal-class="pwa-install-modal"
    unmount-on-close
  >
    <template #title>
      <div class="modal-header">
        <a-avatar :size="48" shape="square">
          <img src="@/assets/icon2.webp" alt="App Icon" />
        </a-avatar>
        <div class="header-text">
          <h3>安装到桌面</h3>
          <p>获得更好的使用体验</p>
        </div>
      </div>
    </template>
    
    <div class="modal-content">
      <a-space direction="vertical" :size="12" fill>
        <a-alert type="info" :show-icon="false">
          将网站添加到桌面，像原生应用一样使用
        </a-alert>
        
        <div class="features-grid">
          <div class="feature-item">
            <icon-thunderbolt :size="20" />
            <span>更快加载</span>
          </div>
          <div class="feature-item">
            <icon-mobile :size="20" />
            <span>离线访问</span>
          </div>
          <div class="feature-item">
            <icon-apps :size="20" />
            <span>全屏体验</span>
          </div>
          <div class="feature-item">
            <icon-notification :size="20" />
            <span>消息推送</span>
          </div>
        </div>
      </a-space>
    </div>

    <template #footer>
      <div class="modal-footer">
        <a-space :size="8">
          <a-button type="text" size="small" @click="neverShow">
            不再提示
          </a-button>
          <a-button @click="dismiss">
            稍后
          </a-button>
          <a-button type="primary" @click="install">
            <template #icon>
              <icon-download />
            </template>
            立即安装
          </a-button>
        </a-space>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  IconThunderbolt, 
  IconMobile, 
  IconApps, 
  IconNotification,
  IconDownload 
} from '@arco-design/web-vue/es/icon';

const showPrompt = ref(false);
let deferredPrompt = null;

onMounted(() => {
  // 监听浏览器的安装提示事件
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 检查用户是否永久拒绝
    const neverShow = localStorage.getItem('pwa-install-never');
    if (neverShow === 'true') {
      return;
    }
    
    // 检查用户是否之前拒绝过
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const now = Date.now();
    
    // 如果用户拒绝过，7天后再显示
    if (!dismissed || now - dismissedTime > 7 * 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        showPrompt.value = true;
      }, 3000); // 3秒后显示提示
    }
  });

  // 监听安装成功事件
  window.addEventListener('appinstalled', () => {
    showPrompt.value = false;
    deferredPrompt = null;
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-never');
    console.log('PWA 安装成功！');
  });
});

const install = async () => {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('用户接受了安装');
  } else {
    console.log('用户拒绝了安装');
  }
  
  deferredPrompt = null;
  showPrompt.value = false;
};

const dismiss = () => {
  showPrompt.value = false;
  localStorage.setItem('pwa-install-dismissed', Date.now().toString());
};

const neverShow = () => {
  showPrompt.value = false;
  localStorage.setItem('pwa-install-never', 'true');
};
</script>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0;
}

.header-text h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.header-text p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--color-text-3);
  font-weight: normal;
}

.modal-content {
  padding: 8px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-fill-2);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-2);
  transition: all 0.2s;
}

.feature-item:hover {
  background: var(--color-fill-3);
  transform: translateY(-2px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 0 0;
}

:deep(.arco-modal-header) {
  border-bottom: 1px solid var(--color-border-2);
}

:deep(.arco-modal-footer) {
  border-top: 1px solid var(--color-border-2);
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
