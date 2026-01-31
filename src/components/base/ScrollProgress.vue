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
import {IconArrowFall, IconArrowRise} from '@arco-design/web-vue/es/icon';
import {ref} from 'vue';

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

const handleScrollToTop = () => 
{
  emit('scrollToTop', props.currentScrollPercent);
};
</script>

<style scoped lang="less">
@import '@/assets/style/global.less';

.scroll-progress-container {
  width: clamp(100px, 10vw, 140px);
  transition: right 0.3s ease, left 0.3s ease;
  padding: @size-2 @size-3;
  background-color: fade(@color-bg-white, 90%);
  border-radius: @border-radius-medium;
  box-shadow: @shadow2-center;
  backdrop-filter: blur(10px);
}

.scroll-progress-wrapper {
  display: flex;
  align-items: center;
  gap: @size-2;

  .arco-progress {
    flex: 1;
  }

  span {
    font-size: @font-size-body-1;
    color: @color-text-3;
    min-width: 30px;
    text-align: right;
  }

  .arco-btn {
    padding: 0;
    width: 24px;
    height: 24px;
  }

  .arco-icon {
    font-size: @font-size-title-1;
    color: white;
  }
}

/* 滚动进度条过渡动画 */
.scroll-progress-enter-from,
.scroll-progress-leave-to {
  opacity: 0;
  transform: translateY(@size-5);
}

.scroll-progress-enter-active,
.scroll-progress-leave-active {
  transition: all 0.3s ease;
}
</style>