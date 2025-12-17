<template>
  <div class="tree-menu">
    <!-- 根级节点 -->
    <TreeNode
      v-for="node in treeData"
      :key="node.id"
      :node="node"
      :level="0"
      @node-click="handleNodeClick"
      @node-drop="handleNodeDrop"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import TreeNode from './TreeMenu/TreeNodeNew.vue';

// 定义组件属性
const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['node-click', 'node-drop']);

// 处理节点点击
const handleNodeClick = (node) => {
  emit('node-click', node);
};

// 处理节点拖拽放置
const handleNodeDrop = ({ draggedNode, targetNode, position }) => {
  emit('node-drop', { draggedNode, targetNode, position });
  
  // 重新计算所有节点的层级
  updateAllNodeLevels(props.treeData);
};

// 递归更新所有节点的层级
const updateAllNodeLevels = (nodes, currentLevel = 0) => {
  nodes.forEach(node => {
    // 为每个节点设置当前计算出的层级
    node.level = currentLevel;
    
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      updateAllNodeLevels(node.children, currentLevel + 1);
    }
  });
};

// 监听 treeData 的变化，自动更新层级
watch(() => props.treeData, (newData) => {
  if (newData && newData.length > 0) {
    updateAllNodeLevels(newData);
  }
}, { deep: true, immediate: true });
</script>

<style scoped lang="less">
.tree-menu {
  width: 100%;
}
</style>