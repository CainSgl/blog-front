<template>
  <div>
    <Header></Header>
    <div class="header-container"></div>
    <!-- 左侧固定交互组件 -->
    <PostActions v-if="post" :postId="post.id" :likeCount="post.likeCount" :commentCount="post?.commentCount"
      :isLiked="isLiked" :isFavorited="isFavorited" :starCount="post?.starCount" @like="handleLike"
      @comment="scrollToComments" @favorite="handleFavoriteSuccess" @report="handleReport" :authorId="post.userId" />
    <div class="main-layout">
      <div class="content-wrapper">
        <div class="left-content">
          <div class="post-sidebar" v-if="showMoreInfo">
            <div :style="{ height: placeholderHeight - 60 + 'px' }"></div>
            <PostHistroy :postId="post?.id" @history-item-click="handleHistoryClick" :post="post"
              :targetVersion="targetVersion" />
            <div></div>
          </div>
          <div class="post-container" ref="containerRef">
            <!-- 文章头部信息 -->
            <div class="post-header">
              <div class="post-user-info">
                <AvatarWithInfo :user="author" :size="70" />
                <div class="post-title-section">
                  <h1 class="post-title">{{ post?.title || '加载中' }}</h1>
                  <div class="post-meta">
                    <span class="post-date">发布于：{{ formatDate(post?.publishedAt) }} <span style="margin-left: 16px;"
                        v-if="showMoreInfo">创建于：{{
                          formatDate(post?.createdAt)
                        }}</span></span>
                    <span class="post-stats">
                      <span class="stat-item">
                        <icon-eye /> {{ post?.viewCount || 0 }} 浏览
                      </span>
                      <span class="stat-item" style="margin-left: 16px;">
                        <icon-heart /> {{ post?.likeCount || 0 }} 点赞
                      </span>
                      <span class="stat-item" style="margin-left: 16px;">
                        <icon-message /> {{ post?.commentCount || 0 }} 评论
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <a-divider dashed />
            <!-- 文章内容 -->
            <div class="post-content">

              <div class="markdown-content" :class="{ 'best-reading-content': !notBestReading }">
                <MarkdownPreviewWrapper @scroll="handleContentScroll" :content="post?.content" :showComment="true" />
                <div v-show="notBestReading" class="full-screen-tip">
                  <div >
                    <a-button type="primary" shape="circle" @click="handleFullScreenClick">
                      <icon-fullscreen />
                    </a-button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
        <div class="comment-section" :style="{ marginLeft: showMoreInfo ? '10vw' : '0px' }">
          <a-divider dashed ref="commentDividerRef" />
          <CommentList :version="version" :postId="post?.id" :postCount="post?.commentCount" />
        </div>
      </div>

      <div class="post-right-sidebar" v-if="showMoreInfo">
        <div :style="{ height: (placeholderHeight) / 2 + 'px' }"></div>
        <!-- 展示知识库 -->
        <PostRecommend :postId="post?.id" />
      </div>
    </div>
  </div>


  <CodeLoader v-if="codeLoader > 0"></CodeLoader>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';
import {IconEye, IconFullscreen, IconHeart, IconMessage} from '@arco-design/web-vue/es/icon';
import {Message} from '@arco-design/web-vue';
import api from '@/api/index.js';
import MarkdownPreviewWrapper from '@/components/md/MarkdownPreviewWrapper.vue';
import AvatarWithInfo from '@/components/base/avatar/AvatarWithInfo.vue';
import {useUserStore} from '@/store/user.js';
import PostHistroy from '@/views/post/components/PostHistroy.vue';
import PostRecommend from '@/views/post/components/PostRecommend.vue';
import {useCommentStore} from '@/components/comment/commentStore.js';
import CodeLoader from '@/components/base/loader/CodeLoader.vue';
import CommentList from '@/components/post/children/CommentList.vue';
import PostActions from '@/components/post/common/PostActions.vue';
import Header from '../../components/layout/Header.vue';
import {storeToRefs} from 'pinia';
import {formatDate} from '@/utils/DateFormatter.js';

const userStore = useUserStore();
const commentStore = useCommentStore();

const route = useRoute();

// 检测屏幕宽度并在渲染前设置变量
const showMoreInfo = ref(window.innerWidth >= 768);

// 响应式数据
const post = ref(null);
const author = ref(null);
const lastScrollTop = ref(0);
const placeholderHeight = ref(0);
const codeLoader = ref(0);
const version = ref();
const isFavorited = ref(false);
const isLiked = ref(false);
let originContent;
let orginCommentCountData;
let summaryCache;
function getSummrayElment(summary) {
  if (summaryCache) {
    return summaryCache;
  }
  if (!summary) {
    summary = '这个人没有设置任何摘要哦';
  }
  summaryCache = `<p style="font-size: 16px; line-height: 1.6;background-color: var(--color-fill-1); padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">摘要：${summary}</p>`;
  return summaryCache;
}
const loadPostContent = async (postId) => {
  codeLoader.value++;

  try {
    const { data } = await api.get('/post', { id: postId });
    codeLoader.value--;
    //获取评论数据
    version.value = data.version;
    commentStore.getParagraphCommentCountByPost(postId, data.version).then(countMap => {
      orginCommentCountData = {
        postId: postId,
        version: data.version,
        countMap,
      };
    });
    post.value = data;

    // 设置页面标题
    document.title = data.title || '文章详情';

    // 从 operate 字段中获取点赞和收藏状态
    if (data.operate) {
      // 兼容两种数据格式：字符串数组或对象数组
      isLiked.value = data.operate.some(op =>
        typeof op === 'string' ? op === '点赞' : op.type === '点赞'
      );
      isFavorited.value = data.operate.some(op =>
        typeof op === 'string' ? op === '收藏文章' : op.type === '收藏文章'
      );
    }
    console.log('operate数据:', data.operate, '点赞状态:', isLiked.value, '收藏状态:', isFavorited.value)
    post.value.content = getSummrayElment(data.summary) + '\n' + data.content;
    originContent = post.value.content;

    if (data.userId) {
      author.value = await userStore.getUserInfo(data.userId);
    }
  }
  catch (error) {
    console.error('加载文章内容失败:', error);
    codeLoader.value--;
  }
  finally {

  }
  placeholderHeight.value = getBestReadingTop();
};

async function handleHistoryClick(item) {
  Message.loading({ id: 'loadingHistory', content: '正在加载文章历史版本...', duration: 10000 });
  version.value = item.version;
  try {
    if (item.publishVersion) {
      commentStore.getParagraphCommentCountByPost(orginCommentCountData.postId, orginCommentCountData.version, orginCommentCountData.countMap);
      post.value.content = originContent;
      Message.success({ id: 'loadingHistory', content: '已恢复到原始版本', duration: 500 });
      return;
    }
    version.value = orginCommentCountData.version;
    console.log('查看历史记录', item.version);
    commentStore.getParagraphCommentCountByPost(item.postId, item.version);
    const { data } = await api.get('/post/history', { postId: item.postId, id: item.id });
    post.value.content = data;
    Message.success({ id: 'loadingHistory', content: '文章历史版本加载成功', duration: 500 });
  }
  catch (error) {
    console.error('加载文章历史版本失败:', error);
    Message.error({ id: 'loadingHistory', content: '加载文章历史版本失败', duration: 500 });
  }

}



// 节流函数，减少事件触发频率
const throttle = (func, delay) => {
  let timer = null;
  return function (...args) {
    if (!timer) {
      timer = setTimeout(() => {
        func.apply(this, args);
        timer = null;
      }, delay);
    }
  };
};
const containerRef = ref(null);
const commentDividerRef = ref(null);
const notBestReading = ref(false);
const targetVersion = ref(null);
let firstDivider;
const getBestReadingTop = () => {
  if (firstDivider) {
    const rect = firstDivider.getBoundingClientRect();
    return window.pageYOffset + rect.top;
  }
  const dividers = containerRef.value?.querySelectorAll('.arco-divider') || [];
  firstDivider = dividers.length > 0 ? dividers[0] : null;
  if (firstDivider) {
    const rect = firstDivider.getBoundingClientRect();
    return window.pageYOffset + rect.top;
  }
  return 113;
};
function handleFullScreenClick() {
  notBestReading.value = false;
  console.log('滑动到', getBestReadingTop());
  window.scrollTo({
    top: getBestReadingTop(),
    behavior: 'smooth'
  });
}

// 处理内容滚动事件
const handleContentScroll = throttle((event) => {
  if (codeLoader.value > 0 || !author.value) {
    return;
  }

  const currentBestReadingTop = getBestReadingTop();
  if (window.scrollY < currentBestReadingTop + 5 && window.scrollY > currentBestReadingTop - 5) {
    notBestReading.value = false;
  }
  else {
    notBestReading.value = true;
  }
  const contentElement = event.target;
  const scrollTop = contentElement.scrollTop;
  // 判断滚动方向
  const isScrollingDown = scrollTop > lastScrollTop.value;
  // 如果是向下滚动
  if (isScrollingDown) {
    // 计算本次滚动的距离
    if (window.scrollY < currentBestReadingTop - 5) {
      window.scrollTo({
        top: currentBestReadingTop,
        behavior: 'smooth'
      });
    }
  }
  lastScrollTop.value = scrollTop;
}, 50);

// 滚动到评论区
const scrollToComments = () => {
  if (commentDividerRef.value) {
    const element = commentDividerRef.value.$el || commentDividerRef.value;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};



const handleLike = (b) => {
  isLiked.value = b;
  // 更新本地点赞数
  if (post.value) {
    post.value.likeCount = b ? post.value.likeCount + 1 : post.value.likeCount - 1;
  }
}

// 收藏成功处理
const handleFavoriteSuccess = (b) => {
  isFavorited.value = b;
  // 更新本地收藏数
  if (post.value) {
    post.value.starCount = b ? post.value.starCount + 1 : post.value.starCount - 1;
  }
};

// 举报处理（后续实现）
const handleReport = () => {
  Message.info('举报功能待实现');
};


const { targetDataId, parCommentId, targetParVersion, targetReplyId, postCommentId } = storeToRefs(commentStore);
async function processParCommentId(parCommentId2) {
  try {
    const { data } = await api.get('/comment/locate', { id: parCommentId2 });
    console.log("需要定位到段评", parCommentId2, "返回数据:", data);
    if (data && data.version) {
      targetVersion.value = data.version;
      targetParVersion.value = data.version
    }
    if (data && data.dataId) {
      // 直接赋值给 store 的属性
      targetDataId.value = data.dataId;
      parCommentId.value = parCommentId2;
      console.log("已设置 targetDataId:", commentStore.targetDataId, "parCommentId:", commentStore.parCommentId);
    }
  } catch (error) {
    console.error('定位评论失败:', error);
  }
}

async function processPostCommentId(p) {
  postCommentId.value = p
}

// 组件挂载时的逻辑
onMounted(() => {
  const postId = route.params.id;
  placeholderHeight.value = getBestReadingTop();

  // 获取 URL 参数
  const parCommentId = route.query.par;
  const postCommentId = route.query.comment;
  const replyId = route.query.reply
  // 处理参数（如果需要的话）
  if (parCommentId) {
    processParCommentId(parCommentId)
  }
  if (replyId) {
    targetReplyId.value = replyId
  }
  if (postCommentId) {
    processPostCommentId(postCommentId)
  }
  // 移除 URL 参数
  if (parCommentId || postCommentId) {
    const newQuery = { ...route.query };
    delete newQuery.par;
    delete newQuery.comment;
    delete newQuery.reply;
    window.history.replaceState(
      {},
      '',
      `${route.path}${Object.keys(newQuery).length > 0 ? '?' + new URLSearchParams(newQuery).toString() : ''}`
    );
  }

  if (postId) {
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

.main-layout {
  display: flex;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
  background-color: var(--color-bg-1);
}

.content-wrapper {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.left-content {
  display: flex;
  max-width: 100%;
}

.comment-section {
  max-width: 100%;
  padding-right: 30px;
  box-sizing: border-box;
}

.post-sidebar {
  margin-left: 200px;
  padding: 0px 20px 20px 20px;
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media screen and (max-width: 1400px) {
    margin-left: 50px;
    padding: 0px 10px;
    width: 180px;
  }

  @media screen and (max-width: 768px) {
    margin-left: 10px;
    display: none;
  }
}

.post-right-sidebar {
  width: 280px;
  flex-shrink: 0;

  box-sizing: border-box;

  @media screen and (max-width: 1200px) {
    display: none;
  }
}

.post-container {
  box-sizing: border-box;
  scrollbar-width: none;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  border-radius: 8px;

  &::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  padding: 20px;
  overflow-y: auto;

  @media screen and (max-width: 1400px) {
    padding: 10px;
  }

  @media screen and (max-width: 768px) {
    padding: 10px;
    width: 100%;
  }
}

.post-header {
  padding: 20px 0;

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
  color: var(--color-neutral-10);
  line-height: 1.3;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--color-neutral-8);
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
  height: 98dvh;
  display: flex;
  gap: 20px;
}

.changelog-sidebar {
  width: 200px;
  background-color: var(--color-fill-2);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
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



.comment-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;

  border-radius: 14px;
  background-color: var(--color-fill-2);
  color: var(--color-text-2);
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--color-border-2);
}
</style>
