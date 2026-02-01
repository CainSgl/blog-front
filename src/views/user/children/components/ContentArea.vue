<template>
  <div class="content-area">
    <a-card :bordered="false">
      <div class="list-container">
        <div class="list">
          <slot :pageSize="pageSize" :containerWidth="containerWidth" :containerHeight="containerHeight"></slot>
        </div>
        <div v-if="$slots.empty && listData.length === 0 && !loading" class="empty-container">
          <slot name="empty"></slot>
        </div>
        <div v-else-if="listData.length === 0 && loading" class="loading-placeholder"></div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  listData: {
    type: Array,
    default: () => []
  },
  cardWidth: {
    type: Number,
    required: true
  },
  cardHeight: {
    type: Number,
    required: true
  },
  cardGap: {
    type: Number,
    default: 16
  }
});

const containerWidth = ref(0);
const containerHeight = ref(0);

// 简化计算：根据容器宽度计算每行卡片数
const cardsPerRow = computed(() => {
  if (containerWidth.value <= 0) return 1;
  
  // 移动端适配
  if (containerWidth.value < 768) {
    return Math.floor(containerWidth.value / Math.min(props.cardWidth, 300));
  }
  
  const cards = Math.floor(containerWidth.value / (props.cardWidth + props.cardGap));
  return Math.max(1, cards);
});

// 简化的 pageSize 计算
const pageSize = computed(() => {
  const rows = 3; // 固定显示3行
  const size = cardsPerRow.value * rows;
  return Math.min(Math.max(size, 6), 100); // 最小6个，最大100个
});

const emit = defineEmits(['pageSizeChange']);

watch(pageSize, (newSize, oldSize) => {
  if (newSize !== oldSize && oldSize > 0) {
    emit('pageSizeChange', newSize);
  }
});

let resizeObserver = null;
let resizeTimeout = null;

const updateContainerSize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = setTimeout(() => {
    const containerElement = document.querySelector('.content-area .list-container');
    if (containerElement) {
      const newWidth = containerElement.clientWidth;
      if (newWidth !== containerWidth.value) {
        containerWidth.value = newWidth;
      }
    }
  }, 150);
};

onMounted(() => {
  updateContainerSize();
  
  resizeObserver = new ResizeObserver(updateContainerSize);
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    resizeObserver.observe(contentArea);
  }
  
  window.addEventListener('resize', updateContainerSize);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', updateContainerSize);
  
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
});
</script>

<style lang="less" scoped>
.content-area {
  margin-top: 20px;

  :deep(.arco-card) {
    background-color: var(--color-bg-1);
  }

  .list-container {
    width: 100%;
  }

  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;
    padding: 16px 0;
  }

  .empty-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .loading-placeholder {
    min-height: 400px;
  }
}

// 移动端适配
@media (max-width: 768px) {
  .content-area {
    margin-top: 12px;

    .list {
      gap: 12px;
      padding: 12px 0;
      justify-content: center;
    }

    .empty-container {
      min-height: 300px;
    }

    .loading-placeholder {
      min-height: 300px;
    }
  }
}
</style>