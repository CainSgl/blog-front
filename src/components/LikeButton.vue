<template>
  <div class="like-button" @click="handleLike">
    <IconHeart v-if="!liked" class="like-icon" />
    <IconHeartFill v-else class="like-icon liked" />
    <span class="like-count">{{ likeCount }}</span>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { IconHeart, IconHeartFill } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  initialLikeCount: {
    type: Number,
    default: 0
  },
  kbId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['like']);

const likeCount = ref(props.initialLikeCount);
const liked = ref(false);

function handleLike() {
  // 切换点赞状态
  liked.value = !liked.value;
  
  // 更新点赞数
  if (liked.value) {
    likeCount.value++;
  } else {
    likeCount.value--;
  }
  
  // 发送事件通知父组件
  emit('like', { liked: liked.value, count: likeCount.value, kbId: props.kbId });
}
</script>

<style scoped lang="less">
.like-button {
  position: fixed;
  bottom: 30px;
  left: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 50px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .like-icon {
    width: 20px;
    height: 20px;
    color: #999;
    transition: all 0.3s ease;

    &.liked {
      color: #f53f3f;
    }
  }

  .like-count {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
}
</style>