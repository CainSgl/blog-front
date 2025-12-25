<template>
    <div class="markdown-preview-wrapper" :class="tocPosition === 'right' ? 'toc-right' : 'toc-left'">
       <MarkdownPreview :content="content" :height="height" class="preview" />
        <TableOfContents v-if="showToc" :content="content" @select="handleSelect" class="toc" />
    </div>
</template>

<script setup>
import MarkdownPreview from './MarkdownPreview.vue';
import TableOfContents from '../toc/TableOfContents.vue';

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
  }

  .preview {
    flex: 1; // 预览区域占剩余空间
    overflow-y: auto;
  }
}
</style>