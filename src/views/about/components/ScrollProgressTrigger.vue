<template>
  <Transition name="progress-slide">
    <div v-if="showProgress" class="scroll-progress-bar" :class="{ 'fixed-bottom': fixedBottom, 'fixed-top': fixedTop }">
      <div class="progress-container">
        <a-progress :percent="scrollProgress/100" :show-text="false" :stroke-width="4" status="normal" />
        <div class="progress-tip">{{ progressTip || `继续滑动将自动跳转 (${scrollProgress}%)` }}</div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import {nextTick, onMounted, onUnmounted, ref, watch} from 'vue';

const props = defineProps({
  // 滚动容器的选择器
  containerSelector: {
    type: String,
    default: '.content-area'
  },
  // 需要额外滑动的距离（像素）
  scrollThreshold: {
    type: Number,
    default: 150
  },
  // 是否启用进度条
  enabled: {
    type: Boolean,
    default: true
  },
  // 自定义提示文本
  progressTip: {
    type: String,
    default: ''
  },
  // 是否固定在底部
  fixedBottom: {
    type: Boolean,
    default: false
  },
  // 是否固定在顶部
  fixedTop: {
    type: Boolean,
    default: false
  },
  // 滑动方向：'down' 向下滑动到底部触发，'up' 向上滑动到顶部触发
  direction: {
    type: String,
    default: 'down',
    validator: (value) => ['down', 'up'].includes(value)
  }
});

const emit = defineEmits(['progress-complete', 'progress-change']);

let scrollContainer = null;
let lastScrollTop = 0;

// 进度条相关状态
const showProgress = ref(false);
const scrollProgress = ref(0);
let accumulatedScroll = 0;

// 监听滚动事件
const handleScroll = () => {
  if (!scrollContainer || !props.enabled) return;

  const currentScrollTop = scrollContainer.scrollTop;
  const scrollHeight = scrollContainer.scrollHeight;
  const clientHeight = scrollContainer.clientHeight;

  if (props.direction === 'down') {
    // 向下滑动模式
    const isScrollingDown = currentScrollTop > lastScrollTop;
    const isAtBottom = (scrollHeight - currentScrollTop - clientHeight) < 10;

    if (!isScrollingDown && !isAtBottom) {
      resetProgress();
    }
  } else {
    // 向上滑动模式
    const isScrollingUp = currentScrollTop < lastScrollTop;
    const isAtTop = currentScrollTop < 10;

    if (!isScrollingUp && !isAtTop) {
      resetProgress();
    }
  }

  lastScrollTop = currentScrollTop;
};

// 监听滚轮事件，在边界时累积进度
const handleWheel = (e) => {
  if (!scrollContainer || !props.enabled) return;

  const scrollHeight = scrollContainer.scrollHeight;
  const clientHeight = scrollContainer.clientHeight;
  const scrollTop = scrollContainer.scrollTop;

  if (props.direction === 'down') {
    // 向下滑动模式：在底部时监听
    const isAtBottom = (scrollHeight - scrollTop - clientHeight) < 10;

    if (isAtBottom) {
      if (e.deltaY > 0) {
        // 在底部且向下滚动
        showProgress.value = true;
        accumulatedScroll += Math.abs(e.deltaY);
        scrollProgress.value = Math.round((accumulatedScroll / props.scrollThreshold) * 10);

        emit('progress-change', scrollProgress.value);

        if (scrollProgress.value >= 100) {
          emit('progress-complete');
          resetProgress();
        }
      } else if (e.deltaY < 0 && showProgress.value) {
        // 在底部且向上滚动，减小进度
        accumulatedScroll -= Math.abs(e.deltaY);
        
        if (accumulatedScroll < 0) {
          accumulatedScroll = 0;
        }
        
        scrollProgress.value = Math.round((accumulatedScroll / props.scrollThreshold) * 10);
        emit('progress-change', scrollProgress.value);

        if (scrollProgress.value <= 0) {
          resetProgress();
        }
      }
    }
  } else {
    // 向上滑动模式：在顶部时监听
    const isAtTop = scrollTop < 10;

    if (isAtTop) {
      if (e.deltaY < 0) {
        // 在顶部且向上滚动
        showProgress.value = true;
        accumulatedScroll += Math.abs(e.deltaY);
        scrollProgress.value = Math.round((accumulatedScroll / props.scrollThreshold) * 10);

        emit('progress-change', scrollProgress.value);

        if (scrollProgress.value >= 100) {
          emit('progress-complete');
          resetProgress();
        }
      } else if (e.deltaY > 0 && showProgress.value) {
        // 在顶部且向下滚动，减小进度
        accumulatedScroll -= Math.abs(e.deltaY);
        
        if (accumulatedScroll < 0) {
          accumulatedScroll = 0;
        }
        
        scrollProgress.value = Math.round((accumulatedScroll / props.scrollThreshold) * 10);
        emit('progress-change', scrollProgress.value);

        if (scrollProgress.value <= 0) {
          resetProgress();
        }
      }
    }
  }
};

// 重置进度条
const resetProgress = () => {
  showProgress.value = false;
  scrollProgress.value = 0;
  accumulatedScroll = 0;
};

// 设置滚动监听
const setupScrollListener = () => {
  // 找到滚动容器
  scrollContainer = document.querySelector(props.containerSelector);

  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('wheel', handleWheel, { passive: true });
    lastScrollTop = scrollContainer.scrollTop;
  }
};

// 移除滚动监听
const removeScrollListener = () => {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll);
    scrollContainer.removeEventListener('wheel', handleWheel);
  }
};

// 监听 enabled 变化
watch(() => props.enabled, (newVal) => {
  if (!newVal) {
    resetProgress();
  }
});

// 监听容器选择器变化
watch(() => props.containerSelector, () => {
  removeScrollListener();
  resetProgress();
  nextTick(() => {
    setupScrollListener();
  });
});

onMounted(() => {
  nextTick(() => {
    setupScrollListener();
  });
});

onUnmounted(() => {
  removeScrollListener();
  resetProgress();
});

// 暴露重置方法给父组件
defineExpose({
  resetProgress
});
</script>

<style scoped lang="less">
.scroll-progress-bar {
  margin-top: 24px;
  padding: 20px 24px;
  background-color: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  overflow: hidden;

  &.fixed-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin-top: 0;
    border-radius: 0;
    border: none;
    border-top: 1px solid var(--color-border-2);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
    z-index: 100;
    background-color: var(--color-bg-2);
  }

  &.fixed-top {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    margin-top: 0;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid var(--color-border-2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    z-index: 100;
    background-color: var(--color-bg-2);
  }
}

.progress-slide-enter-active,
.progress-slide-leave-active {
  transition: all 0.3s ease;
}

.progress-slide-enter-from {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.progress-slide-enter-to {
  opacity: 1;
  max-height: 200px;
  margin-top: 24px;
  padding-top: 20px;
  padding-bottom: 20px;
}

.progress-slide-leave-from {
  opacity: 1;
  max-height: 200px;
  margin-top: 24px;
  padding-top: 20px;
  padding-bottom: 20px;
}

.progress-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.scroll-progress-bar.fixed-bottom,
.scroll-progress-bar.fixed-top {
  .progress-slide-enter-from,
  .progress-slide-leave-to {
    margin-top: 0;
  }
  
  .progress-slide-enter-to,
  .progress-slide-leave-from {
    margin-top: 0;
  }
}

.progress-container {
  max-width: 600px;
  margin: 0 auto;
}

.progress-tip {
  margin-top: 8px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-2);
  font-weight: 500;
}
</style>
