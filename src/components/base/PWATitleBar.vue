<template>
  <div v-if="isPWA" class="pwa-title-bar" :style="titleBarStyle">
    <div class="title-bar-drag-region">
      <div class="app-info">
        <img src="@/assets/icon2.webp" alt="Logo" class="app-icon" />
        <span class="app-title">{{ pageTitle }}</span>
      </div>
    </div>
    <div class="title-bar-controls">
      <a-button 
        type="text" 
        size="small" 
        @click="goBack" 
        v-if="canGoBack"
        class="control-btn"
      >
        <template #icon>
          <icon-left />
        </template>
      </a-button>
      <a-button 
        type="text" 
        size="small" 
        @click="goForward" 
        v-if="canGoForward"
        class="control-btn"
      >
        <template #icon>
          <icon-right />
        </template>
      </a-button>
      <a-button 
        type="text" 
        size="small" 
        @click="reload"
        class="control-btn"
      >
        <template #icon>
          <icon-refresh />
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconLeft, IconRight, IconRefresh } from '@arco-design/web-vue/es/icon';

const route = useRoute();
const router = useRouter();

const isPWA = ref(false);
const canGoBack = ref(false);
const canGoForward = ref(false);

// 检测是否在 PWA 模式下运行
onMounted(() => {
  isPWA.value = window.matchMedia('(display-mode: standalone)').matches ||
                window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                window.navigator.standalone === true;
  
  updateNavigationState();
});

// 监听路由变化更新导航状态
watch(() => route.path, () => {
  updateNavigationState();
});

const updateNavigationState = () => {
  canGoBack.value = window.history.length > 1;
  // canGoForward 需要通过其他方式判断，这里简化处理
  canGoForward.value = false;
};

const pageTitle = computed(() => {
  return route.meta.title || 'cainsgl的小站';
});

const titleBarStyle = computed(() => {
  // 如果支持 window-controls-overlay，使用环境变量
  if (CSS.supports('top: env(titlebar-area-height)')) {
    return {
      height: 'env(titlebar-area-height, 40px)',
      backgroundColor: 'var(--color-bg-1)',
    };
  }
  return {
    height: '40px',
    backgroundColor: 'var(--color-bg-1)',
  };
});

const goBack = () => {
  router.back();
};

const goForward = () => {
  router.forward();
};

const reload = () => {
  window.location.reload();
};
</script>

<style scoped>
.pwa-title-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border-2);
  z-index: 1000;
  backdrop-filter: blur(10px);
  -webkit-app-region: drag;
}

.title-bar-drag-region {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: drag;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: cover;
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-1);
  user-select: none;
}

.title-bar-controls {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.control-btn {
  -webkit-app-region: no-drag;
}

/* 为页面内容添加顶部间距 */
:global(body.pwa-mode) {
  padding-top: 40px;
}

/* 支持 window-controls-overlay 时的样式 */
@supports (top: env(titlebar-area-height)) {
  .pwa-title-bar {
    left: env(titlebar-area-x, 0);
    width: env(titlebar-area-width, 100%);
  }
}
</style>
