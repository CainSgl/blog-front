<template>
  <div class="chat-message-list">
    <div class="message-list-header">
      <a-link :href="`/space/${otherUserInfo.id}`">
        <Avatar v-if="otherUserInfo" :size="32" :src="otherUserInfo.avatarUrl" class="header-avatar" />
      </a-link>
      
      <h3>{{ otherUserInfo?.nickname || '加载中...' }}</h3>
      <div class="header-actions">
        <a-dropdown @select="handleAction">
          <a-button type="text" size="small">
            <icon-more />
          </a-button>
          <template #content>
            <a-doption value="block">
              <icon-stop />
              拉黑用户
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>
    <div ref="messageListContent" class="message-list-content">
      <ChatMessageItem v-for="message in messages" :key="message.id" :message="message"
        :is-mine="message.senderId == currentUserId"> </ChatMessageItem>
      
      <!-- 正在输入提示 -->
      <div v-if="isOtherUserTyping" class="typing-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="typing-text">{{ otherUserInfo?.nickname || '对方' }} 正在输入中...</span>
      </div>
      
      <div v-if="!hasMore && messages.length > 0" class="no-more-message">
        没有更多消息了
      </div>
      <div ref="observerTarget" class="observer-target"></div>
    </div>
    <div class="message-input-area">
      <div v-if="isBlockedByOther" class="blocked-notice">
        <icon-exclamation-circle-fill />
        <span>你已被对方拉黑，无法发送消息</span>
        <a-link @click="showForceSendModal">强行发送</a-link>
      </div>
      <template v-else>
        <a-textarea v-model="inputText" placeholder="输入消息..." :auto-size="{ minRows: 1, maxRows: 4 }"
          @keydown.enter.exact.prevent="sendMessage"
          @input="handleTyping" />
        <a-button type="primary" @click="sendMessage" :disabled="!inputText.trim()">
          发送
        </a-button>
      </template>
    </div>

    <!-- 强行发送消息弹窗 -->
    <a-modal 
      v-model:visible="forceSendModalVisible" 
      title="强行发送消息"
      @ok="handleForceSend"
      @cancel="forceSendModalVisible = false"
      ok-text="发送"
      cancel-text="取消"
    >
      <div class="force-send-warning">
        <icon-exclamation-circle-fill style="color: rgb(var(--warning-6)); font-size: 20px;" />
        <p>已被对方拉黑，即便消息发出去也不一定会被对方接受！</p>
      </div>
      <a-textarea 
        v-model="forceSendText" 
        placeholder="输入要发送的消息..." 
        :auto-size="{ minRows: 3, maxRows: 6 }"
        style="margin-top: 16px;"
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import { IconMore, IconStop, IconExclamationCircleFill } from '@arco-design/web-vue/es/icon';
import ChatMessageItem from './ChatMessageItem.vue';
import Avatar from '@/components/base/avatar/Avatar.vue';
import api from '@/api';
import chatWebSocket from '@/services/chatWebSocket';
import { useUserStore } from '@/store/user';

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['block-user']);

const userStore = useUserStore();
const currentUserId = computed(() => userStore.userInfo?.id);
const otherUserInfo = ref(null);

// 检查是否被对方拉黑
const isBlockedByOther = computed(() => {
  return props.session?.deletedByOther === true;
});

const inputText = ref('');
const observerTarget = ref(null);
const messageListContent = ref(null);
const messages = ref([]);
let last;
let observer = null;
const hasMore = ref(true);
let isLoading = false; // 加载锁

// 强行发送相关
const forceSendModalVisible = ref(false);
const forceSendText = ref('');

// 正在输入相关
const isOtherUserTyping = ref(false);
let typingTimer = null;
let sendTypingTimer = null;
let isTypingSent = false; // 标记是否已发送正在输入状态

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListContent.value) {
      messageListContent.value.scrollTop = 0;
    }
  });
};

// 加载消息
const loadMessages = async () => {
  // 防重复请求：如果正在加载或没有更多消息，直接返回
  if (isLoading || !hasMore.value) {
    return;
  }

  try {
    isLoading = true; // 上锁
    
    const { data } = await api.post('/chat/messages', { sessionId: props.session.id, last });
    
    if (data.messages.length === 0) {
      hasMore.value = false;
    } else {
      messages.value = [...messages.value, ...data.messages];
      last = data.last;
    }
  } catch (error) {
    console.error('加载消息失败:', error);
    Message.error('加载消息失败');
  } finally {
    isLoading = false; // 解锁
  }
};
// 处理输入事件，发送正在输入状态
const handleTyping = () => {
  // 清除之前的定时器
  if (sendTypingTimer) {
    clearTimeout(sendTypingTimer);
  }
  
  // 只在第一次输入时发送正在输入状态
  if (!isTypingSent) {
    chatWebSocket.sendTyping(props.session.otherUserId, true);
    isTypingSent = true;
  }
  
  // 1秒后发送停止输入状态并重置标志
  sendTypingTimer = setTimeout(() => {
    chatWebSocket.sendTyping(props.session.otherUserId, false);
    isTypingSent = false;
  }, 1000);
};

// 发送消息
const sendMessage = () => {
  if (!inputText.value.trim()) return;
  
  // 检查是否被拉黑
  if (isBlockedByOther.value) {
    Message.warning('你已被对方拉黑，无法发送消息');
    return;
  }

  const content = inputText.value.trim();

  // 发送到服务器，等待服务器返回消息后再显示
  chatWebSocket.sendMessage(props.session.otherUserId, content);

  inputText.value = '';
  
  // 发送停止输入状态并重置标志
  if (sendTypingTimer) {
    clearTimeout(sendTypingTimer);
  }
  chatWebSocket.sendTyping(props.session.otherUserId, false);
  isTypingSent = false;
};

// 显示强行发送弹窗
const showForceSendModal = () => {
  forceSendModalVisible.value = true;
  forceSendText.value = '';
};

// 处理强行发送
const handleForceSend = () => {
  if (!forceSendText.value.trim()) {
    Message.warning('请输入消息内容');
    return;
  }

  const content = forceSendText.value.trim();

  // 发送到服务器
  chatWebSocket.sendMessage(props.session.otherUserId, content);

  Message.info('消息已发送，但对方可能不会接收');
  
  forceSendModalVisible.value = false;
  forceSendText.value = '';
};

// 处理 WebSocket 消息
const handleWebSocketMessage = (wsMessage) => {
  // 处理普通消息
  if (wsMessage.type === 'message') {
    const { senderId, receiverId, content, messageId, timestamp, isOnline, unreadCount } = wsMessage;

    if (senderId == props.session.otherUserId || receiverId == props.session.otherUserId) {
      const message = {
        id: messageId,
        sessionId: props.session.id,
        senderId,
        receiverId,
        content,
        createdAt: timestamp,
        isOnline: isOnline,
        unreadCount: unreadCount
      };

      // 添加到消息列表 - 使用数组展开确保响应式更新
      messages.value = [message,...messages.value];
      
      // 自动滚动到底部
      scrollToBottom();
    }
  }
  
  // 处理正在输入消息
  if (wsMessage.type === 'typing') {
    const { senderId, atTyping } = wsMessage;
    
    // 只处理当前会话对方的 typing 状态
    if (senderId == props.session.otherUserId) {
      isOtherUserTyping.value = atTyping !== false;
      
      // 清除之前的定时器
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      
      // 如果是正在输入，3秒后自动隐藏
      if (isOtherUserTyping.value) {
        typingTimer = setTimeout(() => {
          isOtherUserTyping.value = false;
        }, 3000);
      }
    }
  }
};

const webSocketHandler = (wsMessage) => {
  handleWebSocketMessage(wsMessage)
}

// 加载对方用户信息
const loadOtherUserInfo = async () => {
  if (props.session?.otherUserId) {
    try {
      otherUserInfo.value = await userStore.getUserInfo(props.session.otherUserId);
    } catch (error) {
      console.error('加载用户信息失败:', error);
      otherUserInfo.value = { nickname: props.session.otherUserId };
    }
  }
};

// 处理操作菜单
const handleAction = (value) => {
  if (value === 'block') {
    handleBlockUser();
  }
};

// 拉黑用户
const handleBlockUser = () => {
  Modal.confirm({
    title: '确认拉黑',
    content: `确定要拉黑用户 ${otherUserInfo.value?.nickname || '该用户'} 吗？拉黑后将删除会话记录。`,
    okText: '确认拉黑',
    cancelText: '取消',
    onOk: async () => {
      try {
        await api.delete('/chat/session', { sessionId: props.session.id  });
        Message.success('已拉黑该用户');
        emit('block-user', props.session.id);
      } catch (error) {
        console.error('拉黑用户失败:', error);
        Message.error('拉黑用户失败，请重试');
      }
    }
  });
};

// 设置 Intersection Observer
onMounted(async () => {
  // 加载对方用户信息
  await loadOtherUserInfo();
  
  // 监听 WebSocket
  chatWebSocket.onMessage(webSocketHandler);

  // 设置滚动加载 - 只交给 IntersectionObserver 处理，不在这里主动调用
  if (observerTarget.value) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMessages();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(observerTarget.value);
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
  
  // 清理定时器
  if (typingTimer) {
    clearTimeout(typingTimer);
  }
  if (sendTypingTimer) {
    clearTimeout(sendTypingTimer);
  }
});

watch(() => props.session.id, async () => {
  messages.value = [];
  last = null;
  hasMore.value = true;
  isLoading = false; // 重置加载锁
  isOtherUserTyping.value = false;
  
  // 清理定时器和标志
  if (typingTimer) {
    clearTimeout(typingTimer);
  }
  if (sendTypingTimer) {
    clearTimeout(sendTypingTimer);
  }
  isTypingSent = false;
  
  await loadOtherUserInfo();
  // 不在这里调用 loadMessages，交给 IntersectionObserver 处理
});

</script>

<style scoped lang="less">
.chat-message-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-1);
  overflow: hidden;

  .message-list-header {
    flex-shrink: 0;
    padding: 16px;
    background-color: var(--color-bg-1);
    border-bottom: 1px solid var(--color-border-2);
    display: flex;
    align-items: center;
    gap: 12px;

    .header-avatar {
      flex-shrink: 0;
    }

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-1);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .header-actions {
      flex-shrink: 0;
    }
  }

  .message-list-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column-reverse;
    min-height: 0;

    .no-more-message {
      text-align: center;
      padding: 16px;
      color: var(--color-text-3);
      font-size: 14px;
      flex-shrink: 0;
    }

    .observer-target {
      height: 1px;
      flex-shrink: 0;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      flex-shrink: 0;

      .typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;

        span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--color-text-3);
          animation: typing-bounce 1.4s infinite ease-in-out;

          &:nth-child(1) {
            animation-delay: -0.32s;
          }

          &:nth-child(2) {
            animation-delay: -0.16s;
          }
        }
      }

      .typing-text {
        font-size: 13px;
        color: var(--color-text-3);
      }
    }
  }

  @keyframes typing-bounce {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .message-input-area {
    flex-shrink: 0;
    padding: 16px;
    background-color: var(--color-bg-1);
    border-top: 1px solid var(--color-border-2);
    display: flex;
    gap: 12px;
    align-items: flex-end;

    :deep(.arco-textarea-wrapper) {
      flex: 1;
    }

    .blocked-notice {
      width: 100%;
      padding: 12px 16px;
      background-color: rgba(var(--danger-1), 0.5);
      border: 1px solid rgb(var(--danger-3));
      border-radius: 4px;
      color: rgb(var(--danger-6));
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      svg {
        font-size: 16px;
      }

      span {
        flex: 1;
      }

      :deep(.arco-link) {
        color: rgb(var(--primary-6));
        font-weight: 500;
        white-space: nowrap;
      }
    }
  }
}

.force-send-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background-color: rgba(var(--warning-1), 0.5);
  border: 1px solid rgb(var(--warning-3));
  border-radius: 4px;

  p {
    margin: 0;
    color: rgb(var(--warning-6));
    font-size: 14px;
    line-height: 1.6;
  }
}
</style>
