<template>
  <div class="user-docs">
    <UserPageHeader 
      :userId="userId" 
      title="文章列表" 
      subtitle="文章"
      searchPlaceholder="搜索文章..."
      :sortOptions="sortOptions"
      apiUrl="/post/list"
      @sort-change="handleSortChangeFromHeader"
      @search="handleSearchFromHeader"
      @back="handleBack" />

    <ContentArea 
      :loading="loading" 
      :list-data="posts" 
      loading-tip="正在加载文章..."
      :card-width="cardWidth"
      :card-height="cardHeight"
      :height-offset="400"
      @page-size-change="handlePageSizeChange"
      emptyHeight="50vh">
      <template #default="{ pageSize: currentPageSize, containerWidth: currentContainerWidth, containerHeight: currentContainerHeight }">
        <div class="posts-list">
          <!-- 文章卡片将在这里展示 -->
          <div v-for="post in posts">
            <PostCard :showStatus="userId == post.userId" :height="cardHeight" :width="cardWidth" :key="post.id"
              :post="post" />
          </div>
        </div>
      </template>
      <template #empty>
        <a-empty style="padding: 40px 0;" description="暂无文章" />
      </template>
    </ContentArea>
    <div class="pagination-wrapper">
      <a-pagination size="large" :total="total" :current="currentPage" :page-size="pageSize" show-total show-jumper
        @change="handlePageChange" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api/index.js';
import PostCard from '@/components/post/PostCard.vue';
import UserPageHeader from './common/UserPageHeader.vue';
import ContentArea from './common/ContentArea.vue';

// 定义排序选项
const sortOptions = [
  { label: '最新发布', value: 'published_at' },
  { label: '最多观看', value: 'view_count' },
  { label: '最多点赞', value: 'like_count' }
];

const router = useRouter();
const route = useRoute();
// 从路由参数获取用户ID
const userId = ref(route.params.id);
const userInfo = ref(null);

// 获取用户信息
const fetchUserInfo = async (id) => {
  try {
    const response = await api.get('/user', { id: id });
    userInfo.value = response.data;
  } catch (err) {
    console.error('获取用户信息失败:', err);
  }
};

// 文章数据
const posts = ref([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);


// 排序相关数据
const sortBy = ref('published_at'); // 默认按最新发布排序
// pageSize 现在由 ContentArea 组件管理，这里只需要保留一个响应式的引用
const pageSize = ref(10); // 默认值

// 卡片尺寸常量
const cardWidth = 260;
const cardHeight = 400;

// 加载文章列表
const loadPosts = async (page = 1) => {
  loading.value = true;
  try {
    // 构建请求参数
    const params = {
      page: page,
      size: pageSize.value,
      userId: userId.value,
      simple: total.value > 0,
      option: sortBy.value // 添加排序字段
    };
    if (pageSize.value < 2) {
      //兼容代码，不知道为什么会先发起一个pageSize=1的请求
      console.warn('pageSize=1的请求，忽略')
      return;
    }
    // 如果有搜索关键词，则添加到请求参数中
    if (useSearch && searchValue.value && searchValue.value.trim()) {
      params.keyword = searchValue.value.trim();
    }

    const { data } = await api.post('/post/list', params);
    posts.value = data.records;
    if (total.value <= 0) {
      total.value = data.total;
    }
    currentPage.value = page;
  } catch (error) {
    console.error('加载文章列表失败:', error);
    posts.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  // 返回到用户主页
  router.push(`/space/${userId.value}`);
};

let useSearch = false

// 从公共组件传递的事件处理
const handleSortChangeFromHeader = (value) => {
  sortBy.value = value;
  // 排序变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};

const handleSearchFromHeader = (value) => {
  console.log('从头部组件接收搜索:', value);
  currentPage.value = 1
  total.value = -1
  useSearch = true
  // 重新加载文章，带上搜索关键词
  loadPosts(currentPage.value);
};

// 处理分页变化
const handlePageChange = (page) => {
  loadPosts(page);
};

// 组件挂载时加载数据
onMounted(async () => {
  // 获取用户信息
  if (userId.value) {
    fetchUserInfo(userId.value);
  }
});



// 组件卸载时清理监听
onUnmounted(() => {
});

// 处理pageSize变化事件
const handlePageSizeChange = (newPageSize) => {
  // 更新本地的 pageSize 值
  pageSize.value = newPageSize;
  
  // pageSize变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};
</script>

<style lang="less" scoped>
.user-docs {

  margin: 0 auto;
  padding: 0 20px;

  .posts-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;
    padding: 16px 0;
    align-items: flex-start;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  .content-area {
    min-height: 480px;
    height: calc(100vh - 300px);
  }


}

@media (max-width: 1380px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: 16px;
  }
}
</style>