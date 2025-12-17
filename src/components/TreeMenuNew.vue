<template>
  <div class="tree-menu">
    <div 
      v-for="node in flatNodes" 
      :key="node.id"
      class="tree-node"
      :style="{ paddingLeft: `${node.depth * 20}px` }"
    >
      <div class="node-content" @click="toggleNode(node)">
        <span 
          v-if="node.children && node.children.length > 0" 
          class="expand-icon"
          :class="{ expanded: getNodeExpandedState(node) }"
        >
          {{ getNodeExpandedState(node) ? '▼' : '▶' }}
        </span>
        <span v-else class="expand-icon-placeholder">•</span>
        
        <span class="node-name">{{ node.name || '未命名' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  treeData: {
    type: Array,
    required: true
  }
});

// 扁平化的节点数据
const flatNodes = ref([]);

// 将树形结构扁平化为数组，保留深度信息
function flattenTree(nodes, depth = 0) 
{
  const result = [];
  
  for (const node of nodes) 
  {
    // 添加当前节点到结果中
    result.push({
      ...node,
      depth
    });
  }
  
  return result;
}

// 监听原始数据变化，重新扁平化
watch(
  () => props.treeData,
  (newData) => 
  {
    flatNodes.value = flattenTree(newData);
  },
  { immediate: true, deep: true }
);

// 获取节点展开状态
function getNodeExpandedState(node) {
  // 如果没有子节点，直接返回false
  if (!node.children || node.children.length === 0) {
    return false;
  }
  
  // 查找当前节点在扁平化数组中的索引
  const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
  
  // 检查下一个元素是否存在且是否为当前节点的子节点
  if (currentIndex >= 0 && currentIndex < flatNodes.value.length - 1) {
    const nextNode = flatNodes.value[currentIndex + 1];
    // 如果下一个节点的parentId等于当前节点的id，说明是展开状态
    if (nextNode.parentId === node.id) {
      return true;
    }
  }
  
  // 默认返回false（收起状态）
  return false;
}

// 切换节点展开/收起状态
function toggleNode(node) {
  const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
  
  // 获取当前节点的展开状态
  const isExpanded = getNodeExpandedState(node);
  
  function toExpand(index) {
    if (flatNodes.value.length <= index) {
      return;
    }
    
    const me = flatNodes.value[index];
    // 将子节点逐个插入到当前节点之后
    if (me.children && me.children.length > 0) {
      const childrenWithDepth = me.children.map(child => ({
        ...child,
        depth: me.depth + 1
      }));
      // 在当前节点后插入子节点
      flatNodes.value.splice(index + 1, 0, ...childrenWithDepth);
    }
  }
  
  function toCollapse(parentIndex) {
    if (flatNodes.value.length <= parentIndex) {
      return;
    }
    const parent = flatNodes.value[parentIndex];
    const parentDepth = parent.depth;
    // 从父节点的下一个位置开始查找需要删除的子节点
    let removeCount = 0;
    for (let i = parentIndex + 1; i < flatNodes.value.length; i++) {
      const node = flatNodes.value[i];
      // 如果节点的深度小于等于父节点，说明已经超出了子节点范围
      if (node.depth <= parentDepth) {
        break;
      }
      removeCount++;
    }
    // 删除所有子节点
    if (removeCount > 0) {
      flatNodes.value.splice(parentIndex + 1, removeCount);
    }
  }
  
  // 切换节点展开状态
  if (!isExpanded) {
    // 展开节点
    toExpand(currentIndex);
  } else {
    // 收起节点
    toCollapse(currentIndex);
  }
}
</script>

<style scoped lang="less">
.tree-menu {
  // 禁用文本选择
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  .tree-node {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin: 2px 0;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    .node-content {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .expand-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #666;
        cursor: pointer;
        transition: transform 0.2s ease;
        
        &.expanded {
          transform: rotate(0deg);
        }
      }
      
      .expand-icon-placeholder {
        width: 16px;
        height: 16px;
      }
      
      .node-name {
        flex: 1;
        font-size: 14px;
        color: #333;
      }
    }
  }
}
</style>