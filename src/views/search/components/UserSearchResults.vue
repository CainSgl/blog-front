<template>
  <div v-if="shouldShowUsers" class="user-search-container">
    <!-- 用户搜索结果标题 -->
    <div class="user-results-header">
      <span class="header-title">用户</span>
      <span v-if="totalUsers !== null" class="user-count">{{ totalUsers }} 位用户</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && users.length === 0" class="loading-container">
      <a-spin size="small" />
    </div>

    <!-- 用户卡片横向滚动区域 -->
    <div v-else-if="users.length > 0" class="user-scroll-wrapper">
      <div class="user-grid">
        <a-link 
          v-for="user in users" 
          :key="user.id" 
          :href="`/space/${user.id}`" 
          :hoverable="false" 
          target="_blank"
          class="user-card-link"
        >
          <div class="user-card">
            <div class="user-header">
              <Avatar :size="60" class="user-avatar" :src="user.avatarUrl" />
              <div class="user-basic-info">
                <div class="user-name-row">
                  <span class="user-nickname" v-html="user.nickname"></span>
                  <icon-man v-if="user.gender === '男'" class="gender-icon male" />
                  <icon-woman v-if="user.gender === '女'" class="gender-icon female" />
                  <a-tag color="arcoblue" size="small" class="level-tag">LV.{{ user.level }}</a-tag>
                </div>
                <div class="user-username">@{{ user.username }}</div>
              </div>
            </div>

            <div v-if="user.bio" class="bio-section">
              <span class="bio-text">{{ user.bio }}</span>
            </div>

            <div class="user-stats">
              <span class="stat-item">
                <strong>{{ user.followerCount || 0 }}</strong> 粉丝
              </span>
              <span class="stat-divider">·</span>
              <span class="stat-item">
                <strong>{{ user.followingCount || 0 }}</strong> 关注
              </span>
              <span class="stat-divider">·</span>
              <span class="stat-item">
                <strong>{{ user.likeCount || 0 }}</strong> 获赞
              </span>
            </div>
          </div>
        </a-link>
      </div>

      <!-- 分页按钮 -->
      <div v-if="hasMore || currentPage > 0" class="pagination-controls">
        <a-button 
          :disabled="currentPage === 0 || loading"
          type="outline"
          @click="goToPreviousPage"
        >
          <template #icon>
            <icon-left />
          </template>
          上一页
        </a-button>
        
        <span class="page-indicator">第 {{ currentPage + 1 }} 页</span>
        
        <a-button 
          :disabled="!hasMore || loading"
          type="outline"
          @click="goToNextPage"
        >
          下一页
          <template #icon>
            <icon-right />
          </template>
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { IconLeft, IconRight, IconMan, IconWoman } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import api from '@/api/index.js';
import Avatar from '@/components/base/avatar/Avatar.vue';

const route = useRoute();

// 搜索参数
const searchQuery = ref('');
const searchMode = ref('term');

// 用户搜索结果
const users = ref([]);
const totalUsers = ref(null);
const hasMore = ref(false);
const loading = ref(false);

// 分页相关
const currentPage = ref(0);
const pageCache = ref(new Map()); // 缓存页面数据: { pageIndex: { users, searchAfter, hasMore } }

// 判断是否应该显示用户搜索结果
const shouldShowUsers = computed(() => {
  if (!searchQuery.value.trim()) return false;
  if (searchMode.value !== 'term') return false;
  
  const filtersParam = route.query.filters || '';
  const filters = filtersParam ? filtersParam.split(',').filter(f => f) : [];
  
  // 如果没有指定 filters 或者包含 user，则显示用户搜索
  return filters.length === 0 || filters.includes('user');
});

// 从路由参数中解析搜索条件
const parseRouteParams = () => {
  searchQuery.value = route.query.query || '';
  searchMode.value = route.query.mode || 'term';
};

// 执行用户搜索
const searchUsers = async (searchAfter = null) => {
  if (!searchQuery.value.trim() || !shouldShowUsers.value) return;
  
  loading.value = true;
  
  try {
    const { data } = await api.get('/user/search', {
      keyword: searchQuery.value,
      size: 9, // 每页9个用户（3列 x 3行）
      searchAfter
    });

    if (data) {
      users.value = data.data || [];
      hasMore.value = data.hasMore || false;
      
      // 第一次搜索时更新总数
      if (currentPage.value === 0 && searchAfter === null) {
        totalUsers.value = data.total;
      }
      
      // 缓存当前页数据
      pageCache.value.set(currentPage.value, {
        users: [...users.value],
        searchAfter: data.searchAfter,
        hasMore: data.hasMore
      });
    }
  } catch (error) {
    console.error('用户搜索失败:', error);
    Message.error('用户搜索失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 下一页
const goToNextPage = async () => {
  if (!hasMore.value || loading.value) return;
  
  const nextPageIndex = currentPage.value + 1;
  
  // 检查缓存
  if (pageCache.value.has(nextPageIndex)) {
    const cached = pageCache.value.get(nextPageIndex);
    users.value = cached.users;
    hasMore.value = cached.hasMore;
    currentPage.value = nextPageIndex;
  } else {
    // 获取当前页的 searchAfter
    const currentPageData = pageCache.value.get(currentPage.value);
    if (currentPageData && currentPageData.searchAfter) {
      currentPage.value = nextPageIndex;
      await searchUsers(currentPageData.searchAfter);
    }
  }
};

// 上一页
const goToPreviousPage = () => {
  if (currentPage.value === 0 || loading.value) return;
  
  const prevPageIndex = currentPage.value - 1;
  
  // 从缓存中获取上一页数据
  if (pageCache.value.has(prevPageIndex)) {
    const cached = pageCache.value.get(prevPageIndex);
    users.value = cached.users;
    hasMore.value = cached.hasMore;
    currentPage.value = prevPageIndex;
  }
};

// 重置搜索状态
const resetSearch = () => {
  users.value = [];
  totalUsers.value = null;
  hasMore.value = false;
  currentPage.value = 0;
  pageCache.value.clear();
};

// 监听路由变化
watch(() => route.query, () => {
  resetSearch();
  parseRouteParams();
  
  if (shouldShowUsers.value) {
    searchUsers();
  }
}, { deep: true });

// 初始化
parseRouteParams();
if (shouldShowUsers.value && searchQuery.value) {
  searchUsers();
}
</script>

<style scoped lang="less">
.user-search-container {
  margin-bottom: 32px;
  background: var(--color-bg-2);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-results-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-2);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-neutral-10);
}

.user-count {
  font-size: 14px;
  color: var(--color-neutral-4);
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.user-scroll-wrapper {
  width: 100%;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding-bottom: 40px;
}

.user-card-link {
  display: block;
  text-decoration: none;
}

.user-card {
  background: var(--color-bg-1);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--color-border-2);
  padding: 16px;
  transition: all 0.3s ease;
  height: 100%;
  user-select: none;
  
  &:hover {
    border-color: rgb(var(--primary-6));
  }
}

.user-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-avatar {
  flex-shrink: 0;
  cursor: pointer;
}

.user-basic-info {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  gap: 4px;
}

.user-nickname {
  font-size: var(--font-size-body-2);
  font-weight: 700;
  color: var(--color-neutral-10);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  :deep(em) {
    color: rgb(var(--primary-6));
    font-style: normal;
    font-weight: 700;
  }
}

.gender-icon {
  font-size: 16px;
  flex-shrink: 0;
  
  &.male {
    color: #55acee;
  }
  
  &.female {
    color: #e85695;
  }
}

.level-tag {
  flex-shrink: 0;
}

.user-username {
  font-size: var(--font-size-body-1);
  color: var(--color-neutral-8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bio-section {
  margin-bottom: 12px;
}

.bio-text {
  color: var(--color-neutral-8);
  font-size: var(--font-size-body-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.user-stats {
  display: flex;
  align-items: center;
  font-size: var(--font-size-body-1);
  color: var(--color-neutral-6);
  padding-top: 12px;
  border-top: 1px solid var(--color-fill-3);
}

.stat-item {
  strong {
    font-size: var(--font-size-body-2);
    color: var(--color-neutral-8);
    font-weight: 600;
  }
}

.stat-divider {
  margin: 0 8px;
  color: var(--color-neutral-4);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-2);
}

.page-indicator {
  font-size: 14px;
  color: var(--color-neutral-6);
  min-width: 80px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .user-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .user-search-container {
    padding: 16px;
  }
  
  .user-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .header-title {
    font-size: 16px;
  }
}
</style>
