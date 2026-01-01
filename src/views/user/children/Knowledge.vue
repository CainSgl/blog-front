<template>
  <div class="user-knowledge">
    <a-page-header title="知识库"
      :subtitle="userInfo ? `用户 ${userInfo ? userInfo.nickname || userInfo.username : userId} 的知识库` : ''"
      @back="handleBack">
      <template #extra>
        <a-space>
          <a-button-group size="medium" style="margin-right: 16px;">
            <a-button :type="sortBy === 'created_at' ? 'primary' : 'outline'"
              @click="handleSortButtonClick('created_at')" size="medium">
              最新发布
            </a-button>
            <a-button :type="sortBy === 'like_count' ? 'primary' : 'outline'"
              @click="handleSortButtonClick('like_count')" size="medium">
              最多点赞
            </a-button>
          </a-button-group>
          <a-auto-complete v-model="searchValue" :data="searchOptions" placeholder="搜索知识库..."
            :style="{ width: '300px' }" @search="handleSearch" @select="handleSearchSelect"
            @press-enter="handleSearchEnter" allow-clear>
            <template #prefix>
              <IconSearch />
            </template>
          </a-auto-complete>
        </a-space>
      </template>
    </a-page-header>

    <div class="content-area" style="margin-top: 20px;">
      <a-card :bordered="false">
        <a-spin :loading="loading" tip="正在加载知识库...">
          <div class="kb-list-container" :style="{ width: containerWidth + 'px' }">
            <div class="kb-list">
              <KbCard v-for="kb in knowledgeBases" :key="kb.id" :kb-info="kb" :show-status="isCurrentUser" />
              <div v-if="isCurrentUser" class="create-kb-card">
              <a-popconfirm content="你要的是创建公开知识库还是私密知识库？（后续可修改）" okText="公开" cancelText="私密" @ok="handleCreateKb(true)" @cancel="handleCreateKb(false)">
                <a-card class="kb-card-container" :bordered="false" :body-style="{ padding: 0 }">
                  <div class="kb-cover-empty">
                    <div class="create-icon">
                      <IconPlus />
                    </div>
                    <div class="create-text">创建知识库</div>
                  </div>
                </a-card>
              </a-popconfirm>
            </div>
            </div>

            <a-empty v-if="knowledgeBases.length === 0 && !loading" style="padding: 40px 0;" description="暂无知识库" />
            <div v-else-if="knowledgeBases.length === 0" style="height: 50vh;"></div>

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
import { IconSearch, IconPlus } from '@arco-design/web-vue/es/icon';
import { Popconfirm } from '@arco-design/web-vue';
import KbCard from '@/components/kb/KbCard.vue';
import api from '@/api/index.js';
import { debounce } from 'lodash-es';
import { useUserStore } from '@/store/user.js';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 从路由参数获取用户ID
const userId = ref(route.params.id);
const userInfo = ref(null);
const currentUserInfo = ref({ id: -1 });

// 计算当前是否为访问自己的知识库
const isCurrentUser = computed(() => {
  return currentUserInfo.value.id == userId.value;
});

const knowledgeBases = ref([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);

// 获取用户信息
const fetchUserInfo = async (id) => {
  try {
    const response = await api.get('/user', { id: id });
    userInfo.value = response.data;
  } catch (err) {
    console.error('获取用户信息失败:', err);
  }
};

// 搜索相关数据
const searchValue = ref('');
const searchOptions = ref([]);
// 排序相关数据
const sortBy = ref('created_at'); // 默认按最新发布排序
const pageSize = computed(() => {
  const widthCount = loadingContainerWNumber.value;
  const heightCount = loadingContainerHNumber.value;
  const calculatedSize = Math.floor(widthCount * heightCount);
  const finalSize = Math.min(calculatedSize, 100);
  return finalSize;
});

// 卡片尺寸常量
const cardWidth = 180;
const cardHeight = 180;
const cardGap = 16;

// 响应式容器尺寸
const containerWidth = ref(0);
const containerHeight = ref(0);

// 简化的计算：直接计算可用空间能放多少个卡片
const loadingContainerWNumber = computed(() => {
  if (containerWidth.value <= 0) return cardWidth / (cardWidth + cardGap);
  const cardsPerRow = Math.floor(containerWidth.value / (cardWidth + cardGap));
  return Math.max(1, cardsPerRow);
});

const loadingContainerHNumber = computed(() => {
  if (containerHeight.value <= 0) return cardHeight;
  const rows = Math.floor(containerHeight.value / (cardHeight + cardGap));
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
        const newHeight = window.innerHeight - 600;

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

const loadKnowledgeBases = async (page = 1) => {
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
    const currentUserInfo = await userStore.getUserInfo();
    if (currentUserInfo.id == userId.value) {
      params.size = pageSize.value - 1;
    }
    // 如果有搜索关键词，则添加到请求参数中
    if (useSearch && searchValue.value && searchValue.value.trim()) {
      params.keyword = searchValue.value.trim();
    }

    const { data } = await api.post('/kb/list', params);
    knowledgeBases.value = data.records;
    if (total.value <= 0) {
      total.value = data.total;
    }
    currentPage.value = page;
  } catch (error) {
    console.error('加载知识库列表失败:', error);
    knowledgeBases.value = [];
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
      const { data } = await api.post('/kb/list', params);

      // 将搜索结果转换为下拉选项格式
      if (data && data.records) {
        searchOptions.value = data.records.map(kb => kb.name || kb.title || `知识库 ${kb.id}`);
      } else {
        searchOptions.value = [];
      }
    } catch (error) {
      console.error('搜索知识库失败:', error);
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
  // 重新加载知识库，带上搜索关键词
  loadKnowledgeBases(currentPage.value);
};

const handleSearchEnter = () => {
  console.log('搜索:', searchValue.value);
  currentPage.value = 1
  total.value = -1
  useSearch = true
  // 重新加载知识库，带上搜索关键词
  loadKnowledgeBases(currentPage.value);
};

// 处理排序变化
const handleSortChange = () => {
  // 排序变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadKnowledgeBases(1);
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
  loadKnowledgeBases(page);
};

function handleCreateKb(isPublic = true) {
  // 将知识库类型作为查询参数传递
  const routeData = router.resolve({ 
    name: 'KBCreate',
    query: { 
      type: isPublic ? 'public' : 'private'
    }
  });
  window.open(routeData.href, '_blank');
}


// 监听pageSize变化，自动重新加载数据
watch(pageSize, (newSize, oldSize) => {
  if (newSize !== oldSize && oldSize > 0) {
    currentPage.value = 1;
    loadKnowledgeBases(1);
  }
});

// 组件挂载时加载数据
onMounted(async () => {
  updateContainerSize();
  if (userId.value) {
    const [currentUserInfoData, userInfoData] = await Promise.all([
      userStore.getUserInfo(),
      fetchUserInfo(userId.value)
    ]);
    currentUserInfo.value = currentUserInfoData;
  }

  // 初始化ResizeObserver监听尺寸变化
  resizeObserver = new ResizeObserver(() => {
    updateContainerSize();
  });
  const container = document.querySelector('.content-area');
  if (container) {
    resizeObserver.observe(container);
  }
  // 监听窗口大小变化
  window.addEventListener('resize', updateContainerSize);

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
.user-knowledge {
  margin: 0 auto;
  padding: 0 20px;

  .kb-list {
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
    min-height: 600px;
    height: calc(100vh - 400px);
  }

  // 创建知识库卡片样式
  .create-kb-card {
    width: 180px;
    position: relative;
    height: 262px;

    .kb-card-container {
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      height: 100%;
      border: 1px dashed #d9d9d9;

      &:hover {
        border-color: #4080ff;
        box-shadow: 0 4px 12px 0 rgba(0, 174, 236, 0.15);
      }
    }

    .kb-cover-empty {
      width: 100%;
      height: 262px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #fafafa;
      transition: all 0.3s ease;

      &:hover {
        background-color: #f0f3f8;
      }
    }

    .create-icon {
      font-size: 48px;
      color: #86909c;
      margin-bottom: 8px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      width: 100%;
    }

    .create-text {
      font-size: 14px;
      color: #86909c;
      transition: all 0.3s ease;
      margin-top: 0;
      line-height: 1.4;
      width: 100%;
      text-align: center;
    }

    &:hover {

      .create-icon,
      .create-text {
        color: #4080ff;
      }
    }
  }

  // 加载状态容器
  .kb-loading-container {
    position: relative;
    transition: height 0.3s ease;
  }

  .kb-loading-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    height: 100%;
  }

  .kb-loading-card {
    flex-shrink: 0;
    position: relative;
    border-radius: 6px;
    overflow: hidden;
  }

  .kb-loading-card-placeholder {
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

// 响应式布局：当屏幕宽度小于1080px时，为PageHeader的extra插槽内容添加上边距
@media (max-width: 1080px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: 16px;
  }
}
</style>