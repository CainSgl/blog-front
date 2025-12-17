<template>
  <div 
    class="document-node"
    :class="{
      'dragging': isDragging,
      'drag-over': isDragOver && isDropAllowed,
      'drag-over-not-allowed': isDragOver && !isDropAllowed,
      [`drag-${dragPosition}`]: isDragOver && dragPosition && isDropAllowed,
      [`drag-${dragPosition}-not-allowed`]: isDragOver && dragPosition && !isDropAllowed,
      'preview-before': dragPosition === 'before',
      'preview-after': dragPosition === 'after',
      'preview-inside': dragPosition === 'inside' && isDropAllowed
    }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="node-content">
      <span class="icon">📄</span>
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
  'node-click', 
  'drag-start', 
  'drag-end', 
  'drag-over', 
  'drag-enter', 
  'drag-leave', 
  'drop'
]);

const handleClick = () => {
  emit('node-click');
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
.document-node {
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
  
  /* 预览样式 */
  &.preview-before::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #165dff;
    z-index: 1000;
  }
  
  &.preview-after::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #165dff;
    z-index: 1000;
  }
  
  &.preview-inside {
    background-color: #bbdefb;
    box-shadow: inset 0 0 0 2px #165dff;
  }
  
  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .icon {
    font-size: 14px;
  }
  
  .name {
    color: #333;
    flex: 1;
  }
}
</style>