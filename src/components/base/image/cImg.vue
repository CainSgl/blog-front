<template>
  <a-image 
    :src="computedUrl" 
    v-bind="filteredAttrs"
    class="c-img"
  />
</template>

<script setup>
import {computed, useAttrs} from 'vue';
import {computeResourceUrl} from '@/utils/urlHelper.js';

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
const computedUrl = computed(() => computeResourceUrl(props.src));

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