<template>
  <div class="reply-messages">


    <div class="messages-list" v-if="messages.length > 0">
      <a-divider dashed />
      <MessageItem v-for="message in messages" :key="message.id" :message="message" @click="handleMessageClick">
        <div class="reply-content">
          <div class="reply-text">
            <span class="reply-label">回复了你：</span>
            <span class="reply-message">{{ message.replyInfo?.content || '加载中...' }}</span>
          </div>
          <div class="reply-meta">
            <span class="like-count">
              <icon-heart-fill />
              {{ message.replyInfo?.likeCount || 0 }}
            </span>
          </div>
          <a-button>回复</a-button>
        </div>
      </MessageItem>

      <!-- 加载触发器 -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <a-spin v-if="loading" tip="获取更多中" />
        <div v-else-if="!hasMore" class="no-more">没有更多了</div>
      </div>
    </div>

    <a-empty v-else-if="!loading" description="暂无回复消息" />
    <a-spin v-else :loading="loading" style="width: 100%; padding: 40px 0;" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { IconHeartFill } from '@arco-design/web-vue/es/icon';
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
    const { data } = await api.get('/user/notice', { type: "回复", size: size.value, after: after.value });
    const newMessages = data.records;

    // 先把消息加入列表，立即显示
    messages.value.push(...newMessages);
    hasMore.value = data.hasMore;
    after.value = data.after;

    // 异步加载完整的回复信息
    const ids = newMessages.map(msg => msg.targetId).join(',');
    if (ids) {
      api.get('/comment/reply/notice', { ids }).then(({ data: replyData }) => {
        const replyMap = new Map(replyData.map(item => [item.id, item]));
        console.log(replyMap)
        messages.value.forEach(msg => {
          if (replyMap.has(msg.targetId)) {
            msg.replyInfo = replyMap.get(msg.targetId);
          }
        });
      }).catch(error => {
        console.error('加载回复详情失败:', error);
      });
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleMessageClick = (message) => {
  console.log('点击消息:', message);
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return formatDate(timestamp);
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
.reply-messages {


  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
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

  .reply-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
    cursor: pointer;
    .reply-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .reply-label {
        font-size: 13px;
        color: @color-text-3;
        font-weight: 500;
      }

      .reply-message {
        font-size: 14px;
        color: @color-text-1;
        line-height: 1.6;
        word-break: break-word;
        padding: 8px 12px;
        background-color: @color-fill-1;
        border-radius: 6px;
        border-left: 3px solid @color-primary-light-3;
      }
    }

    .reply-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: @color-text-3;

      .like-count {
        display: flex;
        align-items: center;
        gap: 4px;
        color: @color-text-3;

        svg {
          font-size: 14px;
          color: rgb(var(--danger-6));
        }
      }

      .reply-time {
        color: @color-text-3;
      }
    }
  }
}
</style>
