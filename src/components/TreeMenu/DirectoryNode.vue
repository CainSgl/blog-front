<template>
  <div 
    class="directory-node"
    :class="{
      'expanded': isExpanded,
      'collapsed': !isExpanded,
      'dragging': isDragging,
      'drag-over': isDragOver && isDropAllowed,
      'drag-over-not-allowed': isDragOver && !isDropAllowed,
      [`drag-${dragPosition}`]: isDragOver && dragPosition && isDropAllowed,
      [`drag-${dragPosition}-not-allowed`]: isDragOver && dragPosition && !isDropAllowed
    }"
    draggable="true"
    @click="toggleExpand"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="node-content">
      <span class="arrow" :class="{ 'expanded': isExpanded }">▶</span>
      <span class="name">{{ node.name }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  isExpanded: {
    type: Boolean,
    default: false
  },
  isDragging: {
    type: Boolean,
    default: false
  },
  isDragOver: {
    type: Boolean,
    default: false
  },
  dragPosition: {
    type: String,
    default: ''
  },
  isDropAllowed: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'toggle-expand', 
  'drag-start', 
  'drag-end', 
  'drag-over', 
  'drag-enter', 
  'drag-leave', 
  'drop'
]);

const toggleExpand = (event) => {
  // 防止拖拽时意外触发展开/收起
  if (event.target.closest('.directory-node')?.classList.contains('dragging')) {
    return;
  }
  emit('toggle-expand');
};

const handleDragStart = (event) => {
  emit('drag-start', event);
};

const handleDragEnd = (event) => {
  emit('drag-end', event);
};

const handleDragOver = (event) => {
  event.preventDefault();
  emit('drag-over', event);
};

const handleDragEnter = (event) => {
  emit('drag-enter', event);
};

const handleDragLeave = (event) => {
  emit('drag-leave', event);
};

const handleDrop = (event) => {
  emit('drop', event);
};
</script>

<style scoped lang="less">
.directory-node {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  background-color: white; // 默认白色背景
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &.dragging {
    background-color: red; // 拖拽中红色背景
    opacity: 0.8;
  }
  
  &.drag-over {
    background-color: #e3f2fd;
  }
  
  &.drag-over-not-allowed {
    background-color: #ffebee;
    cursor: not-allowed;
  }
  
  &.drag-before::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #165dff;
    z-index: 1000;
  }
  
  &.drag-after::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #165dff;
    z-index: 1000;
  }
  
  &.drag-inside {
    background-color: #bbdefb;
    box-shadow: inset 0 0 0 2px #165dff;
  }
  
  &.drag-inside-not-allowed {
    background-color: #ffcdd2;
    box-shadow: inset 0 0 0 2px #f44336;
  }
  
  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .arrow {
    transition: transform 0.2s ease;
    font-size: 12px;
    color: #666;
    
    &.expanded {
      transform: rotate(90deg);
    }
  }
  
  .name {
    font-weight: 500;
    color: #333;
    flex: 1;
  }
}
</style>