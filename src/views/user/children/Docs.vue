<template>
  <div style="padding:24px">
    <div class="user-docs">
    <UserPageHeader :userId="userId" title="文章列表" subtitle="文章" searchPlaceholder="搜索文章..." :sortOptions="sortOptions"
      apiUrl="/post/list" @sort-change="handleSortChangeFromHeader" @search="handleSearchFromHeader"
      @back="handleBack" />

    <!-- 为当前用户添加状态选择ContentArea -->
    <div v-if="isCurrentUser" class="status-filter-area">
      <div class="status-filter-container">
        <div class="status-and-tip">
          <a-radio-group v-model="postStatus" type="button" @change="handleStatusChange">
            <a-radio value="">全部</a-radio>
            <a-radio value="草稿">草稿</a-radio>
            <a-radio value="已发布">已公开</a-radio>
            <a-radio value="仅粉丝">仅粉丝</a-radio>
            <a-radio value="无知识库归属">游离文档</a-radio>
            <a-radio value="待审核">审核中</a-radio>
            <a-radio value="已下架">已下架</a-radio>
          </a-radio-group>
          <span class="create-tip">{{ getCreateTipText }}</span>
        </div>
      </div>
    </div>

    <ContentArea :loading="loading" :list-data="posts" loading-tip="正在加载文章..." :card-width="cardWidth"
      :card-height="cardHeight-90" :height-offset="600" @page-size-change="handlePageSizeChange" emptyHeight="50vh">
      <template
        #default="{ pageSize: currentPageSize, containerWidth: currentContainerWidth, containerHeight: currentContainerHeight }">
        <div class="posts-list">
          <!-- 文章卡片将在这里展示 -->
          <div v-for="post in posts">
            <PostCard :showStatus="postStatus==''" :height="cardHeight" :width="cardWidth" :key="post.id"
              :post="loading?{}:post" />
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
  </div>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api/index.js';
import PostCard from '@/components/post/PostCard.vue';
import UserPageHeader from './common/UserPageHeader.vue';
import ContentArea from './common/ContentArea.vue';
import { useUserStore } from '@/store/user.js';

// 定义排序选项
const sortOptions = [
  { label: '最新发布', value: 'published_at' },
  { label: '最多观看', value: 'view_count' },
  { label: '最多点赞', value: 'like_count' }
];

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 从路由参数获取用户ID
const userId = ref(route.params.id);
const userInfo = ref(null);
const currentUserInfo = ref({ id: -1 });

// 计算当前是否为访问自己的文章列表
const isCurrentUser = computed(() => 
{
  return currentUserInfo.value.id == userId.value;
});

// 获取用户信息
const fetchUserInfo = async (id) => 
{
  try 
  {
    const response = await api.get('/user', { id: id });
    userInfo.value = response.data;
  }
  catch (err) 
  {
    console.error('获取用户信息失败:', err);
  }
};

// 文章数据
const posts = ref([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);
const getCreateTipText = computed(() => 
{
  switch(postStatus.value) 
  {
  case '':
    return '若需要创建文档，请先创建知识库！';
  case '草稿':
    return '文章若是草稿状态，将不会被公开展示。';
  case '已发布':
    return '互联网的所有人均可以访问。';
  case '无知识库归属':
    return '游离文档是指未绑定到任何知识库的文档。建议绑定知识库以方便管理！';
  case '待审核':
    return '你的文档信息将会在审核通过后公开展示。';
  case '已下架':
    return '已下架的文档将不再公开展示。若需要重新公开展示，请联系管理员。';
  case '仅粉丝':
    return '只有粉丝才能观看该文章！';
  default:
    return '若需要创建文档，请先创建知识库！';
  }
});

// 排序相关数据
const sortBy = ref('published_at'); // 默认按最新发布排序
// pageSize 现在由 ContentArea 组件管理，这里只需要保留一个响应式的引用
const pageSize = ref(10); // 默认值

// 卡片尺寸常量
const cardWidth = 260;
const cardHeight = 400;

// 文章状态筛选
const postStatus = ref(''); // 默认为全部

const searchValue = ref('');
// 加载文章列表
const loadPosts = async (page = 1) => 
{
  loading.value = true;
  try 
  {
    // 构建请求参数
    const params = {
      page: page,
      size: pageSize.value,
      userId: userId.value,
      simple: total.value > 0,
      option: sortBy.value // 添加排序字段
    };

    // 添加状态筛选参数
    if (postStatus.value) 
    {
      params.status = postStatus.value;
    }

    // 如果有搜索关键词，则添加到请求参数中
    if (useSearch && searchValue.value && searchValue.value.trim()) 
    {
      params.keyword = searchValue.value.trim();
    }

    const { data } = await api.post('/post/list', params);
    posts.value = data.records;
    if (total.value <= 0) 
    {
      total.value = data.total;
    }
    currentPage.value = page;
  }
  catch (error) 
  {
    console.error('加载文章列表失败:', error);
    posts.value = [];
    total.value = 0;
  }
  finally 
  {
    loading.value = false;
  }
};

const handleBack = () => 
{
  // 返回到用户主页
  router.push(`/space/${userId.value}`);
};

let useSearch = false;

// 从公共组件传递的事件处理
const handleSortChangeFromHeader = (value) => 
{
  sortBy.value = value;
  // 排序变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};

const handleSearchFromHeader = (value) => 
{
  currentPage.value = 1;
  total.value = -1;
  if (value && value.trim()) 
  {
    useSearch = true;
    loadPosts(currentPage.value);
  }
  else 
  {
    if (useSearch) 
    {
      console.log('之前搜索过，现在是复原');
      useSearch = false;
      loadPosts(currentPage.value);
    }
  }
  searchValue.value = value;
};

// 处理状态选择变化
const handleStatusChange = (value) => 
{
  postStatus.value = value;
  console.log(value);
  // 状态变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};

// 处理分页变化
const handlePageChange = (page) => 
{
  loadPosts(page);
};

// 组件挂载时加载数据
onMounted(async () => 
{
  if (userId.value) 
  {
    const [currentUserInfoData, userInfoData] = await Promise.all([
      userStore.getUserInfo(),
      fetchUserInfo(userId.value)
    ]);
    currentUserInfo.value = currentUserInfoData;
  }
});


// 处理pageSize变化事件
const handlePageSizeChange = (newPageSize) => 
{
  // 更新本地的 pageSize 值
  pageSize.value = newPageSize;

  // pageSize变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};
</script>

<style lang="less" scoped>
.user-docs {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  overflow: hidden;
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
    height: calc(100vh - 400px);
  }

  // 状态筛选区域样式
  .status-filter-area {
    padding: 16px 0;
    border-bottom: 1px solid #eee;

    .status-filter-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;

      .status-and-tip {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .create-tip {
        font-size: 14px;
        color: #999;
      }
    }
  }


}

@media (max-width: 1380px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: 16px;
  }
}
</style>