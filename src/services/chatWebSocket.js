import { API_BASE_URL } from '@/config';

class ChatWebSocket {
  constructor() {
    this.ws = null;
    this.token = null;
    this.messageHandlers = [];
    this.connectionHandlers = [];
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
  }

  connect(token) {
    this.token = token;
    const wsUrl = API_BASE_URL.replace('http', 'ws') + `/ws/chat?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket 连接成功');
      this.notifyConnection('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("收到消息", data)
        this.messageHandlers.forEach(handler => handler(data));
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      this.notifyConnection('error');
    };

    this.ws.onclose = () => {
      console.log('WebSocket 连接关闭');
      this.notifyConnection('disconnected');
      this.stopHeartbeat();
      this.scheduleReconnect();
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(receiverId, content) {
    console.log("发送message", content)
    this.send({
      type: 'message',
      receiverId,
      content
    });
  }

  sendTyping(receiverId, atTyping = true) {
    console.log("发送typing", receiverId, atTyping)
    this.send({
      type: 'typing',
      receiverId,
      atTyping
    });
  }

  // 查询单个用户在线状态
  checkOnlineStatus(receiverId) {
    console.log("查询用户在线状态", receiverId)
    this.send({
      type: 'checkOnline',
      receiverId
    });
  }

  // 批量查询用户在线状态
  checkBatchOnlineStatus(userIds) {
    console.log("批量查询用户在线状态", userIds)
    this.send({
      type: 'checkOnline',
      userIds
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket 未连接');
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  onConnection(handler) {
    this.connectionHandlers.push(handler);
  }

  notifyConnection(status) {
    this.connectionHandlers.forEach(handler => handler(status));
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.token) {
        console.log('尝试重新连接...');
        this.connect(this.token);
      }
    }, 3000);
  }

  startHeartbeat() {
    // 每 20 秒发送一次心跳，避免 30 秒超时
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 20000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export default new ChatWebSocket();
