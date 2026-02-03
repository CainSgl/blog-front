<template>
  <div class="chat-session-list">
    <div class="session-list-header">
      <h3>消息</h3>
    </div>
    <div class="session-list-content">

      <ChatSessionItem v-for="session in sessions" :key="session.id" :session="session"
        :is-active="currentSessionId === session.id" 
        :is-typing="typingUsers.has(session.otherUserId)"
        @select="handleSelect" @block="handleBlockSession" />
      <div v-if="sessions.length === 0" class="empty-state">
        <p>暂无会话</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, h } from 'vue';
import { useRoute } from 'vue-router';
import { Notification, Button, Space } from '@arco-design/web-vue';
import ChatSessionItem from './ChatSessionItem.vue';
import api from '@/api';
import chatWebSocket from '@/services/chatWebSocket';
import { useUserStore } from '@/store/user';

const emit = defineEmits(['select']);
const route = useRoute();
const userStore = useUserStore();

const sessions = ref([]);
const currentSessionId = ref(null);
const typingUsers = ref(new Set()); // 正在输入的用户ID集合
const typingTimers = ref(new Map()); // 用户ID -> 定时器
const onlineStatus = ref(new Map()); // 用户ID -> 在线状态

// 加载会话列表
const loadSessions = async () => {
  try {
    const { data } = await api.get('/chat/sessions');
    sessions.value = data.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });

    // 批量查询所有用户的在线状态
    if (sessions.value.length > 0) {
      const userIds = sessions.value.map(s => s.otherUserId);
      chatWebSocket.checkBatchOnlineStatus(userIds);
    }
  } catch (error) {
    console.error('加载会话列表失败:', error);
  }
};

// 选择会话
const handleSelect = (session) => {
  currentSessionId.value = session.id;
  session.unreadCount = 0;
  emit('select', session);
};

// 处理拉黑会话
const handleBlockSession = (sessionId) => {
  // 从列表中移除该会话
  sessions.value = sessions.value.filter(s => s.id !== sessionId);

  // 如果拉黑的是当前选中的会话，清空选中状态
  if (currentSessionId.value == sessionId) {
    currentSessionId.value = null;
    emit('select', null);
  }
};

// 处理被拉黑用户发来的消息
const handleNewSessionFromBlockedUser = async (senderId, content, timestamp) => {
  try {
    const { data } = await api.get('/chat/sessions/byOther', { otherId: senderId });

    const session = data.session;
    const deleted = data.deleted;

    if (deleted) {
      // 被拉黑的用户想要发消息，使用 Notification 提示
      const id = `blocked-user-${senderId}-${Date.now()}`;

      Notification.warning({
        id,
        title: '消息提醒',
        content: '有一个被你拉黑的用户想要对你发消息，是否接受？',
        duration: 0,
        closable: true,
        footer: h(Space, {}, {
          default: () => [
            h(Button, {
              type: 'secondary',
              size: 'small',
              onClick: () => {
                Notification.remove(id);
              }
            }, { default: () => '拒绝' }),
            h(Button, {
              type: 'primary',
              size: 'small',
              onClick: () => {
                // 用户选择接受，添加会话到列表
                if (session) {
                  session.lastMessage = content;
                  session.lastMessageTime = timestamp;
                  session.unreadCount = 1;
                  sessions.value.unshift(session);

                  // 重新排序
                  sessions.value.sort((a, b) => {
                    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                    return timeB - timeA;
                  });
                }
                Notification.remove(id);
              }
            }, { default: () => '接受' })
          ]
        })
      });
    } else {
      // 正常会话，直接添加
      if (session) {
        session.lastMessage = content;
        session.lastMessageTime = timestamp;
        session.unreadCount = 1;
        sessions.value.unshift(session);

        // 重新排序
        sessions.value.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
      }
    }
  } catch (error) {
    console.error('加载会话失败:', error);
  }
};

// 处理 WebSocket 消息
const handleWebSocketMessage = async (wsMessage) => {
  if (wsMessage.type === 'message') {
    const { senderId, receiverId, content, timestamp, isOnline, unreadCount } = wsMessage;
    const current = await userStore.getUserInfo();
    
    // 判断是发送的消息还是接收的消息
    const isSentByMe = senderId == current.id;
    const otherUserId = isSentByMe ? receiverId : senderId;
    
    // 找到对应的会话
    const session = sessions.value.find(s => s.otherUserId == otherUserId);
    
    if (session) {
      // 更新会话信息
      session.lastMessage = content;
      session.lastMessageTime = timestamp;

      // 更新在线状态（如果返回了）
      if (typeof isOnline !== 'undefined') {
        onlineStatus.value.set(otherUserId, isOnline);
        session.isOnline = isOnline;
      }

      // 更新未读数量
      if (typeof unreadCount !== 'undefined') {
        session.unreadCount = unreadCount;
      } else if (!isSentByMe && session.id != currentSessionId.value) {
        // 如果是接收的消息且不是当前会话，增加未读数
        session.unreadCount = (session.unreadCount || 0) + 1;
      }

      // 重新排序
      sessions.value.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
    } else if (!isSentByMe) {
      // 收到消息但没找到会话，尝试加载该用户的会话
      console.log('未找到会话，重新加载会话列表');
      handleNewSessionFromBlockedUser(senderId, content, timestamp);
    }
  }
  
  // 处理在线状态响应
  if (wsMessage.type === 'onlineStatus') {
    if (wsMessage.receiverId) {
      // 单个用户在线状态
      const { receiverId, isOnline } = wsMessage;
      onlineStatus.value.set(receiverId, isOnline);
      
      // 更新会话中的在线状态
      const session = sessions.value.find(s => s.otherUserId == receiverId);
      if (session) {
        session.isOnline = isOnline;
      }
    } else if (wsMessage.onlineStatus) {
      // 批量用户在线状态
      Object.entries(wsMessage.onlineStatus).forEach(([userId, isOnline]) => {
        const userIdNum = parseInt(userId);
        onlineStatus.value.set(userIdNum, isOnline);
        
        // 更新会话中的在线状态
        const session = sessions.value.find(s => s.otherUserId == userIdNum);
        if (session) {
          session.isOnline = isOnline;
        }
      });
    }
  }
  
  // 处理正在输入消息
  if (wsMessage.type === 'typing') {
    const { senderId, atTyping } = wsMessage;
    
    // 清除之前的定时器
    if (typingTimers.value.has(senderId)) {
      clearTimeout(typingTimers.value.get(senderId));
      typingTimers.value.delete(senderId);
    }
    
    if (atTyping !== false) {
      // 添加到正在输入集合
      typingUsers.value.add(senderId);
      
      // 3秒后自动移除
      const timer = setTimeout(() => {
        typingUsers.value.delete(senderId);
        typingTimers.value.delete(senderId);
      }, 3000);
      
      typingTimers.value.set(senderId, timer);
    } else {
      // 立即移除
      typingUsers.value.delete(senderId);
    }
  }
};

onMounted(async () => {
  // 连接 WebSocket
  const token = userStore.getToken();
  if (token) {
    chatWebSocket.connect(token);
    chatWebSocket.onMessage(handleWebSocketMessage);
  }

  // 加载会话列表
  await loadSessions();

  // 如果 URL 中有 sessionId，自动选中
  const sessionId = route.query.sessionId;
  if (sessionId) {
    const session = sessions.value.find(s => s.id == sessionId);
    if (session) {
      handleSelect(session);
    }
  }
});

onUnmounted(() => {
  chatWebSocket.disconnect();
  
  // 清理所有定时器
  typingTimers.value.forEach(timer => clearTimeout(timer));
  typingTimers.value.clear();
});

// 暴露方法给父组件
defineExpose({
  loadSessions
});
</script>

<style scoped lang="less">
.chat-session-list {
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

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }

  .session-list-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--color-text-3);
    }
  }
}
</style>
