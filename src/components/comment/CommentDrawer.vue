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
          <Comment v-for="comment in comments" :key="comment.id" :comment-data="comment" />
        </div>
        <div v-if="loading" class="loading-more">加载中...</div>
        <div v-if="!hasMore" class="no-more">没有更多评论了</div>
      </div>

      <!-- 评论输入框 -->
      <div class="comment-input-wrapper" :class="{ 'mobile-keyboard-active': isKeyboardActive }">
        <a-textarea v-model="newCommentContent" placeholder="评论一下吧！" :maxlength="{ length: 255, errorOnly: true }"
          :auto-size="{ minRows: 1, maxRows: 4 }" @keydown.enter="handleEnterKey" @focus="handleInputFocus"
          @blur="handleInputBlur" show-word-limit allow-clear ref="commentInputRef" />
        <a-button type="primary" @click="handleAddComment" :disabled="!newCommentContent.trim()" class="submit-btn"
          :loading="pushCommentLoading">
          发送
        </a-button>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref, nextTick, watch } from 'vue';
import Comment from '@/components/comment/Comment.vue';
import { useCommentStore } from '@/components/comment/commentStore.js';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user.js';
import api from '@/api/index.js';
const commentStore = useCommentStore();
const userStore = useUserStore();
// 评论数据和分页状态
const comments = ref([]);
const hasMore = ref(true);
const loading = ref(false);
const currentPage = ref(1);
const pushCommentLoading = ref(false);
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
const commentInputRef = ref(null);

// 新评论内容
const newCommentContent = ref('');

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
    } else {
      commentsContainerRef.value.style.height = 'calc(100vh - 150px)';
      commentsContainerRef.value.style.maxHeight = '';
    }
  }
};
const initData = () => {
  comments.value = [];
  hasMore.value = true;
  loading.value = false;
  newCommentContent.value = '';
  currentPage.value = 1;
}

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
    const result = await commentStore.loadCommentData(currentPage.value + 1); // 传入页码参数
    if (result.data && result.data.length > 0) {
      comments.value = [...comments.value, ...result.data];
      currentPage.value++;
    }
    hasMore.value = result.hasMore;
  } catch (error) {
    console.error('加载评论失败:', error);
  } finally {
    loading.value = false;
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

// 处理回车键
const handleEnterKey = (event) => {
  // 只有在按下 Ctrl+Enter 或 Alt+Enter 时才提交评论
  if (event.ctrlKey || event.altKey || event.metaKey) {
    event.preventDefault(); // 阻止默认换行行为
    handleAddComment();
  }
  // 如果只按 Enter 键，则允许换行（默认行为）
};

// 处理添加评论
const handleAddComment = async () => {
  if (!newCommentContent.value.trim()) {
    Message.warning('请输入评论内容');
    return;
  }
  if (!commentStore.paragrahphId) {
    Message.error('发生了未知的错误，请重新打开评论区');
    return;
  }
  if (pushCommentLoading.value) {
    return;
  }
  pushCommentLoading.value = true;
  try {
    const content = newCommentContent.value
    newCommentContent.value = ''
    const { data } = await api.post('/comment', { postId: commentStore.postId, version: commentStore.version, dataId: commentStore.paragrahphId, content })
    if (data != 'error') {
       commentStore.incrementCommentCount(commentStore.paragrahphId);
      Message.success('成功发布评论');
      const currentUserInfo = await userStore.getUserInfo();
      const newComment = {
        userId: currentUserInfo.id,
        id: data,
        content: content,
        createdAt: new Date().toISOString().split('T')[0], // 格式化为 "YYYY-MM-DD"
        likeCount: 0,
      };
      comments.value.unshift(newComment); // 添加到数组开头而不是末尾
      newCommentContent.value = '';
      // 滚动到顶部
      await nextTick();
      if (commentsContainerRef.value) {
        commentsContainerRef.value.scrollTop = 0;
      }
    } else {
      Message.error('发布评论失败，异常问题，请联系管理员！');
    }
  } finally {
    pushCommentLoading.value = false;
  }

};

// 监听键盘事件，用于检测手机端输入法是否激活
const handleInputFocus = () => {
  if (isMobile.value) {
    isKeyboardActive.value = true;
    // 在手机端聚焦时，尝试滚动到输入框位置
    nextTick(() => {
      if (commentInputRef.value) {
        // 尝试滚动使输入框可见
        commentInputRef.value.$el?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center'
        });
      }
    });
  }
};

const handleInputBlur = () => {
  // 延迟设置，以确保键盘完全收起
  setTimeout(() => {
    isKeyboardActive.value = false;
  }, 300);
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
    } else {
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
  margin:0px 16px;
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

.comment-input-wrapper {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #eee;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 10;

  :deep(.arco-input-wrapper),
  :deep(.arco-textarea-wrapper) {
    border-radius: 5px !important;
    flex: 1;
    align-self: center;
  }



  &.mobile-keyboard-active {
    // 在手机端键盘激活时调整样式
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: auto;
    background-color: white;
    border-top: 1px solid #eee;
    padding: 12px 16px;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }
}
</style>