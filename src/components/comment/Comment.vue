<template>
  <a-comment class="comment-item" :align="align"
    :content="commentData.content" :datetime="formatTime(commentData.createdAt)">
    <template #actions>
      <span class="action" key="heart" @click="onLikeChange">
        <span v-if="like">
          <IconHeartFill :style="{ color: '#f53f3f' }" />
        </span>
        <span v-else>
          <IconHeart />
        </span>
        {{ commentData.likeCount + (like ? 1 : 0) }}
      </span>
      <span class="action" key="reply" @click="onReply">
        <IconMessage /> 回复
      </span>
    </template>
    <template #avatar>
      <AvatarWithInfo :user="userDetail" :size="40"  />
    </template>
    <template #author>
      <span class="author-with-level">
        {{ userDetail?.nickname }}
        <UserLevel  v-if="userDetail?.level !== undefined" :level="userDetail?.level" />
      </span>
    </template>
    <slot></slot>
  </a-comment>
</template>

<script setup>
import { ref, defineProps, watch, computed } from 'vue';
import { useUserStore } from '@/store/user.js';
import {
  IconHeart,
  IconMessage,
  IconHeartFill,
} from '@arco-design/web-vue/es/icon';
import { Comment as AComment } from '@arco-design/web-vue';
import AvatarWithInfo from '@/components/user/base/AvatarWithInfo.vue';
import UserLevel from '@/components/user/base/UserLevel.vue';

// 定义组件属性
const props = defineProps({
  commentData: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      content: '',
      createdAt: '',
      likeCount: 0,
      starCount: 0
    })
  },
  align: {
    type: [String, Object],
    default: {
       datetime: "left",
       actions: "left"
    }
  }
});

// 点赞状态
const like = ref(false);

// 用户信息
const userStore = useUserStore();
const userDetail = ref(null);

// 监听 commentData 变化，如果包含 userId 则获取完整用户信息
watch(
  () => props.commentData,
  async (newCommentData) => {
    if (newCommentData && newCommentData.userId) {
      // 如果 commentData 中有 userId，则获取用户信息
      const userInfo = await userStore.getUserInfo(newCommentData.userId);
      userDetail.value = userInfo;
    }
  },
  { immediate: true }
);


// 点赞处理函数
const onLikeChange = async () => {
  // 临时更新本地状态
  like.value = !like.value;
  const change = like.value ? 1 : -1;

  // 这里可以调用API更新点赞状态
  try {
    // 示例API调用，实际项目中需要替换为真实的API
    // await api.likeComment(props.commentData.id, like.value);
    console.log(`点赞状态已更新: ${props.commentData.id}, 点赞: ${like.value}`);
  } catch (error) {
    // 如果API调用失败，回滚状态
    like.value = !like.value;
    console.error('点赞操作失败:', error);
  }
};

// 回复处理函数
const onReply = () => {
  // 触发回复事件，父组件可以监听
  emit('reply', props.commentData);
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;

  return date.toLocaleDateString('zh-CN');
};

// 定义组件事件
const emit = defineEmits(['reply']);
</script>

<style scoped lang="less">
.comment-item {
  width: 100%;
}

.action {
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
  color: var(--color-text-1);
  line-height: 24px;
  background: transparent;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s ease;
}
:deep(.arco-comment-avatar) {
  cursor: default;
}
.action:hover {
  background: var(--color-fill-3);
}

.author-with-level {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  :deep(.arco-comment-author) {
    font-size: 16px;
    font-weight: 500;
  }
}
</style>