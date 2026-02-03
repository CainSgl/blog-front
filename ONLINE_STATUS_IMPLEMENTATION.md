# 在线状态功能实现说明

## 功能概述

实现了聊天系统中的用户在线状态查询和显示功能，包括：

1. 批量查询会话列表中所有用户的在线状态
2. 实时更新用户在线状态
3. 在会话列表中显示在线状态指示器
4. 处理消息中返回的未读数量

## 实现细节

### 1. WebSocket 服务扩展 (`src/services/chatWebSocket.js`)

新增两个方法用于查询在线状态：

```javascript
// 查询单个用户在线状态
checkOnlineStatus(receiverId)

// 批量查询用户在线状态
checkBatchOnlineStatus(userIds)
```

发送的消息格式：
```json
// 单个查询
{
  "type": "checkOnline",
  "receiverId": 123456
}

// 批量查询
{
  "type": "checkOnline",
  "userIds": [123456, 789012, 345678]
}
```

### 2. 会话列表组件 (`src/components/base/chat/ChatSessionList.vue`)

#### 新增状态管理
- `onlineStatus`: Map 类型，存储用户ID到在线状态的映射

#### 加载会话时查询在线状态
```javascript
const loadSessions = async () => {
  // 加载会话列表
  const { data } = await api.get('/chat/sessions');
  sessions.value = data.sort(...);

  // 批量查询所有用户的在线状态
  if (sessions.value.length > 0) {
    const userIds = sessions.value.map(s => s.otherUserId);
    chatWebSocket.checkBatchOnlineStatus(userIds);
  }
};
```

#### 处理在线状态响应
```javascript
// 处理 WebSocket 返回的在线状态
if (wsMessage.type === 'onlineStatus') {
  if (wsMessage.receiverId) {
    // 单个用户在线状态
    onlineStatus.value.set(receiverId, isOnline);
    session.isOnline = isOnline;
  } else if (wsMessage.onlineStatus) {
    // 批量用户在线状态
    Object.entries(wsMessage.onlineStatus).forEach(([userId, isOnline]) => {
      onlineStatus.value.set(userIdNum, isOnline);
      session.isOnline = isOnline;
    });
  }
}
```

#### 处理消息中的在线状态和未读数
```javascript
if (wsMessage.type === 'message') {
  const { senderId, receiverId, isOnline, unreadCount } = wsMessage;
  
  // 更新在线状态
  if (typeof isOnline !== 'undefined') {
    onlineStatus.value.set(otherUserId, isOnline);
    session.isOnline = isOnline;
  }

  // 更新未读数量
  if (typeof unreadCount !== 'undefined') {
    session.unreadCount = unreadCount;
  }
}
```

### 3. 会话项组件 (`src/components/base/chat/ChatSessionItem.vue`)

#### 显示在线状态指示器
```vue
<div class="session-avatar">
  <Avatar :size="48" :src="userInfo?.avatarUrl" />
  <!-- 在线状态指示器 -->
  <span v-if="session.isOnline" class="online-indicator" title="在线"></span>
  <!-- 未读消息徽章 -->
  <span v-if="session.unreadCount > 0" class="unread-badge">
    {{ session.unreadCount > 99 ? '99+' : session.unreadCount }}
  </span>
</div>
```

样式：
- 在线指示器：绿色圆点，位于头像右下角
- 未读徽章：红色圆形徽章，位于头像右上角

### 4. 消息列表组件 (`src/components/base/chat/ChatMessageList.vue`)

已经在处理消息时接收 `isOnline` 和 `unreadCount` 字段：

```javascript
if (wsMessage.type === 'message') {
  const { isOnline, unreadCount } = wsMessage;
  
  const message = {
    // ... 其他字段
    isOnline: isOnline,
    unreadCount: unreadCount
  };
}
```

## 服务端返回数据格式

### 在线状态查询响应
```json
{
  "type": "onlineStatus",
  "onlineStatus": {
    "123456": true,
    "789012": false,
    "345678": true
  },
  "timestamp": "2026-02-03T10:30:00"
}
```

### 消息响应（包含在线状态和未读数）
```json
{
  "type": "message",
  "senderId": 123456,
  "receiverId": 789012,
  "content": "你好",
  "messageId": 1001,
  "timestamp": "2026-02-03T10:30:00",
  "isOnline": true,
  "unreadCount": 3
}
```

## 功能特点

1. **自动查询**：加载会话列表时自动批量查询所有用户的在线状态
2. **实时更新**：通过 WebSocket 实时接收在线状态变化
3. **视觉反馈**：在线用户显示绿色圆点指示器
4. **未读提醒**：显示未读消息数量，超过99显示"99+"
5. **性能优化**：使用批量查询减少网络请求
6. **双向消息处理**：正确区分发送和接收的消息，避免重复处理

## 使用场景

- 用户打开聊天页面时，自动查询所有会话中用户的在线状态
- 发送消息时，服务端返回对方的在线状态和未读消息数
- 接收消息时，更新会话的未读数量和对方在线状态
- 实时显示用户是否在线，方便用户判断对方是否能及时回复
