<template>
  <div class="dir-view">
    <div v-if="!items.length" class="empty">
      <a-empty description="这里什么都没有！" />
    </div>
    <div>
      <div class="dir-content">
        <div v-for="(item, index) in items" :key="item.id" class="dir-item"
          :class="{ 'is-article': item.postId, 'is-folder': !item.postId, 'first-item-highlight': index === 0 && isProgressActive }"
          @click="handleItemClick(item)">
          <div class="item-icon">
            <icon-file v-if="item.postId" />
            <icon-folder v-else />
          </div>
          <div class="item-content">
            <div class="item-name">{{ item.name }}</div>
          </div>
        </div>
      </div>

      <!-- 向上滑动进度条 -->
      <ScrollProgressTrigger v-if="hasPrevious" ref="progressTriggerUpRef" :enabled="items.length > 0" direction="up"
        progress-tip="向上滑动返回上一级" @progress-complete="handleProgressCompleteUp"
        @progress-change="handleProgressChangeUp" />

      <!-- 向下滑动进度条 -->
      <ScrollProgressTrigger ref="progressTriggerRef" :enabled="items.length > 0" direction="down"  progress-tip="向下滑动跳转到下一级"
        @progress-complete="handleProgressComplete" @progress-change="handleProgressChange" />
    </div>
  </div>
</template>

<script setup>
import {computed, nextTick, ref, watch} from 'vue';
import {IconFile, IconFolder} from '@arco-design/web-vue/es/icon';
import ScrollProgressTrigger from '@/views/about/components/ScrollProgressTrigger.vue';

const props = defineProps({
  node: {
    type: Object,
    default: null
  },
  hasPrevious: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['load-more', 'item-click', 'load-previous']);

const progressTriggerRef = ref(null);
const progressTriggerUpRef = ref(null);
const isProgressActive = ref(false);
const isProgressUpActive = ref(false);



// 直接使用当前节点的 children 数组
const items = computed(() => {
  if (!props.node || !props.node.children) return [];
  return props.node.children;
});

// 处理向下进度完成事件
const handleProgressComplete = () => {
  if (items.value.length > 0) {
    emit('load-more', items.value[0]);
  }
};

// 处理向下进度变化事件
const handleProgressChange = (progress) => {
  isProgressActive.value = progress > 0;

};

// 处理向上进度完成事件
const handleProgressCompleteUp = () => {
  emit('load-previous');
};

// 处理向上进度变化事件
const handleProgressChangeUp = (progress) => {
  isProgressUpActive.value = progress > 0;

};

// 处理项目点击
const handleItemClick = (item) => {
  emit('item-click', item);
};

// 监听 node 变化，重置进度条
watch(() => props.node, () => {
  nextTick(() => {
    if (progressTriggerRef.value) {
      progressTriggerRef.value.resetProgress();
    }
    if (progressTriggerUpRef.value) {
      progressTriggerUpRef.value.resetProgress();
    }
    isProgressActive.value = false;
    isProgressUpActive.value = false;
  });
}, { deep: true });
</script>

<style scoped lang="less">
.dir-view {
  padding: 24px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.dir-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dir-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    background: var(--color-bg-3);
    border-color: var(--color-border-3);
    transform: translateX(4px);
  }

  &.is-article {
    .item-icon {
      color: rgb(var(--primary-6));
    }
  }

  &.is-folder {
    .item-icon {
      color: rgb(var(--warning-6));
    }
  }

  &.first-item-highlight {
    background-color: var(--color-primary-light-1);
    border-color: rgb(var(--primary-6));
  }
}

.item-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-path {
  font-size: 12px;
  color: var(--color-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
