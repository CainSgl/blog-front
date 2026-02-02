<template>

  <div ref="previewContainerRef" class="cainsgl-markdown-preview">
    
    <div ref="previewContentRef"  class="cainsgl-preview-content"
      v-html="renderedMarkdown" />
      <div v-if="!renderedMarkdown&&content">
          正在将服务器的数据渲染出来！
      </div>
      <slot></slot>
  </div>
</template>

<script setup>
import {computed, createApp, defineProps, h, nextTick, onMounted, onUnmounted, onUpdated, ref, watch} from 'vue';
import {marked} from 'marked';
import DOMPurify from 'dompurify';
import 'highlight.js/styles/github.css';
import ArcoVue, {Image as AImage} from '@arco-design/web-vue';
import CodeBlock from './common/CodeBlock.vue';
import CommentableParagraph from '../comment/CommentableParagraph.vue';
import {API_BASE_URL} from '@/config';
import containerExtension from '@/plugins/md-tip-info-extens.js';
import {useTocStore} from './common/toc/toc.js';
import {storeToRefs} from 'pinia';
// 使用 marked 的 use 方法注册扩展
marked.use({
  extensions: [containerExtension]
});



const extractImageSize = (src) => 
{
  if (!src || typeof src !== 'string') 
  {
    return {
      src: src,
      width: null
    };
  }
  const widthMatch = src.match(/^(.+?)(?:\?|&)(width=\d+)$/);
  let width = null;

  if (widthMatch) 
  {
    // 提取 width 值
    const widthValue = widthMatch[2].substring(6);
    width = parseInt(widthValue, 10);
    const maxWidth = 1200;
    if (width && width > maxWidth) 
    {
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

  showComment: {
    type: Boolean,
    default: true
  },
  useWindowScroll: {
    type: Boolean,
    default: false
  }
});

const previewContentRef = ref(null);
const previewContainerRef = ref(null);

// 标记是否正在程序触发的滚动
let isScrollingToElement = false;

// 使用toc store
const tocStore = useTocStore();
const { currentTocItem,toHashItem } = storeToRefs(tocStore);

const renderer = new marked.Renderer();

// 用于生成 p 标签的自增ID
let paragraphIdCounter = 0;
renderer.paragraph = function (obj) 
{
  // 检查是否为图片段落或未启用评论功能
  if (obj.tokens[0].type === 'image' || !props.showComment) 
  {
    return `<p>${this.parser.parseInline(obj.tokens)}</p>`;
  }
  else 
  {
    const commentId = ++paragraphIdCounter;
    return `<div id="commentable-paragraph-${commentId}" class="commentable-paragraph-placeholder" data-text="${encodeURIComponent(this.parser.parseInline(obj.tokens))}" data-comment-id="${commentId}">Loading paragraph...</div>`;
  }

};

// 自定义代码块渲染器 - 创建一个特殊的占位符 
let codeBlockIdCounter = 0; // 用于生成自增ID
renderer.code = function (code, language) 
{
  let codeText, lang;
  if (typeof code === 'object' && code !== null) 
  {
    codeText = code.text || '';
    lang = code.lang || language;
  }
  else 
  {
    codeText = code || '';
    lang = language;
  }

  const uniqueId = `code-block-${++codeBlockIdCounter}`;

  return `<div id="${uniqueId}" class="code-block-placeholder" data-code="${encodeURIComponent(codeText)}" data-language="${lang || ''}">Loading code block...</div>`;
};

renderer.blockquote = function (quote) 
{
  // 处理换行符，将换行符替换为 <br> 标签，同时保持段落结构
  const processedText = quote.text
    .replace(/\r\n/g, '<br>')
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '<br>');
  return `<blockquote class="cainsgl-markdown-blockquote">${processedText}</blockquote>`;
};

renderer.link = function (href) 
{
  // 判断是否为外部链接
  let finalHref = href.href;
  let isExternal = false;

  try 
  {
    const url = new URL(href.href, window.location.origin);
    // 如果链接的域名与当前域名不同，则使用跳转页面
    if (url.origin !== window.location.origin) 
    {
      isExternal = true;
      finalHref = `/redirect?url=${encodeURIComponent(href.href)}`;
    }
  }
  catch (e) 
  {
    // 如果 URL 格式不正确，也使用跳转页面
    isExternal = true;
    finalHref = `/redirect?url=${encodeURIComponent(href.href)}`;
  }

  // 仅对外部链接使用 target="_blank"，内部链接直接跳转
  if (isExternal) 
  {
    return `<a class="arco-link arco-link-status-normal" href="${finalHref}" target="_blank" rel="noopener noreferrer">${href.text}</a>`;
  }
  else 
  {
    return `<a class="arco-link arco-link-status-normal" href="${href.href}">${href.text}</a>`;
  }
};

// 自定义表格渲染器
renderer.table = function (header, body) 
{
  // 检查 header 是否为对象结构（包含 header 和 rows 属性）
  if (header && typeof header === 'object' && header.header && header.rows) 
  {
    // 构建表头
    const headersHtml = `<tr>${header.header.map(h => 
    {
      let alignStyle = '';
      if (h.align === 'center') alignStyle = ' style="text-align: center;"';
      else if (h.align === 'right') alignStyle = ' style="text-align: right;"';
      else if (h.align === 'left') alignStyle = ' style="text-align: left;"';
      return `<th${alignStyle}>${DOMPurify.sanitize(marked.parseInline(h.text || ''))}</th>`;
    }).join('')}</tr>`;

    // 构建表体
    const rowsHtml = header.rows.map(row => 
    {
      return `<tr>${row.map(cell => 
      {
        let alignStyle = '';
        if (cell.align === 'center') alignStyle = ' style="text-align: center;"';
        else if (cell.align === 'right') alignStyle = ' style="text-align: right;"';
        else if (cell.align === 'left') alignStyle = ' style="text-align: left;"';
        return `<td${alignStyle}>${DOMPurify.sanitize(marked.parseInline(cell.text || ''))}</td>`;
      }).join('')}</tr>`;
    }).join('');

    return `<table class="cainsgl-markdown-table"><thead>${headersHtml}</thead><tbody>${rowsHtml}</tbody></table>`;
  }
  else 
  {
    return `<table class="cainsgl-markdown-table">${header}${body}</table>`;
  }
};

// 自定义图片渲染器 - 创建一个特殊的占位符
let imageIdCounter = 0; // 用于生成自增ID
renderer.image = function ({ href, title, text }) 
{
  let src = href || '';
  const alt = text || '';
  const finalTitle = title || alt || '';

  let width = null;
  if (!src.startsWith('http')) 
  {
    let res = extractImageSize(src);
    src = API_BASE_URL + '/file?f=' + res.src;
    width = res.width;
  }
  const uniqueId = `arco-image-${++imageIdCounter}`;
  return `<span id="${uniqueId}" class="arco-image-placeholder" data-src="${src}" data-alt="${alt}" data-title="${finalTitle}" data-width="${width || ''}">Loading image...</span>`;
};

// 生成标题 ID 的辅助函数
const generateId = (text) => 
{
  // 移除 HTML 标签（如果有的话）
  const cleanText = text.replace(/<[^>]*>/g, '');
  // 移除特殊字符，转换为小写，用连字符连接
  return 'cainsgl-titile-' + cleanText
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留字母、数字、中文、空格和连字符
    .replace(/[\s-]+/g, '-') // 多个空格或连字符替换为单个连字符
    .replace(/^-+|-+$/g, ''); // 去除开头和结尾的连字符
};

// 用于跟踪已使用的标题 ID，确保唯一性
const usedHeadingIds = new Map(); // key: baseId, value: count

// 自定义标题渲染器 - 为标题添加 ID
renderer.heading = function (token) 
{
  const text = token.text || '';
  const level = token.depth || 1;
  const baseId = generateId(text);
  
  // 确保 ID 唯一性
  let id = baseId;
  if (usedHeadingIds.has(baseId)) 
  {
    const count = usedHeadingIds.get(baseId);
    usedHeadingIds.set(baseId, count + 1);
    id = `${baseId}-${count}`;
  }
  else 
  {
    usedHeadingIds.set(baseId, 1);
  }
  
  return `<h${level} id="${id}">${text}</h${level}>`;
};

// 自定义列表项渲染器 - 处理任务列表
renderer.listitem = function (token) 
{
  // 从token对象中提取内容和任务相关信息
  let text = token.text || '';
  const task = token.task || false;
  const checked = token.checked || false;

  let parsedText = marked(text);

  let content = parsedText;

  // 检查是否是任务列表项
  if (task) 
  {
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
const renderedMarkdown = computed(() => 
{
  if (!props.content) return '';
  // 每次渲染前重置段落ID计数器和标题ID计数器
  paragraphIdCounter = 0;
  usedHeadingIds.clear();
  const preFix=`<div></div>`
  const reallyContent=preFix+props.content

  const rawHtml = marked(reallyContent);
  let clean = DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target']
  });
  //增加一个底部的高度适配按钮
  clean+='<div style="height:40px;"></div>'
  return clean;
});

// 在组件挂载和更新后处理动态组件占位符（图片、代码块和评论段落）
const processDynamicComponents = async () => 
{
  await nextTick();
  if (previewContentRef.value) 
  {
    // 处理图片占位符
    const imagePlaceholders = previewContentRef.value.querySelectorAll('.arco-image-placeholder');
    imagePlaceholders.forEach(placeholder => 
    {
      let src = placeholder.getAttribute('data-src');
      const alt = placeholder.getAttribute('data-alt');
      const title = placeholder.getAttribute('data-title');
      let width = placeholder.getAttribute('data-width');

      // Arco 图片组件
      const container = document.createElement('div');
      container.className = 'arco-image-container';
      placeholder.parentNode.replaceChild(container, placeholder);

      // 渲染 Arco 图片组件
      const imageApp = createApp({
        render() 
        {
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
    codeBlockPlaceholders.forEach(placeholder => 
    {
      const code = decodeURIComponent(placeholder.getAttribute('data-code'));
      const language = placeholder.getAttribute('data-language');

      // 创建一个容器来放置 CodeBlock 组件
      const container = document.createElement('div');
      container.className = 'code-block-container';
      placeholder.parentNode.replaceChild(container, placeholder);

      const codeBlockApp = createApp({
        render() 
        {
          return h(CodeBlock, {
            code: code,
            language: language
          });
        }
      });

      // 挂载到容器
      codeBlockApp.mount(container);
    });

    // 处理评论段落占位符
    if (props.showComment) 
    {
      const paragraphPlaceholders = previewContentRef.value.querySelectorAll('.commentable-paragraph-placeholder');
      paragraphPlaceholders.forEach(placeholder => 
      {
        const text = placeholder.getAttribute('data-text');
        const commentId = parseInt(placeholder.getAttribute('data-comment-id'));

        // 创建一个容器来放置 CommentableParagraph 组件
        const container = document.createElement('div');
        container.className = 'commentable-paragraph-container';
        placeholder.parentNode.replaceChild(container, placeholder);

        const paragraphApp = createApp({
          render() 
          {
            return h(CommentableParagraph, {
              text: decodeURIComponent(text),
              commentId: commentId,
              showComment: props.showComment
            });
          }
        });
        paragraphApp.use(ArcoVue);
        // 挂载到容器
        paragraphApp.mount(container);
      });
    }
  }
};

watch(toHashItem, (newValue, oldValue) => 
{
  console.log(currentTocItem.value);
  scrollToTocElement();
});

onMounted(() => 
{
  processDynamicComponents();
});

// 根据toc store中的状态滚动到对应元素
const scrollToTocElement = () => 
{
  // 等待DOM更新完成
  nextTick(() => 
  {
    const elementId = currentTocItem.value;
    if (elementId) 
    {
      // elementId 现在已经是完整的 ID（包含 cainsgl-titile- 前缀），不需要再添加
      let targetId = elementId;
      // 解码URL编码的ID，处理中文字符
      targetId = decodeURIComponent(targetId);
      const element = document.getElementById(targetId);
      if (element && previewContainerRef.value) 
      {
        if (props.useWindowScroll) 
        {
          // 设置滚动标志，表示正在程序触发的滚动
          isScrollingToElement = true;
          // 使用直接跳转到目标元素
          element.scrollIntoView({
            behavior: 'auto',
            block: 'start'
          });
          // 添加视觉提示效果
          addVisualHighlight(element);
          // 立即重置滚动标志
          isScrollingToElement = false;
          return;
        }
        // 设置滚动标志，表示正在程序触发的滚动
        isScrollingToElement = true;
        // 计算元素在预览容器中的位置
        const elementTop = element.offsetTop - previewContentRef.value.offsetTop;
        // 滚动到元素位置，使其位于容器顶部附近
        previewContainerRef.value.scrollTo({
          top: elementTop - 20, // 留出20px的顶部边距
          behavior: 'auto'
        });

        // 添加视觉提示效果
        addVisualHighlight(element);
        // 立即重置滚动标志
        isScrollingToElement = false;

      }
    }
  });
};

// 添加视觉提示效果
const addVisualHighlight = (element) => 
{
  // 添加临时的高亮类
  element.classList.add('cainsgl-highlight-target');

  // 3秒后移除高亮效果
  setTimeout(() => 
  {
    element.classList.remove('cainsgl-highlight-target');
  }, 3000);
};


// 滚动监听函数，检测当前可视区域的标题元素
const handleScroll = () => 
{

  if (!previewContainerRef.value || !previewContentRef.value) return;

  // 获取所有标题元素
  const headings = previewContentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (!headings.length) return;

  let currentHeading = null;
  const scrollTop = previewContainerRef.value.scrollTop;

  // 遍历所有标题元素，找到当前可视区域内的标题
  for (let i = 0; i < headings.length; i++) 
  {
    const heading = headings[i];
    // 计算标题相对于容器的偏移位置
    const headingTop = heading.offsetTop - previewContentRef.value.offsetTop;
    // 计算标题相对于滚动容器的可视位置
    const relativeTop = headingTop - scrollTop;

    // 如果标题位置在可视区域内或接近可视区域顶部，则认为是当前标题
    if (relativeTop <= 100) 
    { // 给一个100px的容差范围
      currentHeading = heading;
    }
    else 
    {
      // 如果下一个标题已经超过了可视区域，则当前标题就是上一个标题
      break;
    }
  }

  if (currentHeading) 
  {
    // 获取标题的ID（现在 ID 已经是完整的，包含 cainsgl-titile- 前缀）
    const headingId = currentHeading.id;
    if (headingId) 
    {
      // 直接使用完整的 ID，不需要移除前缀
      tocStore.setCurrentTocItem(headingId);
    }
  }
};



onMounted(() => 
{
  // 初始化toc store，从URL hash获取初始值
  tocStore.initializeFromUrl();
  
  processDynamicComponents();
  // 组件挂载后检查toc store中是否有值，如果有则滚动到对应元素
  scrollToTocElement();
  // 添加滚动监听器到预览容器
  if (previewContainerRef.value) 
  {
    previewContainerRef.value.addEventListener('scroll', handleScroll);
  }
});

onUpdated(() => 
{
  processDynamicComponents();
});

// 滚动到顶部或底部的方法
const scrollToTopOrBottom = (isBottom) => 
{

  isScrollingToElement = true;
  if (previewContainerRef.value) 
  {
    if (isBottom) 
    {
      // 直接跳转到底部
      previewContainerRef.value.scrollTo({
        top: previewContainerRef.value.scrollHeight,
        behavior: 'auto'
      });
    }
    else 
    {
      // 直接跳转到顶部
      previewContainerRef.value.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }
  setTimeout(() => 
  {
    isScrollingToElement = false;
  }, 3000);
};

// 监听 showComment 属性变化，重新处理动态组件
watch(() => props.showComment, async (newShowComment) => 
{
  if (newShowComment) 
  {
    // 当启用评论功能时，重新处理动态组件以确保评论段落被正确渲染
    await nextTick();
    processDynamicComponents();
  }
}, { immediate: false });

// 在组件卸载时移除事件监听器
onUnmounted(() => 
{
  // 移除预览容器的滚动监听器
  if (previewContainerRef.value) 
  {
    previewContainerRef.value.removeEventListener('scroll', handleScroll);
  }

});

// 暴露方法给父组件
defineExpose({
  scrollToTopOrBottom
});
</script>

<style lang="less">
.cainsgl-preview-content {
  overflow-x: hidden;
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
    color: var(--color-neutral-10);

    & .cainsgl-custom-container {
      margin: 20px 0;
      border-radius: 8px;
      overflow: hidden;

      & .cainsgl-container-title {
        padding: 12px 16px;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;

        &::before {
          margin-right: 8px;
          font-weight: bold;
        }
      }

      & .cainsgl-container-content {
        padding: 16px;

        &>p:first-child {
          margin-top: 0;
        }

        &>p:last-child {
          margin-bottom: 0;
        }
      }

      &.cainsgl-container-info {
        background-color: @link-1;

        & .cainsgl-container-title {
          background-color: @link-2;
          color: @link-7;

        }
      }

      &.cainsgl-container-tip {
        background-color: @success-1;

        & .cainsgl-container-title {
          background-color: @success-2;
          color: @success-7;


        }
      }

      &.cainsgl-container-warning {
        background-color: @warning-1;

        & .cainsgl-container-title {
          background-color: @warning-2;
          color: @warning-7;

        }
      }

      &.cainsgl-container-danger {
        background-color: @danger-1;

        & .cainsgl-container-title {
          background-color: @danger-2;
          color: @danger-7;


        }
      }

      &.cainsgl-container-details {
        border: 1px solid @color-border-1;
        background-color: @color-fill-1;

        & .cainsgl-container-title {
          background-color: @color-fill-2;
          color: var(--color-neutral-10);


        }
      }
    }


    & .cainsgl-markdown-code {
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 0.9em;
      background-color: @color-fill-2;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid @color-border-1;
    }

    & .code-block-container {
      margin: 16px 0;
    }

    & .cainsgl-markdown-blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      border-left: 4px solid @primary-4;
      background-color: @color-fill-1;
      color: var(--color-neutral-8);
      border-radius: 0 4px 4px 0;
      position: relative;
    }

    & .cainsgl-markdown-table {

      border-collapse: collapse;
      margin: 16px 0;
      font-size: 0.9em;
      font-family: inherit;
      background-color: @color-bg-white;

      border-radius: 6px;


      th,
      td {
        padding: 8px 12px;
        text-align: left;
        border: 1px solid @color-border-2;
        word-wrap: break-word;
        white-space: normal;
      }

      th {
        background-color: @color-fill-2;
        font-weight: 600;
        color: var(--color-neutral-10);
      }

      tr:nth-child(even) {
        background-color: @color-fill-1;
      }


    }

    & .cainsgl-markdown-image {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 16px 0;
      box-shadow: @shadow2-center;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: @shadow3-center;
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

          &+.cainsgl-task-list-checkmark {
            display: inline-block;
            width: 14px; // 减小宽度
            height: 14px; // 减小高度
            border: 1px solid @color-border-2;
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

          &:checked+.cainsgl-task-list-checkmark {
            background-color: @link-5;
            border-color: @link-5;

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

      & input[type="checkbox"]:checked+.cainsgl-task-list-checkmark+.cainsgl-task-list-content {
        text-decoration: line-through;
        color: var(--color-neutral-6);
      }
    }

    // 高亮目标元素的样式
    & .cainsgl-highlight-target {
      animation: highlightAnimation 2s ease;
    }
  }
}

@keyframes highlightAnimation {
  0% {
    background-color: transparent;
  }

  25% {
    background-color: fade(yellow, 50%);
  }

  50% {
    background-color: fade(yellow, 50%);
  }

  100% {
    background-color: transparent;
  }
}
</style>