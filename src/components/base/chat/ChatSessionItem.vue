<template>
  <a-dropdown 
    trigger="contextMenu"
    @select="handleContextMenu"
  >
    <div 
      class="chat-session-item" 
      :class="{ active: isActive, blocked: session.deletedByOther, typing: isTyping }"
      @click="$emit('select', session)"
    >
      <div class="session-avatar">
        <Avatar :size="48" :src="userInfo?.avatarUrl" />
        <span v-if="session.isOnline" class="online-indicator" title="在线"></span>
        <span v-if="session.unreadCount > 0" class="unread-badge">
          {{ session.unreadCount > 99 ? '99+' : session.unreadCount }}
        </span>
      </div>
      <div class="session-content">
        <div class="session-header">
          <span class="session-name">
            {{ userInfo?.nickname || '加载中...' }}
            <span v-if="session.deletedByOther" class="blocked-tag">已被拉黑</span>
          </span>
          <span class="session-time">{{ formatTime(session.lastMessageTime) }}</span>
        </div>
        <div class="session-message">
          <template v-if="isTyping">
            <span class="typing-indicator">正在输入中...</span>
          </template>
          <template v-else>
            {{ session.lastMessage || '暂无消息' }}
          </template>
        </div>
      </div>
    </div>
    <template #content>
      <a-doption v-if="!isBlocked" value="block">
        <icon-stop />
        拉黑用户
      </a-doption>
      <a-doption v-if="isBlocked" value="restore">
        <icon-undo />
        恢复会话
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { Modal, Message } from '@arco-design/web-vue';
import { IconStop, IconUndo } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/store/user';
import Avatar from '@/components/base/avatar/Avatar.vue';
import api from '@/api';

const props = defineProps({
  session: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isTyping: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'block', 'restore']);

const userStore = useUserStore();
const userInfo = ref(null);

// 计算对方用户ID（处理被拉黑会话的情况）
const otherUserId = computed(() => {
  if (props.session.otherUserId) {
    return props.session.otherUserId;
  }
  // 如果是被拉黑的会话，需要从 userId1 和 userId2 中判断
  const currentUserId = userStore.userInfo?.id;
  if (props.session.userId1 === currentUserId) {
    return props.session.userId2;
  }
  return props.session.userId1;
});

// 加载用户信息
const loadUserInfo = async () => {
  if (otherUserId.value) {
    try {
      userInfo.value = await userStore.getUserInfo(otherUserId.value);
    } catch (error) {
      console.error(`加载用户 ${otherUserId.value} 信息失败:`, error);
      userInfo.value = { nickname: `用户${otherUserId.value}` };
    }
  }
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString();
};

// 处理右键菜单
const handleContextMenu = (value) => {
  if (value === 'block') {
    handleBlockUser();
  } else if (value === 'restore') {
    handleRestoreUser();
  }
};

// 拉黑用户
const handleBlockUser = () => {
  Modal.confirm({
    title: '确认拉黑',
    content: `确定要拉黑用户 ${userInfo.value?.nickname || '该用户'} 吗？拉黑后将删除会话记录。`,
    okText: '确认拉黑',
    cancelText: '取消',
    onOk: async () => {
      try {
        await api.delete('/chat/session', {
          sessionId: props.session.id 
        });
        Message.success('已拉黑该用户');
        emit('block', props.session.id);
      } catch (error) {
        console.error('拉黑用户失败:', error);
        Message.error('拉黑用户失败，请重试');
      }
    }
  });
};

// 恢复用户
const handleRestoreUser = () => {
  Modal.confirm({
    title: '确认恢复',
    content: `确定要恢复与用户 ${userInfo.value?.nickname || '该用户'} 的会话吗？`,
    okText: '确认恢复',
    cancelText: '取消',
    onOk: () => {
      emit('restore', props.session.id);
    }
  });
};

// 监听 session 变化
watch(() => otherUserId.value, () => {
  loadUserInfo();
}, { immediate: true });

onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped lang="less">
.chat-session-item {
  display: flex;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--color-border-2);

  &:hover {
    background-color: var(--color-fill-2);
  }

  &.active {
    background-color: var(--color-fill-3);
  }

  &.blocked {
    background-color: rgba(var(--danger-1), 0.3);
    border-left: 3px solid rgb(var(--danger-6));

    .session-name,
    .session-message {
      color: rgb(var(--danger-6));
    }
  }

  &.typing {
    background-color: var(--color-fill-2);
  }

  .session-avatar {
    position: relative;
    flex-shrink: 0;
    margin-right: 12px;

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background-color: rgb(var(--success-6));
      border: 2px solid var(--color-bg-1);
      border-radius: 50%;
    }

    .unread-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background-color: rgb(var(--danger-6));
      color: white;
      border-radius: 9px;
      font-size: 12px;
      line-height: 18px;
      text-align: center;
      font-weight: 500;
    }
  }

  .session-content {
    flex: 1;
    min-width: 0;

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .session-name {
        font-weight: 500;
        font-size: 14px;
        color: var(--color-text-1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 8px;

        .blocked-tag {
          font-size: 12px;
          padding: 2px 6px;
          background-color: rgb(var(--danger-6));
          color: white;
          border-radius: 4px;
          font-weight: normal;
          flex-shrink: 0;
        }
      }

      .session-time {
        font-size: 12px;
        color: var(--color-text-3);
        flex-shrink: 0;
        margin-left: 8px;
      }
    }

    .session-message {
      font-size: 13px;
      color: var(--color-text-2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .typing-indicator {
        color: var(--color-text-3);
        font-style: italic;
      }
    }
  }
}
</style>
