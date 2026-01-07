<template>
  <a-drawer v-model:visible="drawerVisible" :footer="false" :header="false" :mask-closable="true" :closable="true"
    :placement="isMobile ? 'bottom' : 'right'" :width="isMobile ? '100%' : 400" :height="isMobile ? '70vh' : undefined">

    <div class="comments-container" ref="commentsContainerRef">
      <div class="comments-list">
        <Comment v-for="comment in comments" :key="comment.id" :comment-data="comment" @reply="handleReply" />
      </div>
      <div v-if="loading" class="loading-more">加载中...</div>
      <div v-if="!hasMore" class="no-more">没有更多评论了</div>
    </div>

  </a-drawer>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref, nextTick, watch } from 'vue';
import Comment from '@/components/comment/Comment.vue';
import { useCommentStore } from '@/components/comment/commentStore.js';

const commentStore = useCommentStore();

// 评论数据和分页状态
const comments = ref([]);
const currentPage = ref(1);
const pageSize = 10;
const hasMore = ref(true);
const loading = ref(false);

// 保持响应性，不直接解构响应式变量
const drawerVisible = computed({
  get: () => commentStore.drawerVisible,
  set: (value) => {
    commentStore.drawerVisible = value;
  }
});
const newComment = computed({
  get: () => commentStore.newComment,
  set: (value) => {
    commentStore.newComment = value;
  }
});

// 屏幕尺寸检测逻辑移到组件中
const isMobile = ref(false);

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

const initScreenSizeDetection = () => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
};

const cleanupScreenSizeDetection = () => {
  window.removeEventListener('resize', updateScreenSize);
};

// 加载评论数据
const loadComments = async (reset = false) => {
  if (reset) {
    currentPage.value = 1;
    comments.value = [];
  }

  if (!hasMore.value && !reset) {
    return;
  }

  if (loading.value) {
    return;
  }

  loading.value = true;

  try {
    const result = await commentStore.loadCommentData(currentPage.value, pageSize);
    if (result.data && result.data.length > 0) {
      if (reset) {
        comments.value = [...result.data];
      } else {
        comments.value = [...comments.value, ...result.data];
      }
    }

    hasMore.value = result.hasMore;
    if (result.hasMore) {
      currentPage.value++;
    }
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

onMounted(() => {
  initScreenSizeDetection();

  // 监听抽屉显示状态变化
  watch(drawerVisible, async (newVisible) => {
    if (newVisible) {
      // 重新显示时加载初始数据
      await loadComments(true);
    }
  });
});

onUnmounted(() => {
  cleanupScreenSizeDetection();
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
  cleanupScreenSizeDetection();
});

// 回复功能（保持原有逻辑）
const handleReply = (comment) => {
  // 这里可以实现回复逻辑
  console.log('回复评论:', comment);
};

// 添加评论功能（保持原有逻辑）
const addComment = () => {
  // 这里可以实现添加评论逻辑
  console.log('添加评论:', newComment.value);
};
</script>



<style scoped lang="less">
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
</style>