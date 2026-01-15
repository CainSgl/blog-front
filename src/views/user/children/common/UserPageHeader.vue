<template>
  <a-page-header :title="title"
    :subtitle="userInfo ? `用户 ${userInfo ? userInfo.nickname || userInfo.username : userId} 的${subtitle}` : ''"
    @back="handleBack">
    <template #extra>
      <a-space>
        <a-button-group size="medium" style="margin-right: 16px;">
          <a-button v-for="sortOption in sortOptions" :key="sortOption.value"
            :type="sortBy === sortOption.value ? 'primary' : 'outline'" @click="handleSortButtonClick(sortOption.value)"
            size="medium">
            {{ sortOption.label }}
          </a-button>
        </a-button-group>
        <a-auto-complete v-model="searchValue" :data="displaySearchOptions" :placeholder="searchPlaceholder"
          :style="{ width: searchWidth }" :filter-option="false" @search="handleSearchWrapper"
          @select="handleSearchSelect" @press-enter="handleSearchEnter" allow-clear>
          <template #prefix>
            <IconSearch />
          </template>
          <template #footer>
            <div v-if="isLoading" class="search-footer-loading">
              <div class="loading-container">
                <a-spin :size="14" />
                <span class="loading-text">搜索中...</span>
              </div>
            </div>
            <div v-else-if="isEmptyResult && !isLoading" class="search-footer-empty">
              <div class="empty-container">
                <span class="empty-text">没有找到匹配的结果</span>
              </div>
            </div>
          </template>
        </a-auto-complete>
      </a-space>
    </template>
  </a-page-header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { IconSearch } from '@arco-design/web-vue/es/icon';
import { debounce } from 'lodash-es';
import api from '@/api/index.js';

// 接收 props
const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: '搜索...'
  },
  searchWidth: {
    type: String,
    default: '400px'
  },
  sortOptions: {
    type: Array,
    default: () => []
  },
  apiUrl: {
    type: String,
    required: true
  }
});

// 定义事件
const emit = defineEmits(['sort-change', 'search', 'back']);

// 用户信息
const userInfo = ref(null);

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

// 搜索相关数据
const searchValue = ref('');
const searchOptions = ref([]);
const isLoading = ref(false);
const isEmptyResult = ref(false);
const sortBy = ref(props.sortOptions[0]?.value || ''); // 默认选择第一个排序选项

// 计算属性：只显示非特殊状态的搜索选项
const displaySearchOptions = computed(() => 
{
  return searchOptions.value.filter(option => option !== 'loading' && option !== 'empty');
});

// 初始化用户信息
fetchUserInfo(props.userId);

// 搜索相关事件处理 - 使用防抖优化性能
function handleSearchWrapper(value) 
{
  isLoading.value = true;
  isEmptyResult.value = false;
  searchOptions.value = [''];
  handleSearch(value);
}

const handleSearch = debounce(async (value) => 
{
  console.log('搜索值:', value);
  if (value.trim()) 
  {
    try 
    {
      const params = {
        page: 1,
        size: 5,  // 固定大小为5
        simple: true,
        userId: props.userId,
        sortBy: sortBy.value, // 添加排序字段
        keyword: value  // 添加搜索关键词
      };
      const { data } = await api.post(props.apiUrl, params);
      if (data.records.length > 0) 
      {
        searchOptions.value = data.records.map(item => item.title || item.name || item.id);
        isEmptyResult.value = false;
      }
      else 
      {
        searchOptions.value = [''];
        isEmptyResult.value = true;
      }

    }
    catch (error) 
    {
      console.error('搜索失败:', error);
      searchOptions.value = [];
      isEmptyResult.value = false;
    }
  }
  else 
  {
    searchOptions.value = [];
    isEmptyResult.value = false;
  }
  isLoading.value = false;
  if (!value) 
  {
    emit('search', value);
  }

}, 300);

const handleSearchSelect = (value) => 
{
  // 替换搜索框的文字为选中的标题
  searchValue.value = value;
  emit('search', value);
};

const handleSearchEnter = () => 
{
  console.log('搜索:', searchValue.value);
  emit('search', searchValue.value);
};

// 处理排序变化
const handleSortChange = (value) => 
{
  sortBy.value = value;
  emit('sort-change', value);
};

// 处理排序按钮点击
const handleSortButtonClick = (value) => 
{
  if (sortBy.value !== value) 
  {
    sortBy.value = value;
    handleSortChange(value);
  }
};



// 处理返回
const handleBack = () => 
{
  emit('back');
};
</script>

<style lang="less" scoped>
.custom-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;

  .option-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .option-loading-icon {
    margin-left: 8px;
    font-size: 12px;
    color: #c0c4cc;
  }
}

// 搜索框底部加载和空结果样式
.search-footer-loading,
.search-footer-empty {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 0;
  min-height: 40px;
}

.loading-text,
.empty-text {
  margin-left: 8px;
  font-size: 13px;
  color: #666;
}

// 搜索框样式优化
:deep(.arco-auto-complete) {
  .arco-input {
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 0 0 1px var(--color-primary-light-3);
    }
    
    &:focus {
      box-shadow: 0 0 0 2px var(--color-primary-light-3);
    }
  }
  
  .arco-auto-complete-dropdown {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
</style>