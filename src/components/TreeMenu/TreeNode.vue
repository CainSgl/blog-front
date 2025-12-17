<template>
  <div class="tree-node" :style="{ paddingLeft: `${level * 20}px` }" :data-node-id="node.id">
    <!-- 目录节点 -->
    <DirectoryNode 
      v-if="hasChildren" 
      :node="node"
      :is-expanded="isExpanded"
      :is-dragging="isDragging"
      :is-drag-over="isDragOver"
      :drag-position="isDragOver ? dragPosition : ''"
      :is-drop-allowed="isDropAllowed"
      @toggle-expand="toggleExpand"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
      @drag-over="handleDragOver"
      @drag-enter="handleDragEnter"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
    />
    
    <!-- 文档节点 -->
    <DocumentNode 
      v-else
      :node="node"
      :is-dragging="isDragging"
      :is-drag-over="isDragOver"
      :drag-position="isDragOver ? dragPosition : ''"
      :is-drop-allowed="isDropAllowed"
      @node-click="handleClick"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
      @drag-over="handleDragOver"
      @drag-enter="handleDragEnter"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
    />
    
    <!-- 子节点 -->
    <div v-show="isExpanded" class="children-container" v-if="hasChildren">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :dragged-node="draggedNode"
        :drag-over-node="dragOverNode"
        :drag-position="dragPosition"
        :drag-preview="dragPreview"
        @node-click="emit('node-click', $event)"
        @toggle-expand="emit('toggle-expand', $event)"
        @node-drop="emit('node-drop', $event)"
        @drag-start="emit('drag-start', $event)"
        @drag-over-node="emit('drag-over-node', $event)"
        @drag-end="emit('drag-end', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';
import DirectoryNode from './DirectoryNode.vue';
import DocumentNode from './DocumentNode.vue';

// 定义组件属性
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  draggedNode: {
    type: Object,
    default: null
  },
  dragOverNode: {
    type: Object,
    default: null
  },
  dragPosition: {
    type: String,
    default: ''
  },
  dragPreview: {
    type: Object,
    default: null
  }
});

// 定义事件
const emit = defineEmits([
  'node-click', 
  'toggle-expand', 
  'node-drop', 
  'drag-start', 
  'drag-over-node', 
  'drag-end'
]);

// 注入父组件的方法
const parentIsExpanded = inject('isExpanded', () => true);

// 判断是否为目录节点（有 children 属性且没有 postId）
const hasChildren = computed(() => {
  return props.node.children !== undefined && !props.node.postId;
});

// 判断当前节点是否展开
const isExpanded = computed(() => {
  return hasChildren.value ? parentIsExpanded(props.node.id) : false;
});

// 拖拽状态
const isDragging = computed(() => {
  return props.draggedNode && props.draggedNode.id === props.node.id;
});

const isDragOver = computed(() => {
  return props.dragOverNode && props.dragOverNode.id === props.node.id;
});

// 检查是否允许放置（防止拖拽到自己或子节点内）
const isDropAllowed = computed(() => {
  if (!props.draggedNode) return true;
  
  // 防止节点拖拽到自己内部
  if (props.draggedNode.id === props.node.id) {
    return false;
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
  
  return !isDraggingToChild(props.draggedNode, props.node.id);
});

// 切换展开/收起
const toggleExpand = () => {
  if (hasChildren.value) {
    emit('toggle-expand', props.node);
  }
};

// 处理节点点击
const handleClick = () => {
  emit('node-click', props.node);
};

// 拖拽相关事件处理
const handleDragStart = (event) => {
  emit('drag-start', props.node);
  event.dataTransfer.setData('text/plain', JSON.stringify(props.node));
  event.dataTransfer.effectAllowed = 'move';
};

const handleDragEnd = () => {
  emit('drag-end');
};

const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  
  // 防止节点拖拽到自己内部
  if (props.draggedNode && props.draggedNode.id === props.node.id) {
    event.dataTransfer.dropEffect = 'none';
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
  
  if (props.draggedNode && isDraggingToChild(props.draggedNode, props.node.id)) {
    event.dataTransfer.dropEffect = 'none';
    return;
  }
  
  // 计算拖拽位置
  const rect = event.currentTarget.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const height = rect.height;
  
  let position = '';
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    // 检查目标节点是否为目录节点（可以接受子节点）
    if (props.node.children !== undefined && !props.node.postId) {
      position = 'inside';
    } else {
      position = 'after';
    }
  }
  
  emit('drag-over-node', { node: props.node, position });
};

const handleDragEnter = (event) => {
  event.preventDefault();
};

const handleDragLeave = () => {};

const handleDrop = (event) => {
  event.preventDefault();
  
  // 检查是否允许放置
  if (!isDropAllowed.value) {
    console.log('Drop not allowed');
    return;
  }
  
  const draggedNodeData = JSON.parse(event.dataTransfer.getData('text/plain'));
  emit('node-drop', { 
    draggedNode: draggedNodeData, 
    targetNode: props.node, 
    position: props.dragPosition 
  });
};
</script>

<style scoped lang="less">
.tree-node {
  position: relative;
}
</style>