<template>
  <a-trigger
    trigger="hover"
    :position="triggerPosition"
    :popup-offset="20"
    :show-arrow="false"
    :auto-fit-position="true"
    :mouse-enter-delay="0"
    v-model:popup-visible="popupVisible"
    @popup-visible-change="handleVisibleChange"
  >
    <slot />
    <template #content>
      <div class="history-preview">
        <div class="preview-header">
          <span>最近浏览</span>
        </div>
        <div class="preview-list">
          <div v-if="loading" class="loading-container">
            <a-spin />
          </div>
          <div v-else-if="historyList.length === 0" class="empty-container">
            <span>暂无浏览历史</span>
          </div>
          <div
            v-else
            v-for="item in historyList.slice(0, 5)"
            :key="item.id"
            class="preview-item"
            @click="goToPost(item.postId)"
          >
            <div class="item-content">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-time">{{ formatTime(item.browseTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </a-trigger>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/index.js';

const router = useRouter();
const historyList = ref([]);
const popupVisible = ref(false);
const loading = ref(false);
const windowWidth = ref(window.innerWidth);

// 根据屏幕宽度动态调整弹出位置
const triggerPosition = computed(() => {
  // 在小屏幕或者窗口较窄时，使用 bl (bottom-left) 位置
  // 这样弹出框会向左对齐，避免超出屏幕
  if (windowWidth.value < 768) {
    return 'bl';
  }
  return 'bottom';
});

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// 加载历史记录
const loadHistory = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/post/view/history', { limit: 5 });
    historyList.value = data.items || [];
  } catch (error) {
    console.error('加载历史记录失败:', error);
    historyList.value = [];
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}-${date.getDate()}`;
  }
};

// 在新窗口打开文章
const goToPost = (postId) => {
  const fullPath = router.resolve(`/p/${postId}`).href;
  window.open(fullPath, '_blank');
  popupVisible.value = false;
};

// 处理弹出框显示状态变化
const handleVisibleChange = (visible) => {
  if (visible && historyList.value.length === 0 && !loading.value) {
    loadHistory();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="less">
.history-preview {
  width: 260px;
  max-height: 400px;
  background-color: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  
  .preview-header {
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-border-2);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-neutral-10);
  }
  
  .preview-list {
    max-height: 350px;
    overflow-y: auto;
    
    .loading-container,
    .empty-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px 20px;
      color: var(--color-neutral-6);
      font-size: 13px;
    }
    
    .preview-item {
      padding: 10px 14px;
      cursor: pointer;
      transition: background-color 0.2s;
      border-bottom: 1px solid var(--color-border-1);
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background-color: var(--color-fill-2);
      }
      
      .item-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        .item-title {
          font-size: 13px;
          color: var(--color-neutral-10);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .item-time {
          font-size: 11px;
          color: var(--color-neutral-6);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .history-preview {
    width: 240px;
    max-height: 300px;
    
    .preview-list {
      max-height: 250px;
    }
  }
}
</style>
