<template>

  <a-comment class="comment-item" :align="align" :datetime="formatDate(commentData.createdAt)">
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
      <span class="view-replies comment-gray-color" style="font-size: 14px;" key="reply" @click="toggleReplyInput">
        回复
      </span>
    </template>

    <template #avatar>
      <AvatarWithInfo :user="userDetail" :size="44" :position="position" />
    </template>

    <template #author>
      <span class="author-with-level">
        {{ userDetail?.nickname }}
        <UserLevel style=" display: flex;align-items: center;height: 100%;" v-if="userDetail?.level !== undefined"
          :level="userDetail?.level" />
      </span>
    </template>

    <template #content>
      <div class="comment-content">
        {{ commentData.content }}
      </div>
    </template>



    <transition name="replies-container" mode="out-in">
      <div v-if="showReplies && replies.length > 0" class="replies-container" key="replies">
        <transition-group name="reply-list" tag="div">
          <CommentReply v-for="replyComment in replies" :key="replyComment.id" :comment-data="replyComment"
            :data-reply-id="replyComment.id" @reply="handleReply" @reply-to-click="handleReplyToClick" />
        </transition-group>
      </div>
    </transition>
    <!-- 回复输入框 -->
    <ReplyInput v-if="showReplyInput" class="reply-input-wrapper" :on-submit-comment="handleSubmitReply"
      :placeholder="placeholder" :showSelf="showSelf" />
    <a-spin v-if="loadingReply" tip="加载更多评论中" />
    <transition name="toggle-button">
      <div v-if="commentData.replyCount > 0">
        <div v-if="!showReplies">
          <span class="comment-gray-color" style="font-size: 14px;">
            共{{ commentData.replyCount }}条回复，
          </span>
          <span class="view-replies comment-gray-color" @click="toggleReplies" style="font-size: 14px;">
            点击查看
          </span>
        </div>
        <div v-else>
          <span class="comment-gray-color" style="font-size: 14px;" v-if="showReplies">
            共{{ commentData.replyCount }}条回复，
          </span>
          <span class="view-replies comment-gray-color" v-if="hasMore && commentData.replyCount > replies.length"
            @click="loadReply()" style="font-size: 14px;">
            查看更多，
          </span>
          <span class="view-replies comment-gray-color" @click="toggleReplies" style="font-size: 14px;">
            点击收起
          </span>
        </div>
      </div>
    </transition>
    <a-divider dashed />
  </a-comment>
</template>

<script setup>
import { defineProps, nextTick, onMounted, ref, watch } from 'vue';
import { useUserStore } from '@/store/user.js';
import { Message } from '@arco-design/web-vue';
import { IconHeart, IconHeartFill, } from '@arco-design/web-vue/es/icon';
import AvatarWithInfo from '@/components/base/avatar/AvatarWithInfo.vue';
import UserLevel from '@/components/base/UserLevel.vue';
import CommentReply from './CommentReply.vue'; // 引入新的回复组件
import ReplyInput from './ReplyInput.vue'; // 引入ReplyInput组件
import api from '@/api/index.js';
import { formatDate, getDateNow } from '@/utils/DateFormatter.js';
import { useCommentStore } from '@/components/comment/commentStore.js';
import { storeToRefs } from 'pinia';
import { likeCache } from '@/utils/likeCache.js'; // 引入点赞缓存工具

const commentStore = useCommentStore();

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
      replyCount: 0,
      starCount: 0
    })
  },
  align: {
    type: [String, Object],
    default: {
      datetime: 'left',
      actions: 'left'
    }
  },
  postComment: {
    type: Boolean,
    default: true
  },
  showSelf: {
    type: Boolean,
    default: true
  },
  position: {
    type: String,
    default: 'top'
  }
});

// 点赞状态 - 从缓存中初始化
const like = ref(likeCache.getLike(props.commentData.id));

// 回复相关状态
const showReplies = ref(false);
const replies = ref([]);
const showReplyInput = ref(false);
const placeholder = ref('');
// 用户信息
const userStore = useUserStore();
const userDetail = ref(null);
const hasMore = ref(true);
const loadingReply = ref(false);
// 记录已经移动到顶部的评论ID，用于去重
const movedToTopIds = ref(new Set());
// 监听 commentData 变化，如果包含 userId 则获取完整用户信息
watch(
  () => props.commentData,
  async (newCommentData) => {
    if (newCommentData && newCommentData.userId) {
      // 如果 commentData 中有 userId，则获取用户信息
      const userInfo = await userStore.getUserInfo(newCommentData.userId);
      userDetail.value = userInfo;
      placeholder.value = `回复 @${userInfo.nickname}：`;
    }
  },
  { immediate: true }
);

let lastCreatedAt;
let lastLikeCount;
let lastId;
function buildReplyRequest() {
  let req;
  if (props.postComment) {
    req = {
      postCommentId: props.commentData.id,
    };
  }
  else {
    req = {
      parCommentId: props.commentData.id,
    };
  }
  if (lastCreatedAt) {
    req.lastCreatedAt = lastCreatedAt;
    req.lastLikeCount = lastLikeCount;
    req.lastId = lastId;
  }
  return req;
}
let replyIdCache = null;

function buildReplyPost(content) {
  let req;
  if (replyIdCache) {
    req = {
      replyId: replyIdCache,
      //还需要知道具体是哪个回复
      replyCommentId: idCache,
    };
  } else {
    req = {
      replyId: props.commentData.userId,
    }
  }
  if (props.postComment) {
    req = {
      ...req,
      postCommentId: props.commentData.id,
    };
  }
  else {
    req = {
      ...req,
      dataId: commentStore.paragrahphId,
      parCommentId: props.commentData.id,
    };
  }
  req.postId = commentStore.postId;
  req.version = commentStore.version;
  req.content = content;
  return req;
}
async function buildReplyMessage({ id, content }) {
  const current = await userStore.getUserInfo();

  const message = {
    id: id,
    content: content,
    replyCount: 0,
    likeCount: 0,
    createdAt: getDateNow(),
    userId: current.id,
  };
  console.log(message, current);
  if (replyIdCache) {
    message.replyId = replyIdCache;
    message.replyCommentId = idCache
    return message;
  }

  if (props.postComment) {
    message.postCommentId = props.commentData.id;
    return message;
  }
  else {
    message.parCommentId = props.commentData.id;
    return message;
  }
}

// 切换显示回复
const toggleReplies = async () => {
  if (showReplies.value) {
    showReplies.value = false;
  }
  else {
    if (replies.value.length === 0) {
      loadReply();
    }
    showReplies.value = true;
  }
};

// 切换回复输入框显示/隐藏
const toggleReplyInput = () => {
  showReplyInput.value = !showReplyInput.value;
  replyIdCache = null;
};



// 处理回复提交
const handleSubmitReply = async (content) => {
  if (!content.trim()) {
    Message.warning('请输入回复内容');
    return;
  }

  try {
    console.log(replyIdCache)
    if (replyIdCache) {
      console.log("回复他人")
    } else {
      console.log("回复主评论")
    }
    const { data } = await api.post('/comment/reply', buildReplyPost(content));
    Message.success('成功回复评论');
    replies.value.unshift(await buildReplyMessage(data));
    // 隐藏输入框
    showReplyInput.value = false;
    replyIdCache = null;
    // 更新回复计数
    props.commentData.replyCount += 1;
  }
  catch (error) {
    console.error('回复评论失败:', error);
    Message.error('回复评论失败，请重试！');
  }
};

async function loadReply() {
  loadingReply.value = true;
  try {
    const { data } = await api.get('/comment/reply', buildReplyRequest());
    if (data && data.length > 0) {
      lastCreatedAt = data[data.length - 1].createdAt;
      lastLikeCount = data[data.length - 1].likeCount;
      lastId = data[data.length - 1].id;
    }

    // 过滤掉已经移动到顶部的评论，防止重复
    const filteredData = data.filter(reply => !movedToTopIds.value.has(reply.id));
    replies.value = [...replies.value, ...filteredData];

    if (data.length < 10) {
      hasMore.value = false;
    }

    showReplies.value = true;
  }
  catch (error) {
    console.error('获取回复评论失败:', error);
  }
  finally {
    loadingReply.value = false;
  }
}
let idCache;
function handleReply({ id, replyId, nickname }) {
  console.log("回复的评论id是", id)
  console.log("回复的用户id是", replyId)
  if (showReplyInput.value) {
    if (replyIdCache === replyId && idCache === id) {
      //关闭回复
      toggleReplyInput();
      return;
    }
    else {
      replyIdCache = replyId;
      replyCommentIdCache = replyCommentId
      idCache = id;
      placeholder.value = `回复 @${nickname}：`;
    }
  }
  else {
    //打开回复
    toggleReplyInput();
    placeholder.value = `回复 @${nickname}：`;
    replyIdCache = replyId;
    idCache = id;
  }
}

// 处理点击@用户，跳转到对应回复
const handleReplyToClick = async (replyCommentId) => {
  if (!replyCommentId) return;

  // 先确保回复列表已展开
  if (!showReplies.value) {
    await toggleReplies();
  }

  // 等待DOM更新
  await nextTick();

  // 在当前回复列表中查找目标回复
  const targetIndex = replies.value.findIndex(reply => reply.id === replyCommentId);
  if (targetIndex !== -1) {
    //直接就能找到，返回，等待滚动
    await nextTick();
    scrollToReply(replyCommentId);
  } else {
    // 没找到，发起请求获取
    try {
      if (loadingReply.value) {
        //已经在加载数据了，那就等待他为false后重新执行一遍自己就好了
        return new Promise((resolve) => {
          const unwatch = watch(loadingReply, (newVal) => {
            if (!newVal) {
              unwatch(); // 停止监听
              resolve(handleReplyToClick(replyCommentId)); // 重新执行
            }
          });
        });
      }
      const { data } = await api.get('/comment/reply/getMyReply', {
        id: replyCommentId
      });

      if (data) {
        // 添加到首位
        replies.value.unshift(data);

        // 记录已移动到顶部的ID
        movedToTopIds.value.add(replyCommentId);

        // 等待DOM更新后滚动
        await nextTick();
        scrollToReply(replyCommentId);
      }
    } catch (error) {
      console.error('获取回复失败:', error);
      Message.error('获取回复失败');
    }
  }
};

// 滚动到指定回复
const scrollToReply = (replyId) => {
  // 通过 data-reply-id 属性定位元素
  const targetElement = document.querySelector(`[data-reply-id="${replyId}"]`);

  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 添加高亮效果
    const commentElement = targetElement.querySelector('.arco-comment') || targetElement;
    commentElement.style.transition = 'background-color 0.3s';
    commentElement.style.backgroundColor = 'var(--color-fill-2)';
    setTimeout(() => {
      commentElement.style.backgroundColor = '';
    }, 2000);
  }
};

// 点赞处理函数
const onLikeChange = async () => {
  // 先更新本地状态和缓存
  like.value = !like.value;
  likeCache.setLike(props.commentData.id, like.value);

  try {
    console.log(`点赞状态已更新: ${props.commentData.id}, 点赞: ${like.value}`);
    let url;
    if (props.postComment) {
      url = "/comment/post/like"
    } else {
      url = "/comment/like"
    }
    await api.get(url, { id: props.commentData.id, add: like.value });
  }
  catch (error) {
    // 如果API调用失败，回滚状态和缓存
    like.value = !like.value;
    likeCache.setLike(props.commentData.id, like.value);
    console.error('点赞操作失败:', error);
    Message.error('操作失败，请重试');
  }
};
async function getReply() {
  console.log("自动展开，并获取回复");
  // 如果有目标回复ID，直接调用 handleReplyToClick（它会自动展开）
  if (targetReplyId.value) {
    await handleReplyToClick(targetReplyId.value);
  } else {
    // 如果没有目标回复ID，只展开回复列表
    if (!showReplies.value) {
      await toggleReplies();
    }
  }
  targetReplyId.value = null
}


const { parCommentId, targetReplyId, postCommentId } = storeToRefs(commentStore);
onMounted(async () => {
  if (!props.postComment) {
    if (props.commentData.id == parCommentId.value) {
      getReply()
      // 清空标记，避免重复触发
      parCommentId.value = null;
    }
  } else {
    if (props.commentData.id == postCommentId.value) {
      getReply()
      // 清空标记，避免重复触发
      postCommentId.value = null;
    }
  }
})

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
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  color: var(--color-neutral-10);
  line-height: 24px;
  height: 24px;
  background: transparent;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s ease;
  font-size: 14px;

  &:hover {
    background: @color-fill-3;
  }
}

.comment-gray-color {
  color: var(--color-neutral-6);
}

:deep(.arco-comment-avatar) {
  cursor: default;
}



.author-with-level {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
  font-weight: 500;

}

.view-replies {
  user-select: none;
  cursor: pointer;

  &:hover {
    color: @primary-5;
  }
}

:deep(.arco-comment-inner-comment) {
  margin-top: 8px;
}

.reply-input-wrapper {
  margin-top: 12px;
  border-radius: 4px;
  display: flex;

}

/* 回复列表过渡动画 */
.reply-list-move,
.reply-list-enter-active,
.reply-list-leave-active {
  transition: all 0.3s ease;
}

.reply-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.reply-list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.reply-list-move {
  transition: transform 0.3s ease;
}

.replies-container {
  margin-top: 23px;
}

/* 回复容器整体过渡动画 */
.replies-container-move,
.replies-container-enter-active,
.replies-container-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.replies-container-enter-from {
  max-height: 0;
  opacity: 0;
}

.replies-container-enter-to {
  max-height: 500px;
  /* 设置一个足够大的值，确保内容完全显示 */
  opacity: 1;
}

.replies-container-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

/* 切换按钮过渡动画 */
.toggle-button-enter-active,
.toggle-button-leave-active {
  transition: all 0.2s ease;
}

.toggle-button-enter-from,
.toggle-button-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.comment-content {
  margin-top: 12px;
  font-size: 0.98rem;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  max-width: 100%;
}
</style>