<template>
  <a-comment class="comment-reply-item" style="margin:0px;">
    <template #avatar>
      <AvatarWithInfo :user="userDetail" :size="36" :position="'top'" />
    </template>
    <template #author>
      <div>
        <div style="display: flex;align-items: center;">
          <a-link class="author-with-level" :loading="!userDetail?.nickname" :href="`/space/${userDetail?.id}`"
            :hoverable="false" style="color: var(--color-text-1);">
            {{ userDetail?.nickname || '加载中' }}
          </a-link>
          <UserLevel style=" display: flex;align-items: center;height: 100%;margin-left: 15px;"
            v-if="userDetail?.level !== undefined" :level="userDetail?.level" />
        </div>
        <div style="margin-top: 5px;">
          <a-link class="reply-to" v-if="replyUserInfo&&commentData.replyCommentId" @click="handleReplyToClick" >
           @{{ replyUserInfo?.nickname }}
          </a-link>
          <a-typography-paragraph 
            class="content" 
            :ellipsis="{
              suffix: '',
              rows: 3,
              expandable: true,
            }"
            style="display: inline; margin: 0;">
            {{ commentData.content }}
          </a-typography-paragraph>
        </div>

        <div>
          <span class="arco-comment-datetime">{{ formatDate(commentData.createdAt) }}</span>
          <span class="action arco-comment-actions arco-comment-actions-align-left" key="heart" @click="onLikeChange">
            <span v-if="like">
              <IconHeartFill :style="{ color: 'rgb(var(--danger-6))' }" />
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
import {Comment as AComment, Link as ALink, Typography as ATypography} from '@arco-design/web-vue';
import AvatarWithInfo from '@/components/base/avatar/AvatarWithInfo.vue';
import UserLevel from '@/components/base/UserLevel.vue';
import {formatDate} from '@/utils/DateFormatter.js';
import { likeCache } from '@/utils/likeCache.js'; // 引入点赞缓存工具
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';

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

// 点赞状态 - 从缓存中初始化
const like = ref(likeCache.getLike(props.commentData.id));

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
  // 先更新本地状态和缓存
  like.value = !like.value;
  likeCache.setLike(props.commentData.id, like.value);

  try {
    console.log(`点赞状态已更新: ${props.commentData.id}, 点赞: ${like.value}`);
    // 调用API更新点赞状态
    await api.get('/comment/reply/like', { id: props.commentData.id, add: like.value });
  }
  catch (error) {
    // 如果API调用失败，回滚状态和缓存
    like.value = !like.value;
    likeCache.setLike(props.commentData.id, like.value);
    console.error('点赞操作失败:', error);
    Message.error('操作失败，请重试');
  }
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
  white-space: pre-wrap;
  word-break: break-word;
}

.view-replies {
  user-select: none;
  cursor: pointer;

  &:hover {
    color: rgb(var(--primary-5));
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