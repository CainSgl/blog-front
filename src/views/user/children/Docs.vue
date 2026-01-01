<template>
  <div class="user-docs">
    <a-page-header title="文章列表"
      :subtitle="userInfo ? `用户 ${userInfo ? userInfo.nickname || userInfo.username : userId} 的文章` : ''"
      @back="handleBack">
      <template #extra>
        <a-space>
          <a-button-group size="medium" style="margin-right: 16px;">
            <a-button :type="sortBy === 'published_at' ? 'primary' : 'outline'"
              @click="handleSortButtonClick('published_at')" size="medium">
              最新发布
            </a-button>
            <a-button :type="sortBy === 'view_count' ? 'primary' : 'outline'"
              @click="handleSortButtonClick('view_count')" size="medium">
              最多观看
            </a-button>
            <a-button :type="sortBy === 'like_count' ? 'primary' : 'outline'"
              @click="handleSortButtonClick('like_count')" size="medium">
              最多点赞
            </a-button>
          </a-button-group>
          <a-auto-complete v-model="searchValue" :data="searchOptions" placeholder="搜索文章..." :style="{ width: '400px' }"
            @search="handleSearch" @select="handleSearchSelect" @press-enter="handleSearchEnter" allow-clear>
            <template #prefix>
              <IconSearch />
            </template>
          </a-auto-complete>
        </a-space>
      </template>
    </a-page-header>

    <div class="content-area" style="margin-top: 20px;">
      <a-card :bordered="false">
        <a-spin :loading="loading" tip="正在加载文章...">
          <div class="posts-list-container" :style="{ width: containerWidth + 'px' }">
            <div class="posts-list">
              <!-- 文章卡片将在这里展示 -->
              <div v-for="post in posts">
                <PostCard :showStatus="userId == post.userId" :height="cardHeight" :width="cardWidth" :key="post.id"
                  :post="post" />
              </div>
              <a-empty v-if="posts.length === 0 && !loading" style="padding: 40px 0;" description="暂无文章" />
              <div v-else-if="posts.length === 0" style="height: 50vh;"></div>
            </div>

          </div>
        </a-spin>
      </a-card>

    </div>
    <div class="pagination-wrapper">
      <a-pagination size="large" :total="total" :current="currentPage" :page-size="pageSize" show-total show-jumper
        @change="handlePageChange" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IconPlus,
  IconSearch
} from '@arco-design/web-vue/es/icon';
import api from '@/api/index.js';
import PostCard from '@/components/PostCard.vue';
import { debounce } from 'lodash-es';

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
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);

// 搜索相关数据
const searchValue = ref('');
const searchOptions = ref([]);
// 排序相关数据
const sortBy = ref('published_at'); // 默认按最新发布排序
const pageSize = computed(() => {
  const widthCount = loadingContainerWNumber.value;
  const heightCount = loadingContainerHNumber.value;
  const calculatedSize = Math.floor(widthCount * heightCount);
  const finalSize = Math.min(calculatedSize, 100);
  return finalSize;
});

// 卡片尺寸常量
const cardWidth = ref(260);
const cardHeight = ref(400);
const cardGap = 16;

// 响应式容器尺寸
const containerWidth = ref(0);
const containerHeight = ref(0);

// 简化的计算：直接计算可用空间能放多少个卡片
const loadingContainerWNumber = computed(() => {
  if (containerWidth.value <= 0) return 1;
  const cardsPerRow = Math.floor(containerWidth.value / (cardWidth.value + cardGap));
  return Math.max(1, cardsPerRow);
});

const loadingContainerHNumber = computed(() => {
  if (containerHeight.value <= 0) return 1;
  const rows = Math.floor(containerHeight.value / (cardHeight.value + cardGap));
  return Math.max(2, rows);
});

// 监听容器尺寸变化
let resizeObserver = null;
let resizeTimeout = null;
let resizeCallCount = 0;
let containerElement = null; // 缓存 DOM 元素

const updateContainerSize = () => {
  resizeCallCount++;

  // 清除之前的定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  // 使用 setTimeout 防抖，延迟执行
  resizeTimeout = setTimeout(() => {
    // 只在最后一次调用后执行
    if (containerElement || (containerElement = document.querySelector('.content-area'))) {
      if (containerElement) {
        // 确保响应式数据正确更新
        const newWidth = containerElement.clientWidth;
        const newHeight = window.innerHeight - 400;

        // 只有真正变化时才更新，避免不必要的重新渲染
        if (newWidth !== containerWidth.value) {
          containerWidth.value = newWidth;
        }
        if (newHeight !== containerHeight.value) {
          containerHeight.value = newHeight;
        }
      }
    }

    // 重置计数器
    resizeCallCount = 0;
  }, 100); // 100ms 延迟防抖
};

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
// 搜索相关事件处理 - 使用防抖优化性能
const handleSearch = debounce(async (value) => {
  if (value.trim()) {
    useSearch = false
  }
  console.log("搜索值:", value);
  if (value.trim()) {
    try {
      // 调用API获取搜索建议
      const params = {
        page: 1,
        size: 5,  // 固定大小为5
        simple: true,
        userId: userId.value,
        sortBy: sortBy.value, // 添加排序字段
        keyword: value  // 添加搜索关键词
      };
      const { data } = await api.post('/post/list', params);

      // 将搜索结果转换为下拉选项格式
      if (data && data.records) {
        searchOptions.value = data.records.map(post => post.title || `文章 ${post.id}`);
      } else {
        searchOptions.value = [];
      }
    } catch (error) {
      console.error('搜索文章失败:', error);
      searchOptions.value = [];
    }
  } else {
    searchOptions.value = [];
  }
}, 300);

const handleSearchSelect = (value) => {
  console.log('选中搜索项:', value);
  // 替换搜索框的文字为选中的标题
  searchValue.value = value;
  currentPage.value = 1
  total.value = -1
  useSearch = true
  // 重新加载文章，带上搜索关键词
  loadPosts(currentPage.value);
};

const handleSearchEnter = () => {
  console.log('搜索:', searchValue.value);
  currentPage.value = 1
  total.value = -1
  useSearch = true
  // 重新加载文章，带上搜索关键词
  loadPosts(currentPage.value);
};

// 处理排序变化
const handleSortChange = () => {
  // 排序变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};

// 处理排序按钮点击
const handleSortButtonClick = (value) => {
  if (sortBy.value !== value) {
    sortBy.value = value;
    handleSortChange();
  }
};

// 处理分页变化
const handlePageChange = (page) => {
  loadPosts(page);
};

// 监听pageSize变化，自动重新加载数据
watch(pageSize, (newSize, oldSize) => {
  if (newSize !== oldSize && oldSize > 0) {
    // pageSize变化时重置到第一页并重新加载
    currentPage.value = 1;
    loadPosts(1);
  }
});

// 组件挂载时加载数据
onMounted(async () => {
  updateContainerSize();
  // 获取用户信息
  if (userId.value) {
    fetchUserInfo(userId.value);
  }
  // 初始化ResizeObserver监听尺寸变化
  resizeObserver = new ResizeObserver(() => {
    updateContainerSize();
  });
  // 在ResizeObserver中使用懒加载方式获取元素
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    resizeObserver.observe(contentArea);
  }
  // 监听窗口大小变化
  window.addEventListener('resize', updateContainerSize);

  // 加载文章列表
  loadPosts(currentPage.value);
});

// 组件卸载时清理监听
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', updateContainerSize);

  // 清理定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
});
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
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  .content-area {

    min-height: calc(100vh - 400px);
  }

  // 加载状态容器
  .posts-loading-container {
    position: relative;
    transition: height 0.3s ease;
  }

  .posts-loading-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    height: 100%;
  }

  .posts-loading-card {
    flex-shrink: 0;
    position: relative;
    border-radius: 6px;
    overflow: hidden;
  }

  .posts-loading-card-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f5f5f5 25%, #e8e8e8 37%, #f5f5f5 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
    border-radius: 6px;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 100% 50%;
    }

    100% {
      background-position: 0 50%;
    }
  }
}

@media (max-width: 1380px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: 16px;
  }
}
</style>