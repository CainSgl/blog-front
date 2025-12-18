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
        :style="{ marginLeft: `${node.depth * 20}px` }"
        @mousedown="handleMouseDown($event, node, index)"
      >
        <div class="node-content">
          <span 
            v-if="node.children && node.children.length > 0" 
            class="expand-icon"
            :class="{ expanded: getNodeExpandedState(node) }"
          >
            <IconDown v-if="getNodeExpandedState(node)" />
            <IconRight v-else />
          </span>
          <!-- <span v-else class="expand-icon-placeholder">•</span> -->
          <span class="node-name">{{ node.name || '未命名' }}</span>
          
          <!-- 右侧操作图标 - 只在悬停时显示 -->
           <div class="node-actions" v-show="!dragState.isDragging&&edit&&!node.postId">
             <IconPlus class="action-icon" @click.stop="handleAddNode(node)" @mousedown.stop />
             <IconMore class="action-icon" @click.stop="handleMoreActions(node)" @mousedown.stop />
           </div>
        </div>

        <!-- 拖拽预览指示器 -->
        <div 
          v-if="dragState.isDragging && dragState.targetIndex === index"
          class="drag-indicator"
          :class="`indicator-${dragState.dropType}`"
          :style="{ paddingLeft: `${(node.depth)}px` }"
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
          <IconRight />
        </span>
        <!-- <span v-else class="expand-icon-placeholder">•</span> -->
        <span class="node-name">{{ dragState.sourceNode?.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, watch, reactive, nextTick } from 'vue';
import { IconDown, IconRight, IconPlus, IconMore } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  treeData: {
    type: Array,
    required: true
  },
  edit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['clickPost']);

// 图标点击处理函数
function handleAddNode(node) {
  // 这里可以添加新节点的逻辑
  console.log('添加子节点:', node.name);
  // TODO: 实现添加子节点的功能
  // 可以触发一个事件或者打开一个模态框
}

function handleMoreActions(node) {
  // 这里可以添加更多操作的逻辑
  console.log('更多操作:', node.name);
  // TODO: 实现更多操作菜单
  // 可以触发一个事件或者打开一个下拉菜单
  // 比如：重命名、删除、复制等操作
}

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
  containerRect: null,
  startPosition: { x: 0, y: 0 },
  hasMoved: false,
  clickTimeout: null
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
function getNodeClasses(node, index) 
{
  const classes = ['default'];
  
  if (dragState.isDragging) 
  {
    if (dragState.sourceIndex === index) 
    {
      classes.push('dragging-source');
    }
    else if (dragState.targetIndex === index && dragState.dropType === 'child') 
    {
      classes.push('drag-target');
    }
    else 
    {
      classes.push('dragging-other');
    }
  }
  
  return classes.join(' ');
}

// 拖拽相关配置
const DRAG_THRESHOLD = 5; // 最小拖拽距离

// 鼠标按下事件 - 设置拖拽准备状态
function handleMouseDown(event, node, index) 
{
  // 如果点击的是展开图标，不触发拖拽，只处理展开/收起
  if (event.target.closest('.expand-icon')) 
  {
    event.preventDefault();
    toggleNode(node);
    return;
  }
  
  // 如果 edit 为 false，不允许拖拽功能
  if (!props.edit) {
    event.preventDefault();
    // 如果节点存在 postId，调用父组件的 clickPost 方法
    if (node.postId) {
      emit('clickPost', node);
    } else {
      // 否则执行点击逻辑 - 切换展开/收起状态
      toggleNode(node);
    }
    return;
  }
  
  event.preventDefault();
  
  // 获取容器边界
  const container = event.currentTarget.closest('.tree-menu');
  dragState.containerRect = container.getBoundingClientRect();
  
  // 计算鼠标相对于节点的偏移
  const nodeRect = event.currentTarget.getBoundingClientRect();
  dragState.mouseOffset.x = event.clientX - nodeRect.left;
  dragState.mouseOffset.y = event.clientY - nodeRect.top;
  
  // 记录初始位置
  dragState.startPosition = {
    x: event.clientX,
    y: event.clientY
  };
  
  // 设置拖拽准备状态，但不立即开始拖拽
  dragState.isDragging = false;
  dragState.sourceNode = { ...node };
  dragState.sourceIndex = index;
  dragState.targetIndex = index;
}

// 创建拖拽阴影元素
function createDraggingShadow(node, event) 
{
  dragState.draggingElement = true;
  dragState.shadowWidth = event.currentTarget.offsetWidth;
}

// 开始拖拽
function startDragging(event) {
  // 如果 edit 为 false，不允许开始拖拽
  if (!props.edit) {
    return;
  }
  
  dragState.isDragging = true;
  dragState.hasMoved = true;
  
  // 清除点击定时器
  if (dragState.clickTimeout) {
    clearTimeout(dragState.clickTimeout);
    dragState.clickTimeout = null;
  }
  
  // 收起子目录（如果展开的话）
  if (dragState.sourceNode && getNodeExpandedState(dragState.sourceNode)) {
    toggleNode(dragState.sourceNode);
  }
  
  // 临时移除tree-menu-container样式
  const container = document.querySelector('.tree-menu-container');
  if (container) {
    container.classList.add('no-transition');
  }
  
  // 创建拖拽阴影元素
  createDraggingShadow(dragState.sourceNode, event);
  
  // 更新阴影位置
  updateShadowPosition(event);
}

// 更新阴影位置
function updateShadowPosition(event) 
{
  if (!dragState.isDragging) return;
  
  dragState.shadowPosition.x = event.clientX - dragState.mouseOffset.x;
  dragState.shadowPosition.y = event.clientY - dragState.mouseOffset.y;
}

// 鼠标移动事件
function handleMouseMove(event) 
{
  event.preventDefault();
  
  // 如果 edit 为 false，不允许拖拽
  if (!props.edit) {
    return;
  }
  
  // 如果还未开始拖拽，检查是否需要启动拖拽
  if (!dragState.isDragging && dragState.sourceNode) {
    const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
    const deltaY = Math.abs(event.clientY - dragState.startPosition.y);
    
    // 如果移动距离超过阈值，开始拖拽
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      startDragging(event);
      return;
    }
  }
  
  // 如果已经在拖拽状态，处理拖拽逻辑
  if (dragState.isDragging) {
    // 更新阴影位置
    updateShadowPosition(event);
    
    // 计算目标位置
    calculateDropPosition(event);
  }
}

// 计算放置位置
function calculateDropPosition(event) 
{
  const nodes = document.querySelectorAll('.tree-node');
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  let targetIndex = -1;
  let dropType = 'none';
  
  // 遍历所有节点，找到鼠标悬停的节点
  for (let i = 0; i < nodes.length; i++) 
  {
    const nodeElement = nodes[i];
    const rect = nodeElement.getBoundingClientRect();
    
    // 检查鼠标是否在当前节点范围内
    if (mouseY >= rect.top && mouseY <= rect.bottom && 
        mouseX >= rect.left && mouseX <= rect.right) 
    {
      
      // 排除源节点
      if (i === dragState.sourceIndex) continue;
      
      targetIndex = i;
      
      // 计算精确的放置类型
      const relativeY = mouseY - rect.top;
      const nodeHeight = rect.height;
      
      if (relativeY < nodeHeight * 0.25) 
      {
        dropType = 'before';
      }
      else if (relativeY > nodeHeight * 0.75) 
      {
        dropType = 'after';
      }
      else 
      {
        // 如果目标节点存在postId，不允许作为子节点
        const targetNode = flatNodes.value[i];
      
        if (targetNode.postId) 
        {
          dropType = 'after';
        }
        else 
        {
          dropType = 'child';
        }
      }
      
      break;
    }
  }
  
  // 更新拖拽状态
  if (targetIndex !== dragState.targetIndex || dropType !== dragState.dropType) 
  {
    dragState.targetIndex = targetIndex;
    dragState.dropType = dropType;
  }
}

// 鼠标释放事件 - 结束拖拽或处理点击
function handleMouseUp(event) 
{
  event.preventDefault();
  
  // 如果 edit 为 false，直接处理点击事件
  if (!props.edit) {
    if (dragState.sourceNode) {
      const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
      const deltaY = Math.abs(event.clientY - dragState.startPosition.y);
      
      // 如果移动距离很小，认为是点击
      if (deltaX <= DRAG_THRESHOLD && deltaY <= DRAG_THRESHOLD) {
        // 如果节点存在 postId，调用父组件的 clickPost 方法
        if (dragState.sourceNode.postId) {
          emit('clickPost', dragState.sourceNode);
        } else {
          // 否则执行点击逻辑 - 切换展开/收起状态
          toggleNode(dragState.sourceNode);
        }
      }
    }
    
    // 清理拖拽状态
    cleanupDrag();
    return;
  }
  
  // 如果已经开始了拖拽，执行放置操作
  if (dragState.isDragging) {
    performDrop();
    cleanupDrag();
    return;
  }
  
  // 如果没有开始拖拽，可能是点击事件
  if (dragState.sourceNode) {
    const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
    const deltaY = Math.abs(event.clientY - dragState.startPosition.y);
    
    // 如果移动距离很小，认为是点击
    if (deltaX <= DRAG_THRESHOLD && deltaY <= DRAG_THRESHOLD) {
      // 清除点击定时器（如果有的话）
      if (dragState.clickTimeout) {
        clearTimeout(dragState.clickTimeout);
        dragState.clickTimeout = null;
      }
      
      // 如果节点存在postId，调用父组件的clickPost方法
      if (dragState.sourceNode.postId) {
        emit('clickPost', dragState.sourceNode);
      } else {
        // 否则执行点击逻辑 - 切换展开/收起状态
        toggleNode(dragState.sourceNode);
      }
    }
  }
  
  // 清理拖拽状态
  cleanupDrag();
}

// 鼠标离开容器事件
function handleMouseLeave(event) 
{
  if (!dragState.isDragging) return;
  
  // 如果鼠标离开容器，尝试目前是不放置
  if (dragState.targetIndex !== -1) 
  {
   // performDrop();
  }
  
  cleanupDrag();
}

// 执行放置操作
function performDrop() 
{
  if (dragState.targetIndex === -1 || dragState.dropType === 'none') 
  {
    return;
  }
  
  const sourceIndex = dragState.sourceIndex;
  const targetIndex = dragState.targetIndex;
  const dropType = dragState.dropType;
  
  // 防止无效放置
  if (sourceIndex === targetIndex) return;
  
  // 调整索引（因为移除了源节点，目标索引可能会变化）
  let adjustedTargetIndex = targetIndex;
  if (sourceIndex < targetIndex) 
  {
    adjustedTargetIndex--;
  }
  
  // 获取源节点
  const sourceNode = flatNodes.value[sourceIndex];
  
  // 从原位置移除
  flatNodes.value.splice(sourceIndex, 1);
  
  // 根据放置类型插入到新位置
  switch (dropType) 
  {
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
function cleanupDrag() 
{
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
  dragState.startPosition = { x: 0, y: 0 };
  dragState.hasMoved = false;
  if (dragState.clickTimeout) {
    clearTimeout(dragState.clickTimeout);
    dragState.clickTimeout = null;
  }
  
}

</script>

<style scoped lang="less">
.tree-menu {
  user-select: none;
  .tree-menu-container {
    position: relative;
  }
  
  .default {
    &:hover {
      background-color: #f5f5f5;
    }
  }
  
  // 拖拽状态样式
  .tree-node.dragging-source {
    opacity: 0;
    visibility: hidden;
  }
  
  .tree-node.drag-target {
    background-color: @primary-1;
    border: 2px dashed @primary-6 !important;
    border-radius: 4px;
    
    .node-content {
      pointer-events: none;
    }
  }
  
  .dragging-other {
    opacity:1;
  }
  
  .tree-node {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin: 2px 0;
    transition: all 0.2s ease;
    position: relative;
    border: 2px solid transparent;
  }
  
  .tree-node .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .expand-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      cursor: pointer;
      transition: transform 0.2s ease;
      
      &.expanded {
        transform: rotate(0deg);
      }
      
      svg {
        width: 16px;
        height: 16px;
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
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    // 右侧操作图标样式
    .node-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
      margin-left: auto;
    }
    
    .action-icon {
      width: 16px;
      height: 16px;
      color: #999;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: #f0f0f0;
      }
      
      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
  
  // 悬停时显示右侧图标
  .tree-node:hover .node-actions {
    opacity: 1;
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
        background-color: @primary-6;
        border-radius: 1px;
      }
    }
    
    &.indicator-after {
      bottom: -2px;
      
      .indicator-line {
        height: 2px;
        background-color: @primary-6;
        border-radius: 1px;
      }
    }
    
    // &.indicator-child {
    //   top: 50%;
    //   left: 50%;
    //   transform: translate(-50%, -50%);
      
    //   .indicator-line {
    //     width: 12px;
    //     height: 12px;
    //     background-color: #2196f3;
    //     border-radius: 50%;
    //     border: 2px solid white;
    //   }
    // }
  }
  
  // 拖拽阴影样式
  .dragging-shadow {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    border-radius: 20%;
    opacity: 0.4;
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
      color: #666;
      
      svg {
        width: 16px;
        height: 16px;
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