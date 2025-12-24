<template>
  <div class="markdown-preview">
    <div 
      :style="{ height: height }"
      class="preview-content"
      v-html="renderedMarkdown"
    />
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  height: {
    type: String,
  }
});

// 设置 marked 选项
marked.setOptions({
  breaks: false,
  gfm: true,
  sanitize: true,  // 启用HTML清理以防止XSS攻击
  smartLists: true,
  smartypants: false
});

// 渲染 Markdown 内容
const renderedMarkdown = computed(() => {
  if (!props.content) return '';
  const rawHtml = marked(props.content);
  return DOMPurify.sanitize(rawHtml); // 使用DOMPurify清理HTML以防止XSS攻击
});
</script>

<style scoped>
.markdown-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.preview-content {
  padding: 16px;
  line-height: 1.6;
  font-size: 16px;
  color: #333;
}

.preview-content blockquote {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 4px solid #ddd;
  background-color: #f8f9fa;
  color: #666;
  font-style: italic;
}

.preview-content blockquote p {
  margin: 0;
  padding: 0;
}

.preview-content blockquote > p:first-child {
  margin-top: 0;
}

.preview-content blockquote > p:last-child {
  margin-bottom: 0;
}
</style>