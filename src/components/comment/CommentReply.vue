<template>
  <a-comment class="comment-reply-item" style="margin:0px;">
    <template #avatar>
      <AvatarWithInfo :user="userDetail" :size="36" :position="'top'" />
    </template>
    <template #author>
      <div>
        <div style="display: flex;align-items: center;">
          <a-link class="author-with-level" :loading="!userDetail?.nickname" :href="`/space/${userDetail?.id}`"
            :hoverable="false" style="color: black;">
            {{ userDetail?.nickname || '加载中' }}
          </a-link>
          <UserLevel style=" display: flex;align-items: center;height: 100%;margin-left: 15px;"
            v-if="userDetail?.level !== undefined" :level="userDetail?.level" />
        </div>
        <div style="margin-top: 5px;">
          <a-link class="reply-to" v-if="replyUserInfo&&commentData.replyCommentId" @click="handleReplyToClick" >
           @{{ replyUserInfo?.nickname }}
          </a-link>
          <span class="content"> {{ commentData.content }}</span>
        </div>

        <div>
          <span class="arco-comment-datetime">{{ formatTime(commentData.createdAt) }}</span>
          <span class="action arco-comment-actions arco-comment-actions-align-left" key="heart" @click="onLikeChange">
            <span v-if="like">
              <IconHeartFill :style="{ color: '#f53f3f' }" />
            </span>
            <span v-else>
              <IconHeart />
            </span>
            {{ commentData.likeCount + (like ? 1 : 0) }}
          </span>
          <span class="view-replies arco-comment-datetime" style="font-size: 14px;" key="reply" @click="reply">
            回复
          </span>
        </div>
      </div>

    </template>

  </a-comment>
</template>

<script setup>
import {ref, watch} from 'vue';
import {useUserStore} from '@/store/user.js';
import {IconHeart, IconHeartFill,} from '@arco-design/web-vue/es/icon';
import {Comment as AComment, Link as ALink} from '@arco-design/web-vue';
import AvatarWithInfo from '@/components/base/avatar/AvatarWithInfo.vue';
import UserLevel from '@/components/base/UserLevel.vue';

// 定义组件属性
const props = defineProps({
  commentData: {
    type: Object,
    required: true,
    default: null
  }
});

// 定义emit事件
const emit = defineEmits(['reply', 'replyToClick']);

// 点赞状态
const like = ref(false);

// 用户信息
const userStore = useUserStore();
const userDetail = ref(null);
const replyUserInfo = ref(null);
// 监听 commentData 变化，如果包含 userId 则获取完整用户信息
watch(
  () => props.commentData,
  async (newCommentData) => {
    if (newCommentData && newCommentData.userId) {
      // 如果 commentData 中有 userId，则获取用户信息
      const userInfo = await userStore.getUserInfo(newCommentData.userId);
      userDetail.value = userInfo;
      if (newCommentData.replyId) {
        replyUserInfo.value = await userStore.getUserInfo(newCommentData.replyId);
      }
    }
  },
  { immediate: true }
);

// 点赞处理函数
const onLikeChange = async () => {
  // 临时更新本地状态
  like.value = !like.value;

  // 这里可以调用API更新点赞状态
  try {
    // 示例API调用，实际项目中需要替换为真实的API
    // await api.likeComment(props.commentData.id, like.value);
    console.log(`点赞状态已更新: ${props.commentData.id}, 点赞: ${like.value}`);
  }
  catch (error) {
    // 如果API调用失败，回滚状态
    like.value = !like.value;
    console.error('点赞操作失败:', error);
  }
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


// 回复处理函数
const reply = () => {
  emit('reply', { id: props.commentData.id, replyId: userDetail.value?.id, nickname: userDetail.value?.nickname });
};

// 处理点击@用户
const handleReplyToClick = () => {
  emit('replyToClick', props.commentData.replyCommentId);
};
</script>

<style scoped lang="less">
.comment-reply-item {
  width: 100%;
}

.content {
  margin-left: 5px;
  font-size: 15px;
}

.view-replies {
  user-select: none;
  cursor: pointer;

  &:hover {
    color: @primary-5;
  }
}

.action {
  margin-left: 10px;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  color: var(--color-text-1);
  line-height: 24px;
  height: 24px;
  background: transparent;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s ease;
  font-size: 14px;
}

.action:hover {
  background: var(--color-fill-3);
}

.author-with-level {
  display: inline-flex;
  align-items: center;
}

.reply-to {
  margin-right: 5px;
  font-size: 14px;
  vertical-align: middle;
}

:deep(.arco-comment-inner) {
  height: 100%;
}

:deep(.arco-comment) {
  margin-top: 0px;
}

:deep(.arco-comment-inner-comment) {
  margin-top: 0px;
}
</style>