<template>
  <div class="cainsgl-code-container">
    <div class="cainsgl-code-header">
      <div class="cainsgl-code-title">{{ language || '文本' }}</div>
      <div class="cainsgl-code-actions">
        <TooltipWrapper :content="isWrapped ? '取消换行' : '自动换行'">
          <button
            size="small" 
            type="text" 
            @click="toggleWrap"
            class="cainsgl-wrap-button arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal"
          >
              <IconMenuUnfold v-if="isWrapped" />
              <IconMenuFold v-else />
          </button>
        </TooltipWrapper>
        <TooltipWrapper content="复制代码">
          <button
            size="small" 
            type="text" 
            @click="copyCode"
            class="cainsgl-copy-button arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal"
          >
              <IconCopy />
          </button>
        </TooltipWrapper>
        <TooltipWrapper content="展开/收起">
          <button
            size="small" 
            type="text" 
            @click="toggleExpand"
            class="cainsgl-toggle-button arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal"
          >
              <IconUp v-if="isExpanded" />
              <IconDown v-else />
          </button>
        </TooltipWrapper>
      </div>
    </div>
    <div 
      class="cainsgl-code-block-wrapper" 
      :class="{ 'cainsgl-code-expanded': isExpanded, 'cainsgl-code-wrapped': isWrapped }"
      :style="{ maxHeight: isExpanded ? maxHeightValue : '300px' }"
    >
      <pre class="cainsgl-code-block" :class="{ 'wrapped': isWrapped }">
        <code :class="`hljs ${validLang}`" v-html="highlightedCode"></code>
      </pre>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import hljs from 'highlight.js';
import {Message} from '@arco-design/web-vue';
import {IconCopy, IconDown, IconUp, IconMenuFold, IconMenuUnfold} from '@arco-design/web-vue/es/icon';
import TooltipWrapper from '@/components/base/TooltipWrapper.vue';

const props = defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: ''
  }
});

const isExpanded = ref(false);
const isWrapped = ref(false);

const validLang = computed(() => 
{
  return !props.language || props.language === 'undefined' ? 'plaintext' : props.language;
});

const highlightedCode = computed(() => 
{
  let highlighted;
  try 
  {
    highlighted = hljs.highlight(props.code, { language: validLang.value }).value;
  }
  catch (err) 
  {
    // 如果高亮失败，回退到自动检测
    highlighted = hljs.highlightAuto(props.code).value;
  }
  return highlighted;
});

// 计算展开时的最大高度
const maxHeightValue = computed(() => 
{
  // 使用一个足够大的值来确保代码块完全显示，但仍保持可动画性
  return '9999px';
});

const toggleExpand = () => 
{
  isExpanded.value = !isExpanded.value;
};

const toggleWrap = () => 
{
  isWrapped.value = !isWrapped.value;
};

const copyCode = async () => 
{
  try 
  {
    await navigator.clipboard.writeText(props.code);
    Message.success('代码已复制到剪贴板');
  }
  catch (err) 
  {
    console.error('复制失败:', err);
    Message.error('复制失败');
  }
};
</script>

<style lang="less">
@import '@/assets/style/markdown-styles.less';

.cainsgl-code-container {
  margin: 16px 0;
  border: 1px solid var(--code-border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--code-bg);

  .cainsgl-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--code-header-bg);
    border-bottom: 1px solid var(--code-border-color);

    .cainsgl-code-title {
      font-size: 0.85em;
      font-weight: 600;
      color: var(--code-title-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cainsgl-code-actions {
      display: flex;
      gap: 4px;
      align-items: center;
      min-height: 24px;
    }
  }

  .cainsgl-copy-button,
  .cainsgl-toggle-button,
  .cainsgl-wrap-button {
    min-width: 24px;
    min-height: 24px;
    width: auto;
    height: auto;

    // 确保 Arco Design 按钮的样式正确应用
    .arco-btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .arco-icon {
      font-size: 14px;
    }
  }

  .cainsgl-code-block-wrapper {
    position: relative;
    overflow: auto;
    max-height: 300px;
    transition: max-height 0.3s ease;

    &.cainsgl-code-expanded {
      max-height: 9999px;
    }

    &.cainsgl-code-wrapped {
      overflow-x: hidden;
    }

    // 代码块滚动条样式
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: var(--code-scrollbar-track);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--code-scrollbar-thumb);
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: var(--code-scrollbar-thumb-hover);
    }

    // Firefox 滚动条样式
    scrollbar-width: thin;
    scrollbar-color: var(--code-scrollbar-thumb) var(--code-scrollbar-track);
  }

  .cainsgl-code-block {
    margin: 0;
    padding: 12px;
    padding-bottom: 16px;
    background-color: var(--code-bg);
    overflow: visible;
    font-size: 0.9em;
    line-height: 1.5;
    color: var(--code-text-color);
    border: none;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    min-width: fit-content;

    code {
      background-color: transparent;
      padding: 0;
      border: none;
      display: block;
      color: var(--code-text-color);
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      overflow-x: visible;
      white-space: pre;
    }

    &.wrapped code {
      white-space: pre-wrap;
      word-break: break-all;
    }

    .hljs {
      background: var(--code-bg) !important;
      padding: 0 !important;
      margin: 0;
      color: var(--code-text-color);
    }
    
    /* 语法高亮配色 */
    .hljs-comment,
    .hljs-quote {
      color: var(--hljs-comment);
      font-style: italic;
    }
    
    .hljs-params {
      color: var(--hljs-number);
    }

    .hljs-keyword,
    .hljs-selector-tag,
    .hljs-subst {
      color: var(--hljs-keyword);
      font-weight: bold;
    }
    
    .hljs-number,
    .hljs-literal,
    .hljs-variable,
    .hljs-template-variable,
    .hljs-tag .hljs-attr {
      color: var(--hljs-number);
    }
    
    .hljs-string,
    .hljs-doctag {
      color: var(--hljs-string);
    }
    
    .hljs-title,
    .hljs-section,
    .hljs-selector-id {
      color: var(--hljs-function);
      font-weight: bold;
    }
    
    .hljs-subst {
      color: var(--code-text-color);
    }
    
    .hljs-type,
    .hljs-class .hljs-title {
      color: var(--hljs-number);
      font-weight: bold;
    }
    
    .hljs-tag,
    .hljs-name,
    .hljs-attribute {
      color: var(--hljs-tag);
    }
    
    .hljs-regexp,
    .hljs-link {
      color: var(--hljs-string);
    }
    
    .hljs-symbol,
    .hljs-bullet {
      color: var(--hljs-number);
    }
    
    .hljs-built_in,
    .hljs-builtin-name {
      color: var(--hljs-function);
    }
    
    .hljs-meta {
      color: var(--hljs-keyword);
      font-weight: bold;
    }
    
    .hljs-deletion {
      background: var(--hljs-deletion-bg);
      color: var(--hljs-deletion-color);
    }
    
    .hljs-addition {
      background: var(--hljs-addition-bg);
      color: var(--hljs-addition-color);
    }
    
    .hljs-emphasis {
      font-style: italic;
    }
    
    .hljs-strong {
      font-weight: bold;
    }
  }
}
</style>