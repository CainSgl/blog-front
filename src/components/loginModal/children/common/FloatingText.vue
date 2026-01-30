<template>
  <div class="floating-text-container" :class="className">
    <span 
      v-for="(char, index) in chars" 
      :key="index" 
      class="floating-char"
      :style="{ animationDelay: `${index * 0.1}s` }"
    >
      {{ char }}
    </span>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  className: {
    type: String,
    default: ''
  }
});

// 将文本拆分为字符数组
const chars = ref(props.text.split(''));

// 当组件挂载时触发动画
onMounted(() => 
{
  // 触发动画的类会在CSS中定义
});
</script>

<style scoped>
.floating-text-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  /* 继承父级的文本样式 */
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
  color: inherit;
  /* 最简化样式以提高清晰度 */
  padding: 5px;
}

.floating-char {
  opacity: 0;
  display: inline-block;
  transform: translateY(1.2em);
  animation: floatUp 0.4s forwards;
  animation-timing-function: ease-out;
  /* 最简化文本效果 */
  text-shadow: none;
  /* 确保清晰渲染 */
  will-change: transform, opacity;
  /* 确保文本不会被截断 */
  line-height: 1.2;
}

@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translateY(1.2em);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>