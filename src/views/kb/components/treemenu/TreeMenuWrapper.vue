<template>
  <div ref="wrapperRef" class="tree-menu-wrapper">

    <div v-if="showSkeleton" class="tree-menu-skeleton">
      <!-- 模拟搜索框 -->
      <div class="search-container-skeleton">
        <a-skeleton-line :rows="1" />
      </div>
      
      <!-- 模拟树节点 -->
      <div class="tree-nodes-skeleton">
        <div 
          v-for="i in 8" 
          :key="i" 
          class="tree-node-skeleton"
          :style="{ marginLeft: `${Math.floor(Math.random() * 3) * 20}px` }"
        >
          <a-skeleton-line :rows="1" />
        </div>
      </div>
    </div>
   
    <TreeMenuNew 
      v-else
      :tree-data="treeData" 
      :edit="edit" 
      :kb-id="kbId"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import TreeMenuNew from './TreeMenuNew.vue';

// 启用属性继承
defineOptions({
  inheritAttrs: false
});

const props = defineProps({
  treeData: {
    type: Array,
    required: true
  },
  edit: {
    type: Boolean,
    default: false
  },
  kbId: {
    type: String,
    default: '-1'
  }
});

// 判断是否显示骨架屏
const showSkeleton = computed(() => 
{
  return !props.kbId || parseInt(props.kbId) < 1;
});

// 创建ref引用
const wrapperRef = ref(null);
</script>

<style scoped>
.tree-menu-wrapper {
  width: 100%;
  height: 100%;
}

.tree-menu-skeleton {
  user-select: none;
}

.search-container-skeleton {
  padding: 12px;
  border-bottom: 1px solid var(--color-neutral-3);
}

.tree-node-skeleton {
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 4px;
}

.tree-node-skeleton :deep(.arco-skeleton-line-row) {
  height: 24px !important;
}
</style>