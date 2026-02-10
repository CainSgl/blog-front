<template>
  <a-spin :loading="loading" tip="正在加载文章内容..." style="display: block;">
    <div>
      <div style="padding:10px 0px;">
        <KBCardHeader :post-info="postInfo" :kb-id="kbId" :tree-data="treeData" :kb-info="kbInfo" :on-back="goBack" :show-go-post="true" @update="handlePostUpdate" />
      </div>
      <div style="height: 100%;padding-left:16px;margin-right: 10px;position: relative;" :style="{'height': previewHeight}">
        <MarkdownPreviewWrapper @scroll="handleContentScroll" :content="textContent" :useWindowScroll="true" />
        <!-- <div v-show="notBestReading" class="full-screen-tip">
          <a-tooltip content="点我可滑动到底部获取最佳阅读体验哦">
            <a-button type="primary" shape="circle" @click="handleFullScreenClick">
              <icon-fullscreen />
            </a-button>
          </a-tooltip>
        </div> -->
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Message} from '@arco-design/web-vue';

import KBCardHeader from '@/views/kb/components/KBCardHeader.vue';
import api from '@/api/index.js';
import {useKbStore} from '../kbStore.js';
import {messageManager} from '@/api/request.js';

import MarkdownPreviewWrapper from '@/components/md/MarkdownPreviewWrapper.vue';

const props = defineProps({
  isImmersive: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();

// 响应式数据
const textContent = ref('');
const previewHeight = computed(() => {
  // immersive 模式：100dvh
  // 非 immersive 模式：100dvh - 68px (header高度)
  // 减去 124px 是页面内部的其他元素高度
  return props.isImmersive ? 'calc(100dvh - 124px)' : 'calc(100dvh - 124px - 68px)';
});
const loading = ref(false); // 控制文章加载时的旋转动画
const notBestReading = ref(false); // 是否不在最佳阅读位置
const lastScrollTop = ref(0); // 上次滚动位置

// 从store中获取treeData
const treeData = computed(() => kbStore.treeData);
const kbInfo = computed(() => kbStore.kbInfo);
const kbId = computed(() => route.query.kb);

const postInfo = ref({});
let summaryCache;
function getSummrayElment(summary) 
{
  if (summaryCache) 
  {
    return summaryCache;
  }
  if (!summary) 
  {
    summary = '这个人没有设置任何摘要哦';
  }
  summaryCache = `<p style="font-size: 16px; line-height: 1.6;background-color: var(--color-fill-1); padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">摘要：${summary}</p>\n\n`;
  return summaryCache;
}
const loadPostContent = async (postId) => 
{
  // 获取文章名称用于加载提示
  let postName = '文章';
  // 开始加载，设置loading为true
  loading.value = true;
  try 
  {
    const { data } = await api.get('/post', { id: postId, simple: true });
    console.log(data);
    data.content= getSummrayElment(data.summary) + '\n' + data.content;
    textContent.value = data.content || '';
    postInfo.value = data;
  }
  catch (error) 
  {
    console.error('加载文章内容失败:', error);
    if (messageManager.hasMessage('40101')) 
    {
      Message.warning({
        id: '40101',
        content: '该文章由于私密性设置无法访问',
        duration: 3000,
      });
      router.push({ name: 'NoPermission', query: { kb: kbId.value } });
    }
    else 
    {
      Message.error(`加载${postName}失败`);
    }
  }
  finally 
  {
    // 加载完成，设置loading为false
    loading.value = false;
  }
};
// 获取最佳阅读位置（页面底部）
const getBestReadingTop = () => {
  // 返回文档的最大滚动高度
  return document.documentElement.scrollHeight - window.innerHeight;
};

// 点击按钮滚动到底部
const handleFullScreenClick = () => {
  notBestReading.value = false;
  window.scrollTo({
    top: getBestReadingTop(),
    behavior: 'smooth'
  });
};

// 节流函数
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

// 处理内容滚动事件
const handleContentScroll = throttle((event) => {
  if (loading.value) {
    return;
  }

  const currentBestReadingTop = getBestReadingTop();
  // 判断是否在底部（允许5px的误差）
  if (window.scrollY >= currentBestReadingTop - 5) {
    notBestReading.value = false;
  }
  else {
    notBestReading.value = true;
  }
  
  const contentElement = event.target;
  const scrollTop = contentElement.scrollTop;
  
  // 判断滚动方向
  const isScrollingDown = scrollTop > lastScrollTop.value;
  
  // 如果是向下滚动且还没到最佳阅读位置
  if (isScrollingDown) {
    if (window.scrollY < currentBestReadingTop - 5) {
      window.scrollTo({
        top: currentBestReadingTop,
        behavior: 'smooth'
      });
    }
  }
  
  lastScrollTop.value = scrollTop;
}, 50);
// 监听路由参数变化
watch(
  () => route.query.p,
  async (newPostId, oldPostId) => 
  {
    if (newPostId && newPostId !== oldPostId) 
    {
      loadPostContent(newPostId);
    }
  }
);

// 返回函数
const goBack = () => 
{
  router.push({ name: 'KBIndex', query: { kb: kbId.value } });
};

// 处理文章更新
const handlePostUpdate = (updatedData) => {
  // 更新本地的 postInfo
  postInfo.value = {
    ...postInfo.value,
    title: updatedData.title,
    summary: updatedData.summary,
    isTop: updatedData.isTop,
    tags: updatedData.tags,
    img: updatedData.img || postInfo.value.img
  };
};

// 组件挂载时的逻辑（如果需要）
onMounted(() => 
{
  const postId = route.query.p;
  console.log('Post ID from route:', postId, 'type:', typeof postId);
  if (postId) 
  {
    // 先加载文章内容
    loadPostContent(postId);
  }
});
</script>

<style lang="less" scoped>
.full-screen-tip {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 100;
}
</style>
