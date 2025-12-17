<template>
  <div 
    class="directory-node-wrapper"
  >
    <div 
      class="directory-node"
      :class="{
        'expanded': isExpanded,
        'collapsed': !isExpanded,
        'dragging': isDragging
      }"
    >
      <div class="node-content" @click="toggleExpand">
        <span class="arrow" :class="{ 'expanded': isExpanded }">▶</span>
        <span class="name">{{ node.name }}</span>
      </div>
    </div>
    
    <!-- 子节点 -->
    <div v-show="isExpanded" class="children-container" v-if="hasChildren">
      <draggable 
        v-model="node.children" 
        :group="{ name: 'tree', pull: true, put: true }"
        :animation="150"
        item-key="id"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onDragChange"
      >
        <template #item="{ element }">
          <TreeNodeNew 
            :node="element"
            :level="level + 1"
            @node-click="$emit('node-click', element)"
            @node-drop="handleChildDrop"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
import draggable from 'vuedraggable';
import TreeNodeNew from './TreeNodeNew.vue';

// 定义组件属性
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  isExpanded: {
    type: Boolean,
    default: false
  },
  childrenNodes: {
    type: Array,
    default: () => []
  },
  level: {
    type: Number,
    default: 0
  }
});

// 定义事件
const emit = defineEmits(['toggle-expand', 'node-click', 'node-drop']);

// 注入父组件的方法
const parentIsExpanded = inject('isExpanded', () => true);

// 判断当前节点是否展开
const isExpanded = computed(() => {
  return parentIsExpanded(props.node.id);
});

// 判断是否为目录节点（有 children 属性且没有 postId）
const hasChildren = computed(() => {
  return props.node.children !== undefined && !props.node.postId;
});

// 切换展开/收起
const toggleExpand = () => {
  emit('toggle-expand');
};

// 拖拽状态
const isDragging = ref(false);

// 处理拖拽开始
const onDragStart = (event) => {
  isDragging.value = true;
  // 在拖拽开始时临时收起当前节点
  if (hasChildren.value && isExpanded.value) {
    emit('toggle-expand');
  }
};

// 处理拖拽结束
const onDragEnd = (event) => {
  isDragging.value = false;
  // 拖拽结束后恢复展开状态（如果之前是展开的）
  if (hasChildren.value && !isExpanded.value) {
    emit('toggle-expand');
  }
};

// 处理拖拽变化
const onDragChange = (event) => {
  // 处理拖拽的变更事件，如添加、移动等
  if (event.added) {
    // 新增了元素
    console.log('元素被添加', event.added.element);
  } else if (event.moved) {
    // 移动了元素
    console.log('元素被移动', event.moved.element);
  } else if (event.removed) {
    // 移除了元素
    console.log('元素被移除', event.removed.element);
  }
};

// 处理子节点拖拽放置事件
const handleChildDrop = (payload) => {
  emit('node-drop', payload);
};
</script>

<style scoped lang="less">
.directory-node-wrapper {
  width: 100%;
}

.directory-node {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  background-color: white;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &.dragging {
    background-color: #ffebee;
    opacity: 0.8;
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
  
  .children-container {
    margin-left: 16px;
  }
}
</style>