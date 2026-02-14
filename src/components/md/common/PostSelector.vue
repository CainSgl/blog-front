<template>
  <ModalWrapper
    v-model:visible="visible"
    title="选择文章"
    width="80%"
    :footer="false"
    @cancel="handleCancel"
  >
    <div class="post-selector">
      <!-- 搜索框 -->
      <div class="search-bar">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索文章标题..."
          @search="handleSearch"
          @press-enter="handleSearch"
          style="margin-bottom: 16px;"
        />
      </div>

      <!-- 文章列表 -->
      <div v-if="loading && posts.length === 0" class="loading-container">
        <a-spin />
        <span>加载中...</span>
      </div>

      <div v-else-if="posts.length === 0 && !loading" class="empty-container">
        <a-empty description="暂无文章" />
      </div>

      <div v-else class="posts-grid">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
          @click="handleSelectPost(post)"
        >
          <PostCardWrapper
            :post="post"
            :height="'100%'"
          />
        </div>
        
        <!-- 加载中的遮罩 -->
        <div v-if="loading" class="loading-overlay">
          <a-spin size="large" />
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-wrapper">
        <a-pagination
          :total="total"
          :current="currentPage"
          :page-size="pageSize"
          show-total
          @change="handlePageChange"
        />
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import api from '@/api';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import ModalWrapper from '@/components/base/ModalWrapper.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'select']);

const visible = ref(props.modelValue);
const loading = ref(false);
const posts = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(12);
const searchKeyword = ref('');

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal;
  if (newVal) {
    // 打开时加载文章列表
    loadPosts();
  }
});

// 监听 visible 变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal);
});

// 加载文章列表
const loadPosts = async (page = 1) => {
  loading.value = true;
  try {
    const params = {
      page: page,
      size: pageSize.value,
      simple: total.value > 0,
      option: 'updated_at'
    };

    // 如果指定了用户ID，则只加载该用户的文章
    if (props.userId) {
      params.userId = props.userId;
    }

    // 如果有搜索关键词
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim();
    }

    const { data } = await api.post('/post/list', params);
    
    // 加载完成后再更新数据，避免页面闪烁
    posts.value = data.records;
    if (total.value <= 0) {
      total.value = data.total;
    }
    currentPage.value = page;
  } catch (error) {
    console.error('加载文章列表失败:', error);
    Message.error('加载文章列表失败');
    posts.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  total.value = 0;
  posts.value = []; // 搜索时清空旧数据
  loadPosts(1);
};

// 分页处理
const handlePageChange = (page) => {
  // 不清空旧数据，保持页面内容
  loadPosts(page);
};

// 选择文章
const handleSelectPost = (post) => {
  emit('select', post);
  visible.value = false;
};

// 取消
const handleCancel = () => {
  visible.value = false;
};
</script>

<style lang="less" scoped>
.post-selector {
  .search-bar {
    margin-bottom: 16px;
  }

  .loading-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 0;
    color: var(--color-text-2);
  }

  .posts-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 8px;

    .post-item {
      width: 100%;
      height: 320px;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-4px);
      }
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(var(--color-bg-1-rgb), 0.8);
      backdrop-filter: blur(2px);
      z-index: 10;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-2);
  }
}

// 响应式设计
@media (max-width: 1280px) {
  .post-selector {
    .posts-grid {
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .post-selector {
    .posts-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
      
      .post-item {
        height: 280px;
      }
    }
  }
}

@media (max-width: 480px) {
  .post-selector {
    .posts-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      
      .post-item {
        height: 280px;
      }
    }
  }
}
</style>
