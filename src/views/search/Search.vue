<template>
  <Header :showSearch="false"></Header>
  <!-- 顶部搜索 Header -->
  <div class="header-container"></div>

  <!-- 搜索页面主体 -->
  <div class="search-page">
    <SearchBox />
    <!-- 搜索结果区域 -->
    <div class="search-content">
      <!-- 搜索信息 -->
      <div v-if="searchQuery" class="search-info">
        <div class="search-meta">
          <a-tag color="arcoblue">{{ getModeLabel(searchMode) }}</a-tag>
          <span class="search-query">"{{ searchQuery }}"</span>
          <span v-if="totalCount !== null" class="search-count">
            找到 {{ totalCount }} 条结果
          </span>
        </div>
        <div v-if="activeFilters.length > 0" class="active-filters">
          <span class="filter-label">筛选：</span>
          <a-tag v-for="filter in activeFilters" :key="filter" color="blue">
            {{ getFilterLabel(filter) }}
          </a-tag>
        </div>
      </div>

      <!-- 搜索结果组件 -->
      <SearchResults @updateTotal="updateTotal" />
    </div>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import SearchBox from '@/components/base/SearchBox.vue';
import SearchResults from './components/SearchResults.vue';
import Header from '@/components/layout/Header.vue';

const route = useRoute();

// 搜索参数
const searchMode = ref('term');
const searchQuery = ref('');
const activeFilters = ref([]);
const totalCount = ref(null);

// 搜索模式标签映射
const searchModes = {
  term: '词项搜索',
  semantic: '语义搜索',
  precise: '精准搜索'
};

// 过滤器标签映射
const filterLabels = {
  user: '用户',
  post: '文章',
  kb: '知识库',
  title:'标题',
  content:"内容",
  tag:"标签",
};

const getModeLabel = (mode) => searchModes[mode] || '词项搜索';
const getFilterLabel = (filter) => filterLabels[filter] || filter;

// 从路由参数中解析搜索条件
const parseRouteParams = () => {
  searchMode.value = route.query.mode || 'term';
  searchQuery.value = route.query.query || '';

  const filtersParam = route.query.filters || '';
  activeFilters.value = filtersParam ? filtersParam.split(',').filter(f => f) : [];

  // 设置页面标题
  if (searchQuery.value) {
    document.title = `${searchQuery.value} - cainsgl的小站`;
  } else {
    document.title = '搜索 - cainsgl的小站';
  }
};

// 更新总数
const updateTotal = (total) => {
  totalCount.value = total;
};

// 监听路由变化
watch(() => route.query, () => {
  totalCount.value = null;
  parseRouteParams();
}, { deep: true });

// 初始化
parseRouteParams();
</script>

<style scoped lang="less">
.search-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: fade(@color-bg-white, 95%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid @color-border-1;
  box-shadow: @shadow2-center;
}

.search-header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
}

.search-page {
  padding-top: 10dvh;
  min-height: calc(100vh - 80px);
  background: linear-gradient(to bottom, @color-fill-1 0%, @color-bg-white 300px);
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

.search-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  box-sizing: border-box;
  width: 100%;
}

.search-info {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: @color-bg-white;
  border-radius: 12px;
  box-shadow: @shadow2-center;
}

.search-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}



.search-query {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-neutral-10);
}

.search-count {
  color: var(--color-neutral-4);
  font-size: 14px;
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  color: var(--color-neutral-4);
  font-size: 14px;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .search-content {
    padding: 16px 12px;
  }

  .search-info {
    padding: 12px 16px;
  }

  .search-query {
    font-size: 16px;
  }
}
</style>
