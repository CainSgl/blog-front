<template>
  <div class="chat-session-list">
    <div class="session-list" v-if="chatStore.sortedSessions.length > 0">
      <div
        v-for="session in chatStore.sortedSessions"
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === currentSessionId, unread: session.unreadCount > 0 }"
        @click="handleSessionClick(session)"
      >
        <AvatarWithUserId
          :user-id="session.otherUserId"
          :size="48"
        />
        
        <div class="session-content">
          <div class="session-info">
            <span class="session-name">{{ session.otherUserName || '用户' }}</span>
            <span class="session-time">{{ formatTime(session.lastMessageTime) }}</span>
          </div>
          <div class="session-message">
            <span class="message-text">{{ session.lastMessage || '暂无消息' }}</span>
            <a-badge v-if="session.unreadCount" :count="session.unreadCount" />
          </div>
        </div>

        <a-dropdown trigger="click" @select="(value) => handleAction(value, session)">
          <a-button type="text" size="small" class="session-action">
            <icon-more />
          </a-button>
          <template #content>
            <a-doption value="delete">
              <icon-delete />
              删除会话
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>

    <a-spin v-else-if="loading" :loading="loading" style="display: block; padding: 40px 0;" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useChatStore } from '@/store/chat';
import { storeToRefs } from 'pinia';
import { IconMore, IconDelete } from '@arco-design/web-vue/es/icon';
import { Modal } from '@arco-design/web-vue';
import AvatarWithUserId from '@/components/base/avatar/AvatarWithUserId.vue';

const chatStore = useChatStore();
const { currentSessionId } = storeToRefs(chatStore);

const loading = ref(false);

// 格式化时间
function formatTime(time) {
  if (!time) return '';
  
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  // 1分钟内
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  
  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
  
  // 其他
  return date.toLocaleDateString('zh-CN');
}

// 点击会话
function handleSessionClick(session) {
  chatStore.currentSessionId = session.id;
  chatStore.markSessionAsRead(session.id);
}

// 处理操作
async function handleAction(action, session) {
  if (action === 'delete') {
    Modal.confirm({
      title: '确认删除',
      content: '删除会话将同时删除所有聊天记录，确定要删除吗？',
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await chatStore.deleteSession(session.id);
        } catch (error) {
          console.error('删除会话失败:', error);
        }
      }
    });
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await chatStore.loadSessions();
  } catch (error) {
    console.error('加载会话列表失败:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="less">
.chat-session-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-1);

  .session-list {
    flex: 1;
    overflow-y: auto;

    .session-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      position: relative;
      border-bottom: 1px solid var(--color-border-1);

      &:hover {
        background-color: var(--color-fill-2);

        .session-action {
          opacity: 1;
        }
      }

      &.active {
        background-color: var(--color-fill-3);
      }

      &.unread {
        .session-name {
          font-weight: 600;
        }
      }

      .session-content {
        flex: 1;
        min-width: 0;

        .session-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;

          .session-name {
            font-weight: 500;
            font-size: 15px;
            color: var(--color-text-1);
          }

          .session-time {
            font-size: 12px;
            color: var(--color-text-3);
            flex-shrink: 0;
            margin-left: 8px;
          }
        }

        .session-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;

          .message-text {
            flex: 1;
            font-size: 13px;
            color: var(--color-text-3);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .session-action {
        opacity: 0;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }
    }
  }
}
</style>
