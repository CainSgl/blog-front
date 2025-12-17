<template>
  <div class="tree-menu">
    <TransitionGroup 
      name="node-list" 
      tag="div"
      class="tree-menu-container"
    >
      <div 
        v-for="(node, index) in flatNodes" 
        :key="node.id"
        class="tree-node default"
        :style="{ paddingLeft: `${node.depth * 20}px` }"
        draggable="true"
        @dragstart="listDragStart($event, index)"
        @dragenter="listDragEnter($event, index)"
        @dragend="listDragEnd"
        @dragover="listDragOver"
        @drop="listDrop($event, index)"
      >
        <div  class="node-content" @click="toggleNode(node)" >
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
    </TransitionGroup>
  </div>
</template>

<script setup>
import { log } from 'three';
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
function getNodeExpandedState(node) 
{
  // 如果没有子节点，直接返回false
  if (!node.children || node.children.length === 0) 
  {
    return false;
  }
  
  // 查找当前节点在扁平化数组中的索引
  const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
  
  // 检查下一个元素是否存在且是否为当前节点的子节点
  if (currentIndex >= 0 && currentIndex < flatNodes.value.length - 1) 
  {
    const nextNode = flatNodes.value[currentIndex + 1];
    // 如果下一个节点的parentId等于当前节点的id，说明是展开状态
    if (nextNode.parentId === node.id) 
    {
      return true;
    }
  }
  
  // 默认返回false（收起状态）
  return false;
}

// 切换节点展开/收起状态
function toggleNode(node) 
{
  const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
  
  // 获取当前节点的展开状态
  const isExpanded = getNodeExpandedState(node);
  
  function toExpand(index) 
  {
    if (flatNodes.value.length <= index) 
    {
      return;
    }
    
    const me = flatNodes.value[index];
    // 将子节点逐个插入到当前节点之后
    if (me.children && me.children.length > 0) 
    {
      const childrenWithDepth = me.children.map(child => ({
        ...child,
        depth: me.depth + 1
      }));
      // 在当前节点后插入子节点
      flatNodes.value.splice(index + 1, 0, ...childrenWithDepth);
    }
  }
  
  function toCollapse(parentIndex) 
  {
    if (flatNodes.value.length <= parentIndex) 
    {
      return;
    }
    const parent = flatNodes.value[parentIndex];
    const parentDepth = parent.depth;
    // 从父节点的下一个位置开始查找需要删除的子节点
    let removeCount = 0;
    for (let i = parentIndex + 1; i < flatNodes.value.length; i++) 
    {
      const node = flatNodes.value[i];
      // 如果节点的深度小于等于父节点，说明已经超出了子节点范围
      if (node.depth <= parentDepth) 
      {
        break;
      }
      removeCount++;
    }
    // 删除所有子节点
    if (removeCount > 0) 
    {
      flatNodes.value.splice(parentIndex + 1, removeCount);
    }
  }
  
  // 切换节点展开状态
  if (!isExpanded) 
  {
    // 展开节点
    toExpand(currentIndex);
  }
  else 
  {
    // 收起节点
    toCollapse(currentIndex);
  }
}

//下面代码跟拖动有关
let sourceNode = null;
let dragTargetInfo = null; // 存储当前拖拽目标信息
let isDragging = false; // 标记是否正在拖拽

function listDragStart(e, index) 
{
  sourceNode = flatNodes.value[index];
  isDragging = true;
  
  //先收起子目录
  if(getNodeExpandedState(sourceNode))
  {
    toggleNode(sourceNode);
  }
  const target = e.target;
  target.classList.remove('default');
  setTimeout(()=>
  {
    target.classList.add('dragging');
  },0);
  
  // 设置拖拽数据
  e.dataTransfer.effectAllowed = 'move';
}

// 计算鼠标在目标节点上的位置
function getDropPosition(e, targetElement) {
  const rect = targetElement.getBoundingClientRect();
  const mouseY = e.clientY;
  const top = rect.top;
  const bottom = rect.bottom;
  const height = bottom - top;
  
  // 计算鼠标在元素中的相对位置（0-1之间）
  const relativeY = (mouseY - top) / height;
  
  // 根据相对位置确定放置类型
  if (relativeY < 0.3) {
    return 'before'; // 上方30% -> 前一个兄弟节点
  } else if (relativeY > 0.7) {
    return 'after';  // 下方30% -> 后一个兄弟节点
  } else {
    return 'inside'; // 中间40% -> 子节点
  }
}

// 更新视觉反馈
function updateDropIndicator(targetElement, position) {
  // 清除之前的指示器类
  document.querySelectorAll('.drop-before, .drop-after, .drop-inside').forEach(el => {
    el.classList.remove('drop-before', 'drop-after', 'drop-inside');
  });
  
  // 添加新的指示器类
  switch(position) {
    case 'before':
      targetElement.classList.add('drop-before');
      break;
    case 'after':
      targetElement.classList.add('drop-after');
      break;
    case 'inside':
      targetElement.classList.add('drop-inside');
      break;
  }
}

function listDragEnter(e, targetIndex) 
{
  e.preventDefault();
  
  // 确保sourceNode已设置且正在拖拽
  if(!sourceNode || !isDragging)
  {
    return;
  }
  
  // 避免触发自身的事件
  if(flatNodes.value[targetIndex] === sourceNode)
  {
    return;
  }
  
  const targetElement = e.target.closest('.tree-node');
  if (!targetElement) return;
  
  // 计算放置位置
  const dropPosition = getDropPosition(e, targetElement);
  
  // 更新视觉反馈
  updateDropIndicator(targetElement, dropPosition);
  
  // 存储目标信息用于后续处理
  dragTargetInfo = {
    targetIndex,
    dropPosition,
    targetElement
  };
}

function listDragOver(e) 
{
  e.preventDefault();
  
  if (!sourceNode || !isDragging) return;
  
  const targetElement = e.target.closest('.tree-node');
  if (!targetElement) return;
  
  // 更新放置位置和视觉反馈
  const dropPosition = getDropPosition(e, targetElement);
  updateDropIndicator(targetElement, dropPosition);
  
  // 更新存储的目标信息
  if (dragTargetInfo) {
    dragTargetInfo.dropPosition = dropPosition;
    dragTargetInfo.targetElement = targetElement;
  }
  
  // 设置拖拽效果
  e.dataTransfer.dropEffect = 'move';
}

// 移动节点
function moveNode(sourceIndex, targetIndex, dropPosition) {
  if (sourceIndex === -1) return;
  
  // 避免无效移动
  if (sourceIndex === targetIndex && dropPosition !== 'inside') {
    return;
  }
  
  const nodeToMove = flatNodes.value[sourceIndex];
  const targetNode = flatNodes.value[targetIndex];
  
  // 根据放置位置进行不同的操作
  switch(dropPosition) {
    case 'before':
      // 移除原节点
      flatNodes.value.splice(sourceIndex, 1);
      // 调整目标索引（如果源索引在目标索引之前，目标索引会减少1）
      const beforeTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      flatNodes.value.splice(beforeTargetIndex, 0, {
        ...nodeToMove,
        depth: targetNode?.depth || 0,
        parentId: targetNode?.parentId || null
      });
      break;
      
    case 'after':
      // 移除原节点
      flatNodes.value.splice(sourceIndex, 1);
      // 调整目标索引
      const afterTargetIndex = sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
      flatNodes.value.splice(afterTargetIndex, 0, {
        ...nodeToMove,
        depth: targetNode?.depth || 0,
        parentId: targetNode?.parentId || null
      });
      break;
      
    case 'inside':
      // 作为子节点插入（在目标节点之后）
      flatNodes.value.splice(sourceIndex, 1);
      const insideTargetIndex = sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
      flatNodes.value.splice(insideTargetIndex, 0, {
        ...nodeToMove,
        depth: (targetNode?.depth || 0) + 1,
        parentId: targetNode?.id
      });
      break;
  }
}

function listDragEnd(e) 
{
  // 重置拖拽状态
  isDragging = false;
  sourceNode = null;
  dragTargetInfo = null;
  
  // 清除所有拖拽指示器
  document.querySelectorAll('.drop-before, .drop-after, .drop-inside').forEach(el => {
    el.classList.remove('drop-before', 'drop-after', 'drop-inside');
  });
  
  // 移除拖拽样式
  e.target.classList.remove('dragging');
  e.target.classList.add('default');
}

// 处理放置事件
function listDrop(e, targetIndex) {
  e.preventDefault();
  
  // 执行实际的节点移动
  if (dragTargetInfo) {
    const sourceIndex = flatNodes.value.findIndex(node => node.id === sourceNode.id);
    if (sourceIndex !== -1 && sourceIndex !== dragTargetInfo.targetIndex) {
      moveNode(sourceIndex, dragTargetInfo.targetIndex, dragTargetInfo.dropPosition);
    }
  }
  
  // 重置状态
  isDragging = false;
  sourceNode = null;
  dragTargetInfo = null;
  
  // 清除防抖定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  
  // 清除所有拖拽指示器
  document.querySelectorAll('.drop-before, .drop-after, .drop-inside').forEach(el => {
    el.classList.remove('drop-before', 'drop-after', 'drop-inside');
  });
}
</script>

<style scoped lang="less">
.tree-menu {
  // 禁用文本选择
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  .tree-menu-container {
    position: relative;
  }
  
  .default{
    &:hover {
      background-color: #f5f5f5;
    }
  }
  
  .tree-node {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin: 2px 0;
    transition: all 0.2s ease;
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
  
  .dragging {
    background-color: #ee00005d;
  }
}

// TransitionGroup 动画样式
.node-list-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.node-list-enter-active {
  transition: all 0.2s ease;
}

// 拖拽放置指示器样式
.drop-before {
  border-top: 2px solid #409eff;
}

.drop-after {
  border-bottom: 2px solid #409eff;
}

.drop-inside {
  background-color: rgba(64, 158, 255, 0.1);
  border: 1px dashed #409eff;
}

.node-list-leave-active {
  transition: all 0.2s ease;
}

.node-list-enter-from,
.node-list-leave-to {
  opacity: 0;
  max-height: 0;
}

.node-list-enter-to,
.node-list-leave-from {
  opacity: 1;
  max-height: 100px;
}

</style>