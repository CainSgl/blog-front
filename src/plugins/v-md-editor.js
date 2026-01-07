import VMdEditor from '@kangc/v-md-editor';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';
import {API_BASE_URL} from '@/config/index'

// Plugins
import createTipPlugin from '@kangc/v-md-editor/lib/plugins/tip/index';
import '@kangc/v-md-editor/lib/plugins/tip/tip.css';
import createEmojiPlugin from '@kangc/v-md-editor/lib/plugins/emoji/index';
import '@kangc/v-md-editor/lib/plugins/emoji/emoji.css';
import createKatexPlugin from '@kangc/v-md-editor/lib/plugins/katex/npm.js';
import createMermaidPlugin from '@kangc/v-md-editor/lib/plugins/mermaid/npm.js';
import '@kangc/v-md-editor/lib/plugins/mermaid/mermaid.css';
import createTodoListPlugin from '@kangc/v-md-editor/lib/plugins/todo-list/index';
import '@kangc/v-md-editor/lib/plugins/todo-list/todo-list.css';
import createLineNumbertPlugin from '@kangc/v-md-editor/lib/plugins/line-number/index';
import createHighlightLinesPlugin from '@kangc/v-md-editor/lib/plugins/highlight-lines/index';
import '@kangc/v-md-editor/lib/plugins/highlight-lines/highlight-lines.css';
import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index';
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css';
import createAlignPlugin from '@kangc/v-md-editor/lib/plugins/align';
// External libraries
import katex from 'katex';
import mermaid from 'mermaid';

// highlight.js
import hljs from 'highlight.js';

// 使用主题并自定义渲染器
VMdEditor.use(vuepressTheme, {
  hljs,
  extend(md) {
    // 启用HTML标签支持
    md.set({
      html: true,
      linkify: true,
      breaks: true
    });
    
    // 自定义列表项渲染 - 处理任务列表
    const defaultListItem = md.renderer.rules.list_item_open;
    md.renderer.rules.list_item_open = function (tokens, idx, options, env, renderer) {
      const contentToken = tokens[idx + 1];
      
      // 检查是否是任务列表项
      if (contentToken && contentToken.type === 'inline') {
        const content = contentToken.content || '';
        // 检查是否包含任务列表标记
        if (content.includes('[ ] ') || content.includes('[x] ') || content.includes('[X] ')) {
          // 提取任务内容并创建自定义HTML
          let taskContent = content;
          let checked = false;
          
          if (content.startsWith('[x] ') || content.startsWith('[X] ')) {
            checked = true;
            taskContent = content.substring(4); // 移除 [x] 或 [X] 
          } else if (content.startsWith('[ ] ')) {
            taskContent = content.substring(4); // 移除 [ ]
          }
          
          const checkedAttribute = checked ? 'checked' : '';
          return `
            <li class="cainsgl-task-list-item-container">
              <div class="cainsgl-task-list-item">
                <label class="cainsgl-task-list-checkbox">
                  <input type="checkbox" ${checkedAttribute} disabled />
                  <span class="cainsgl-task-list-checkmark"></span>
                </label>
                <span class="cainsgl-task-list-content">${taskContent}</span>
              </div>
            </li>`;
        }
      }
      
      if (defaultListItem) {
        return defaultListItem(tokens, idx, options, env, renderer);
      }
      return '<li>';
    };
    
    // 提取图片尺寸的辅助函数
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
        src = widthMatch[1]; // 基础路径
        width = widthMatch[2]; // 宽度参数，如 "width=300"
      }
      
      return {
        src: src,
        width: width
      };
    };

    // 自定义图片渲染
    const defaultRender = md.renderer.rules.image;
    md.renderer.rules.image = function (tokens, idx, options, env, renderer) {
      const token = tokens[idx];
      let src = token.attrGet('src');
      const alt = token.attrGet('alt');
      const title = token.attrGet('title');
      
      // 使用与MarkdownPreview.vue相同的图片处理逻辑
      if (src && !src.startsWith('http')) {
        // 处理本地图片路径
        let res = extractImageSize(src);
        src = API_BASE_URL + '/file?f=' + res.src;
        
        // 解析宽度值
        let widthValue = null;
        if (res.width) {
          const widthMatch = res.width.match(/width=(\d+)/);
          if (widthMatch) {
            widthValue = widthMatch[1];
          }
        }
        
        // 直接渲染带有宽度属性的图片标签
        let widthAttr = widthValue ? ` width="${widthValue}"` : '';
        let styleAttr = widthValue ? ` style="max-width: ${widthValue}px;"` : ' style="max-width: 100%;"';
        
        return `<img src="${src}" alt="${alt || ''}" title="${title || alt || ''}"${widthAttr}${styleAttr} class="cainsgl-markdown-image" />`;
      }
      
      // 使用默认渲染
      return defaultRender(tokens, idx, options, env, renderer);
    };
    
    // 自定义引用块渲染
    const defaultBlockquote = md.renderer.rules.blockquote_open;
    md.renderer.rules.blockquote_open = function (tokens, idx, options, env, renderer) {
      let token = tokens[idx];
      token.attrSet('class', 'cainsgl-markdown-blockquote');
      if (defaultBlockquote) {
        return defaultBlockquote(tokens, idx, options, env, renderer);
      }
      return '<blockquote class="cainsgl-markdown-blockquote">';
    };
    
    // 自定义表格渲染 - 处理表格开始标签
    md.renderer.rules.table_open = function (tokens, idx, options, env, renderer) {
      return '<table class="cainsgl-markdown-table">';
    };
    
    // 自定义表格渲染 - 处理表格结束标签
    md.renderer.rules.table_close = function (tokens, idx, options, env, renderer) {
      return '</table>';
    };
    
    // 自定义表格行渲染 - 支持单元格对齐
    const defaultTROpen = md.renderer.rules.tr_open;
    md.renderer.rules.tr_open = function (tokens, idx, options, env, renderer) {
      if (defaultTROpen) {
        return defaultTROpen(tokens, idx, options, env, renderer);
      }
      return '<tr>';
    };
    
    const defaultTRClose = md.renderer.rules.tr_close;
    md.renderer.rules.tr_close = function (tokens, idx, options, env, renderer) {
      if (defaultTRClose) {
        return defaultTRClose(tokens, idx, options, env, renderer);
      }
      return '</tr>';
    };
    
    // 自定义表格单元格渲染 - 支持对齐
    const defaultTHeadOpen = md.renderer.rules.th_open;
    md.renderer.rules.th_open = function (tokens, idx, options, env, renderer) {
      // 获取对齐信息
      const token = tokens[idx];
      const alignMatch = token.attrGet('style')?.match(/text-align:\s*(left|center|right)/);
      const align = alignMatch ? alignMatch[1] : null;
      
      let style = '';
      if (align) {
        style = ` style="text-align: ${align};"`;
      }
      
      // 获取现有的class属性
      const existingClass = token.attrGet('class') || '';
      const classAttr = existingClass ? ` class="${existingClass}"` : '';
      
      return `<th${classAttr}${style}>`;
    };
    
    const defaultTHeadClose = md.renderer.rules.th_close;
    md.renderer.rules.th_close = function (tokens, idx, options, env, renderer) {
      if (defaultTHeadClose) {
        return defaultTHeadClose(tokens, idx, options, env, renderer);
      }
      return '</th>';
    };
    
    const defaultTBodyOpen = md.renderer.rules.td_open;
    md.renderer.rules.td_open = function (tokens, idx, options, env, renderer) {
      // 获取对齐信息
      const token = tokens[idx];
      const alignMatch = token.attrGet('style')?.match(/text-align:\s*(left|center|right)/);
      const align = alignMatch ? alignMatch[1] : null;
      
      let style = '';
      if (align) {
        style = ` style="text-align: ${align};"`;
      }
      
      // 获取现有的class属性
      const existingClass = token.attrGet('class') || '';
      const classAttr = existingClass ? ` class="${existingClass}"` : '';
      
      return `<td${classAttr}${style}>`;
    };
    
    const defaultTBodyClose = md.renderer.rules.td_close;
    md.renderer.rules.td_close = function (tokens, idx, options, env, renderer) {
      if (defaultTBodyClose) {
        return defaultTBodyClose(tokens, idx, options, env, renderer);
      }
      return '</td>';
    };
    
    // 自定义标题渲染，添加ID
    const defaultHeading = md.renderer.rules.heading_open;
    md.renderer.rules.heading_open = function (tokens, idx, options, env, renderer) {
      const level = tokens[idx].tag.substr(1);
      const contentToken = tokens[idx + 1];
      const text = contentToken.content;
      
      // 生成ID，与MarkdownPreview.vue保持一致
      const cleanText = text.replace(/<[^>]*>/g, '');
      const id = "cainsgl-titile-" + cleanText
        .toLowerCase()
        .trim()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留字母、数字、中文、空格和连字符
        .replace(/[\s-]+/g, '-') // 多个空格或连字符替换为单个连字符
        .replace(/^-+|-+$/g, ''); // 去除开头和结尾的连字符
      
      if (defaultHeading) {
        const result = defaultHeading(tokens, idx, options, env, renderer);
        return result.replace(/<h\d/, `<h${level} id="${id}"`);
      }
      return `<h${level} id="${id}">`;
    };
    
    // 自定义链接渲染
    const defaultLinkOpen = md.renderer.rules.link_open;
    
    // 保存链接的href和内容，用于在link_close时处理
    let currentLinkHref = '';
    
    md.renderer.rules.link_open = function (tokens, idx, options, env, renderer) {
      const token = tokens[idx];
      const hrefIndex = token.attrIndex('href');
      if (hrefIndex >= 0) {
        const href = token.attrs[hrefIndex][1];
        currentLinkHref = href; // 保存当前链接的href
        
        let isExternal = false;
        
        try {
          const url = new URL(href, window.location.origin);
          // 如果链接的域名与当前域名不同，则使用跳转页面
          if (url.origin !== window.location.origin) {
            isExternal = true;
          }
        } catch (e) {
          // 如果 URL 格式不正确，也认为是外部链接
          isExternal = true;
        }
        
        // 仅对外部链接添加 target="_blank" 和 rel="noopener noreferrer"
        if (isExternal) {
          token.attrSet('class', 'arco-link arco-link-status-normal');
          token.attrSet('target', '_blank');
          token.attrSet('rel', 'noopener noreferrer');
          if (!href.startsWith('http')) {
            // 对于相对路径的外部链接，使用跳转页面
            token.attrSet('href', `/redirect?url=${encodeURIComponent(href)}`);
          }
        } else {
          token.attrSet('class', 'arco-link arco-link-status-normal');
        }
      }
      
      if (defaultLinkOpen) {
        return defaultLinkOpen(tokens, idx, options, env, renderer);
      }
      return '<a>';
    };
 
    md.renderer.rules.fence = function (tokens, idx, options, env, renderer) {
      const token = tokens[idx];
      const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
      let langName = '';
      
      if (info) {
        langName = info.split(/\s+/g)[0];
      }
      
      const code = token.content;
      
      // 使用highlight.js进行语法高亮
      let highlightedCode = code;
      if (langName && hljs.getLanguage(langName)) {
        try {
          highlightedCode = hljs.highlight(code, { language: langName }).value;
        } catch (e) {
          // 如果高亮失败，使用原始代码
          highlightedCode = code;
        }
      } else {
        // 尝试自动检测语言
        try {
          highlightedCode = hljs.highlightAuto(code).value;
        } catch (e) {
          highlightedCode = code;
        }
      }
      
      // 返回带有语法高亮的代码块，使用与CodeBlock.vue和MarkdownEditor.vue相同的类名
      return `<div class="cainsgl-code-container">
        <div class="cainsgl-code-header">
          <div class="cainsgl-code-title">${langName || 'text'}</div>
          <div class="cainsgl-code-actions">
          </div>
        </div>
        <div class="cainsgl-code-block-wrapper">
          <pre class="cainsgl-code-block"><code class="hljs language-${langName}">${highlightedCode}</code></pre>
        </div>
      </div>`;
    };
  }
});

// 使用插件
VMdEditor.use(createTipPlugin({ name: 'tip-plugin' }));
VMdEditor.use(createEmojiPlugin());
VMdEditor.use(createKatexPlugin({ katex }));
VMdEditor.use(createMermaidPlugin({ mermaid }));
VMdEditor.use(createTodoListPlugin());
VMdEditor.use(createLineNumbertPlugin());
VMdEditor.use(createHighlightLinesPlugin());
VMdEditor.use(createCopyCodePlugin());
VMdEditor.use(createAlignPlugin());

export default VMdEditor;