<template>
  <a-tooltip v-bind="$attrs" :popup-visible="computedPopupVisible">
    <slot></slot>
    <template v-if="$slots.content" #content>
      <slot name="content"></slot>
    </template>
  </a-tooltip>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';

const props = defineProps({
  popupVisible: {
    type: Boolean,
    default: undefined
  }
});

const hasMouse = ref(true);

onMounted(() => {
  // 检测设备是否有鼠标
  hasMouse.value = window.matchMedia('(pointer: fine)').matches;
});

const computedPopupVisible = computed(() => {
  // 如果没有鼠标，强制隐藏
  if (!hasMouse.value) {
    return false;
  }
  // 否则使用传入的 popupVisible 值
  return props.popupVisible;
});
</script>
