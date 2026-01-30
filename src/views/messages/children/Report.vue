<template>
  <div class="report-messages">
    
    <div class="messages-list" v-if="messages.length > 0">
      <MessageItem v-for="message in messages" :key="message.id" :message="message" @click="handleMessageClick">
        <template #action>
         
        </template>
      </MessageItem>

      <!-- 加载触发器 -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <a-spin v-if="loading" tip="获取更多中" />
        <div v-else-if="!hasMore" class="no-more">没有更多了</div>
      </div>
    </div>

    <a-empty v-else-if="!loading" description="暂无举报消息" />
    <a-spin v-else :loading="loading" style="display: block;">
      <div style="width: 100%; height: 300px;"></div>
    </a-spin>
  </div>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import api from '@/api/index'
import MessageItem from '@/components/user/base/MessageItem.vue';

const loading = ref(false);
const messages = ref([]);
const after = ref(null);
const size = ref(20);
const hasMore = ref(true);
const loadMoreTrigger = ref(null);
let observer = null;

const formatTime = (time) => {
  return time;
};

const loadMessages = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const { data } = await api.get('/user/notice', { type: ["举报"], size: size.value, after: after.value })
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
.report-messages {
  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .message-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background-color: @color-bg-2;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: @color-fill-2;
    }

    &.unread {
      background-color: @color-primary-light-1;

      &:hover {
        background-color: @color-primary-light-2;
      }
    }

    .message-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background-color: @color-warning-light-3;
      border-radius: 50%;
      color: @color-warning-6;
    }

    .message-content {
      flex: 1;
      min-width: 0;

      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .message-title {
          font-weight: 600;
          color: @color-text-1;
        }

        .message-time {
          font-size: 12px;
          color: @color-text-3;
        }
      }

      .message-text {
        color: @color-text-2;
        line-height: 1.6;
      }
    }

    .message-status {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
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
      height: 300px;
    }
  }
}
</style>
