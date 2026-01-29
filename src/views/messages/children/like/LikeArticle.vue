<template>
  <div class="like-article">
    <div class="messages-list" v-if="messages.length > 0">
      <MessageItem v-for="message in messages" :key="message.id" :message="message" @click="handleMessageClick">
        <template #action>
          <icon-heart :style="{ color: '#f53f3f', marginRight: '4px' }" />
          点赞了你的文章
        </template>
      </MessageItem>

      <!-- 加载触发器 -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <a-spin v-if="loading" tip="获取更多中" />
        <div v-else-if="!hasMore" class="no-more">没有更多了</div>
      </div>
    </div>

    <a-empty v-else-if="!loading" description="暂无点赞文章消息" />
     <a-spin v-else :loading="loading" style="display: block;">
      <div style="width: 100%; height: 300px;"></div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { IconHeart } from '@arco-design/web-vue/es/icon';
import MessageItem from '@/components/user/base/MessageItem.vue';
import api from '@/api/index';

const loading = ref(false);
const messages = ref([]);
const after = ref(null);
const size = ref(20);
const hasMore = ref(true);
const loadMoreTrigger = ref(null);
let observer = null;

const loadMessages = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const { data } = await api.get('/user/notice', { type: "点赞文章", size: size.value, after: after.value });
    const newMessages = data.records;
    messages.value.push(...newMessages);
    hasMore.value = data.hasMore;
    after.value = data.after;
  } catch (error) {
    console.error('加载消息失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleMessageClick = (message) => {
  console.log('点击消息:', message);
};

const setupObserver = () => {
  if (!loadMoreTrigger.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        loadMessages();
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }
  );

  observer.observe(loadMoreTrigger.value);
};

onMounted(() => {
  loadMessages().then(() => {
    setupObserver();
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped lang="less">
.like-article {
  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .load-more-trigger {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    .no-more {
      color: @color-text-3;
      font-size: 14px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
