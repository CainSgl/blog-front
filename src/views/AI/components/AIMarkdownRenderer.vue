<template>
  <div class="ai-markdown-content" v-html="renderedMarkdown"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  content: {
    type: String,
    required: true
  }
});

marked.setOptions({
  breaks: true,
  gfm: true
});

// 渲染 Markdown
const renderedMarkdown = computed(() => {
  if (!props.content) return '';
  
  try {
    return marked(props.content);
  } catch (e) {
    console.error('Markdown render error:', e);
    return props.content;
  }
});
</script>

<style scoped lang="less">
.ai-markdown-content {
  color: var(--color-text-1);
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  min-height: 24px; // 防止内容渲染时高度跳变
  max-width: 100%;
  overflow-x: hidden;
  
  // 使用 content-visibility 优化渲染性能
  content-visibility: auto;
  
  // 段落间距
  :deep(p) {
    margin: 0.8em 0;
    line-height: 1.6;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  // 标题样式
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 1.2em 0 0.6em 0;
    font-weight: 600;
    line-height: 1.4;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  :deep(h1) { font-size: 1.8em; }
  :deep(h2) { font-size: 1.5em; }
  :deep(h3) { font-size: 1.3em; }
  :deep(h4) { font-size: 1.1em; }
  :deep(h5) { font-size: 1em; }
  :deep(h6) { font-size: 0.9em; }
  
  // 列表样式
  :deep(ul), :deep(ol) {
    margin: 0.8em 0;
    padding-left: 2em;
    line-height: 1.6;
  }
  
  :deep(li) {
    margin: 0.3em 0;
    line-height: 1.6;
  }
  
  // 代码块样式
  :deep(pre) {
    margin: 1em 0;
    padding: 12px 16px;
    background-color: #f6f8fa;
    border-radius: 6px;
    overflow-x: auto;
    
    code {
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.5;
    }
  }
  
  // 行内代码样式
  :deep(code) {
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 0.9em;
    background-color: rgba(175, 184, 193, 0.2);
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--color-text-1);
  }
  
  :deep(pre code) {
    background: none;
    padding: 0;
  }
  
  // 引用块样式
  :deep(blockquote) {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid var(--color-primary-6);
    background-color: var(--color-fill-1);
    color: var(--color-text-2);
    
    p {
      margin: 0.5em 0;
    }
  }
  
  // 表格样式
  :deep(table) {
    margin: 1em 0;
    border-collapse: collapse;
    width: 100%;
    font-size: 0.95em;
    
    th, td {
      padding: 8px 12px;
      border: 1px solid var(--color-border-2);
      text-align: left;
    }
    
    th {
      background-color: var(--color-fill-2);
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: var(--color-fill-1);
    }
  }
  
  // 链接样式
  :deep(a) {
    color: var(--color-primary-6);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  // 水平线样式
  :deep(hr) {
    margin: 1.5em 0;
    border: none;
    border-top: 1px solid var(--color-border-2);
  }
  
  // 图片样式
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 0.5em 0;
  }
}

// 暗黑模式适配
body[arco-theme='dark'] {
  .ai-markdown-content {
    :deep(pre) {
      background-color: #0d1117;
    }
    
    :deep(code) {
      background-color: rgba(110, 118, 129, 0.4);
    }
    
    :deep(pre code) {
      background: none;
    }
  }
}
</style>
