<template>
  <div class="cainsgl-commentable-paragraph" :data-comment-id="commentId">
    <span v-html="text"></span>
    <div class="comment-badge" @click="handleCommentClick">
      <span class="comment-count">{{ commentCount > 99 ? '99+' : commentCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { useCommentStore } from '@/components/comment/commentStore.js';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  commentId: {
    type: Number,
    required: true
  }
});

const commentStore = useCommentStore();

// 计算评论数量
const commentCount = computed(() => {
  return 5;
});

// 处理评论点击事件
const handleCommentClick = () => {

  commentStore.toggleCommentDrawer(props.commentId);
};
</script>

<style scoped lang="less">
.cainsgl-commentable-paragraph {
  position: relative;
  display: inline-block;
}

.comment-badge {
  margin-left: 6px;
  user-select: none;
  cursor: pointer;
  display: inline-block;
  width: 18px;
  height: 18px;
  padding: 2px;
  background-color: #E5E6EB;
  color: #86909C;
  border-radius: 50%;
  font-size: 12px;
  text-align: center;
}

.comment-count {
  display: block;
  width: 100%;
}
</style>