<template>

  <a-modal v-model:visible="visible" title="选择置顶文章" :footer="null" @cancel="handleCancel" width="auto">
    <div class="top-post-selector">
      <div class="search-section">
        <a-auto-complete v-model="searchValue" :data="searchOptions" placeholder="搜索文章..." :style="{ width: '100%' }"
          @search="handleSearch" @select="handleSearchSelect" @press-enter="handleSearchEnter" allow-clear>
          <template #prefix>
            <IconSearch />
          </template>
        </a-auto-complete>
      </div>

      <div class="sort-section">
        <a-button-group size="small" style="margin-bottom: 16px;">
          <a-button :type="sortBy === 'published_at' ? 'primary' : 'outline'"
            @click="handleSortButtonClick('published_at')" size="small">
            最新发布
          </a-button>
          <a-button :type="sortBy === 'view_count' ? 'primary' : 'outline'" @click="handleSortButtonClick('view_count')"
            size="small">
            最多观看
          </a-button>
          <a-button :type="sortBy === 'like_count' ? 'primary' : 'outline'" @click="handleSortButtonClick('like_count')"
            size="small">
            最多点赞
          </a-button>
        </a-button-group>
      </div>

      <a-spin :loading="loading" tip="正在加载文章...">
        <div class="posts-container">
          <div v-for="post in posts" :key="post.id" class="post-item"
            :class="{ 'selected': selectedPostId === post.id }">
            <a-popconfirm 
              content="确定要将此文章设为置顶吗？" 
              @ok="setTopPost(post)"
              @cancel="handlePopconfirmCancel"
              ok-text="确定"
              cancel-text="取消"
            >
              <PostCard :post="post" :show-status="false" style="height: 100%;width: 100%;" @clickCard="selectPost(post)" />
            </a-popconfirm>
          </div>
          <a-empty v-if="posts.length === 0 && !loading" style="margin: 40px 0;" description="未找到文章" />
        </div>
      </a-spin>

      <div class="pagination-wrapper" v-if="total > 4">
        <a-pagination :total="total" :current="currentPage" :page-size="4" show-total show-jumper
          @change="handlePageChange" />
      </div>
    </div>
  </a-modal>

</template>

<script setup>
import {ref} from 'vue';
import {IconSearch} from '@arco-design/web-vue/es/icon';
import {Message} from '@arco-design/web-vue';
import api from '@/api/index.js';
import {debounce} from 'lodash-es';
import PostCard from '../../../../components/post/PostCardWrapper.vue';

// 接收父组件传入的用户ID
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

// 定义事件
const emit = defineEmits(['top-post-selected', 'cancel']);

// 响应式数据
const visible = ref(false);
const posts = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);


// 搜索相关数据
const searchValue = ref('');
const searchOptions = ref([]);

// 排序相关数据
const sortBy = ref('published_at');

// 选中的文章
const selectedPostId = ref(null);

// 显示弹窗
const showModal = () => 
{
  visible.value = true;
  searchValue.value = null;
  currentPage.value = 1;
  loadPosts(1); // 显示弹窗时加载第一页数据
};
let useSearch = false;
// 隐藏弹窗
const hideModal = () => 
{
  visible.value = false;
  useSearch = false;
};



// 构建请求参数的通用方法
const buildRequestParams = (page = 1) => 
{
  const params = {
    page: page,
    size: 4,
    userId: props.userId,
    simple: total.value > 0,
    option: sortBy.value,
    status: '已发布'
  };
  if (useSearch && searchValue.value && searchValue.value.trim()) 
  {
    params.keyword = searchValue.value.trim();
  }

  return params;
};

// 加载文章列表
const loadPosts = async (page) => 
{
  loading.value = true;

  try 
  {
    const params = buildRequestParams(page);
    const { data } = await api.post('/post/list', params);
    posts.value = data.records;
    if (total.value <= 0 || searchValue.value) 
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

// 搜索相关事件处理 - 使用防抖优化性能
const handleSearch = debounce(async (value) => 
{
  if (value.trim()) 
  {
    try 
    {
      // 使用构建参数的通用方法
      const params = buildRequestParams(1, true);
      const { data } = await api.post('/post/list', params);
      // 将搜索结果转换为下拉选项格式
      if (data && data.records) 
      {
        searchOptions.value = data.records.map(post => post.title || `文章 ${post.id}`);
      }
      else 
      {
        searchOptions.value = [];
      }
    }
    catch (error) 
    {
      console.error('搜索文章失败:', error);
      searchOptions.value = [];
    }
  }
  else 
  {
    searchOptions.value = [];
  }
}, 300);

const resetAndReload = (totalnum = 0) => 
{
  currentPage.value = 1;
  total.value = totalnum;
  loadPosts(1);
};

const handleSearchSelect = (value) => 
{
  console.log('选中搜索项:', value);
  // 替换搜索框的文字为选中的标题
  searchValue.value = value;
  resetAndReload();
};

const handleSearchEnter = () => 
{
  if (searchValue.value && searchValue.value.trim()) 
  {
    useSearch = true;
  }
  else
  {
    useSearch = false;
  }
  resetAndReload();
};

// 处理排序按钮点击
const handleSortButtonClick = (value) => 
{
  if (sortBy.value !== value) 
  {
    sortBy.value = value;
    resetAndReload(total.value);
  }
};

// 处理分页变化
const handlePageChange = (page) => 
{
  loadPosts(page);
};

// 选择文章
const selectPost = (post) => 
{
  selectedPostId.value = post.id;
};

// 设置为置顶文章
const setTopPost = async (post) => 
{
  Message.loading({id:'topPostLoading'+post.id,content:'设置为置顶中'});
  try 
  {
    await api.put('/post', {
      id: post.id,
      isTop:true
    });
    Message.success({id:'topPostLoading'+post.id,content:'设置成功！'});
    emit('top-post-selected', post);
    // 关闭弹窗
    visible.value = false;
    // 重置选中状态
    selectedPostId.value = null;
  }
  catch (error) 
  {
    console.error('设置置顶文章失败:', error);
    // 显示错误消息
    Message.error({id:'topPostLoading'+post.id,content:'设置置顶文章失败'});
  }
};

// Popconfirm 取消操作
const handlePopconfirmCancel = () => 
{
  selectedPostId.value=null;
};

// 处理取消
const handleCancel = () => 
{
  emit('cancel');
  selectedPostId.value = null;
};

// 暴露方法给父组件
defineExpose({
  showModal,
  hideModal
});
</script>

<style scoped lang="less">
.top-post-selector {
  .search-section {
    margin-bottom: 16px;
  }

  .sort-section {
    margin-bottom: 16px;
  }

  .posts-container {
    width: calc(60vw+4);
    max-width: 724px;
    min-width: 524px;
    height: 700px;
    overflow-y: auto;
  }

  .post-item {
    width: calc(60vw - 20px);
    max-width: 700px;
    min-width: 500px;
    padding: 12px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}
</style>