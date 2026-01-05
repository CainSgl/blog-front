<template>
  <div class="announcement-banner">
    <div class="announcement-header">
      <a-typography-title :heading="5" class="announcement-title-main">公告</a-typography-title>
    </div>
    <a-timeline :reverse="true" :direction="direction" :mode="mode">
      <div v-for="(item, index) in announcements" :key="item.id">
        <a-timeline-item  class="announcement-item" :label="formatDate(item.createdAt)" @click="goToAnnouncement(item)">
          <a-row class="announcement-content">
            <cImg width="100" class="announcement-image" :src="item.img" v-if="item.img" />
            <div class="announcement-text">
              <h3 class="announcement-title">{{ item.title }}</h3>
              <div class="announcement-summary">
                <span>{{ item.summary }}</span>
              </div>
            </div>
          </a-row>
        </a-timeline-item>
      </div>
    </a-timeline>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import cImg from '@/components/base/cImg.vue';
import api from '@/api/index';
// 响应式判断屏幕宽度
const isMobile = ref(window.matchMedia('(max-width: 1024px)').matches);
const direction = computed(() => isMobile.value ? 'horizontal' : 'vertical');
const mode=computed(()=>isMobile.value?'bottom':'bottom')
const handleResize = () => {
  isMobile.value = window.matchMedia('(max-width: 1024px)').matches;
};
const announcements = ref([
]);

onMounted(async () => {
  window.addEventListener('resize', handleResize);
   const {data}= await api.get('/system/announcement')
   announcements.value=data
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});



const formatDate = (dateString) => {
  const now = new Date();
  const targetDate = new Date(dateString);
  const diffMs = now - targetDate;
  const diffSeconds = Math.floor(diffMs / 1000);

  // 超过7天（604800秒）显示日期
  if (diffSeconds > 604800) {
    return targetDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // 7天内：根据时间差返回 "XX前"
  if (diffSeconds < 60) {
    return `${diffSeconds}秒前`;
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}分钟前`;
  } else if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)}小时前`;
  } else {
    return `${Math.floor(diffSeconds / 86400)}天前`;
  }
};

const goToAnnouncement = (item) => {
  console.log(`跳转到公告详情页: ${item}`);
};
</script>

<style lang="less" scoped>

.announcement-banner {
  width: 100%;
}

.announcement-header {
  margin-bottom: 16px;
  padding: 0 16px;
  
  .arco-typography {
    margin: 0;
    font-weight: 600;
    color: #1d2129;
  }
}

.announcement-item {
  padding: 8% 0;
  border-bottom: 1px dashed #e4e7ed;

  &:last-child {
    border-bottom: none;
  }
  
  // 针对水平模式（小屏幕）的样式调整
  :deep(.arco-timeline-item-content) {
    min-height: auto;
  }
  
  :deep(.arco-timeline-item-label) {
    margin-bottom: 8px;
    font-size: 12px;
    color: #86909c;
  }
}

.announcement-content {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    border-color: @primary-6;
    box-shadow: 0 4px 12px 0 rgba(0, 174, 236, 0.15);

    .announcement-image {
      transform: scale(1.05);
    }
  }
  
  // 小屏幕水平布局调整
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
    
    .announcement-image {
      margin-right: 0;
      margin-bottom: 12px;
      width: 100%;
      height: auto;
    }
  }
}

.announcement-image {
  width: 100px;
  height: 67px;
  margin-right: 16px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #eee;
  transition: transform 0.3s ease;
  
  // 小屏幕下图片样式
  @media (max-width: 1024px) {
    width: 100%;
    height: 150px;
    margin-right: 0;
    margin-bottom: 12px;
  }
}

.announcement-text {
  flex: 1;
  
  // 小屏幕下文本区域样式
  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
  }
}

.announcement-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
  line-height: 1.4;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  // 小屏幕下标题样式
  @media (max-width: 1024px) {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    margin: 0 0 6px 0;
    font-size: 14px;
  }
}

.announcement-summary {
  max-height: 45px;
  font-size: 12px;
  color: #4E5969;
  line-height: 1.5;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  
  // 小屏幕下摘要样式
  @media (max-width: 1024px) {
    font-size: 11px;
    max-height: none;
  }
}

// 针对移动端标题和时间线样式调整
@media (max-width: 1024px) {
  .announcement-header {
    margin-bottom: 12px;
    padding: 0 12px;
    
    .arco-typography {
      font-size: 16px;
    }
  }
  
  :deep(.arco-timeline) {
    padding-left: 0;
    
    .arco-timeline-item {
      padding: 12px 0;
    }
    
    .arco-timeline-item:not(:last-child) {
      padding-bottom: 0;
    }
  }
}
</style>