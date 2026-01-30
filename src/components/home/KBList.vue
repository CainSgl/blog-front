<template>
  <div ref="containerRef" class="kb-list">
    <div class="kb-grid">
      <KbCard v-for="item in items" :key="item.id || item.tempId" :kbInfo="item" 
        :show-status="true" :onlyFans="true" @clickItem="handleItemClick" />
    </div>

    <!-- 显示没有更多内容的提示 -->
    <div v-if="!hasMore && items.length > 0" class="no-more-tips">
      {{ hasMoreText }}
    </div>

  </div>

</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import KbCard from '@/components/kb/KbCard.vue';

const props = defineProps({
  initialItems: {
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
  },
  listenWindowScroll: {
    type: Boolean,
    default: true
  },
  enableAutoLoad: {
    type: Boolean,
    default: true
  }
});

const containerRef = ref(null);
const items = ref([]);
const hasMore = ref(true);
let loadingData = false;
let tempIdCounter = 0;

// 初始化
onMounted(() => 
{
  items.value = [...props.initialItems];
  
  // 根据属性决定监听容器滚动还是窗口滚动
  if (props.listenWindowScroll) 
  {
    window.addEventListener('scroll', handleScroll);
  }
  else if (containerRef.value) 
  {
    containerRef.value.addEventListener('scroll', handleScroll);
  }
  
  // 根据 enableAutoLoad 属性决定是否初始加载数据

  loadMoreData();
  
});

onBeforeUnmount(() => 
{
  // 根据属性决定移除窗口滚动监听器还是容器滚动监听器
  if (props.listenWindowScroll) 
  {
    window.removeEventListener('scroll', handleScroll);
  }
  else if (containerRef.value) 
  {
    containerRef.value.removeEventListener('scroll', handleScroll);
  }
});



// 加载更多数据
const loadMoreData = async () => 
{
  if (loadingData || !hasMore.value||!props.enableAutoLoad) 
  {
    return;
  }
  loadingData = true;
  const pageSize = getPageSize();
  
  try 
  {
    // 在数组末尾添加临时加载项
    const tempLoadingItems = Array.from({ length: pageSize }, () => ({
      tempId: `loading-${tempIdCounter++}`,
      loading: true
    }));
    // 将临时加载项追加到现有项目列表
    items.value = [...items.value, ...tempLoadingItems];

    const newItems = await props.loadData(pageSize);

    // 判断是否还有更多数据
    if (newItems && newItems.length < pageSize) 
    {
      hasMore.value = false;
    }

    // 替换临时加载项为实际数据
    const startIndex = items.value.length - tempLoadingItems.length;
    for (let i = 0; i < newItems.length && i < tempLoadingItems.length; i++) 
    {
      items.value[startIndex + i] = newItems[i];
    }

    // 如果新数据少于加载项数量，移除多余的加载项
    if (newItems.length < tempLoadingItems.length) 
    {
      items.value = items.value.slice(0, startIndex + newItems.length);
    }
    else if (newItems.length > tempLoadingItems.length) 
    {
      // 如果新数据多于预期，追加到数组末尾
      items.value = [...items.value, ...newItems.slice(tempLoadingItems.length)];
    }

    // 触发响应式更新
    items.value = [...items.value];

    // 数据加载完成后，立即检查是否还需要加载更多数据
    nextTick(() => 
    {
      if (shouldLoadMore()) 
      {
        loadMoreData();
      }
    });
  }
  catch (error) 
  {
    console.error('加载数据失败:', error);
    // 加载失败时移除临时加载项
    const startIndex = items.value.length - tempLoadingItems.length;
    items.value = items.value.slice(0, startIndex);
  }
  finally 
  {
    loadingData = false;
  }
};

const getPageSize = () => 
{
  if (!containerRef.value) 
  {
    // 如果容器还未渲染，返回默认值
    return 4;
  }

  // 获取容器宽度
  const containerWidth = containerRef.value.clientWidth || window.innerWidth;
  
  // 每个卡片的固定宽度为180px，加上20px的间隙
  const cardWidth = 180;
  const gap = 20;
  
  // 计算每行可以容纳的卡片数量
  const cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
  
  // 默认显示2行，可以根据需要调整
  const rows = 2;
  const pageSize = cardsPerRow * rows;
  
  return pageSize;
};

// 检查是否需要加载更多数据
const shouldLoadMore = () => 
{
  let scrollTop, scrollHeight, clientHeight;
  
  if (props.listenWindowScroll) 
  {
    // 如果监听窗口滚动，使用文档相关属性
    scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
    clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
  }
  else 
  {
    // 如果监听容器滚动，使用容器属性
    if (!containerRef.value) return false;
    scrollTop = containerRef.value.scrollTop;
    scrollHeight = containerRef.value.scrollHeight;
    clientHeight = containerRef.value.clientHeight;
  }
  // 检查是否滚动到底部（阈值为400px）
  if (scrollHeight - scrollTop - clientHeight < 400) 
  {
    return true;
  }
  return false;
};

// 滚动事件处理函数
const handleScroll = () => 
{
  if (shouldLoadMore()) 
  {
    loadMoreData();
  }
};

const router = useRouter();

const handleItemClick = (item) => 
{

};
</script>

<style scoped lang="less">
@import "@/assets/style/global.less";

.kb-list {
  overflow: hidden;
}

.kb-grid {
  display: flex;
  flex-wrap: wrap;
  gap: @size-5;
  justify-content: flex-start;
}

/* 固定KB卡片宽度为180px */
.kb-grid :deep(.kb-item) {
  width: 180px;
  flex: 0 0 180px;
}

.no-more-tips {
  text-align: center;
  padding: @size-5;
  font-size: @font-size-title-1;
  color: @color-text-4;
  width: 100%;
  margin-top: @size-5;
  word-wrap: break-word;
  word-break: normal;
  overflow-wrap: break-word;
}

/* 手机屏幕下调整 */
@media (max-width: 768px) {
  .kb-list {
    width: 100%;
  }

  .kb-grid {
    gap: 10px;
    justify-content: center;
  }

  .no-more-tips {
    width: calc(100vw - @size-5);
  }
}
</style>