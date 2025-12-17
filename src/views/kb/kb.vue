<template>
  <div class="knowledge-base">
    <div class="sidebar">
      <TreeMenu 
        :tree-data="treeData" 
        @node-click="handleNodeClick"
        @node-drop="handleNodeDrop"
      />
    </div>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import TreeMenu from '@/components/TreeMenu.vue';

// 模拟数据
const treeData = ref([
  {
    "id": 1,
    "kbId": 1,
    "name": "目录1",
    "sortNum": 1
  },
  {
    "id": 2,
    "kbId": 1,
    "name": "目录2",
    "sortNum": 2,
    "children": [
      {
        "id": 3,
        "kbId": 1,
        "parentId": 1,
        "name": "目录3",
        "sortNum": 2,
        "children": [
          {
            "id": 4,
            "kbId": 1,
            "parentId": 4,
            "name": "目录5",
            "sortNum": 2
          },
          {
            "id": 5,
            "kbId": 1,
            "parentId": 4,
            "name": "文章1",
            "postId": 5,
            "sortNum": 2
          },
          {
            "id": 6,
            "kbId": 1,
            "parentId": 4,
            "name": "文章2",
            "postId": 1998966530797060097,
            "sortNum": 3
          }
        ]
      }
    ]
  }
]);

// 处理节点点击
const handleNodeClick = (node) => {
  console.log('Node clicked:', node);
};

// 查找节点的辅助函数
const findNode = (nodes, id) => {
  for (let node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 查找节点的父节点
const findParentNode = (nodes, id, parent = null) => {
  for (let node of nodes) {
    if (node.id === id) {
      return parent;
    }
    if (node.children) {
      const found = findParentNode(node.children, id, node);
      if (found) return found;
    }
  }
  return null;
};

// 从父节点中移除节点
const removeNodeFromParent = (nodes, id) => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === id) {
      return nodes.splice(i, 1)[0];
    }
    if (node.children) {
      const removed = removeNodeFromParent(node.children, id);
      if (removed) return removed;
    }
  }
  return null;
};

// 将节点添加到指定位置
const addNodeToPosition = (nodes, newNode, targetNode, position) => {
  // 如果是添加到内部
  if (position === 'inside') {
    if (!targetNode.children) {
      targetNode.children = [];
    }
    targetNode.children.push(newNode);
    return true;
  }

  // 查找目标节点的父节点
  const parentNode = findParentNode(nodes, targetNode.id);
  const targetArray = parentNode ? parentNode.children : nodes;
  
  // 找到目标节点的索引
  const targetIndex = targetArray.findIndex(n => n.id === targetNode.id);
  
  if (targetIndex === -1) return false;
  
  // 根据位置插入节点
  if (position === 'before') {
    targetArray.splice(targetIndex, 0, newNode);
  } else if (position === 'after') {
    targetArray.splice(targetIndex + 1, 0, newNode);
  }
  
  return true;
};

// 处理节点拖拽放置
const handleNodeDrop = ({ draggedNode, targetNode, position }) => {
  console.log('Node dropped:', { draggedNode, targetNode, position });
  
  // 防止节点拖拽到自己内部
  if (draggedNode.id === targetNode.id) {
    console.log('Cannot drop node into itself');
    return;
  }
  
  // 防止节点拖拽到自己的子节点内
  const isDraggingToChild = (node, targetId) => {
    if (!node.children) return false;
    for (const child of node.children) {
      if (child.id === targetId) return true;
      if (isDraggingToChild(child, targetId)) return true;
    }
    return false;
  };
  
  if (isDraggingToChild(draggedNode, targetNode.id)) {
    console.log('Cannot drop node into its own child');
    return;
  }
  
  // 创建节点副本以避免引用问题
  const nodeToMove = JSON.parse(JSON.stringify(findNode(treeData.value, draggedNode.id)));
  if (!nodeToMove) return;
  
  // 从原位置移除节点
  removeNodeFromParent(treeData.value, draggedNode.id);
  
  // 添加到新位置
  addNodeToPosition(treeData.value, nodeToMove, targetNode, position);
  
  // 更新 treeData 以触发重新渲染
  treeData.value = [...treeData.value];
};
</script>

<style scoped lang="less">
.knowledge-base {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 300px;
  border-right: 1px solid #e5e6eb;
  padding: 20px;
  overflow-y: auto;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>