<template>
  <div 
    class="document-node"
    :class="{ 'dragging': isDragging }"
  >
    <div class="node-content" @click="handleNodeClick">
      <span class="icon"></span>
      <span class="name">{{ node.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 定义组件属性
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
});

// 定义事件
const emit = defineEmits(['node-click', 'node-drop']);

// 拖拽状态
const isDragging = ref(false);

// 处理节点点击
const handleNodeClick = () => {
  emit('node-click', props.node);
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
    background-color: #ffebee; // 拖拽中红色背景
    opacity: 0.8;
  }
  
  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 20px; // 文档节点比目录节点稍微缩进
  }
  
  .icon {
    font-size: 14px;
  }
  
  .name {
    font-weight: 400;
    color: #666;
  }
}
</style>