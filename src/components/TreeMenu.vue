<template>
  <div class="tree-menu">
    <TreeNode
      v-for="node in treeData"
      :key="node.id"
      :node="node"
      :level="0"
      :dragged-node="draggedNode"
      :drag-over-node="dragOverNode"
      :drag-position="dragPosition"
      :drag-preview="dragPreview"
      @node-click="handleNodeClick"
      @toggle-expand="handleToggleExpand"
      @node-drop="handleNodeDrop"
      @drag-start="handleDragStart"
      @drag-over-node="handleDragOverNode"
      @drag-end="handleDragEnd"
    />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';
import TreeNode from './TreeMenu/TreeNode.vue';

// 定义组件属性
const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['node-click', 'node-drop']);

// 拖拽状态管理
const expandedNodes = ref(new Set());
const draggedNode = ref(null);
const dragOverNode = ref(null);
const dragPosition = ref('');
const dragPreview = ref(null); // 用于存储拖拽预览信息
const autoExpandTimer = ref(null); // 自动展开定时器

// 提供给子组件的展开状态检查方法
provide('isExpanded', (nodeId) => expandedNodes.value.has(nodeId));

// 处理节点点击
const handleNodeClick = (node) => {
  emit('node-click', node);
};

// 处理节点展开/收起
const handleToggleExpand = (node) => {
  if (expandedNodes.value.has(node.id)) {
    expandedNodes.value.delete(node.id);
  } else {
    expandedNodes.value.add(node.id);
  }
};

// 处理节点拖拽放置
const handleNodeDrop = ({ draggedNode, targetNode, position }) => {
  emit('node-drop', { draggedNode, targetNode, position });
  // 重置拖拽状态
  draggedNode.value = null;
  dragOverNode.value = null;
  dragPosition.value = '';
};

// 处理拖拽开始
const handleDragStart = (node) => {
  draggedNode.value = node;
};

// 处理拖拽经过节点
const handleDragOverNode = ({ node, position }) => {
  dragOverNode.value = node;
  dragPosition.value = position;
  dragPreview.value = { node, position };
  
  // 如果拖拽到目录节点内部，设置自动展开定时器
  if (position === 'inside' && node.children && !node.postId) {
    // 清除之前的定时器
    if (autoExpandTimer.value) {
      clearTimeout(autoExpandTimer.value);
    }
    
    // 设置新的定时器，1秒后自动展开
    autoExpandTimer.value = setTimeout(() => {
      if (!expandedNodes.value.has(node.id)) {
        expandedNodes.value.add(node.id);
      }
    }, 1000);
  } else {
    // 如果不是拖拽到内部，清除定时器
    if (autoExpandTimer.value) {
      clearTimeout(autoExpandTimer.value);
      autoExpandTimer.value = null;
    }
  }
};

// 处理拖拽结束
const handleDragEnd = () => {
  draggedNode.value = null;
  dragOverNode.value = null;
  dragPosition.value = '';
  dragPreview.value = null;
  
  // 清理自动展开定时器
  if (autoExpandTimer.value) {
    clearTimeout(autoExpandTimer.value);
    autoExpandTimer.value = null;
  }
};
</script>

<style scoped lang="less">
.tree-menu {
  width: 100%;
}
</style>