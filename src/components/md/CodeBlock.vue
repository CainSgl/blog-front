<template>
  <div class="cainsgl-code-container">
    <div class="cainsgl-code-header">
      <div class="cainsgl-code-title">{{ language || '文本' }}</div>
      <div class="cainsgl-code-actions">
        <button
          size="small" 
          type="text" 
          title="复制代码"
          @click="copyCode"
          class="cainsgl-copy-button arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal"
        >
         
            <IconCopy />
         
        </button>
        <button
          size="small" 
          type="text" 
          title="展开/收起"
          @click="toggleExpand"
          class="cainsgl-toggle-button arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal"
        >
      
            <IconUp v-if="isExpanded" />
            <IconDown v-else />
    
        </button>
      </div>
    </div>
    <div 
      class="cainsgl-code-block-wrapper" 
      :class="{ 'cainsgl-code-expanded': isExpanded }"
      :style="{ maxHeight: isExpanded ? maxHeightValue : '300px' }"
    >
      <pre class="cainsgl-code-block">
        <code :class="`hljs ${validLang}`" v-html="highlightedCode"></code>
      </pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import hljs from 'highlight.js';
import { Message } from '@arco-design/web-vue';
import { IconCopy, IconDown, IconUp } from '@arco-design/web-vue/es/icon';

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

const validLang = computed(() => {
  return !props.language || props.language === 'undefined' ? 'plaintext' : props.language;
});

const highlightedCode = computed(() => {
  let highlighted;
  try {
    highlighted = hljs.highlight(props.code, { language: validLang.value }).value;
  } catch (err) {
    // 如果高亮失败，回退到自动检测
    highlighted = hljs.highlightAuto(props.code).value;
  }
  return highlighted;
});

// 计算展开时的最大高度
const maxHeightValue = computed(() => {
  // 使用一个足够大的值来确保代码块完全显示，但仍保持可动画性
  return '9999px';
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    Message.success('代码已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    Message.error('复制失败');
  }
};
</script>

<style lang="less">
@border-color: #d0d7de;
@header-bg: #f6f8fa;
@text-color: #24292e;
@title-color: #57606a;
@code-bg: #f6f8fa;
@vscode-bg: #ffffff;
@vscode-comment: #6a9955;
@vscode-keyword: #569cd6;
@vscode-string: #ce9178;
@vscode-function: #dcdcaa;
@vscode-constant: #9cdcfe;
@vscode-property: #9cdcfe;
@vscode-punctuation: #d4d4d4;
@vscode-operator: #d4d4d4;

.cainsgl-code-container {
  margin: 16px 0;
  border: 1px solid @border-color;
  border-radius: 6px;
  overflow: hidden;
  background-color: @vscode-bg;

  .cainsgl-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: @header-bg;
    border-bottom: 1px solid @border-color;

    .cainsgl-code-title {
      font-size: 0.85em;
      font-weight: 600;
      color: @title-color;
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
  .cainsgl-toggle-button {
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
  }

  .cainsgl-code-block {
    margin: 0;
    padding: 12px;
    background-color: @vscode-bg;
    overflow: auto;  // 同时支持水平和垂直滚动
    font-size: 0.9em;
    line-height: 1.5;
    color: @text-color;
    border: none;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;

    code {
      background-color: transparent;
      padding: 0;
      border: none;
      display: block;
      color: @text-color;
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      overflow-x: auto;
    }

    .hljs {
      background: @vscode-bg !important;
      padding: 0 !important;
      margin: 0;
      color: @text-color;
    }
    
    /* VSCode Light Theme 语法高亮配色 */
    .hljs-comment,
    .hljs-quote {
      color: @vscode-comment;
      font-style: italic;
    }
    
    .hljs-keyword,
    .hljs-selector-tag,
    .hljs-subst {
      color: @vscode-keyword;
      font-weight: bold;
    }
    
    .hljs-number,
    .hljs-literal,
    .hljs-variable,
    .hljs-template-variable,
    .hljs-tag .hljs-attr {
      color: @vscode-constant;
    }
    
    .hljs-string,
    .hljs-doctag {
      color: @vscode-string;
    }
    
    .hljs-title,
    .hljs-section,
    .hljs-selector-id {
      color: @vscode-function;
      font-weight: bold;
    }
    
    .hljs-subst {
      color: @text-color;
    }
    
    .hljs-type,
    .hljs-class .hljs-title {
      color: @vscode-constant;
      font-weight: bold;
    }
    
    .hljs-tag,
    .hljs-name,
    .hljs-attribute {
      color: @vscode-keyword;
    }
    
    .hljs-regexp,
    .hljs-link {
      color: @vscode-string;
    }
    
    .hljs-symbol,
    .hljs-bullet {
      color: @vscode-constant;
    }
    
    .hljs-built_in,
    .hljs-builtin-name {
      color: @vscode-function;
    }
    
    .hljs-meta {
      color: @vscode-keyword;
      font-weight: bold;
    }
    
    .hljs-deletion {
      background: #fdd;
    }
    
    .hljs-addition {
      background: #dfd;
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