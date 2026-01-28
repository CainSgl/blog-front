<template>
  <a-image 
    :src="computedUrl" 
    v-bind="filteredAttrs"
    class="c-img"
  />
</template>

<script setup>
import { computed, useAttrs } from 'vue';
import { API_BASE_URL } from '@/config/index.js';

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
const filteredAttrs = computed(() => 
{
  // 从 attrs 中过滤掉 src，将其他属性传递给 AImage
  const { src, ...restAttrs } = attrs;
  return restAttrs;
});

// 计算完整的图片 URL
const computedUrl = computed(() => 
{
  if (!props.src) 
  {
    return '';
  }
  // 如果已经是完整的 URL，则直接返回
  if (props.src.startsWith('http')) 
  {
    return props.src;
  }
  if(props.src.startsWith('file'))
  {
    return props.src;
  }
  if(props.src.startsWith('blob'))
  {
    return props.src;
  }
  if(props.src.startsWith('/'))
  {
    return`${API_BASE_URL}${props.src}`;
  }

  // 否则拼接 API_BASE_URL
  return `${API_BASE_URL}/file?f=${props.src}`;
});

defineOptions({
  inheritAttrs: false
});
</script>

<style scoped>
.c-img {
  display: inline-block;
}

.c-img :deep(.arco-image-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0; 
  overflow: hidden; 
}
</style>