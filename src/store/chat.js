import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';
import chatWebSocket from '@/services/chatWebSocket';
import { useUserStore } from './user';
import { Message } from '@arco-design/web-vue';

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore();

  // 状态
  const sessions = ref([]);
  const currentSessionId = ref(null);
  const messages = ref(new Map()); // sessionId -> messages[]
  const unreadCount = ref(0);
  const isConnected = ref(false);
  const typingUsers = ref(new Set()); // 正在输入的用户ID集合

  // 计算属性
  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value);
  });

  const currentMessages = computed(() => {
    return messages.value.get(currentSessionId.value) || [];
  });

  const sortedSessions = computed(() => {
    return [...sessions.value].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  });

  /**
   * 初始化聊天
   */
  async function init() {
    const token = userStore.getToken();
    if (!token) {
      console.warn('未登录，无法初始化聊天');
      return;
    }

    try {
      // 连接 WebSocket
      chatWebSocket.connect(token);

      // 监听连接状态
      chatWebSocket.onConnection((status) => {
        isConnected.value = status === 'connected';
      });

      // 监听消息
      chatWebSocket.onMessage(handleWebSocketMessage);

      // 加载会话列表
      await loadSessions();

      // 加载未读数量
      await loadUnreadCount();
    } catch (error) {
      console.error('初始化聊天失败:', error);
    }
  }

  /**
   * 处理 WebSocket 消息
   */
  function handleWebSocketMessage(wsMessage) {
    switch (wsMessage.type) {
      case 'message':
        handleNewMessage(wsMessage);
        break;
      case 'read':
        handleMessageRead(wsMessage);
        break;
      case 'typing':
        handleTyping(wsMessage);
        break;
      default:
        console.log('未知消息类型:', wsMessage.type);
    }
  }

  /**
   * 处理新消息
   */
  function handleNewMessage(wsMessage) {
    const { sessionId, senderId, receiverId, content, messageId, timestamp, isOnline, unreadCount } = wsMessage;

    // 构造消息对象
    const message = {
      id: messageId,
      sessionId,
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: timestamp,
      isOnline: isOnline,
      unreadCount: unreadCount
    };

    // 添加到消息列表
    const sessionMessages = messages.value.get(sessionId) || [];
    sessionMessages.push(message);
    messages.value.set(sessionId, sessionMessages);

    // 更新会话列表
    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      session.lastMessage = content;
      session.lastMessageTime = timestamp;
      
      // 如果是接收到的消息且不是当前会话，增加未读数
      const currentUserId = userStore.userInfo?.id;
      if (senderId !== currentUserId && sessionId !== currentSessionId.value) {
        session.unreadCount = (session.unreadCount || 0) + 1;
        unreadCount.value++;
      }
    }

    // 如果是当前会话，自动标记已读
    if (sessionId === currentSessionId.value) {
      markSessionAsRead(sessionId);
    }
  }

  /**
   * 处理消息已读
   */
  function handleMessageRead(wsMessage) {
    const { sessionId } = wsMessage;
    
    // 更新消息状态
    const sessionMessages = messages.value.get(sessionId);
    if (sessionMessages) {
      sessionMessages.forEach(msg => {
        if (msg.senderId === userStore.userInfo?.id) {
          msg.isRead = true;
        }
      });
    }
  }

  /**
   * 处理正在输入
   */
  function handleTyping(wsMessage) {
    const { senderId } = wsMessage;
    typingUsers.value.add(senderId);

    // 3秒后移除
    setTimeout(() => {
      typingUsers.value.delete(senderId);
    }, 3000);
  }

  /**
   * 加载会话列表
   */
  async function loadSessions() {
    try {
      const { data } = await api.get('/chat/sessions');
      sessions.value = data;
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  }

  /**
   * 加载未读数量
   */
  async function loadUnreadCount() {
    try {
      const { data } = await api.get('/chat/unread-count');
      unreadCount.value = data;
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  }

  /**
   * 创建或打开会话
   */
  async function openSession(otherUserId) {
    try {
      // 检查是否已存在会话
      let session = sessions.value.find(s => 
        s.otherUserId === otherUserId
      );

      if (!session) {
        // 创建新会话
        const { data } = await api.post('/chat/session', {}, { params: { otherUserId } });
        session = data;
        sessions.value.push(session);
      }

      // 设置为当前会话
      currentSessionId.value = session.id;

      // 加载消息
      await loadMessages(session.id);

      // 标记已读
      await markSessionAsRead(session.id);

      return session;
    } catch (error) {
      if (error.code === '403') {
        Message.error('只有互相关注的用户才能创建会话');
      } else {
        Message.error('打开会话失败');
      }
      throw error;
    }
  }

  /**
   * 加载消息列表
   */
  async function loadMessages(sessionId, page = 1) {
    try {
      const { data } = await api.post('/chat/messages', { sessionId, page });
      
      // 反转消息顺序（最新的在下面）
      const newMessages = data.reverse();
      
      if (page === 1) {
        messages.value.set(sessionId, newMessages);
      } else {
        const existing = messages.value.get(sessionId) || [];
        messages.value.set(sessionId, [...newMessages, ...existing]);
      }

      return data;
    } catch (error) {
      console.error('加载消息失败:', error);
      throw error;
    }
  }

  /**
   * 发送消息
   */
  async function sendMessage(content) {
    if (!currentSession.value) {
      Message.error('请先选择会话');
      return;
    }

    const receiverId = currentSession.value.otherUserId;

    try {
      // 优先使用 WebSocket
      if (isConnected.value) {
        chatWebSocket.sendMessage(receiverId, content);
      } else {
        // 降级到 REST API
        const { data: message } = await api.post('/chat/send', { receiverId, content });
        handleNewMessage({
          type: 'message',
          sessionId: currentSession.value.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          messageId: message.id,
          timestamp: message.createdAt
        });
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Message.error('发送失败');
      throw error;
    }
  }

  /**
   * 标记会话已读
   */
  async function markSessionAsRead(sessionId) {
    try {
      const session = sessions.value.find(s => s.id === sessionId);
      if (!session || !session.unreadCount) {
        return;
      }

      // 更新本地状态
      const oldUnreadCount = session.unreadCount;
      session.unreadCount = 0;
      unreadCount.value = Math.max(0, unreadCount.value - oldUnreadCount);

      // 更新消息状态
      const sessionMessages = messages.value.get(sessionId);
      if (sessionMessages) {
        sessionMessages.forEach(msg => {
          if (msg.receiverId === userStore.userInfo?.id) {
            msg.isRead = true;
          }
        });
      }

      // 通知服务器
      if (isConnected.value) {
        chatWebSocket.markAsRead(sessionId);
      } else {
        await api.post('/chat/mark-read', { sessionId });
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  /**
   * 删除会话
   */
  async function deleteSession(sessionId) {
    try {
      await api.delete('/chat/session', { sessionId });
      
      // 从列表中移除
      const index = sessions.value.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        const session = sessions.value[index];
        unreadCount.value = Math.max(0, unreadCount.value - (session.unreadCount || 0));
        sessions.value.splice(index, 1);
      }

      // 清除消息
      messages.value.delete(sessionId);

      // 如果是当前会话，清除选择
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null;
      }

      Message.success('会话已删除');
    } catch (error) {
      console.error('删除会话失败:', error);
      Message.error('删除失败');
      throw error;
    }
  }

  /**
   * 发送正在输入状态
   */
  function sendTyping() {
    if (currentSession.value && isConnected.value) {
      chatWebSocket.sendTyping(currentSession.value.otherUserId);
    }
  }

  /**
   * 检查用户是否正在输入
   */
  function isUserTyping(userId) {
    return typingUsers.value.has(userId);
  }

  /**
   * 清理
   */
  function cleanup() {
    chatWebSocket.disconnect();
    sessions.value = [];
    currentSessionId.value = null;
    messages.value.clear();
    unreadCount.value = 0;
    isConnected.value = false;
    typingUsers.value.clear();
  }

  return {
    // 状态
    sessions,
    currentSessionId,
    messages,
    unreadCount,
    isConnected,
    
    // 计算属性
    currentSession,
    currentMessages,
    sortedSessions,
    
    // 方法
    init,
    loadSessions,
    loadUnreadCount,
    openSession,
    loadMessages,
    sendMessage,
    markSessionAsRead,
    deleteSession,
    sendTyping,
    isUserTyping,
    cleanup
  };
});
