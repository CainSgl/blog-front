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
        :show-status="showStatus"
        :onlyFans="onlyFans"
        :showBottom="showBottom"
        :inHtlm="inHtlm"
        @clickCard="handleClickCard"
    />
  </div>
</template>

<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import PostCard from './PostCard.vue';

const emit = defineEmits(['clickCard']);

const props = defineProps({
  post: {
    type: Object,
    default: null
  },
  width: {
    type: [Number, String],
    default: '100%'
  },
  height: {
    type: [Number, String],
    default: 'auto'
  },
  style: {
    type: Object,
    default: () => ({})
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  onlyFans: {
    type: Boolean,
    default: false
  },
  showBottom: {
    type: Boolean,
    default: true
  },
  inHtlm: {
    type: Boolean,
    default: false
  }
});

const wrapperRef = ref(null);
const computedWidth = ref(0);
const computedHeight = ref(0);

// 常量
const MIN_HEIGHT = 150;

// 样式计算
const wrapperStyle = computed(() => {
  const styleObj = { ...props.style };

  if (typeof props.width === 'number') {
    styleObj.width = `${props.width}px`;
  } else if (props.width) {
    styleObj.width = props.width;
  }

  if (typeof props.height === 'number') {
    styleObj.height = `${props.height}px`;
  } else if (props.height) {
    styleObj.height = props.height;
  }

  return styleObj;
});

// 尺寸计算
const calculateDimensions = async () => {
  await nextTick();

  if (!wrapperRef.value) return;

  const rect = wrapperRef.value.getBoundingClientRect();
  const actualWidth = wrapperRef.value.clientWidth || rect.width;
  const actualHeight = wrapperRef.value.clientHeight || rect.height;

  computedWidth.value = actualWidth || 0;
  computedHeight.value = Math.max(actualHeight, MIN_HEIGHT);
};

// 事件处理
const handleClickCard = (post) => {
  emit('clickCard', post);
};

// 生命周期
let resizeObserver = null;

onMounted(() => {
  calculateDimensions();
  window.addEventListener('resize', calculateDimensions);

  if (wrapperRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(calculateDimensions);
    resizeObserver.observe(wrapperRef.value);
  }
});

watch(() => [props.width, props.height], () => {
  nextTick(calculateDimensions);
});

onUnmounted(() => {
  window.removeEventListener('resize', calculateDimensions);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
.post-card-wrapper {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>