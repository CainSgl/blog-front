<template>
  <div v-if="breadcrumbs.length > 0" class="breadcrumb-container">
    <a-breadcrumb>
      <a-breadcrumb-item @click="$emit('clear-selection')">
        <icon-home />
        首页
      </a-breadcrumb-item>
      <a-breadcrumb-item 
        v-for="(crumb, index) in breadcrumbs" 
        :key="crumb.key"
        @click="$emit('breadcrumb-click', crumb, index)"
      >
        {{ crumb.name }}
      </a-breadcrumb-item>
    </a-breadcrumb>
  </div>
</template>

<script setup>
import {IconHome} from '@arco-design/web-vue/es/icon';

defineProps({
  breadcrumbs: {
    type: Array,
    default: () => []
  }
});

defineEmits(['clear-selection', 'breadcrumb-click']);
</script>

<style scoped lang="less">
.breadcrumb-container {
  padding: @size-4 24px;
  background: @color-bg-2;
  border-bottom: @border-1 solid @color-border-2;
  
  :deep(.arco-breadcrumb-item) {
    cursor: pointer;
    
    &:hover {
      color: @primary-6;
    }
  }
}
</style>
