<template>
  <div ref="containerRef" class="home-post-list">
    <div class="post-grid">
      <PostCard v-for="post in posts" :key="post.id || post.tempId" :width="postCardWidth" :height="postCardHeight"
        :post="post" :show-status="true" @clickCard="handlePostClick" />
    </div>

    <!-- 显示没有更多内容的提示 -->
    <div v-if="!hasMore && posts.length > 0" class="no-more-tips">

      {{ hasMoreText }}
    </div>

  </div>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import PostCard from '@/components/post/PostCard.vue'

const props = defineProps({
  initialPosts: {
    type: Array,
    default: () => []
  },
  loadData: {
    type: Function,
    required: true
  },
  hasMoreText: {
    type: String,
    default: '没有更多内容了'
  }
})

const containerRef = ref(null)
const containerWidth = ref(0)
const postCardWidth = ref(300)
const postCardHeight = ref(400)
const posts = ref([])
const hasMore = ref(true) // 添加 hasMore 标识
let resizeObserver = null

// 监听容器宽度变化
onMounted(() => {
  posts.value = [...props.initialPosts]

  if (containerRef.value) {
    // 初始化容器宽度
    containerWidth.value = containerRef.value.offsetWidth
    // 创建 ResizeObserver 监听容器尺寸变化
    resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(containerRef.value)
    // 根据初始容器宽度设置卡片尺寸
    updateCardSize()
    loadMoreData()

    // 添加滚动事件监听器
    containerRef.value.addEventListener('scroll', handleScroll);
  }
})

// 监听容器宽度变化，动态调整卡片尺寸
watch(containerWidth, () => {
  updateCardSize()
  console.log(getExpectCount())
})

// 根据容器宽度动态计算期望的列数
function getExpectCount() {
  if (containerWidth.value <= 768) {
    // 手机端：每行显示 1-2 个卡片
    return Math.max(1, Math.min(2, Math.floor(containerWidth.value / 175)));
  } else if (containerWidth.value <= 1080) {
    // 平板端：每行显示 2-3 个卡片
    return Math.max(3, Math.min(3, Math.floor(containerWidth.value / 250)));
  } else if (containerWidth.value <= 1780) {
    return Math.max(3, Math.min(2, Math.floor(containerWidth.value / 350)));
  } else {
    return Math.max(4, Math.min(3, Math.floor(containerWidth.value / 300)));
  }
}

function getMinHeightCount() {
  if (containerWidth.value <= 768) {
    return 1.6
  } else if (containerWidth.value <= 1080) {
    return 1.4
  } else if (containerWidth.value <= 1280) {
    return 1
  }
  else if (containerWidth.value <= 1580) {
    return 5 / 7
  } else {
    return 3.5 / 7
  }
}

// 根据容器宽度更新卡片尺寸
const updateCardSize = () => {
  let expectWidth = 300;
  let expectHeight = 400;
  expectWidth = containerWidth.value / getExpectCount() - 20
  expectHeight = Math.floor(getMinHeightCount() * expectWidth)
  if (containerWidth.value <= 768) {
    expectWidth = containerWidth.value / getExpectCount()-20
    expectHeight = Math.floor(getMinHeightCount() * expectWidth)
  }
  postCardWidth.value = expectWidth
  postCardHeight.value = expectHeight
}

// 计算页面大小
const getPageSize = () => {
  const expectCount = getExpectCount();
  // 计算需要补齐的数量，如果 posts.value.length 能被 expectCount 整除，则不需要补齐
  const remainder = posts.value.length % expectCount;
  const fillCount = (remainder === 0) ? 0 : expectCount - remainder;
  return expectCount * 4 + fillCount;
}

let loadingData = false
let tempIdCounter = 0

// 加载更多数据
const loadMoreData = async () => {
  if (loadingData || !hasMore.value) { // 如果正在加载或没有更多数据，则不加载
    return
  }
  loadingData = true
  const pageSize = getPageSize();
  try {
    console.log("需要更多数据")
    // 在数组末尾添加临时加载项
    const tempLoadingItems = Array.from({ length: pageSize }, () => ({
      tempId: `loading-${tempIdCounter++}`,
      loading: true
    }))
    // 将临时加载项追加到现有帖子列表
    posts.value = [...posts.value, ...tempLoadingItems]

    const newPosts = await props.loadData(pageSize);


    // 判断是否还有更多数据：如果返回的数据量小于请求的数量，说明没有更多数据了
    if (newPosts && newPosts.length < pageSize) {
      hasMore.value = false;
    }

    // 替换临时加载项为实际数据
    // 计算需要替换的起始位置
    const startIndex = posts.value.length - tempLoadingItems.length
    for (let i = 0; i < newPosts.length && i < tempLoadingItems.length; i++) {
      posts.value[startIndex + i] = newPosts[i]
    }

    // 如果新数据少于加载项数量，移除多余的加载项
    if (newPosts.length < tempLoadingItems.length) {
      posts.value = posts.value.slice(0, startIndex + newPosts.length)
    } else if (newPosts.length > tempLoadingItems.length) {
      // 如果新数据多于预期，追加到数组末尾
      posts.value = [...posts.value, ...newPosts.slice(tempLoadingItems.length)]
    }

    // 触发响应式更新
    posts.value = [...posts.value]

    // 数据加载完成后，立即检查是否还需要加载更多数据
    // 这样可以避免用户需要再次滚动到底部才能加载更多数据
    nextTick(() => {
      if (shouldLoadMore()) {
        loadMoreData();
      }
    });
  } catch (error) {
    console.error('加载数据失败:', error);
    // 加载失败时移除临时加载项
    const startIndex = posts.value.length - tempLoadingItems.length
    posts.value = posts.value.slice(0, startIndex)
  } finally {
    loadingData = false
  }
}

onBeforeUnmount(() => {
  // 清理监听器
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  // 移除滚动事件监听器
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll);
  }
})

// 检查是否需要加载更多数据
const shouldLoadMore = () => {
  if (!containerRef.value) return;

  const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
  // 检查是否滚动到底部（阈值为100px，防止需要精确滚动到最底部）
  if (scrollHeight - scrollTop - clientHeight < 400) {
    return true
  }
};

// 滚动事件处理函数
const handleScroll = () => {
  if (!containerRef.value || loadingData) return;

  const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
  // 检查是否滚动到底部（阈值为100px，防止需要精确滚动到最底部）
  if (scrollHeight - scrollTop - clientHeight < 400) {
    loadMoreData();
  }
};

const router = useRouter()

const handlePostClick = (post) => {
  // 处理帖子点击事件
  console.log('Post clicked:', post)
  // 在新窗口中打开帖子详情页
  const routeData = router.resolve({ name: 'Post', params: { id: post.id } });
  window.open(routeData.href, '_blank');
}

</script>

<style scoped lang="less">
.home-post-list {
  padding: 20px;
  width: 100%;

  overflow-x: hidden;

}

.post-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

/* 手机屏幕下 gap 为 5px */
@media (max-width: 768px) {
  .post-grid {
    gap: 5px;
  }
}

.no-more-tips {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  color: #999;
  width: 100%;
  margin-top: 20px;
}
</style>