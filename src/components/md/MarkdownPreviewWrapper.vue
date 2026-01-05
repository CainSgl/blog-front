<template>
  <div ref="wrapperRef" class="markdown-preview-wrapper"
    :class="[tocPosition === 'right' ? 'toc-right' : 'toc-left', { 'toc-hidden': !isTocVisible }]">
    <MarkdownPreview  :content="content" :height="height" :class="['preview', { 'preview-full': !isTocVisible }]" />
    <a-affix :offset-top="0" :target="affixTarget">
      <TableOfContents v-if="shouldShowToc" :content="content" @select="handleSelect"
        :style="{ maxHeight: tocMaxHeight }" @visibilityChange="handleTocVisibilityChange"
        :class="['toc', { 'toc-visible': isTocVisible }]" />
    </a-affix>

    <!-- 移动端目录切换按钮 -->
    <div v-if="isMobile && !isTocVisible && props.showToc" class="toc-toggle-container">
      <a-button type="primary" @click="showTocOnMobile" shape="circle" :size="'large'" class="toc-toggle-button">
        <template #icon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5H13M3 8H13M3 11H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import MarkdownPreview from './MarkdownPreview.vue';
import TableOfContents from '../navigation/toc/TableOfContents.vue';

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: ''
  },
  tocPosition: {
    type: String,
    default: 'left', // 默认在左侧
    validator: (value) => ['left', 'right'].includes(value)
  },
  showToc: {
    type: Boolean,
    default: true
  },
  affixTarget: {
    type: [String, Element],
    default: null
  }
});

// 跟踪目录的可见性状态
const isTocVisible = ref(true);
const wrapperRef = ref(null);
const tocMaxHeight = ref(''); // 动态计算目录的最大高度
const isMobile = ref(false); // 跟踪是否为移动端

// 判断是否应该显示目录：在桌面端始终根据isTocVisible决定，
// 在移动端仅在可见状态下显示，隐藏状态下不显示（包括控制按钮）
const shouldShowToc = computed(() => {
  return props.showToc && (isMobile.value ? isTocVisible.value : true);
});

// 监听容器大小变化
const updateMobileStatus = () => {
  if (wrapperRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect();
    isMobile.value = rect.width < 768;
  }
};

// 计算目录的最大高度
const calculateTocMaxHeight = () => {
  if (wrapperRef.value) {
    const wrapperRect = wrapperRef.value.getBoundingClientRect();
    // 设置目录最大高度为容器在屏幕中的高度减去一些边距
    tocMaxHeight.value = `${wrapperRect.height - 20}px`;
  }
};

// 处理目录可见性变化
const handleTocVisibilityChange = (isVisible) => {
  isTocVisible.value = isVisible;
};

const handleSelect = (item) => {

};

// 移动端显示目录
const showTocOnMobile = () => {
  isTocVisible.value = true;
};

let resizeObserver = null;

// 监听窗口大小变化，重新计算目录高度和移动端判断
const handleResize = () => {
  nextTick(() => {
    calculateTocMaxHeight();
    updateMobileStatus();
  });
};

onMounted(() => {
  // 组件挂载后计算目录高度
  nextTick(() => {
    calculateTocMaxHeight();
    updateMobileStatus();
  });

  // 使用ResizeObserver监听容器大小变化
  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver(updateMobileStatus);
    resizeObserver.observe(wrapperRef.value);
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // 组件卸载时移除事件监听
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped lang="less">
.markdown-preview-wrapper {

  display: flex;
  width: 100%;
  height: 100%;

  &.toc-left {
    flex-direction: row;
  }

  &.toc-right {
    flex-direction: row-reverse;
  }

  .toc {

    flex: 0 0 30%; // 目录宽度默认为30%
    max-width: 400px; // 最大宽度为400px
    min-width: 200px; // 最小宽度为200px，防止过小
    transition: all 0.3s ease; // 添加过渡动画
    overflow: auto;

    // 当目录可见时
    &.toc-visible {
      flex: 0 0 30%;
      width: 15vw;
      min-width: 200px;
      max-width: 400px;
    }

    // 当目录不可见时，保留小按钮区域
    &:not(.toc-visible) {
      flex: 0 0 80px !important; // 保留约100px的空间给控制按钮
      min-width: 80px !important;
      max-width: 80px !important;
      overflow: hidden;
    }
  }

  // 在移动设备上，当目录隐藏时完全隐藏目录区域
  @media (max-width: 767px) {
    .toc:not(.toc-visible) {
      display: none !important;
    }
    .toc-visible{
      width: 100vw !important;
    }
  }

  .preview {
    
    flex: 1; // 预览区域占剩余空间
    overflow-y: auto;
    transition: all 0.3s ease; // 添加过渡动画
  }

  // 当目录隐藏时，预览区域占据剩余空间（减去目录按钮的宽度）
  &.toc-hidden .preview-full {
    flex: 1 !important; // 预览区域占据除目录按钮外的所有剩余空间
  }
  
  .toc-toggle-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000; // 确保按钮在最上层
  }
}
</style>