<template>
  <div 
    class="preview-node"
    :style="{ 
      paddingLeft: `${level * 20}px`,
      top: `${position.y}px`,
      left: `${position.x}px`
    }"
  >
    <div class="preview-content">
      {{ node.name }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
});
</script>

<style scoped lang="less">
.preview-node {
  position: absolute;
  z-index: 9999;
  background-color: #e3f2fd;
  border: 1px dashed #165dff;
  border-radius: 4px;
  opacity: 0.8;
  pointer-events: none;
  
  .preview-content {
    padding: 4px 8px;
    font-size: 14px;
    color: #165dff;
    white-space: nowrap;
  }
}
</style>