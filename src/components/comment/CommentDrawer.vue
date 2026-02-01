<template>
  <a-drawer v-model:visible="drawerVisible" :footer="false" :header="false" :mask-closable="true" :closable="true"
    :placement="isMobile ? 'bottom' : 'right'" :width="isMobile ? '100%' : 'max(20vw, 350px)'"
    :height="isMobile ? '70vh' : undefined">
    <template #header>
      <p>评论</p>
    </template>
    <div class="comments-container-wrapper">
      <div class="comments-container" ref="commentsContainerRef">
        <div class="comments-list">
          <Comment v-for="comment in comments" :key="comment.id" :comment-data="comment" :post-comment="false"
            :show-self="false" :position="'LT'" :data-comment-id="comment.id" />
        </div>
        <div v-if="loading" class="loading-more">加载中...</div>
        <div v-if="!hasMore" class="no-more">没有更多评论了</div>
      </div>

      <!-- 评论输入框 -->
      <div :class="{ 'mobile-keyboard-active': isKeyboardActive }">
        <ReplyInput :show-self="false" :auto-focus="false" :on-submit-comment="handleAddComment" 
          placeholder="评论一下吧！" ref="replyInputRef" />
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import Comment from '@/components/comment/Comment.vue';
import ReplyInput from '@/components/comment/ReplyInput.vue';
import {useCommentStore} from '@/components/comment/commentStore.js';
import {Message} from '@arco-design/web-vue';
import {useUserStore} from '@/store/user.js';
import api from '@/api/index.js';
import {getDateNow} from '@/utils/DateFormatter.js';
import {storeToRefs} from 'pinia';

const commentStore = useCommentStore();
const userStore = useUserStore();
const { parCommentId } = storeToRefs(commentStore);

// 评论数据和分页状态
const comments = ref([]);
const hasMore = ref(true);
const loading = ref(false);
const currentPage = ref(1);
const pushCommentLoading = ref(false);
// 缓存已置顶的评论ID，避免重复显示
const pinnedCommentId = ref(null);
// 保持响应性，不直接解构响应式变量
const drawerVisible = computed({
  get: () => commentStore.drawerVisible,
  set: (value) => {
    commentStore.drawerVisible = value;
  }
});

// 屏幕尺寸检测逻辑移到组件中
const isMobile = ref(false);

// 键盘激活状态（用于手机端适配）
const isKeyboardActive = ref(false);

// 评论输入框引用
const replyInputRef = ref(null);

// 滚动容器引用
const commentsContainerRef = ref(null);

const updateScreenSize = () => {
  const newIsMobile = window.innerWidth < 768; // 小于768px认为是移动设备
  const wasMobile = isMobile.value;
  isMobile.value = newIsMobile;

  // 如果设备类型发生变化，更新滚动容器高度
  if (wasMobile !== newIsMobile && commentsContainerRef.value) {
    if (newIsMobile) {
      commentsContainerRef.value.style.maxHeight = '200px';
      commentsContainerRef.value.style.height = '';
    }
    else {
      commentsContainerRef.value.style.height = 'calc(100vh - 150px)';
      commentsContainerRef.value.style.maxHeight = '';
    }
  }
};
const initData = () => {
  comments.value = [];
  hasMore.value = true;
  loading.value = false;
  currentPage.value = 1;
  pinnedCommentId.value = null;
};

// 加载评论数据
const loadComments = async () => {

  if (!hasMore.value) {
    return;
  }

  if (loading.value) {
    return;
  }

  loading.value = true;

  try {
    const result = await commentStore.loadCommentData(); // 传入页码参数
    if (result.data && result.data.length > 0) {
      // 过滤掉已经被置顶的评论
      let filteredData = result.data;
      if (pinnedCommentId.value) {
        filteredData = result.data.filter(comment => comment.id !== pinnedCommentId.value);
      }
      comments.value = [...comments.value, ...filteredData];
      currentPage.value++;
    }
    hasMore.value = result.hasMore;
  }
  catch (error) {
    console.error('加载评论失败:', error);
  }
  finally {
    loading.value = false;
  }
};

// 滚动到指定评论
const scrollToComment = async (commentId) => {
  await nextTick();
  const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (commentElement && commentsContainerRef.value) {
    commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 添加高亮效果
    commentElement.classList.add('highlight-comment');
    setTimeout(() => {
      commentElement.classList.remove('highlight-comment');
    }, 2000);
  }
};

// 处理 parCommentId 的逻辑
const handleParCommentId = async (loadedComments) => {
  if (!parCommentId.value) {
    return;
  }

  // 检查返回的数据中是否包含 parCommentId
  const targetComment = loadedComments.find(comment => comment.id === parCommentId.value);

  if (targetComment) {
    // 如果存在，直接滚动到该评论
    await scrollToComment(parCommentId.value);
  }
  else {
    // 如果不存在，调用 API 获取该评论
    const { data } = await api.get('/comment/notice', { id: parCommentId.value });
    if (data && data.id) {
      // 将获取到的评论置顶
      comments.value.unshift(data);
      pinnedCommentId.value = data.id;
      // 滚动到该评论
      await scrollToComment(data.id);
    }
  }

};

// 滚动事件处理
const handleScroll = () => {
  if (!commentsContainerRef.value || loading.value || !hasMore.value) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.value;
  // 当滚动到底部附近时加载更多数据
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadComments();
  }
};

// 处理添加评论
const handleAddComment = async (content) => {
  if (!commentStore.paragrahphId) {
    Message.error('发生了未知的错误，请重新打开评论区');
    return;
  }
  if (pushCommentLoading.value) {
    return;
  }
  pushCommentLoading.value = true;
  try {
    const msgid = 'paragraph' + commentStore.postId + ":" + commentStore.paragrahphId
    Message.loading({ id: msgid, content: '发送评论中...' });
    const { data } = await api.post('/comment', { postId: commentStore.postId, version: commentStore.version, dataId: commentStore.paragrahphId, content });
    if (data != 'error') {
      commentStore.incrementCommentCount(commentStore.paragrahphId);
      Message.success({ id: msgid, content: '成功发布评论' });
      const currentUserInfo = await userStore.getUserInfo();
      const newComment = {
        userId: currentUserInfo.id,
        id: data,
        content: content,
        createdAt: getDateNow(), // 格式化为 "YYYY-MM-DD"
        likeCount: 0,
      };
      comments.value.unshift(newComment); // 添加到数组开头而不是末尾
      // 滚动到顶部
      await nextTick();
      if (commentsContainerRef.value) {
        commentsContainerRef.value.scrollTop = 0;
      }
    }
    else {
      Message.error('发布评论失败，异常问题，请联系管理员！');
    }
  }
  finally {
    pushCommentLoading.value = false;
  }
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);

  // 监听抽屉显示状态变化
  watch(drawerVisible, async (newVisible) => {
    if (newVisible) {
      initData();
      // 重新显示时加载初始数据
      await loadComments();
      // 处理 parCommentId
      await handleParCommentId(comments.value);
    }
  });
});

// 为滚动容器添加事件监听
onMounted(async () => {
  await nextTick();
  if (commentsContainerRef.value) {
    // 设置滚动容器样式以支持滚动
    commentsContainerRef.value.style.overflowY = 'auto';
    // 根据设备类型设置滚动容器高度
    if (isMobile.value) {
      commentsContainerRef.value.style.height = '70vh';
    }
    else {
      commentsContainerRef.value.style.height = 'calc(100vh - 150px)';
    }
    commentsContainerRef.value.addEventListener('scroll', handleScroll);
  }
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (commentsContainerRef.value) {
    commentsContainerRef.value.removeEventListener('scroll', handleScroll);
  }
  window.removeEventListener('resize', updateScreenSize);
});
</script>



<style scoped lang="less">
.comments-container-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.comments-container {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  flex: 1;
  overflow-y: auto;
}

.comments-list {
  padding-top: 30px;
  margin: 0px 16px;
  display: flex;
  flex-direction: column;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 14px;
}

.mobile-keyboard-active {
  // 在手机端键盘激活时调整样式
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: auto;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

// 高亮评论的动画效果
:deep(.highlight-comment) {
  animation: highlight-fade 2s ease-in-out;
}

@keyframes highlight-fade {
  0% {
    background-color: rgba(var(--primary-6), 0.2);
  }

  100% {
    background-color: transparent;
  }
}
</style>