<template>
  <div class="content-area" style="margin-top: 20px;">
    <a-card :bordered="false">
      <a-spin :loading="loading" :tip="loadingTip">
        <div class="list-container" :style="{ width: containerWidth + 'px' }">
          <div class="list">
            <slot :pageSize="pageSize" :containerWidth="containerWidth" :containerHeight="containerHeight"></slot>
          </div>
          <slot v-if="$slots.empty && listData.length === 0 && !loading" name="empty"></slot>
          <div v-else-if="listData.length === 0 && loading" :style="{ height: emptyHeight, width: emptyWidth }"></div>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// 接收父组件的 props
const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  listData: {
    type: Array,
    default: () => []
  },
  loadingTip: {
    type: String,
    default: '正在加载...'
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
  },
  heightOffset: {
    type: Number,
    default: 400
  },
  emptyHeight: {
    type: String,
    default: '50vh'
  },
  emptyWidth: {
    type: String,
    default: '80vw'
  }
});

// 响应式容器尺寸
const containerWidth = ref(0);
const containerHeight = ref(0);

// 简化的计算：直接计算可用空间能放多少个卡片
const loadingContainerWNumber = computed(() => {
  if (containerWidth.value <= 0) return 1;
  const cardsPerRow = Math.floor(containerWidth.value / (props.cardWidth + props.cardGap));
  return Math.max(1, cardsPerRow);
});

const loadingContainerHNumber = computed(() => {
  if (containerHeight.value <= 0) return 1;
  const rows = Math.floor(containerHeight.value / (props.cardHeight + props.cardGap));
  return Math.max(1, rows);
});

const pageSize = computed(() => {
  const widthCount = loadingContainerWNumber.value;
  const heightCount = loadingContainerHNumber.value;
  const calculatedSize = Math.floor(widthCount * heightCount);
  const finalSize = Math.min(calculatedSize, 100);
  return finalSize;
});

// 监听容器尺寸变化
let resizeObserver = null;
let resizeTimeout = null;
let containerElement = null; // 缓存 DOM 元素

const updateContainerSize = () => {
  // 清除之前的定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  // 使用 setTimeout 防抖，延迟执行
  resizeTimeout = setTimeout(() => {
    // 只在最后一次调用后执行
    if (containerElement || (containerElement = document.querySelector('.content-area'))) {
      if (containerElement) {
        // 确保响应式数据正确更新
        const newWidth = containerElement.clientWidth;
        const newHeight = window.innerHeight - props.heightOffset;

        // 只有真正变化时才更新，避免不必要的重新渲染
        if (newWidth !== containerWidth.value) {
          containerWidth.value = newWidth;
        }
        if (newHeight !== containerHeight.value) {
          containerHeight.value = newHeight;
        }
      }
    }
  }, 100); // 100ms 延迟防抖
};

// 监听pageSize变化，通知父组件
const emit = defineEmits(['pageSizeChange']);

watch(pageSize, (newSize, oldSize) => {
  if (newSize !== oldSize && oldSize > 0) {
    emit('pageSizeChange', newSize);
  }
});

// 组件挂载时加载数据
onMounted(() => {
  updateContainerSize();
  
  // 初始化ResizeObserver监听尺寸变化
  resizeObserver = new ResizeObserver(() => {
    updateContainerSize();
  });
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    resizeObserver.observe(contentArea);
  }
  // 监听窗口大小变化
  window.addEventListener('resize', updateContainerSize);
});

// 组件卸载时清理监听
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', updateContainerSize);

  // 清理定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
});
</script>

<style lang="less" scoped>
.content-area {
  min-height: 450px;
  height: calc(100vh - 300px);

  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;
    padding: 16px 0;
    align-items: flex-start;
  }
}

// 为知识库页面调整高度
.content-area.kb-content {
  min-height: 600px;
  height: calc(100vh - 400px);
}
</style>