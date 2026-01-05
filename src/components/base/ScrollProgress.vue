<template>
  <Transition name="scroll-progress">
    <div class="scroll-progress-container" v-show="showScrollProgress || isHovering" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
      <div class="scroll-progress-wrapper">
        <a-progress :percent="currentScrollPercent / 100" :stroke-width="6" :show-text="false" :color="{
          '0%': 'rgb(var(--primary-5))',
          '35%': 'rgb(var(--primary-6))',
          '100%': 'rgb(var(--primary-4))',
        }" />
        <span> {{ Math.floor(currentScrollPercent) }}%</span>
        <a-button type="primary" shape="circle" size="small" @click="handleScrollToTop" :ghost="true">
          <template #icon>
            <icon-arrow-fall v-if="currentScrollPercent < 60" />
            <icon-arrow-rise v-else />
          </template>
        </a-button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { IconArrowFall, IconArrowRise } from '@arco-design/web-vue/es/icon';
import { ref } from 'vue';

const props = defineProps({
  currentScrollPercent: {
    type: Number,
    default: 0
  },
  showScrollProgress: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['scrollToTop']);

const isHovering = ref(false);

const handleScrollToTop = () => {
  emit('scrollToTop', props.currentScrollPercent);
};
</script>

<style scoped lang="less">
.scroll-progress-container {
    width: clamp(100px, 10vw, 140px);
    transition: right 0.3s ease, left 0.3s ease;
    padding: 8px 12px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

.scroll-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scroll-progress-wrapper .arco-progress {
  flex: 1;
}

.scroll-progress-wrapper span {
  font-size: 12px;
  color: var(--text-color-secondary);
  min-width: 30px;
  text-align: right;
}

.scroll-progress-wrapper .arco-btn {
  padding: 0;
  width: 24px;
  height: 24px;
}

.scroll-progress-wrapper .arco-icon {
  font-size: 16px;
  color: var(--text-color-secondary);
}

/* 滚动进度条过渡动画 */
.scroll-progress-enter-from,
.scroll-progress-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.scroll-progress-enter-active,
.scroll-progress-leave-active {
  transition: all 0.3s ease;
}
</style>