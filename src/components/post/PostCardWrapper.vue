<template>
  <div 
    ref="wrapperRef"
    class="post-card-wrapper" 
    :style="wrapperStyle"
  >
    <PostCard 
      :post="post"
      :height="computedHeight"
      :width="computedWidth"
      @clickCard="handleClickCard"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import PostCard from './PostCard.vue'
import { defineEmits } from 'vue'

const emit = defineEmits(['clickCard']);

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  width: {
    type: [Number, String],
    default: '100%'
  },
  height: {
    type: [Number, String],
    default: 'auto'
  },
  // 额外的样式属性
  style: {
    type: Object,
    default: () => ({})
  }
})

const handleClickCard = (post) => {
  emit('clickCard', post);
}

const wrapperRef = ref(null)
const computedWidth = ref(0)
const computedHeight = ref(0)

// 合并wrapper的样式
const wrapperStyle = computed(() => {
  const styleObj = { ...props.style }
  
  // 处理宽度
  if (typeof props.width === 'number') {
    styleObj.width = `${props.width}px`
  } else if (props.width) {
    styleObj.width = props.width
  }
  
  // 处理高度
  if (typeof props.height === 'number') {
    styleObj.height = `${props.height}px`
  } else if (props.height) {
    styleObj.height = props.height
  }
  
  return styleObj
})

// 计算实际可用的宽高
const calculateDimensions = async () => {
  await nextTick() // 确保DOM已更新
  
  if (wrapperRef.value) {
    // 使用getBoundingClientRect获取精确尺寸
    const rect = wrapperRef.value.getBoundingClientRect()
    // 使用clientWidth和clientHeight以排除边框和滚动条
    const actualWidth = wrapperRef.value.clientWidth || rect.width
    const actualHeight = wrapperRef.value.clientHeight || rect.height
    
    // 设置计算后的尺寸，减去一些内边距以适应PostCard的样式
    // 根据PostCard的响应式逻辑，保留一些空间用于内边距
    computedWidth.value = Math.max(actualWidth - 8, 200) // 最小宽度200px
    computedHeight.value = Math.max(actualHeight - 8, 150) // 最小高度150px
  }
}

// 处理窗口大小变化
const handleResize = () => {
  calculateDimensions()
}

// 监听窗口大小变化
onMounted(() => {
  calculateDimensions()
  
  // 添加窗口大小变化监听器
  window.addEventListener('resize', handleResize)
  
  // 尝试监听容器大小变化
  if (wrapperRef.value) {
    // 使用 ResizeObserver 监听容器大小变化
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        calculateDimensions()
      })
      resizeObserver.observe(wrapperRef.value)
      
      // 保存引用以便在卸载时清理
      wrapperRef.value._resizeObserver = resizeObserver
    }
  }
})

// 监听props的width和height变化
watch(() => [props.width, props.height], () => {
  // 延迟执行以确保DOM更新
  nextTick(() => {
    calculateDimensions()
  })
})

// 卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  if (wrapperRef.value && wrapperRef.value._resizeObserver) {
    wrapperRef.value._resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.post-card-wrapper {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>