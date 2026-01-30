<template>
    <a-typography-title :heading="5" class="section-title">
        置顶文章
    </a-typography-title>
    <a-spin :loading="loading" tip="正在加载置顶文章..." style="display: block;">
        <div ref="containerRef" class="posts-container">
            <template v-if="topPosts.length > 0">
              <a-link :href="`/p/${post.id}`"  v-for="post in topPosts"  :key="post.id" :hoverable="false">
                <PostCard  :height="cardHeight" :post="post" />
                </a-link>
                <div style="text-align: center;">
                    <a-button v-if="topPosts.length < 10" type="primary" style="margin-top: 16px;"
                        @click="showTopPostSelector">置顶更多文章</a-button>
                </div>
            </template>
            <template v-else-if="!loading">
                <a-empty v-if="currentUserInfo?.id != route.params.id" description="该用户没有设置置顶文章" />
                <a-empty v-else description>
                    <div class="empty-content">
                        <p>置顶视频是粉丝们看到的第一个视频，</p>
                        <p>请选择你最喜欢的作品，让粉丝们一饱眼福吧！</p>
                        <a-button type="primary" style="margin-top: 16px;" @click="showTopPostSelector">置顶文章</a-button>
                    </div>
                </a-empty>

            </template>
        </div>
    </a-spin>

    <!-- 置顶文章选择弹窗 -->
    <TopPostSelector ref="topPostSelectorRef" :userId="route.params.id" @top-post-selected="handleTopPostSelected" />
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useUserStore} from '@/store/user.js';
import PostCard from '@/components/post/PostCardWrapper.vue';
import TopPostSelector from '@/components/user/home/index/TopPostSelector.vue';
import api from '@/api/index.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 置顶文章
const topPosts = ref([]);
// 加载状态
const loading = ref(true);
// 当前用户信息
const currentUserInfo = ref(null);
// 容器引用
const containerRef = ref(null);
// 卡片高度
const cardHeight = ref('150px');
// 置顶文章选择器引用
const topPostSelectorRef = ref(null);
// ResizeObserver实例
let resizeObserver = null;

// 根据容器宽度设置卡片高度
const updateCardHeight = (width) => 
{
  if (width < 400) 
  {
    cardHeight.value = '300px';
  }
  else 
  {
    cardHeight.value = '150px';
  }
};

// 获取置顶文章
const fetchTopPosts = async (id) => 
{
  loading.value = true; // 开始加载
  try 
  {
    const response = await api.get('/post/top', { id: id });
    topPosts.value = response.data;
  }
  catch (err) 
  {
    console.error('获取置顶文章失败:', err);
    topPosts.value = [];
  }
  finally 
  {
    loading.value = false; // 结束加载
  }
};

// 显示置顶文章选择器
const showTopPostSelector = () => 
{
  if (topPostSelectorRef.value) 
  {
    topPostSelectorRef.value.showModal();
  }
};

// 处理置顶文章选择完成事件
const handleTopPostSelected = async (post) => 
{
  // 重新获取置顶文章列表以更新UI
  Message.loading({ id: 'PostLoading' + post.id, content: '重新拉取数据中...' });
  await fetchTopPosts(route.params.id);
  Message.success({ id: 'PostLoading' + post.id, content: '拉取完毕' });
};

// 处理路由参数变化
onMounted(async () => 
{
  fetchTopPosts(route.params.id);

  // 获取当前用户信息
  currentUserInfo.value = await userStore.getUserInfo();

  // 初始化容器宽度监听
  if (containerRef.value) 
  {
    // 初始设置高度
    updateCardHeight(containerRef.value.offsetWidth);

    // 创建ResizeObserver监听容器大小变化
    resizeObserver = new ResizeObserver(entries => 
    {
      for (let entry of entries) 
      {
        const width = entry.contentRect.width;
        updateCardHeight(width);
      }
    });

    resizeObserver.observe(containerRef.value);
  }
});



// 组件卸载时清理监听器
onUnmounted(() => 
{
  if (resizeObserver) 
  {
    resizeObserver.disconnect();
  }
});
</script>



<style scoped lang="less">
.section-title {
    margin-bottom: 16px;
    padding-left: 12px;
    border-left: 4px solid @primary-6;
}

.posts-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.empty-content {
    text-align: center;

    p {
        margin-bottom: 8px;
        line-height: 1.5;
    }
}
</style>
