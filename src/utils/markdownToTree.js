/**
 * 将 Markdown 文本解析为 a-tree 组件可用的树结构
 * @param {string} markdown - Markdown 文本
 * @returns {Array} - 符合 a-tree 组件要求的树结构数据
 */
export function parseMarkdownToTree(markdown) {
  // 按行分割 Markdown 文本
  const lines = markdown.split('\n');
  
  // 存储树节点的栈结构
  const stack = [];
  
  // 最终返回的树结构
  const tree = [];
  
  // 用于生成唯一 key 的计数器
  let keyCounter = 0;
  
  // 正则表达式匹配标题行，包括可能的锚点
  // 匹配格式如: # 标题 或 # 标题{#anchor-id}
  const headingRegex = /^(#{1,6})\s+(.+?)(?:\{#[^}]*\})?$/;
  
  lines.forEach(line => {
    const match = line.match(headingRegex);
    
    if (match) {
      const level = match[1].length;  // 标题级别 (# 的数量)
      // 提取标题文本，去除可能的锚点部分
      let title = match[2].trim();
      
      // 如果标题文本以 { 开头（意味着整个标题名被误认为包含锚点），进一步清理
      if (title.includes('{#') && title.includes('}')) {
        // 只保留 { 之前的部分
        const anchorIndex = title.indexOf('{#');
        title = title.substring(0, anchorIndex).trim();
      }
      
      // 创建节点对象
      const node = {
        title: title,
        key: `node-${++keyCounter}`,
        level: level
      };
      
      // 如果栈为空，说明是最顶层节点
      if (stack.length === 0) {
        stack.push(node);
        tree.push(node);
        return;
      }
      
      // 查找当前节点在栈中的正确位置
      // 弹出栈中所有级别大于等于当前级别的节点
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      // 如果栈不为空，说明当前节点有父节点
      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else {
        // 如果栈为空，说明是新的顶级节点
        tree.push(node);
      }
      
      // 将当前节点压入栈
      stack.push(node);
    }
  });
  
  // 移除临时的 level 属性，因为 a-tree 不需要它
  const removeLevelProperty = (nodes) => {
    nodes.forEach(node => {
      delete node.level;
      if (node.children) {
        removeLevelProperty(node.children);
      }
    });
  };
  
  removeLevelProperty(tree);
  
  return tree;
}

export default parseMarkdownToTree;