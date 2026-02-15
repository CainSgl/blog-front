<template>
  <div class="post-list-container">
    <div class="post-grid" ref="gridRef">
      <template v-for="item in displayItems" :key="item.id || item.tempId">
        <!-- 加载中的骨架屏 -->
        <!-- <div v-if="item.loading" class="post-grid-item loading-item">
          <a-skeleton animation>
            <a-skeleton-shape class="skeleton-image" />
            <a-space direction="vertical" :size="8" style="width: 100%; padding: 12px;">
              <a-skeleton-line :rows="2" />
              <a-skeleton-line :rows="1" :widths="['60%']" />
            </a-space>
          </a-skeleton>
        </div> -->

        <!-- 实际文章卡片 -->
        <a-link  :href="item.id?`/p/${item.id}`:undefined" class="post-grid-item" :hoverable="false" target="_blank">
          <PostCardWrapper
              :post="item"
              :height="'100%'"
              :onlyFans="true"
          />
        </a-link>
      </template>
    </div>

    <!-- 底部加载触发器 -->
    <div ref="loadMoreTrigger" class="load-more-trigger"></div>

    <div v-if="!hasMore && posts.length > 0" class="no-more-text">
      没有更多内容了
    </div>

  </div>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, nextTick} from 'vue';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import api from '@/api/index.js';

const posts = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const loadingItems = ref([]);
const loadMoreTrigger = ref(null);
const gridRef = ref(null);

// 游标分页参数
let lastUpdatedAt = null;
let lastLikeRatio = null;
let lastId = null;
const pageSize = 12;
let tempIdCounter = 0;
let observer = null;

// 合并实际文章和加载占位符
const displayItems = computed(() =>
{
  return [...posts.value, ...loadingItems.value];
});

// 构建请求参数
const buildRequestParams = (size) =>
{
  const params = {
    pageSize: size,
    sortBy: 'hot'
  };

  if (lastUpdatedAt !== null)
  {
    params.lastUpdatedAt = lastUpdatedAt;
  }
  if (lastLikeRatio !== null)
  {
    params.lastLikeRatio = lastLikeRatio;
  }
  if (lastId !== null)
  {
    params.lastId = lastId;
  }

  return params;
};

// 加载文章列表
const loadPosts = async () =>
{
  if (loading.value || !hasMore.value) return;

  loading.value = true;

  // 添加临时加载占位符
  const tempLoadingItems = Array.from({ length: pageSize }, () => ({
    tempId: `loading-${tempIdCounter++}`,
    loading: true
  }));
  loadingItems.value = tempLoadingItems;

  try
  {
    const { data } = await api.post('/post/cursor', buildRequestParams(pageSize));

    if (data && data.length > 0)
    {
      posts.value.push(...data);

      const lastItem = data[data.length - 1];
      lastUpdatedAt = lastItem.updatedAt;
      lastLikeRatio = lastItem.likeRatio;
      lastId = lastItem.id;
    }

    if (data && data.length < pageSize)
    {
      hasMore.value = false;
    }
  }
  catch (error)
  {
    console.error('加载文章失败:', error);
  }
  finally
  {
    // 清除加载占位符
    loadingItems.value = [];
    loading.value = false;
    
    // 加载完成后检查是否需要继续加载以填满屏幕
    await nextTick();
    checkAndLoadMore();
    
    // 加载完成后，手动检查触发器是否在视口内
    checkTriggerVisibility();
  }
};

// 检查是否需要继续加载以填满屏幕
const checkAndLoadMore = () => {
  if (!hasMore.value || loading.value || !loadMoreTrigger.value) return;
  
  // 检查触发器是否在视口内或接近视口
  const triggerRect = loadMoreTrigger.value.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // 如果触发器在视口内或距离视口底部小于200px，继续加载
  if (triggerRect.top < windowHeight + 200) {
    loadPosts();
  }
};

// 手动检查触发器可见性（用于 loading 完成后）
const checkTriggerVisibility = () => {
  if (!hasMore.value || loading.value || !loadMoreTrigger.value) return;
  
  const triggerRect = loadMoreTrigger.value.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // 检查触发器是否在视口内（包含 rootMargin）
  if (triggerRect.top < windowHeight + 500) {
    console.log('Trigger is visible after loading, loading more...');
    loadPosts();
  }
};



// 设置 IntersectionObserver
const setupObserver = () => {
  if (!loadMoreTrigger.value) return;

  // 如果已经有 observer，先断开
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      console.log('IntersectionObserver triggered:', {
        isIntersecting: entry.isIntersecting,
        loading: loading.value,
        hasMore: hasMore.value,
        boundingClientRect: entry.boundingClientRect
      });
      // 当触发器进入视口时加载更多
      if (entry.isIntersecting && !loading.value && hasMore.value) {
        console.log('Loading more posts...');
        loadPosts();
      }
    },
    {
      // 提前触发：当触发器距离视口还有 500px 时就开始加载
      rootMargin: '500px',
      threshold: 0
    }
  );

  observer.observe(loadMoreTrigger.value);
  console.log('Observer setup complete');
};

onMounted(async () =>
{
  console.log('Component mounted');
  await loadPosts();
  await nextTick();
  setupObserver();
});

onUnmounted(() =>
{
  console.log('Component unmounting');
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style lang="less" scoped>


.post-list-container {
  width: 100%;
  padding: 24px 0;
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

.loading-item {
  background-color: var(--color-bg-1);
  border-radius: @border-radius-medium;
  overflow: hidden;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-neutral-10) 8%, transparent 92%);

  .skeleton-image {
    width: 100%;
    height: 180px;
    border-radius: 0;
  }

  :deep(.arco-skeleton) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.load-more-trigger {
  height: 1px;
  width: 100%;
  margin-top: 20px;
}

.no-more-text {
  text-align: center;
  padding: 40px 0;
  color: var(--color-neutral-4);
  font-size: @font-size-body-3;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

// 响应式设计
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
  .post-list-container {
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
