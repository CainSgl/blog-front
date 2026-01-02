<template>
  <a-page-header :title="title"
    :subtitle="userInfo ? `用户 ${userInfo ? userInfo.nickname || userInfo.username : userId} 的${subtitle}` : ''"
    @back="handleBack">
    <template #extra>
      <a-space>
        <a-button-group size="medium" style="margin-right: 16px;">
          <a-button v-for="sortOption in sortOptions" 
            :key="sortOption.value"
            :type="sortBy === sortOption.value ? 'primary' : 'outline'"
            @click="handleSortButtonClick(sortOption.value)" 
            size="medium">
            {{ sortOption.label }}
          </a-button>
        </a-button-group>
        <a-auto-complete v-model="searchValue" :data="searchOptions" :placeholder="searchPlaceholder" 
          :style="{ width: searchWidth }" @search="handleSearch" @select="handleSearchSelect"
          @press-enter="handleSearchEnter" allow-clear>
          <template #prefix>
            <IconSearch />
          </template>
        </a-auto-complete>
      </a-space>
    </template>
  </a-page-header>
</template>

<script setup>
import { ref } from 'vue';
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
const sortBy = ref(props.sortOptions[0]?.value || ''); // 默认选择第一个排序选项

// 初始化用户信息
fetchUserInfo(props.userId);

// 搜索相关事件处理 - 使用防抖优化性能
const handleSearch = debounce(async (value) => {
  console.log("搜索值:", value);
  if (value.trim()) {
    try {
      // 调用API获取搜索建议
      const params = {
        page: 1,
        size: 5,  // 固定大小为5
        simple: true,
        userId: props.userId,
        sortBy: sortBy.value, // 添加排序字段
        keyword: value  // 添加搜索关键词
      };
      const { data } = await api.post(props.apiUrl, params);

      // 将搜索结果转换为下拉选项格式
      if (data && data.records) {
        searchOptions.value = data.records.map(item => item.title || item.name || item.id);
      } else {
        searchOptions.value = [];
      }
    } catch (error) {
      console.error('搜索失败:', error);
      searchOptions.value = [];
    }
  } else {
    searchOptions.value = [];
  }
  
  emit('search', value);
}, 300);

const handleSearchSelect = (value) => {
  console.log('选中搜索项:', value);
  // 替换搜索框的文字为选中的标题
  searchValue.value = value;
  emit('search', value);
};

const handleSearchEnter = () => {
  console.log('搜索:', searchValue.value);
  emit('search', searchValue.value);
};

// 处理排序变化
const handleSortChange = (value) => {
  sortBy.value = value;
  emit('sort-change', value);
};

// 处理排序按钮点击
const handleSortButtonClick = (value) => {
  if (sortBy.value !== value) {
    sortBy.value = value;
    handleSortChange(value);
  }
};

// 处理返回
const handleBack = () => {
  emit('back');
};
</script>

<style lang="less" scoped>
</style>