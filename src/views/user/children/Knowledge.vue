<template>
  <div class="user-knowledge">
    <UserPageHeader :userId="userId" title="知识库" subtitle="知识库" searchPlaceholder="搜索知识库..." searchWidth="300px"
      :sortOptions="sortOptions" apiUrl="/kb/list" @sort-change="handleSortChangeFromHeader"
      @search="handleSearchFromHeader" @back="handleBack" />

    <!-- 为当前用户添加状态选择ContentArea -->
    <div v-if="isCurrentUser" class="status-filter-area">
      <div class="status-filter-container">

        <a-radio-group v-model="kbStatus" type="button" @change="handleStatusChange">
          <a-radio value="">全部</a-radio>
          <a-radio value="草稿">草稿</a-radio>
          <a-radio value="已发布">已公开</a-radio>
          <a-radio value="待审核">审核中</a-radio>
          <a-radio value="已下架">已下架</a-radio>
        </a-radio-group>
      </div>
    </div>

    <ContentArea :loading="loading" :list-data="knowledgeBases" loading-tip="正在加载知识库..." :card-width="cardWidth"
      :card-height="cardHeight" :height-offset="600" @page-size-change="handlePageSizeChange" emptyHeight="50vh"
      emptyWidth="80vw">
      <template
        #default="{ pageSize: currentPageSize, containerWidth: currentContainerWidth, containerHeight: currentContainerHeight }">
        <div class="kb-list">
          <KbCard v-for="kb in knowledgeBases" :key="kb.id" :kb-info="loading?{}:kb" :show-status="kbStatus!=''" />
          <div v-if="isCurrentUser" class="create-kb-card">
            <a-popconfirm content="创建公开知识库还是私密知识库？（后续可修改）" okText="公开" cancelText="私密" @ok="handleCreateKb(true)"
              @cancel="handleCreateKb(false)">
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
      </template>
      <template #empty>
        <a-empty style="padding: 40px 0;" description="暂无知识库" />
      </template>
    </ContentArea>
    <div class="pagination-wrapper">
      <a-pagination size="large" :total="total" :current="currentPage" :page-size="pageSize" show-total show-jumper
        @change="handlePageChange" />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IconPlus } from '@arco-design/web-vue/es/icon';
import KbCard from '@/components/kb/KbCard.vue';
import api from '@/api/index.js';
import { useUserStore } from '@/store/user.js';
import UserPageHeader from './common/UserPageHeader.vue';
import ContentArea from './common/ContentArea.vue';

// 定义排序选项
const sortOptions = [
  { label: '最新发布', value: 'created_at' },
  { label: '最多点赞', value: 'like_count' }
];

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


// 排序相关数据
const sortBy = ref('created_at'); // 默认按最新发布排序
// pageSize 现在由 ContentArea 组件管理，这里只需要保留一个响应式的引用
const pageSize = ref(10); // 默认值

// 卡片尺寸常量
const cardWidth = 180;
const cardHeight = 200;
// 知识库状态筛选
const kbStatus = ref(''); // 默认为全部

const searchValue = ref('');
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

    // 添加状态筛选参数
    if (kbStatus.value) {
      params.status = kbStatus.value;
    }

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

// 从公共组件传递的事件处理
const handleSortChangeFromHeader = (value) => {
  sortBy.value = value;
  // 排序变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadKnowledgeBases(1);
};

const handleSearchFromHeader = (value) => {
  currentPage.value = 1
  total.value = -1
  if (value && value.trim()) {
    useSearch = true
    loadKnowledgeBases(currentPage.value);
  } else {
    if (useSearch) {
      console.log("之前搜索过，现在是复原")
      useSearch = false
      loadKnowledgeBases(currentPage.value);
    }
  }
  searchValue.value = value

};

// 处理状态选择变化
const handleStatusChange = (value) => {
  kbStatus.value = value;
  console.log(value)
  // 状态变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadKnowledgeBases(1);
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




// 组件挂载时加载数据
onMounted(async () => {
  if (userId.value) {
    const [currentUserInfoData, userInfoData] = await Promise.all([
      userStore.getUserInfo(),
      fetchUserInfo(userId.value)
    ]);
    currentUserInfo.value = currentUserInfoData;
  }
});

// 处理pageSize变化事件
const handlePageSizeChange = (newPageSize) => {
  // 更新本地的 pageSize 值
  pageSize.value = newPageSize;

  // pageSize变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadKnowledgeBases(1);
};
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
    min-height: 350px;
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

    }
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


}

// 响应式布局：当屏幕宽度小于1080px时，为PageHeader的extra插槽内容添加上边距
@media (max-width: 1080px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: 16px;
  }
}
</style>