import { marked } from 'marked';
const containerExtension = {
  name: 'container',
  level: 'block',
  start(src) { 
    const match = src.match(/^:::[a-z][a-z0-9-]*\s*.*/);
    return match ? match.index : -1;
  },
  tokenizer(src) {
    const rule = /^:::([a-z][a-z0-9-]*)\s*(.*)?\n([\s\S]*?)\n:::/;
    const match = rule.exec(src);
    if (match) {
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
  renderer(token) {
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
    }else
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