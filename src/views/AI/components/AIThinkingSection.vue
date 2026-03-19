<template>
  <div v-if="thinking" class="thinking-section" :class="{ collapsed: isCollapsed }">
    <div class="thinking-header" @click="toggleCollapse">
      <div class="thinking-title">
        <icon-bulb />
        <span>思考过程</span>
      </div>
      <icon-down :class="{ rotated: !isCollapsed }" />
    </div>
    <div v-show="!isCollapsed" class="thinking-content">
      {{ thinking }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { IconBulb, IconDown } from '@arco-design/web-vue/es/icon';

defineProps({
  thinking: {
    type: String,
    default: ''
  }
});

const isCollapsed = ref(false);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped lang="less">
.thinking-section {
  background-color: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  transition: all 0.3s;

  &.collapsed {
    .thinking-header {
      border-bottom: none;
    }
  }

  .thinking-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--color-border-2);
    transition: all 0.2s;

    &:hover {
      background-color: var(--color-fill-2);
    }

    .thinking-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--color-text-2);
      font-weight: 500;

      svg {
        font-size: 14px;
        color: rgb(var(--primary-6));
      }
    }

    .arco-icon-down {
      font-size: 12px;
      color: var(--color-text-3);
      transition: transform 0.3s;

      &.rotated {
        transform: rotate(-180deg);
      }
    }
  }

  .thinking-content {
    padding: 12px 16px;
    font-size: 13px;
    color: var(--color-text-3);
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
