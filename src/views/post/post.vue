<template>
  <div style="display: flex;">
    <div class="post-sidebar">
      <PostHistroy :postId="post?.id" @history-item-click="handleHistoryClick" :post="post"/>
    </div>
    <div class="post-container" ref="containerRef">
      <!-- 文章头部信息 -->
      <div class="post-header">
        <div class="post-user-info">
          <AvatarWithInfo :user="author" :size="70"/>
          <div class="post-title-section">
            <h1 class="post-title">{{ post?.title || '加载中' }}</h1>
            <div class="post-meta">
                <span class="post-date">发布于：{{ formatDate(post?.publishedAt) }} <span style="margin-left: 16px;">创建于：{{
                    formatDate(post?.createdAt)
                  }}</span></span>

              <span class="post-stats">
                  <span class="stat-item">
                    <icon-eye/> {{ post?.viewCount || 0 }} 浏览
                  </span>
                  <span class="stat-item" style="margin-left: 16px;">
                    <icon-heart/> {{ post?.likeCount || 0 }} 点赞
                  </span>
                  <span class="stat-item" style="margin-left: 16px;">
                    <icon-message/> {{ post?.commentCount || 0 }} 评论
                  </span>
                </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="post-content">

        <div class="markdown-content" :class="{ 'best-reading-content': !notBestReading }">
          <MarkdownPreviewWrapper @scroll="handleContentScroll" :content="post?.content" :showComment="true"/>
          <div v-show="notBestReading" class="full-screen-tip">
            <a-tooltip content="点我可回正屏幕获取最佳阅读体验哦">
              <a-button type="primary" shape="circle" @click="handleFullScreenClick">
                <icon-fullscreen/>
              </a-button>
            </a-tooltip>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="comments-section">
    <div class="comments-header">
      <h2>评论</h2>
      <div class="comment-count">{{ post?.commentCount }}</div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';
import {IconEye, IconFullscreen, IconHeart, IconMessage} from '@arco-design/web-vue/es/icon';
import api from '@/api/index.js';
import MarkdownPreviewWrapper from '@/components/md/MarkdownPreviewWrapper.vue';
import AvatarWithInfo from '@/components/user/base/AvatarWithInfo.vue';
import {useUserStore} from "@/store/user.js";
import PostHistroy from "@/components/post/PostHistroy.vue";
import {useCommentStore} from "@/components/comment/commentStore.js";

const userStore = useUserStore();
const commentStore = useCommentStore();

const route = useRoute();

// 响应式数据
const post = ref(null);
const author = ref(null);
const lastScrollTop = ref(0);
let originContent;
const loadPostContent = async (postId) =>
{
  try
  {
    const {data} = await api.get(`/post`, {id: postId});
     //获取评论数据
    commentStore.getParagraphCommentCountByPost(postId,data.version);
    post.value = data;
    const element = `<p style="font-size: 16px; line-height: 1.6;background-color: var(--color-fill-1); padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">摘要：${data.summary}</p>`
    post.value.content = element + '\n' + data.content;
    originContent=post.value.content;
   
    if (data.userId)
    {
      author.value = await userStore.getUserInfo(data.userId)
    }
  } catch (error)
  {
    console.error('加载文章内容失败:', error);
  }
};

async function handleHistoryClick(item)
{
  if(item.publishVersion)
  {
    post.value.content = originContent;
    return;
  }
  const {data} = await api.get('/post/history', {postId: item.postId, id: item.id});
  post.value.content = data
}

// 格式化日期
const formatDate = (dateString) =>
{
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 节流函数，减少事件触发频率
const throttle = (func, delay) =>
{
  let timer = null;
  return function (...args)
  {
    if (!timer)
    {
      timer = setTimeout(() =>
      {
        func.apply(this, args);
        timer = null;
      }, delay);
    }
  };
};
const bestReadingTop = 113;

const notBestReading = ref(false)

function handleFullScreenClick()
{
  notBestReading.value = false;
  window.scrollTo({
    top: bestReadingTop,
    behavior: 'smooth'
  });
}

// 处理内容滚动事件
const handleContentScroll = throttle((event) =>
{
  if (window.scrollY < bestReadingTop + 5 && window.scrollY > bestReadingTop - 5)
  {
    notBestReading.value = false;
  } else
  {
    notBestReading.value = true;
  }
  const contentElement = event.target;
  const scrollTop = contentElement.scrollTop;
  // 判断滚动方向
  const isScrollingDown = scrollTop > lastScrollTop.value;
  // 如果是向下滚动
  if (isScrollingDown)
  {
    // 计算本次滚动的距离
    if (window.scrollY < bestReadingTop - 5)
    {
      window.scrollTo({
        top: bestReadingTop,
        behavior: 'smooth'
      });
    }
  }
  lastScrollTop.value = scrollTop;
}, 50);

// 组件挂载时的逻辑
onMounted(() =>
{
  const postId = route.params.id;
  if (postId)
  {
    loadPostContent(postId);
  }
});
</script>

<style lang="less" scoped>
.full-screen-tip {
  position: absolute;
  bottom: 20px;
  left: 20px;
}

.post-sidebar {
  padding: 120px 20px 20px 20px;
  min-width: 20vw;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media screen and (max-width: 768px) {
    min-width: 0;
    width: 0vw;
    display: none;
  }
}

.post-container {
  scrollbar-width: none;
  width: 60vw;

  &::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  padding: 20px;
  margin-right: 20vw;
  overflow-y: auto;

  @media screen and (max-width: 768px) {
    width: 100vw;
    margin-right: 0vw;
  }
}

.post-header {
  padding: 20px 0;
  border-bottom: 1px solid #e5e8ef;
  margin-bottom: 20px;
}

.post-user-info {
  display: flex;
  align-items: flex-start;
}

.post-title-section {
  margin-left: 16px;
  flex: 1;
}

.post-title {
  margin: 0 0 12px 0;
  font-size: 30px;
  font-weight: bold;
  color: #1d2129;
  line-height: 1.3;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  color: #86909c;
  font-size: 14px;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-content {
  padding: 20px 0;
  height: calc(95vh);
  display: flex;
  gap: 20px;
}

.changelog-sidebar {
  width: 200px;
  background-color: #f7f8fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e8ef;
  height: fit-content;
}

.markdown-content {
  position: relative;
  flex: 1;
  overflow-y: auto;
}


.comments-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.comments-section h2 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #1d2129;
}

.comment-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;

  border-radius: 14px;
  background-color: #f7f8fa;
  color: #86909c;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #e5e8ef;
}
</style>
