<template>
  <div class="follow-list-container">
    <a-typography-title :heading="5" class="section-title">
      {{ title }}
    </a-typography-title>
    <a-spin :loading="loading" tip="正在加载列表..." style="display: block;">
      <div class="follow-items-list">
        <FollowItem 
          v-for="item in items" 
          :key="item.id" 
          :follower="item" 
        />
      </div>
    </a-spin>
    <div class="load-more-container" v-if="hasMore">
      <a-button 
        :loading="loadingMore" 
        @click="loadMore" 
        long
      >
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </a-button>
    </div>
    <a-empty v-if="items.length === 0 && !loading" :description="emptyDescription" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api/index.js';
import FollowItem from '@/components/user/home/follow/follow.vue';

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['followers', 'following'] // 粉丝或关注
  },
  title: {
    type: String,
    required: true
  },
  emptyDescription: {
    type: String,
    default: '暂无数据'
  }
});

const route = useRoute();

// 列表数据
const items = ref([]);
// 加载状态
const loading = ref(false);
// 加载更多状态
const loadingMore = ref(false);
// 是否还有更多数据
const hasMore = ref(false);
// 最后一项ID，用于分页
const lastId = ref('0');

// 获取列表数据
const fetchList = async (id, lastIdValue = '0') => {
  // 根据是否是加载更多来设置不同的loading状态
  if (lastIdValue === '0') {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  
  try {
    // 根据类型选择不同的API端点
    const endpoint = props.type === 'followers' ? '/follow/er/list' : '/follow/ee/list';
    const { data } = await api.post(endpoint, { 
      id: id,
      lastId: lastIdValue
    });
    
    const newItems = data || [];
    // 如果是首次加载，直接替换；否则追加
    if (lastIdValue === '0') {
      items.value = newItems;
    } else {
      items.value = [...items.value, ...newItems];
    }
    
    // 如果返回的数据少于每页大小（20），说明没有更多数据
    if (newItems.length < 20) {
      hasMore.value = false;
    } else {
      hasMore.value = true;
    }
    
    // 更新lastId为最后一条记录的id
    if (newItems.length > 0) {
      lastId.value = newItems[newItems.length - 1].id;
    }
  } catch (err) {
    console.error(`获取${props.type === 'followers' ? '粉丝' : '关注'}列表失败:`, err);
    if (lastIdValue === '0') {
      items.value = [];
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loadingMore.value) return;
  fetchList(route.params.id, lastId.value);
};

// 初始化
onMounted(() => {
  if (route.params.id) {
    fetchList(route.params.id);
  }
});
</script>

<style scoped lang="less">
.follow-list-container {
  .section-title {
    margin-bottom: 16px;
    padding-left: 12px;
    border-left: 4px solid @primary-6;
  }

  .follow-items-list {
    margin-bottom: 24px;
  }

  .load-more-container {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}
</style>