<template>
  <div class="paginated-container">
    <a-spin :loading="loading" style="width: 100%;">
      <div class="post-grid">
        <a-link 
          :href="`/p/${post.id}`" 
          target="_blank" 
          v-for="post in posts" 
          :key="post.id"
          :hoverable="false"
          class="post-grid-item"
        >
          <PostCardWrapper
            :post="post"
            :height="'100%'"
            :onlyFans="true"
          />
        </a-link>
      </div>
    </a-spin>

    <div v-if="!loading && posts.length === 0" class="empty-state">
      <a-empty description="暂无文章" />
    </div>

    <div v-if="totalCount > 0" class="pagination-wrapper">
      <a-pagination
        :current="currentPage"
        :total="totalCount"
        :page-size="pageSize"
        :show-total="showTotal"
        :show-jumper="true"
        :show-page-size="false"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';

const posts = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const loading = ref(false);

const showTotal = (total) => `共 ${total} 篇文章`;

const fetchPosts = async (page) => {
  loading.value = true;
  try {
    const { data } = await api.post('/post/overview', {
      page,
      size: pageSize.value
    });

    posts.value = data.records || [];
    currentPage.value = data.current;
    
    // 只在第一页时更新总数
    if (page === 1) {
      totalCount.value = data.total;
    }

    // 滚动到顶部
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } catch (error) {
    console.error('加载文章失败:', error);
    Message.error('加载文章失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  fetchPosts(page);
};

onMounted(() => {
  fetchPosts(1);
});
</script>

<style lang="less" scoped>
.paginated-container {
  padding: 24px 0;
  min-height: 60vh;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: @size-5;
  width: 100%;
}

.post-grid-item {
  width: 100%;
  height: 320px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-@size-1);
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin: 40px 0;
  padding: 20px 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

// 响应式设计 - 与流式加载保持一致
@media (max-width: 1280px) {
  .post-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: @size-4;
  }
}

@media (max-width: 768px) {
  .post-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: @size-3;
  }

  .post-grid-item {
    height: 280px;
  }
}

@media (max-width: 480px) {
  .paginated-container {
    padding: @size-4 0;
  }

  .post-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: @size-2;
  }

  .post-grid-item {
    height: 280px;
  }
}
</style>
