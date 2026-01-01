<template>
    <div class="markdown-preview-wrapper" :class="[tocPosition === 'right' ? 'toc-right' : 'toc-left', {'toc-hidden': !isTocVisible}]">
       <MarkdownPreview :content="content" :height="height" :class="['preview', {'preview-full': !isTocVisible}]" />
        <TableOfContents v-if="showToc" :content="content" @select="handleSelect" @visibilityChange="handleTocVisibilityChange" :class="['toc', {'toc-visible': isTocVisible}]" />
    </div>
</template>

<script setup>
import { ref } from 'vue';
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
  }
});

// 跟踪目录的可见性状态
const isTocVisible = ref(true);

// 处理目录可见性变化
const handleTocVisibilityChange = (isVisible) => {
  isTocVisible.value = isVisible;
};

const handleSelect = (item) => {
   
};
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
    overflow-y: auto;
    transition: all 0.3s ease; // 添加过渡动画
    
    // 当目录可见时
    &.toc-visible {
      flex: 0 0 30%;
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

  .preview {
    flex: 1; // 预览区域占剩余空间
    overflow-y: auto;
    transition: all 0.3s ease; // 添加过渡动画
  }
  
  // 当目录隐藏时，预览区域占据剩余空间（减去目录按钮的宽度）
  &.toc-hidden .preview-full {
    flex: 1 !important; // 预览区域占据除目录按钮外的所有剩余空间
  }
}
</style>