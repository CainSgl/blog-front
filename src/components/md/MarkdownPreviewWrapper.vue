<template>

  <div ref="wrapperRef" class="markdown-preview-wrapper"
    :class="[currentTocPosition === 'right' ? 'toc-right' : 'toc-left', { 'toc-hidden': !isTocVisible }]">

    <MarkdownPreview v-show="!(isMobile && shouldShowToc)" :showComment="showComment" ref="markdownPreviewRef"
      :content="content" :useWindowScroll="useWindowScroll" :class="['preview', { 'preview-full': !shouldShowToc || !tocHasData }]"
      @scroll="handleMdScroll">
      <div :class="['scroll-progress-container', { 'scroll-progress-mobile': isMobile }]">
        <ScrollProgress :current-scroll-percent="currentScrollPercent" :show-scroll-progress="showScrollProgress"
          @scroll-to-top="handleScrollToTop" />
      </div>
    </MarkdownPreview>

    <div v-if="props.showToc" v-show="tocHasData" :class="['toc', { 'toc-visible': isTocVisible, 'toc-mobile': isMobile }]"
      :style="{ display: tocHasData ? '' : 'none' }"
      :target="affixTarget ? affixTarget : null">
      <TableOfContents v-if="shouldRenderToc" :isMobile="isMobile" :content="content" @select="handleSelect" :tocDefaultShow="tocDefaultShow"
        :tocPosition="currentTocPosition" :style="{ maxHeight: tocMaxHeight }" @visibilityChange="handleTocVisibilityChange" 
        @hasData="handleHasData" @positionChange="handlePositionChange" />
    </div>



    <!-- 移动端目录切换按钮 -->
    <div v-if="isMobile && !isTocVisible && tocHasData && props.showToc" class="toc-toggle-container">
      <a-button type="primary" @click="showTocOnMobile" shape="circle" :size="'large'" class="toc-toggle-button">
        <template #icon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5H13M3 8H13M3 11H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </template>
      </a-button>
    </div>

    <CommentDrawer v-if="showComment" />
  </div>

</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import MarkdownPreview from './MarkdownPreview.vue';
import TableOfContents from './common/toc/TableOfContents.vue';
import ScrollProgress from './common/ScrollProgress.vue';
import CommentDrawer from '@/components/comment/CommentDrawer.vue';

const props = defineProps({
  content: {
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
  },
  showComment: {
    type: Boolean,
    default: true
  },
  useWindowScroll: {
    type: Boolean,
    default: false
  },
  tocDefaultShow: {
    type: Boolean,
    default: true,
  }
});

// 定义事件
const emit = defineEmits(['scroll']);

// 跟踪目录的可见性状态
const isTocVisible = ref(true);
const wrapperRef = ref(null);
const tocMaxHeight = ref(''); // 动态计算目录的最大高度
const isMobile = ref(false); // 跟踪是否为移动端
const markdownPreviewRef = ref(null);
const currentScrollPercent = ref(0); // 当前滚动进度百分比
const showScrollProgress = ref(false);
const tocHasData = ref(false);
const currentTocPosition = ref(props.tocPosition); // 当前目录位置

// 是否渲染 TableOfContents 组件（用于初始化和获取 hasData）
const shouldRenderToc = computed(() => {
  return props.showToc && (isMobile.value ? isTocVisible.value : true);
});

// 判断是否应该显示目录：需要同时满足 props.showToc、tocHasData 和可见性条件
const shouldShowToc = computed(() => {
  if (!props.showToc || !tocHasData.value) return false;
  return isMobile.value ? isTocVisible.value : true;
});

let closeScrollProgress;



function handleHasData(hasData) {
  console.log("toc是否有数据?",hasData)
  tocHasData.value = hasData;
}


function handleMdScroll(e) {
  showScrollProgress.value = true;
  if (closeScrollProgress) {
    clearTimeout(closeScrollProgress);
  }
  const target = e.target;
  if (target) {
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // 计算滚动进度 (0 到 1)
    const scrollProgress = clientHeight >= scrollHeight
      ? 1
      : scrollTop / (scrollHeight - clientHeight);

    // 确保进度值在 0 到 1 的范围内
    const progress = Math.max(0, Math.min(1, scrollProgress));

    // 更新进度显示 (乘以100转换为百分比，保留两位小数)
    currentScrollPercent.value = Math.round(progress * 100 * 100) / 100;

    // 向父组件发送滚动事件
    emit('scroll', e);
  }
  closeScrollProgress = setTimeout(() => {
    showScrollProgress.value = false;
  }, 600);
}
// 监听容器大小变化
const updateMobileStatus = () => {
  if (wrapperRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect();
    isMobile.value = rect.width < 668;
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

// 处理目录位置变化
const handlePositionChange = (newPosition) => {
  currentTocPosition.value = newPosition;
};

const handleSelect = () => {
  // Handle TOC item selection
};

// 移动端显示目录
const showTocOnMobile = () => {
  isTocVisible.value = true;
};

// 滚动到顶部
const handleScrollToTop = () => {
  if (currentScrollPercent.value < 60) {

    markdownPreviewRef.value.scrollToTopOrBottom(true);
  }
  else {
    window.scrollTo({
      top: 0,
    });
    markdownPreviewRef.value.scrollToTopOrBottom(false);
  }
};

let resizeObserver = null;

// 监听窗口大小变化，重新计算目录高度和移动端判断
const handleResize = () => {
  nextTick(() => {
    calculateTocMaxHeight();
    updateMobileStatus();
  });
};

// 监听content变化，重新计算目录高度
watch(() => props.content, () => {
  nextTick(() => {
    calculateTocMaxHeight();
  });
}, {
  immediate: false // 不需要立即执行，因为onMounted中已经计算过一次
});

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
  position: relative;
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
    transition: all 0.3s ease; // 添加过渡动画
    overflow: hidden;
    min-width: 220px;
    max-width: 400px;

    &:hover {
      overflow-y: auto;
    }

    // 当目录可见时
    &.toc-visible {
      width: clamp(200px, 15vw, 400px);
    }

    // 当目录不可见时，保留小按钮区域
    &:not(.toc-visible) {
      flex: 0 0 80px !important; // 保留约100px的空间给控制按钮
      min-width: 80px !important;
      max-width: 80px !important;
      overflow: hidden;
    }
    
    // 当没有数据时，完全不占据空间
    &[style*="display: none"] {
      flex: 0 0 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
      visibility: hidden !important;
    }
  }

  // 当目录隐藏时，预览区域占据剩余空间（减去目录按钮的宽度）
  &.toc-hidden {
    flex: 1 !important; // 预览区域占据除目录按钮外的所有剩余空间
  }

  // 移动端样式
  .toc.toc-mobile {
    transition: none; // 移动端禁用过渡动画

    &.toc-visible {
      display: block !important;
      max-width: 100%;
      flex: 0 0 calc(100vw - 30px) !important;
    }

    &:not(.toc-visible) {
      flex: 0 0 0px !important;
      min-width: 0px !important;
      max-width: 0px !important;
      overflow: hidden;
    }
    
    // 移动端没有数据时，完全不占据空间且不遮挡
    &[style*="display: none"] {
      position: absolute !important;
      left: -9999px !important;
      flex: 0 0 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      width: 0 !important;
      height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  }




  .preview {
    flex: 1;
    overflow-y: auto;
    transition: all 0.3s ease;
    
    &.preview-full {
      width: 100%;
      max-width: 100%;
    }
  }



  .toc-toggle-container {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 10; // 确保按钮在最上层
  }

  .scroll-progress-container {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: clamp(100px, 10vw, 140px);
    transition: all 0.3s ease;
  }
}
</style>