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
};

// 处理拖拽结束
const handleDragEnd = () => {
  draggedNode.value = null;
  dragOverNode.value = null;
  dragPosition.value = '';
};
</script>

<style scoped lang="less">
.tree-menu {
  width: 100%;
}
</style>