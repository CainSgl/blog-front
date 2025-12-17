<template>
  <div class="tree-node" :style="{ paddingLeft: `${displayLevel * 20}px` }" :data-node-id="node.id">
    <!-- 目录节点 -->
    <DirectoryNodeNew 
      v-if="hasChildren" 
      :node="node"
      :is-expanded="isExpanded"
      :children-nodes="node.children"
      :level="displayLevel"
      @toggle-expand="toggleExpand"
      @node-click="$emit('node-click', node)"
      @node-drop="$emit('node-drop', $event)"
    />
    
    <!-- 文档节点 -->
    <DocumentNodeNew 
      v-else
      :node="node"
      :level="displayLevel"
      @node-click="$emit('node-click', node)"
      @node-drop="$emit('node-drop', $event)"
    />
  </div>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';
import DirectoryNodeNew from './DirectoryNodeNew.vue';
import DocumentNodeNew from './DocumentNodeNew.vue';

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

// 注入父组件的方法
const parentIsExpanded = inject('isExpanded', () => true);

// 使用传入的 level 作为显示层级，但确保拖拽后能正确更新
const displayLevel = computed(() => {
  // 如果节点有 parentId，可以根据 parentId 来计算层级
  if (props.node.parentId) {
    // 这里需要一个更智能的方式来计算层级
    // 暂时返回传入的 level，但确保它是合理的
    return Math.max(0, props.level);
  }
  return props.level;
});

// 判断是否为目录节点（有 children 属性且没有 postId）
const hasChildren = computed(() => {
  return props.node.children !== undefined && !props.node.postId;
});

// 判断当前节点是否展开
const isExpanded = computed(() => {
  return hasChildren.value ? parentIsExpanded(props.node.id) : false;
});

// 切换展开/收起
const toggleExpand = () => {
  if (hasChildren.value) {
    emit('toggle-expand', props.node);
  }
};
</script>

<style scoped lang="less">
.tree-node {
  position: relative;
}
</style>