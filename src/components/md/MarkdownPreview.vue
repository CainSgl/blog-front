<template>

  <div ref="previewContainerRef" class="cainsgl-markdown-preview">
    
    <div ref="previewContentRef" :style="{ height: height }" class="cainsgl-preview-content"
      v-html="renderedMarkdown" />
  </div>
</template>

<script setup>
import { defineProps, computed, nextTick, onMounted, onUpdated, onUnmounted, ref } from 'vue';
import { createApp, h } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { Image as AImage } from '@arco-design/web-vue';
import CodeBlock from './CodeBlock.vue';
import { API_BASE_URL } from '@/config';

const extractImageSize = (src) => {
  if (!src || typeof src !== 'string') {
    return {
      src: src,
      width: null
    };
  }
  const widthMatch = src.match(/^(.+?)(?:\?|&)(width=\d+)$/);
  let width = null;
  
  if (widthMatch) {
    // 提取 width 值
    const widthValue = widthMatch[2].substring(6); 
    width = parseInt(widthValue, 10);
    const maxWidth = 1200;
    if (width && width > maxWidth) {
      width = maxWidth;
    }
    // 移除 width 参数，得到纯净的 src
    src = src.replace(/[?&]width=\d+$/, ''); // 移除末尾的 ?width=xxx 或 &width=xxx
  }
  
  return {
    src: src,
    width: width
  };
};

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  height: {
    type: String,
  }
});

const previewContentRef = ref(null);
const previewContainerRef = ref(null);

const renderer = new marked.Renderer();

// 自定义代码块渲染器 - 创建一个特殊的占位符 
let codeBlockIdCounter = 0; // 用于生成自增ID
renderer.code = function (code, language) {
  let codeText, lang;
  if (typeof code === 'object' && code !== null) {
    codeText = code.text || '';
    lang = code.lang || language;
  } else {
    codeText = code || '';
    lang = language;
  }
  
  const uniqueId = `code-block-${++codeBlockIdCounter}`;

  return `<div id="${uniqueId}" class="code-block-placeholder" data-code="${encodeURIComponent(codeText)}" data-language="${lang || ''}">Loading code block...</div>`;
};

renderer.blockquote = function (quote) {
  // 处理换行符，将换行符替换为 <br> 标签，同时保持段落结构
  const processedText = quote.text
    .replace(/\r\n/g, '<br>')
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '<br>');
  return `<blockquote class="cainsgl-markdown-blockquote">${processedText}</blockquote>`;
};

renderer.link = function (href) {
  // 判断是否为外部链接
  let finalHref = href.href;
  let isExternal = false;
  
  try {
    const url = new URL(href.href, window.location.origin);
    // 如果链接的域名与当前域名不同，则使用跳转页面
    if (url.origin !== window.location.origin) {
      isExternal = true;
      finalHref = `/redirect?url=${encodeURIComponent(href.href)}`;
    }
  } catch (e) {
    // 如果 URL 格式不正确，也使用跳转页面
    isExternal = true;
    finalHref = `/redirect?url=${encodeURIComponent(href.href)}`;
  }
  
  // 仅对外部链接使用 target="_blank"，内部链接直接跳转
  if (isExternal) {
    return `<a class="arco-link arco-link-status-normal" href="${finalHref}" target="_blank" rel="noopener noreferrer">${href.text}</a>`;
  } else {
    return `<a class="arco-link arco-link-status-normal" href="${href.href}">${href.text}</a>`;
  }
};

// 自定义表格渲染器
renderer.table = function (header, body) {
  // 检查 header 是否为对象结构（包含 header 和 rows 属性）
  if (header && typeof header === 'object' && header.header && header.rows) {
    // 构建表头
    const headersHtml = `<tr>${header.header.map(h => {
      let alignStyle = '';
      if (h.align === 'center') alignStyle = ' style="text-align: center;"';
      else if (h.align === 'right') alignStyle = ' style="text-align: right;"';
      else if (h.align === 'left') alignStyle = ' style="text-align: left;"';
      return `<th${alignStyle}>${DOMPurify.sanitize(marked.parseInline(h.text || ''))}</th>`;
    }).join('')}</tr>`;
    
    // 构建表体
    const rowsHtml = header.rows.map(row => {
      return `<tr>${row.map(cell => {
        let alignStyle = '';
        if (cell.align === 'center') alignStyle = ' style="text-align: center;"';
        else if (cell.align === 'right') alignStyle = ' style="text-align: right;"';
        else if (cell.align === 'left') alignStyle = ' style="text-align: left;"';
        return `<td${alignStyle}>${DOMPurify.sanitize(marked.parseInline(cell.text || ''))}</td>`;
      }).join('')}</tr>`;
    }).join('');
    
    return `<table class="cainsgl-markdown-table"><thead>${headersHtml}</thead><tbody>${rowsHtml}</tbody></table>`;
  } else {
    return `<table class="cainsgl-markdown-table">${header}${body}</table>`;
  }
};

// 自定义图片渲染器 - 创建一个特殊的占位符
let imageIdCounter = 0; // 用于生成自增ID
renderer.image = function ({ href, title, text }) {
  let src = href || '';
  const alt = text || '';
  const finalTitle = title || alt || '';

  let width = null;
  if (!src.startsWith('http')) {
    let res = extractImageSize(src)
    src=API_BASE_URL+'/file?f='+res.src
    width=res.width
  }
  const uniqueId = `arco-image-${++imageIdCounter}`;
  return `<span id="${uniqueId}" class="arco-image-placeholder" data-src="${src}" data-alt="${alt}" data-title="${finalTitle}" data-width="${width || ''}">Loading image...</span>`;
};

// 生成标题 ID 的辅助函数
const generateId = (text) => {
  // 移除 HTML 标签（如果有的话）
  const cleanText = text.replace(/<[^>]*>/g, '');
  // 移除特殊字符，转换为小写，用连字符连接
  return "cainsgl-titile-"+cleanText
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留字母、数字、中文、空格和连字符
    .replace(/[\s-]+/g, '-') // 多个空格或连字符替换为单个连字符
    .replace(/^-+|-+$/g, ''); // 去除开头和结尾的连字符
};

// 自定义标题渲染器 - 为标题添加 ID
renderer.heading = function (token) {
  const text = token.text || '';
  const level = token.depth || 1;
  const id = generateId(text);
  return `<h${level} id="${id}">${text}</h${level}>`;
};

// 自定义列表项渲染器 - 处理任务列表
renderer.listitem = function (token) {
  // 从token对象中提取内容和任务相关信息
  let text = token.text || '';
  const task = token.task || false;
  const checked = token.checked || false;
  
  let parsedText = marked(text);
  
  let content = parsedText;
  
  // 检查是否是任务列表项
  if (task) {
    const checkedAttribute = checked ? 'checked' : '';
    content = `
      <div class="cainsgl-task-list-item">
        <label class="cainsgl-task-list-checkbox">
          <input type="checkbox" ${checkedAttribute} disabled />
          <span class="cainsgl-task-list-checkmark"></span>
        </label>
        <span class="cainsgl-task-list-content">${content}</span>
      </div>
    `;
  }
  
  return `<li>${content}</li>`;
};

marked.setOptions({
  breaks: false,
  gfm: true,
  sanitize: true,
  smartLists: true,
  tasklists: true,  // 启用任务列表支持
  smartypants: false,
  xhtml: false,
  renderer: renderer
});

// 渲染 Markdown 内容
const renderedMarkdown = computed(() => {
  if (!props.content) return '';
  const rawHtml = marked(props.content);
  const clean = DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target']  
  });
  return clean;
});

// 在组件挂载和更新后处理动态组件占位符（图片和代码块）
const processDynamicComponents = async () => {
  await nextTick();
  if (previewContentRef.value) {
    // 处理图片占位符
    const imagePlaceholders = previewContentRef.value.querySelectorAll('.arco-image-placeholder');
    imagePlaceholders.forEach(placeholder => {
      let src = placeholder.getAttribute('data-src');
      const alt = placeholder.getAttribute('data-alt');
      const title = placeholder.getAttribute('data-title');
      let width = placeholder.getAttribute('data-width');

      // 创建一个容器来放置 Arco 图片组件
      const container = document.createElement('div');
      container.className = 'arco-image-container';
      placeholder.parentNode.replaceChild(container, placeholder);

      // 创建一个简单的 Vue 应用来渲染 Arco 图片组件
      const imageApp = createApp({
        render() {
          return h(AImage, {
            src: src,
            alt: alt,
            width: width ? parseInt(width) : undefined, // 如果有 width 属性，则使用它
            height: 'auto',
            fit: 'scale-down', // 使用 scale-down 模式，保持宽高比且不放大图片
            'show-loader': true,
            'lazy': true,
            preview: true,
            style: {
              borderRadius: '6px',
              margin: '16px 0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              maxWidth: '100%'
            }
          });
        }
      });

      // 挂载到容器
      imageApp.mount(container);
    });

    // 处理代码块占位符
    const codeBlockPlaceholders = previewContentRef.value.querySelectorAll('.code-block-placeholder');
    codeBlockPlaceholders.forEach(placeholder => {
      const code = decodeURIComponent(placeholder.getAttribute('data-code'));
      const language = placeholder.getAttribute('data-language');

      // 创建一个容器来放置 CodeBlock 组件
      const container = document.createElement('div');
      container.className = 'code-block-container';
      placeholder.parentNode.replaceChild(container, placeholder);

      const codeBlockApp = createApp({
        render() {
          return h(CodeBlock, {
            code: code,
            language: language
          });
        }
      });

      // 挂载到容器
      codeBlockApp.mount(container);
    });
  }
};

onMounted(() => {
  processDynamicComponents();
});

// 处理URL中的hash并平滑滚动到对应元素
const scrollToHashElement = () => {
  // 等待DOM更新完成
  nextTick(() => {
    const hash = window.location.hash;
    if (hash) {
      let elementId ="cainsgl-titile-"+ hash.substring(1); // 移除 # 号
      // 解码URL编码的ID，处理中文字符
      elementId = decodeURIComponent(elementId);
      const element = document.getElementById(elementId);
      if (element) {
        // 设置滚动标志，表示正在程序触发的滚动
        isScrollingToElement = true;
        
        // 使用平滑滚动到目标元素
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        
        // 在滚动结束后重置滚动标志
        setTimeout(() => {
          isScrollingToElement = false;
        }, 500); // 500ms应该足够完成平滑滚动
      }
    }
  });
};
let hashChangeCounter = 0; // 计数器，用于控制hashchange事件处理

// 添加滚动状态标志
let isScrollingToElement = false; // 标记是否正在滚动到元素（由程序触发，而非用户手动滚动）

// 自定义设置hash的函数，避免在程序滚动时修改hash
const setHash = (encodedTargetHash) => {
  // 只有在非滚动状态下才允许设置hash
  if (!isScrollingToElement) {
    hashChangeCounter++;
    window.location.hash = encodedTargetHash;
  }
};

// 监听hash变化事件
const handleHashChange = () => {
  if (hashChangeCounter > 0) {
    // 如果计数器大于0，减少计数器但不执行滚动逻辑
    hashChangeCounter--;
  } else {
    // 只有当计数器为0时，才执行滚动逻辑
    scrollToHashElement();
  }
};

// 滚动监听函数，检测当前可视区域的标题元素
const handleScroll = () => {
  if (!previewContainerRef.value || !previewContentRef.value) return;

  // 获取所有标题元素
  const headings = previewContentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (!headings.length) return;

  let currentHeading = null;
  const scrollPosition = previewContainerRef.value.scrollTop;

  // 遍历所有标题元素，找到当前可视区域内的标题
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const headingPosition = heading.offsetTop - previewContentRef.value.offsetTop;

    // 如果标题位置小于等于滚动位置，则认为是当前标题
    if (headingPosition <= scrollPosition) {
      currentHeading = heading;
    } else {
      // 如果下一个标题已经超过了滚动位置，则当前标题就是上一个标题
      break;
    }
  }

  if (currentHeading) {
    // 获取标题的ID
    const headingId = currentHeading.id;
    const targetHash = headingId.replace('cainsgl-titile-', '');
    const encodedTargetHash = encodeURIComponent(targetHash);
    if (headingId && window.location.hash !== `#${encodedTargetHash}`) {
      // 使用自定义setHash函数，避免在程序滚动时修改hash
      setHash(encodedTargetHash);
    }
  }
};

onMounted(() => {
  processDynamicComponents();
  // 组件挂载后检查是否有hash，如果有则滚动到对应元素
  scrollToHashElement();
  // 添加hash变化监听器
  window.addEventListener('hashchange', handleHashChange);
  // 添加滚动监听器
  if (previewContainerRef.value) {
    previewContainerRef.value.addEventListener('scroll', handleScroll);
  }
});

onUpdated(() => {
  processDynamicComponents();
  // 组件更新后也检查hash，以防内容变化导致元素重新渲染
  scrollToHashElement();
});

// 在组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange);
  // 移除滚动监听器
  if (previewContainerRef.value) {
    previewContainerRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style lang="less">
.cainsgl-markdown-code-block{

  .hljs {
    color: #24292e;
    background: #ffffff;
  }
  .hljs-doctag,
  .hljs-keyword,
  .hljs-meta .hljs-keyword,
  .hljs-template-tag,
  .hljs-template-variable,
  .hljs-type,
  .hljs-variable.language_ {
    color: #d73a49; /* 关键字红色 */
  }
  .hljs-title,
  .hljs-title.class_,
  .hljs-title.class_.inherited__,
  .hljs-title.function_ {
    color: #6f42c1; /* 函数/类名紫色 */
  }
  .hljs-attr,
  .hljs-attribute,
  .hljs-literal,
  .hljs-meta,
  .hljs-number,
  .hljs-operator,
  .hljs-variable,
  .hljs-selector-attr,
  .hljs-selector-class,
  .hljs-selector-id {
    color: #005cc5; /* 属性、常量蓝色 */
  }
  .hljs-regexp,
  .hljs-string,
  .hljs-meta .hljs-string {
    color: #032f62; /* 字符串蓝色 */
  }
  .hljs-built_in,
  .hljs-symbol {
    color: #e36209; /* 内建函数橙色 */
  }
  .hljs-comment,
  .hljs-code,
  .hljs-formula {
    color: #6a737d; /* 注释灰色 */
  }
  .hljs-name,
  .hljs-quote,
  .hljs-selector-tag,
  .hljs-selector-pseudo {
    color: #22863a; /* 标签名绿色 */
  }
  .hljs-subst {
    color: #24292e; /* 替换文本 */
  }
  .hljs-section {
    color: #005cc5;
    font-weight: bold;
  }
  .hljs-bullet {
    color: #735c0f; /* 列表标记 */
  }
  .hljs-emphasis {
    color: #24292e;
    font-style: italic;
  }
  .hljs-strong {
    color: #24292e;
    font-weight: bold;
  }
  .hljs-addition {
    color: #22863a;
    background-color: #f0fff4;
  }
  .hljs-deletion {
    color: #b31d28;
    background-color: #ffeef0;
  }
}



.cainsgl {
  &-markdown-preview {
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  &-preview-content {
    padding: 16px;
    line-height: 1.6;
    font-size: 16px;
    color: #333;

    & .cainsgl-markdown-code {
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        font-size: 0.9em;
        background-color: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
      }
      
      & .code-block-container {
        margin: 16px 0;
      }

    & .cainsgl-markdown-blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      border-left: 4px solid @primary-4;
      background-color: #f9fafb;
      color: #4b5563;
      border-radius: 0 4px 4px 0;
      position: relative;
    }

    & .cainsgl-markdown-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 0.9em;
      font-family: inherit;
      background-color: #fff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      th,
      td {
        padding: 8px 12px;
        text-align: left;
        border: 1px solid #d1d5db;
        word-wrap: break-word;
        white-space: normal;
      }

      th {
        background-color: #f3f4f6;
        font-weight: 600;
        color: #374151;
      }

      tr:nth-child(even) {
        background-color: #f9fafb;
      }


    }

    & .cainsgl-markdown-image {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 16px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
    
    & .cainsgl-task-list-item {
      display: flex;
      align-items: flex-start;
      margin: 8px 0;
      
      & .cainsgl-task-list-checkbox {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        margin-top: 4px; // 垂直对齐文本
        cursor: default; // 使用默认光标
        
        & input[type="checkbox"] {
          display: none; // 隐藏原生复选框
          
          & + .cainsgl-task-list-checkmark {
            display: inline-block;
            width: 14px;  // 减小宽度
            height: 14px; // 减小高度
            border: 1px solid #d1d5db;
            border-radius: 3px;
            position: relative;
            cursor: default; // 使用默认光标
            transition: all 0.2s ease;
            
            &:after {
              content: "";
              position: absolute;
              display: none;
              left: 3px;
              top: 0px;
              width: 4px;
              height: 7px;
              border: solid white;
              border-width: 0 1px 1px 0;
              transform: rotate(45deg);
            }
          }
          
          &:checked + .cainsgl-task-list-checkmark {
            background-color: #3b82f6;
            border-color: #3b82f6;
            
            &:after {
              display: block;
            }
          }
        }
      }
      
      & .cainsgl-task-list-content {
        flex: 1;
        line-height: 1.6;
        
        & p {
          margin: 0;
          padding: 0;
          display: inline-block;
          vertical-align: top;
          line-height: 1.6;
        }
      }
      
      & input[type="checkbox"]:checked + .cainsgl-task-list-checkmark + .cainsgl-task-list-content {
        text-decoration: line-through;
        color: #9ca3af;
      }
    }
  }
}
</style>