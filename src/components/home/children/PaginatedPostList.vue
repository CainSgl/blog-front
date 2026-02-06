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
        >
          <PostCard 
            :width="postCardWidth" 
            :height="postCardHeight"
            :onlyFans="true" 
            :post="post" 
            :show-status="true" 
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import PostCard from '@/components/post/PostCard.vue';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';

const posts = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const loading = ref(false);

// 卡片尺寸相关
const containerWidth = ref(0);
const postCardWidth = ref(300);
const postCardHeight = ref(400);
let resizeObserver = null;

const showTotal = (total) => `共 ${total} 篇文章`;

// 根据容器宽度动态计算期望的列数
function getExpectCount() {
  if (containerWidth.value <= 768) {
    return Math.max(1, Math.min(2, Math.floor(containerWidth.value / 175)));
  } else if (containerWidth.value <= 1080) {
    return Math.max(3, Math.min(3, Math.floor(containerWidth.value / 250)));
  } else if (containerWidth.value <= 1780) {
    return Math.max(3, Math.min(3, Math.floor(containerWidth.value / 300)));
  } else {
    return Math.max(4, Math.min(4, Math.floor(containerWidth.value / 350)));
  }
}

function getMinHeightCount() {
  if (containerWidth.value <= 768) {
    return 1.6;
  } else if (containerWidth.value <= 1080) {
    return 1.4;
  } else if (containerWidth.value <= 1280) {
    return 1;
  } else if (containerWidth.value <= 1580) {
    return 5 / 7;
  } else {
    return 3.5 / 7;
  }
}

// 根据容器宽度更新卡片尺寸
const updateCardSize = () => {
  let expectWidth = 300;
  let expectHeight = 400;
  expectWidth = containerWidth.value / getExpectCount() - 20;
  expectHeight = Math.floor(getMinHeightCount() * expectWidth);
  if (containerWidth.value <= 768) {
    expectWidth = containerWidth.value / getExpectCount() - 20;
    expectHeight = Math.floor(getMinHeightCount() * expectWidth);
  }
  postCardWidth.value = expectWidth;
  postCardHeight.value = expectHeight;
};

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
  // 获取容器宽度
  const container = document.querySelector('.paginated-container');
  if (container) {
    containerWidth.value = container.offsetWidth;
    
    // 监听容器宽度变化
    resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(container);
    
    updateCardSize();
  }
  
  fetchPosts(1);
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// 监听容器宽度变化，动态调整卡片尺寸
watch(containerWidth, () => {
  updateCardSize();
});
</script>

<style scoped>
.paginated-container {
  padding: 0;
  min-height: 60vh;
}

.post-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
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

@media (max-width: 768px) {
  .post-grid {
    gap: 5px;
  }
}
</style>
