<template>
  <div class="chat-page">
    <div class="session-list-wrapper" :class="{ 'mobile-hidden': selectedSession && !showBlocked }">
      <div class="session-list-header">
        <h3>{{ showBlocked ? '已拉黑的会话' : '消息列表' }}</h3>
        <a-button 
          type="text" 
          size="small"
          @click="toggleBlocked"
        >
          <template #icon>
            <icon-swap v-if="!showBlocked" />
            <icon-arrow-left v-else />
          </template>
          {{ showBlocked ? '返回' : '拉黑列表' }}
        </a-button>
      </div>
      <ChatSessionList
        v-if="!showBlocked"
        @select="handleSelectSession"
      />
      <BlockedSessionList
        v-else
      />
    </div>
    <div class="chat-content-wrapper" :class="{ 'mobile-visible': selectedSession && !showBlocked }">
      <div v-if="selectedSession && !showBlocked" class="chat-header-mobile">
        <a-button 
          type="text" 
          size="small"
          @click="handleBackToList"
          class="back-button"
        >
          <template #icon>
            <icon-arrow-left />
          </template>
          返回
        </a-button>
        <span class="chat-title">{{ selectedSession.nickname || selectedSession.username }}</span>
      </div>
      <ChatMessageList
        v-if="selectedSession && !showBlocked"
        :session="selectedSession"
        @block-user="handleBlockUser"
      />
      <div v-else class="empty-chat">
        <p>{{ showBlocked ? '选择一个会话进行恢复' : '选择一个会话开始聊天' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { IconSwap, IconArrowLeft } from '@arco-design/web-vue/es/icon';
import ChatSessionList from '@/components/base/chat/ChatSessionList.vue';
import ChatMessageList from '@/components/base/chat/ChatMessageList.vue';
import BlockedSessionList from '@/components/base/chat/BlockedSessionList.vue';

const selectedSession = ref(null);
const showBlocked = ref(false);

const handleSelectSession = (session) => {
  selectedSession.value = session;
};

const handleBlockUser = (sessionId) => {
  // 清空当前选中的会话（如果被拉黑的是当前会话）
  if (selectedSession.value?.id === sessionId) {
    selectedSession.value = null;
  }
};

const toggleBlocked = () => {
  showBlocked.value = !showBlocked.value;
  selectedSession.value = null;
};

const handleBackToList = () => {
  selectedSession.value = null;
};
</script>

<style scoped lang="less">
.chat-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  height: calc(100dvh - 210px);

  .session-list-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-1);
    border-right: 1px solid var(--color-border-2);
    overflow: hidden;

    .session-list-header {
      flex-shrink: 0;
      padding: 16px;
      border-bottom: 1px solid var(--color-border-2);
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-1);
      }
    }

    :deep(.chat-session-list),
    :deep(.blocked-session-list) {
      flex: 1;
      overflow: hidden;
      border-right: none;

      .session-list-header {
        display: none;
      }
    }
  }

  .chat-content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-1);
    overflow: hidden;

    .chat-header-mobile {
      display: none;
    }

    :deep(.chat-message-list) {
      flex: 1;
      height: 100%;
      overflow: hidden;
    }
  }

  .empty-chat {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-1);
    color: var(--color-text-3);
    font-size: 16px;
  }

  // 手机端适配
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    
    .session-list-wrapper {
      &.mobile-hidden {
        display: none;
      }
    }

    .chat-content-wrapper {
      display: none;

      &.mobile-visible {
        display: flex;
      }

      .chat-header-mobile {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--color-bg-1);
        border-bottom: 1px solid var(--color-border-2);
        gap: 12px;
        flex-shrink: 0;

        .back-button {
          flex-shrink: 0;
        }

        .chat-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-1);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
