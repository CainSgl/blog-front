<template>
  <a-image 
    :src="computedUrl" 
    v-bind="filteredAttrs"
  />
</template>

<script setup>
import { computed, useAttrs } from 'vue';
import { API_BASE_URL } from '@/config';

// 定义组件的 props
const props = defineProps({
  src: {
    type: String,
    required: true
  }
});

// 获取所有传递给组件的 attributes
const attrs = useAttrs();

// 过滤掉我们自己处理的属性，其余的传递给 AImage
const filteredAttrs = computed(() => {
  // 从 attrs 中过滤掉 src，将其他属性传递给 AImage
  const { src, ...restAttrs } = attrs;
  return restAttrs;
});

// 计算完整的图片 URL
const computedUrl = computed(() => {
  if (!props.src) {
    return '';
  }
  console.log(props.src)
  // 如果已经是完整的 URL，则直接返回
  if (props.src.startsWith('http')) {
    return props.src;
  }
  
  // 否则拼接 API_BASE_URL
  return `${API_BASE_URL}/file?f=${props.src}`;
});

// 使用 defineOptions 来设置 inheritAttrs 为 false
// 这样可以更好地控制属性的传递
defineOptions({
  inheritAttrs: false
});
</script>