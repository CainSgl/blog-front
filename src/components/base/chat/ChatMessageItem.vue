<template>
  <div class="chat-message-item" :class="{ mine: isMine }">
    <div class="message-avatar">
      <AvatarWithInfo :user="senderInfo" :size="40" />
    </div>
  
    <div class="message-content">
      <div class="message-bubble">{{ message.content }}</div>
      <div class="message-meta">
        <span class="message-time">{{ formatDate(message.createdAt) }}</span>
        <span v-if="isMine && message.unreadCount !== undefined" class="unread-status">
          {{ message.unreadCount > 0 ? '未读' : '已读' }}
        </span>
        <span v-if="!isMine && message.isOnline !== undefined" class="online-status" :class="{ online: message.isOnline }">
          {{ message.isOnline ? '在线' : '离线' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useUserStore } from '@/store/user.js';
import AvatarWithInfo from '@/components/base/avatar/AvatarWithInfo.vue';
import { formatDate } from '@/utils/DateFormatter.js';

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isMine: {
    type: Boolean,
    default: false
  }
});

const userStore = useUserStore();
const senderInfo = ref(null);

// 获取发送者信息
const loadSenderInfo = async () => {
  if (props.message.senderId) {
    try {
      senderInfo.value = await userStore.getUserInfo(props.message.senderId);
    } catch (error) {
      console.error('获取发送者信息失败:', error);
    }
  }
};

onMounted(() => {
  loadSenderInfo();
});

watch(() => props.message.senderId, () => {
  loadSenderInfo();
});
</script>

<style scoped lang="less">
.chat-message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;

  &.mine {
    flex-direction: row-reverse;
    .message-content {
      align-items: flex-end;
      .message-bubble {
        background-color: rgb(var(--primary-6));
        color: white;
      }
    }
  }

  .message-avatar {
    flex-shrink: 0;

    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
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
      background-color: #F5F5F5;
      color: var(--color-text-1);
      word-wrap: break-word;
      word-break: break-word;

      body[arco-theme='dark'] & {
        background-color: var(--color-bg-1);
      }
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 4px;
      font-size: 12px;
      color: var(--color-text-3);

      .message-time {
        color: var(--color-text-3);
      }

      .unread-status {
        color: rgb(var(--warning-6));
        font-weight: 500;
      }

      .online-status {
        color: var(--color-text-4);
        
        &.online {
          color: rgb(var(--success-6));
          font-weight: 500;
        }
      }
    }
  }
}
</style>
