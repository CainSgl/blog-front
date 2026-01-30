import {marked} from 'marked';

// 生成标题 ID 的辅助函数，与 MarkdownPreview.vue 中保持一致
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

// 去除 Markdown 语法和 HTML 标签，获取纯文本的辅助函数
const stripMarkdownSyntax = (text) => 
{
  try 
  {
    // 使用 marked 将 Markdown 转换为 HTML
    const html = marked.parseInline(text);
    // 创建临时 DOM 元素来提取纯文本
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // 提取纯文本内容
    let cleanText = tmp.textContent || tmp.innerText || '';
    // 再次确保移除任何残留的 HTML 标签
    cleanText = cleanText.replace(/<[^>]*>/g, '');
    return cleanText.trim();
  }
  catch (e) 
  {
    console.warn('解析 Markdown 语法时出错:', e);
    // 如果解析失败，使用正则表达式移除 Markdown 语法和 HTML 标签
    return text
      .replace(/<[^>]*>/g, '')          // 移除 HTML 标签
      .replace(/\*\*(.*?)\*\*/g, '$1')  // 粗体 **text**
      .replace(/\*(.*?)\*/g, '$1')      // 斜体 *text*
      .replace(/__(.*?)__/g, '$1')      // 粗体 __text__
      .replace(/_(.*?)_/g, '$1')        // 斜体 _text_
      .replace(/~~(.*?)~~/g, '$1')      // 删除线 ~~text~~
      .replace(/`(.*?)`/g, '$1')        // 代码块 `code`
      .trim();
  }
};

/**
 * 将 Markdown 文本解析为 a-tree 组件可用的树结构
 * @param {string} markdown - Markdown 文本
 * @returns {Array} - 符合 a-tree 组件要求的树结构数据
 */
export function parseMarkdownToTree(markdown) 
{
  if (!markdown) return [];
  
  // 使用 marked 的 lexer 来解析 Markdown，这样可以正确处理标题中的 Markdown 语法
  const tokens = marked.lexer(markdown);
  
  // 存储树节点的栈结构
  const stack = [];
  
  // 最终返回的树结构
  const tree = [];
  
  // 用于跟踪已使用的 ID，确保唯一性
  const usedIds = new Map(); // key: baseId, value: count
  
  // 遍历所有 tokens，只处理标题类型
  tokens.forEach(token => 
  {
    if (token.type === 'heading') 
    {
      const level = token.depth;  // 标题级别 (1-6)
      const rawText = token.text;  // 原始文本（可能包含 Markdown 语法）
      
      // 使用 stripMarkdownSyntax 去除 Markdown 语法，获取纯文本
      const cleanTitle = stripMarkdownSyntax(rawText);
      const baseId = generateId(cleanTitle);
      
      // 确保 ID 唯一性
      let uniqueId = baseId;
      if (usedIds.has(baseId)) 
      {
        const count = usedIds.get(baseId);
        usedIds.set(baseId, count + 1);
        uniqueId = `${baseId}-${count}`;
      }
      else 
      {
        usedIds.set(baseId, 1);
      }
      
      const node = {
        title: cleanTitle,
        key: uniqueId,
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