import {marked} from 'marked';

// 全局计数器，用于生成唯一的 share 文件 ID
let globalShareIdCounter = 0;

const containerExtension = {
  name: 'container',
  level: 'block',
  start(src) 
  { 
    const match = src.match(/^:::[a-z][a-z0-9-]*\s*.*/);
    return match ? match.index : -1;
  },
  tokenizer(src) 
  {
    const rule = /^:::([a-z][a-z0-9-]*)\s*(.*)?\n([\s\S]*?)\n:::/;
    const match = rule.exec(src);
    if (match) 
    {
      return {
        type: 'container',
        raw: match[0],
        kind: match[1],
        title: match[2] || '',
        content: match[3] || '',
        tokens: []
      };
    }
  },
  renderer(token) 
  {
    // 处理 share 类型 - 创建占位符，稍后用 Vue 组件替换
    if (token.kind === 'share') 
    {
      // token.title 包含 "id 自定义描述"
      // token.content 可能包含额外的内容（如果有的话）
      const shareId = ++globalShareIdCounter;
      return `<div class="share-file-placeholder" data-share-id="${shareId}" data-file-id="${encodeURIComponent(token.title)}" data-description="${encodeURIComponent(token.content)}">Loading share file...</div>`;
    }
    
    // 处理 music 类型 - 创建占位符，稍后用 Vue 组件替换
    if (token.kind === 'music') 
    {
      // token.title 包含 "id 音乐名称"
      // token.content 可能包含额外的内容（如果有的话）
      const musicId = ++globalShareIdCounter;
      return `<div class="music-player-placeholder" data-music-id="${musicId}" data-file-id="${encodeURIComponent(token.title)}" data-description="${encodeURIComponent(token.content)}">Loading music player...</div>`;
    }
    
    // 定义容器类型映射
    const containerTypes = {
      info: { class: 'cainsgl-container-info', title: '信息' },
      tip: { class: 'cainsgl-container-tip', title: '提示' },
      warning: { class: 'cainsgl-container-warning', title: '警告' },
      danger: { class: 'cainsgl-container-danger', title: '危险' },
      details: { class: 'cainsgl-container-details', title: '详情' }
    };
    
    const containerInfo = containerTypes[token.kind] || { class: 'cainsgl-container-default', title: token.kind };
    const displayTitle = token.title || containerInfo.title;
    
    // 解析容器内的内容
    const innerContent = marked(token.content.trim());
    if(innerContent)
    {
      return `
      <div class="cainsgl-custom-container ${containerInfo.class}">
        <div class="cainsgl-container-title">
          <span>${displayTitle}</span>
        </div>
        <div class="cainsgl-container-content">
          ${innerContent}
        </div>
      </div>
    `;
    }
    else
    {
      return  `
      <div class="cainsgl-custom-container ${containerInfo.class}">
        <div class="cainsgl-container-content">
          ${displayTitle}
        </div>
      </div>
    `;
    }
   
  }
};
export default containerExtension;