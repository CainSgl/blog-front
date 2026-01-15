import { marked } from 'marked';

// 生成标题 ID 的辅助函数，与 MarkdownPreview.vue 中保持一致
const generateId = (text) => 
{
  // 移除 HTML 标签（如果有的话）
  const cleanText = text.replace(/<[^>]*>/g, '');
  // 移除特殊字符，转换为小写，用连字符连接
  return cleanText
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留字母、数字、中文、空格和连字符
    .replace(/[\s-]+/g, '-') // 多个空格或连字符替换为单个连字符
    .replace(/^-+|-+$/g, ''); // 去除开头和结尾的连字符
};

// 去除 Markdown 语法，获取纯文本的辅助函数
const stripMarkdownSyntax = (text) => 
{
  try 
  {
    // 使用 marked 将 Markdown 转换为 HTML，然后移除 HTML 标签获取纯文本
    const html = marked.parseInline(text);
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  catch (e) 
  {
    console.warn('解析 Markdown 语法时出错:', e);
    // 如果解析失败，使用正则表达式简单移除常见 Markdown 语法
    return text
    
      .replace(/\*\*(.*?)\*\*/g, '$1')  // 粗体 **text**
      .replace(/\*(.*?)\*/g, '$1')      // 斜体 *text*
      .replace(/__(.*?)__/g, '$1')      // 粗体 __text__
      .replace(/_(.*?)_/g, '$1')        // 斜体 _text_
      .replace(/~~(.*?)~~/g, '$1')      // 删除线 ~~text~~
      .replace(/`(.*?)`/g, '$1');       // 代码块 `code`
  }
};

/**
 * 将 Markdown 文本解析为 a-tree 组件可用的树结构
 * @param {string} markdown - Markdown 文本
 * @returns {Array} - 符合 a-tree 组件要求的树结构数据
 */
export function parseMarkdownToTree(markdown) 
{
  // 按行分割 Markdown 文本
  const lines = markdown.split('\n');
  
  // 存储树节点的栈结构
  const stack = [];
  
  // 最终返回的树结构
  const tree = [];
  // 正则表达式匹配标题行，包括可能的锚点
  // 匹配格式如: # 标题 或 # 标题{#anchor-id}
  const headingRegex = /^(#{1,6})\s+(.+?)(?:\{#[^}]*\})?$/;
  
  lines.forEach(line => 
  {
    const match = line.match(headingRegex);
    
    if (match) 
    {
      const level = match[1].length;  // 标题级别 (# 的数量)
      // 提取标题文本，去除可能的锚点部分
      let title = match[2].trim();
      
      // 如果标题文本以 { 开头（意味着整个标题名被误认为包含锚点），进一步清理
      if (title.includes('{#') && title.includes('}')) 
      {
        // 只保留 { 之前的部分
        const anchorIndex = title.indexOf('{#');
        title = title.substring(0, anchorIndex).trim();
      }
      
      // 创建节点对象
      const cleanTitle = stripMarkdownSyntax(title);
      let id = generateId(cleanTitle);
      
      const node = {
        title: cleanTitle,
        key: id,
        level: level
      };
      
      // 如果栈为空，说明是最顶层节点
      if (stack.length === 0) 
      {
        stack.push(node);
        tree.push(node);
        return;
      }
      
      // 查找当前节点在栈中的正确位置
      // 弹出栈中所有级别大于等于当前级别的节点
      while (stack.length > 0 && stack[stack.length - 1].level >= level) 
      {
        stack.pop();
      }
      
      // 如果栈不为空，说明当前节点有父节点
      if (stack.length > 0) 
      {
        const parent = stack[stack.length - 1];
        if (!parent.children) 
        {
          parent.children = [];
        }
        parent.children.push(node);
      }
      else 
      {
        // 如果栈为空，说明是新的顶级节点
        tree.push(node);
      }
      
      // 将当前节点压入栈
      stack.push(node);
    }
  });
  
  // 移除临时的 level 属性，因为 a-tree 不需要它
  const removeLevelProperty = (nodes) => 
  {
    nodes.forEach(node => 
    {
      delete node.level;
      if (node.children) 
      {
        removeLevelProperty(node.children);
      }
    });
  };
  
  removeLevelProperty(tree);
  
  return tree;
}

export default parseMarkdownToTree;