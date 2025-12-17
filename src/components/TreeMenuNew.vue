<template>
  <div class="tree-menu" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">
    <TransitionGroup 
      name="node-list" 
      tag="div"
      class="tree-menu-container"
    >
      <div  
        v-for="(node, index) in flatNodes" 
        :key="node.id"
        class="tree-node"
        :class="getNodeClasses(node, index)"
        :style="{ paddingLeft: `${node.depth * 20}px` }"
        @mousedown="handleMouseDown($event, node, index)"
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

        <!-- 拖拽预览指示器 -->
        <div 
          v-if="dragState.isDragging && dragState.targetIndex === index"
          class="drag-indicator"
          :class="`indicator-${dragState.dropType}`"
        >
          <div class="indicator-line"></div>
        </div>
      </div>
    </TransitionGroup>

    <!-- 拖拽阴影元素 -->
    <div 
      v-if="dragState.isDragging && dragState.draggingElement"
      class="dragging-shadow"
      :style="{
        left: dragState.shadowPosition.x + 'px',
        top: dragState.shadowPosition.y + 'px',
        width: dragState.shadowWidth + 'px'
      }"
    >
      <div class="node-content" :style="{ paddingLeft: `${dragState.sourceNode?.depth * 20 || 0}px` }">
        <span 
          v-if="dragState.sourceNode?.children && dragState.sourceNode.children.length > 0" 
          class="expand-icon"
        >
          ▶
        </span>
        <span v-else class="expand-icon-placeholder">•</span>
        
        <span class="node-name">{{ dragState.sourceNode?.name || '拖拽中...' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, watch, reactive, nextTick } from 'vue';

const props = defineProps({
  treeData: {
    type: Array,
    required: true
  }
});

// 扁平化的节点数据
const flatNodes = ref([]);

// 拖拽状态管理
const dragState = reactive({
  isDragging: false,
  sourceNode: null,
  sourceIndex: -1,
  targetIndex: -1,
  dropType: 'none', // 'before', 'after', 'child'
  draggingElement: null,
  shadowPosition: { x: 0, y: 0 },
  shadowWidth: 0,
  mouseOffset: { x: 0, y: 0 },
  containerRect: null
});

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

// 获取节点样式类
function getNodeClasses(node, index) {
  const classes = ['default'];
  
  if (dragState.isDragging) {
    if (dragState.sourceIndex === index) {
      classes.push('dragging-source');
    } else if (dragState.targetIndex === index) {
      classes.push('drag-target');
    } else {
      classes.push('dragging-other');
    }
  }
  
  return classes.join(' ');
}

// 鼠标按下事件 - 开始拖拽
function handleMouseDown(event, node, index) {
  // 如果点击的是展开图标，不触发拖拽
  if (event.target.closest('.expand-icon')) {
    return;
  }
  
  event.preventDefault();
  
  // 收起子目录（如果展开的话）
  if (getNodeExpandedState(node)) {
    toggleNode(node);
  }
  
  // 初始化拖拽状态
  dragState.isDragging = true;
  dragState.sourceNode = { ...node };
  dragState.sourceIndex = index;
  dragState.targetIndex = index;
  
  // 获取容器边界
  const container = event.currentTarget.closest('.tree-menu');
  dragState.containerRect = container.getBoundingClientRect();
  
  // 计算鼠标相对于节点的偏移
  const nodeRect = event.currentTarget.getBoundingClientRect();
  dragState.mouseOffset.x = event.clientX - nodeRect.left;
  dragState.mouseOffset.y = event.clientY - nodeRect.top;
  
  // 创建拖拽阴影元素
  createDraggingShadow(node, event);
  
  // 更新阴影位置
  updateShadowPosition(event);
}

// 创建拖拽阴影元素
function createDraggingShadow(node, event) {
  dragState.draggingElement = true;
  dragState.shadowWidth = event.currentTarget.offsetWidth;
}

// 更新阴影位置
function updateShadowPosition(event) {
  if (!dragState.isDragging) return;
  
  dragState.shadowPosition.x = event.clientX - dragState.mouseOffset.x;
  dragState.shadowPosition.y = event.clientY - dragState.mouseOffset.y;
}

// 鼠标移动事件
function handleMouseMove(event) {
  if (!dragState.isDragging) return;
  
  event.preventDefault();
  
  // 更新阴影位置
  updateShadowPosition(event);
  
  // 计算目标位置
  calculateDropPosition(event);
}

// 计算放置位置
function calculateDropPosition(event) {
  const nodes = document.querySelectorAll('.tree-node');
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  let targetIndex = -1;
  let dropType = 'none';
  
  // 遍历所有节点，找到鼠标悬停的节点
  for (let i = 0; i < nodes.length; i++) {
    const nodeElement = nodes[i];
    const rect = nodeElement.getBoundingClientRect();
    
    // 检查鼠标是否在当前节点范围内
    if (mouseY >= rect.top && mouseY <= rect.bottom && 
        mouseX >= rect.left && mouseX <= rect.right) {
      
      // 排除源节点
      if (i === dragState.sourceIndex) continue;
      
      targetIndex = i;
      
      // 计算精确的放置类型
      const relativeY = mouseY - rect.top;
      const nodeHeight = rect.height;
      
      if (relativeY < nodeHeight * 0.25) {
        dropType = 'before';
      } else if (relativeY > nodeHeight * 0.75) {
        dropType = 'after';
      } else {
        dropType = 'child';
      }
      
      break;
    }
  }
  
  // 更新拖拽状态
  if (targetIndex !== dragState.targetIndex || dropType !== dragState.dropType) {
    dragState.targetIndex = targetIndex;
    dragState.dropType = dropType;
  }
}

// 鼠标释放事件 - 结束拖拽
function handleMouseUp(event) {
  if (!dragState.isDragging) return;
  
  event.preventDefault();
  
  // 执行放置操作
  performDrop();
  
  // 清理拖拽状态
  cleanupDrag();
}

// 鼠标离开容器事件
function handleMouseLeave(event) {
  if (!dragState.isDragging) return;
  
  // 如果鼠标离开容器，尝试在最近的节点放置
  if (dragState.targetIndex !== -1) {
    performDrop();
  }
  
  cleanupDrag();
}

// 执行放置操作
function performDrop() {
  if (dragState.targetIndex === -1 || dragState.dropType === 'none') {
    return;
  }
  
  const sourceIndex = dragState.sourceIndex;
  const targetIndex = dragState.targetIndex;
  const dropType = dragState.dropType;
  
  // 防止无效放置
  if (sourceIndex === targetIndex) return;
  
  // 调整索引（因为移除了源节点，目标索引可能会变化）
  let adjustedTargetIndex = targetIndex;
  if (sourceIndex < targetIndex) {
    adjustedTargetIndex--;
  }
  
  // 获取源节点
  const sourceNode = flatNodes.value[sourceIndex];
  
  // 从原位置移除
  flatNodes.value.splice(sourceIndex, 1);
  
  // 根据放置类型插入到新位置
  switch (dropType) {
    case 'before':
      flatNodes.value.splice(adjustedTargetIndex, 0, {
        ...sourceNode,
        depth: flatNodes.value[adjustedTargetIndex].depth,
        parentId: flatNodes.value[adjustedTargetIndex].parentId
      });
      break;
      
    case 'after':
      flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
        ...sourceNode,
        depth: flatNodes.value[adjustedTargetIndex].depth,
        parentId: flatNodes.value[adjustedTargetIndex].parentId
      });
      break;
      
    case 'child':
      flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
        ...sourceNode,
        depth: flatNodes.value[adjustedTargetIndex].depth + 1,
        parentId: flatNodes.value[adjustedTargetIndex].id
      });
      break;
  }
}

// 清理拖拽状态
function cleanupDrag() {
  dragState.isDragging = false;
  dragState.sourceNode = null;
  dragState.sourceIndex = -1;
  dragState.targetIndex = -1;
  dragState.dropType = 'none';
  dragState.draggingElement = null;
  dragState.shadowPosition = { x: 0, y: 0 };
  dragState.shadowWidth = 0;
  dragState.mouseOffset = { x: 0, y: 0 };
  dragState.containerRect = null;
}

</script>

<style scoped lang="less">
.tree-menu {
  .tree-menu-container {
    position: relative;
  }
  
  .default {
    &:hover {
      background-color: #f5f5f5;
    }
  }
  
  // 拖拽状态样式
  .dragging-source {
    opacity: 0;
    visibility: hidden;
  }
  
  .drag-target {
    background-color: #fff3e0;
    border: 2px dashed #ff9800;
    
    .node-content {
      pointer-events: none;
    }
  }
  
  .dragging-other {
    opacity: 0.6;
  }
  
  .tree-node {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin: 2px 0;
    transition: all 0.2s ease;
    position: relative;
    
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
    
    // 拖拽指示器
    .drag-indicator {
      position: absolute;
      left: 0;
      right: 0;
      pointer-events: none;
      
      &.indicator-before {
        top: -2px;
        
        .indicator-line {
          height: 2px;
          background-color: #4caf50;
          border-radius: 1px;
          box-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
        }
      }
      
      &.indicator-after {
        bottom: -2px;
        
        .indicator-line {
          height: 2px;
          background-color: #4caf50;
          border-radius: 1px;
          box-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
        }
      }
      
      &.indicator-child {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        
        .indicator-line {
          width: 12px;
          height: 12px;
          background-color: #2196f3;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(33, 150, 243, 0.6);
        }
      }
    }
  }
  
  // 拖拽阴影样式
  .dragging-shadow {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0.95;
    
    .node-content {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      
      .expand-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #666;
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

// TransitionGroup 动画样式
.node-list-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.node-list-enter-active {
  transition: all 0.2s ease;
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