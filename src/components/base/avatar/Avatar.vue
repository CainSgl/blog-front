<template>
  
  <a-avatar 
    :size="size" 
    :shape="shape"
    :trigger-type="triggerType"
    :style="style"
    :class="cls"
    :loading="loading"
    :type="type"
    @click="handleClick"
    :auto-fix-font-size="false"
    :image-url="computedAvatarUrl"
  >
    <slot>
      <icon-user :size="typeof size === 'number' ? size * 0.6 : 24" v-if="!computedAvatarUrl" />
    </slot>
    <template #trigger-icon v-if="$slots['trigger-icon']">
      <slot name="trigger-icon" />
    </template>
  </a-avatar>
</template>

<script setup>
import {computed} from 'vue';
import {IconUser,} from '@arco-design/web-vue/es/icon';
import {computeResourceUrl} from '@/utils/urlHelper.js';

// 定义组件的 props，与 a-avatar 组件保持一致
const props = defineProps({
  size: {
    type: [Number, String],
    default: 40
  },
  shape: {
    type: String,
    default: 'circle', // 'circle' or 'square'
    validator: (value) => ['circle', 'square'].includes(value)
  },
  src: {
    type: String,
    default: null
  },
  triggerType: {
    type: [String, Array],
    default: null
  },
  style: {
    type: Object,
    default: () => ({})
  },
  cls: {
    type: [String, Array, Object],
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: null, // 'text' or 'icon'
    validator: (value) => ['text', 'icon', null].includes(value)
  }
});

// 计算完整的头像 URL
const computedAvatarUrl = computed(() => computeResourceUrl(props.src));

// 传递点击事件
const emit = defineEmits(['click']);

const handleClick = (e) => 
{
  emit('click', e);
};
</script>