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
  padding: 16px 24px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
  
  :deep(.arco-breadcrumb-item) {
    cursor: pointer;
    
    &:hover {
      color: rgb(var(--primary-6));
    }
  }
}
</style>
