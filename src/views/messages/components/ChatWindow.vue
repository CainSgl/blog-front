<template>
  <div class="chat-window">
    <div v-if="currentSession" class="chat-container">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <AvatarWithUserId
          :user-id="currentSession.otherUserId"
          :size="40"
        />
        <div class="header-info">
          <h3>{{ currentSession.otherUserName || '用户' }}</h3>
          <span v-if="isTyping" class="typing-indicator">正在输入...</span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="messageListRef" class="message-list" @scroll="handleScroll">
        <div v-if="hasMore && !loading" class="load-more">
          <a-button type="text" size="small" @click="loadMore">
            加载更多消息
          </a-button>
        </div>

        <a-spin v-if="loading" :loading="loading" style="display: block; padding: 20px 0;" />

        <div
          v-for="message in currentMessages"
          :key="message.id"
          class="message-item"
          :class="{ 'is-mine': message.senderId === currentUserId }"
        >
          <AvatarWithInfo
            v-if="message.senderId !== currentUserId"
            :user-id="message.senderId"
            :size="36"
          />
          
          <div class="message-content">
            <div class="message-bubble">
              <div class="message-text">{{ message.content }}</div>
            </div>
            <div class="message-meta">
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
              <span v-if="message.senderId === currentUserId && message.isRead" class="read-status">
                已读
              </span>
            </div>
          </div>

          <AvatarWithInfo
            v-if="message.senderId === currentUserId"
            :user-id="message.senderId"
            :size="36"
          />
        </div>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <a-textarea
          v-model="inputMessage"
          placeholder="输入消息..."
          :auto-size="{ minRows: 1, maxRows: 4 }"
          @keydown.enter.exact.prevent="handleSend"
          @input="handleTyping"
        />
        <a-button type="primary" :disabled="!inputMessage.trim()" @click="handleSend">
          发送
        </a-button>
      </div>
    </div>

    <a-empty v-else description="选择一个会话开始聊天" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import AvatarWithUserId from '@/components/base/avatar/AvatarWithUserId.vue';

const chatStore = useChatStore();
const userStore = useUserStore();
const { currentSession, currentMessages } = storeToRefs(chatStore);

const messageListRef = ref(null);
const inputMessage = ref('');
const loading = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);
const typingTimer = ref(null);

const currentUserId = computed(() => userStore.userInfo?.id);

const isTyping = computed(() => {
  if (!currentSession.value) return false;
  return chatStore.isUserTyping(currentSession.value.otherUserId);
});

// 格式化时间
function formatTime(time) {
  if (!time) return '';
  
  const date = new Date(time);
  const now = new Date();
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 其他
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}

// 处理滚动
function handleScroll() {
  if (!messageListRef.value) return;
  
  // 滚动到顶部时加载更多
  if (messageListRef.value.scrollTop === 0 && hasMore.value && !loading.value) {
    loadMore();
  }
}

// 加载更多消息
async function loadMore() {
  if (!currentSession.value || loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const oldScrollHeight = messageListRef.value?.scrollHeight || 0;
    
    currentPage.value++;
    const messages = await chatStore.loadMessages(currentSession.value.id, currentPage.value);
    
    if (messages.length === 0) {
      hasMore.value = false;
    }

    // 保持滚动位置
    nextTick(() => {
      if (messageListRef.value) {
        const newScrollHeight = messageListRef.value.scrollHeight;
        messageListRef.value.scrollTop = newScrollHeight - oldScrollHeight;
      }
    });
  } catch (error) {
    console.error('加载更多消息失败:', error);
  } finally {
    loading.value = false;
  }
}

// 发送消息
async function handleSend() {
  if (!inputMessage.value.trim()) return;

  try {
    await chatStore.sendMessage(inputMessage.value.trim());
    inputMessage.value = '';
    scrollToBottom();
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

// 处理输入（发送正在输入状态）
function handleTyping() {
  if (typingTimer.value) {
    clearTimeout(typingTimer.value);
  }

  chatStore.sendTyping();

  typingTimer.value = setTimeout(() => {
    typingTimer.value = null;
  }, 3000);
}

// 监听当前会话变化
watch(() => currentSession.value?.id, async (newId) => {
  if (newId) {
    currentPage.value = 1;
    hasMore.value = true;
    scrollToBottom();
  }
});

// 监听新消息
watch(() => currentMessages.value.length, () => {
  scrollToBottom();
});
</script>

<style scoped lang="less">
.chat-window {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-2);

  .chat-container {
    height: 100%;
    display: flex;
    flex-direction: column;

    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: var(--color-bg-1);
      border-bottom: 1px solid var(--color-border-2);

      .header-info {
        flex: 1;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .typing-indicator {
          font-size: 12px;
          color: var(--color-text-3);
        }
      }
    }

    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .load-more {
        text-align: center;
        padding: 8px 0;
      }

      .message-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;

        &.is-mine {
          flex-direction: row-reverse;

          .message-content {
            align-items: flex-end;

            .message-bubble {
              background-color: rgb(var(--primary-6));
              color: white;
            }

            .message-meta {
              flex-direction: row-reverse;
            }
          }
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 60%;

          .message-bubble {
            padding: 10px 14px;
            border-radius: 12px;
            background-color: var(--color-bg-1);
            word-wrap: break-word;
            word-break: break-word;

            .message-text {
              line-height: 1.5;
              white-space: pre-wrap;
            }
          }

          .message-meta {
            display: flex;
            gap: 8px;
            font-size: 12px;
            color: var(--color-text-3);

            .read-status {
              color: rgb(var(--primary-6));
            }
          }
        }
      }
    }

    .chat-input {
      padding: 16px;
      background-color: var(--color-bg-1);
      border-top: 1px solid var(--color-border-2);
      display: flex;
      gap: 12px;
      align-items: flex-end;

      :deep(.arco-textarea-wrapper) {
        flex: 1;
      }
    }
  }
}
</style>
