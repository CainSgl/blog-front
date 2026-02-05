# 聊天功能使用指南

## 功能概述

聊天功能已完全实现，支持用户之间的实时聊天。主要特性包括：

- ✅ 实时消息推送（WebSocket）
- ✅ 消息已读状态
- ✅ 正在输入提示
- ✅ 会话列表管理
- ✅ 消息分页加载
- ✅ 未读消息统计
- ✅ 互相关注限制
- ✅ 会话删除

## 文件结构

```
src/
├── store/
│   └── chat.js                          # 聊天状态管理
├── services/
│   ├── chatService.js                   # REST API 服务
│   └── chatWebSocket.js                 # WebSocket 客户端
├── views/messages/
│   ├── children/
│   │   └── Message.vue                  # 聊天主页面
│   └── components/
│       ├── ChatSessionList.vue          # 会话列表组件
│       └── ChatWindow.vue               # 聊天窗口组件
├── components/base/avatar/
│   └── AvatarWithUserId.vue            # 头像包装组件
└── utils/
    └── chatHelper.js                    # 聊天辅助函数
```

## 使用方法

### 1. 在消息页面使用

用户访问 `/messages/message` 路由即可使用聊天功能。

### 2. 从其他页面打开聊天

在任何组件中，可以使用 `openChatWithUser` 函数打开与指定用户的聊天：

```vue
<template>
  <a-button @click="handleChat">发消息</a-button>
</template>

<script setup>
import { openChatWithUser } from '@/utils/chatHelper';

const props = defineProps({
  userId: Number
});

function handleChat() {
  openChatWithUser(props.userId);
}
</script>
```

### 3. 获取未读消息数量

```javascript
import { useChatStore } from '@/store/chat';

const chatStore = useChatStore();
const unreadCount = chatStore.unreadCount;
```

## API 说明

### ChatStore 方法

- `init()` - 初始化聊天（连接 WebSocket，加载会话列表）
- `openSession(otherUserId)` - 打开与指定用户的会话
- `sendMessage(content)` - 发送消息
- `markSessionAsRead(sessionId)` - 标记会话已读
- `deleteSession(sessionId)` - 删除会话
- `sendTyping()` - 发送正在输入状态
- `cleanup()` - 清理（断开连接）

### ChatService 方法

- `getSessions()` - 获取会话列表
- `createSession(otherUserId)` - 创建或获取会话
- `deleteSession(sessionId)` - 删除会话
- `getMessages(sessionId, page, pageSize)` - 获取消息列表
- `sendMessage(receiverId, content)` - 发送消息（REST）
- `markAsRead(sessionId)` - 标记已读
- `getUnreadCount()` - 获取未读数量

### ChatWebSocket 方法

- `connect(token)` - 连接 WebSocket
- `sendMessage(receiverId, content)` - 发送消息
- `markAsRead(sessionId)` - 标记已读
- `sendTyping(receiverId)` - 发送正在输入
- `disconnect()` - 断开连接
- `onMessage(handler)` - 监听消息
- `onConnection(handler)` - 监听连接状态

## 业务规则

### 互相关注限制

只有互相关注的用户才能创建聊天会话。如果尝试与未互相关注的用户聊天，会返回 403 错误。

### 会话删除

- 用户可以删除自己参与的任何会话
- 删除会话会级联删除该会话的所有消息
- 只能删除自己参与的会话

### 离线消息

- 接收方不在线时，消息会保存到数据库
- Redis 中的 `msgMessageCount` 会自动增加
- 用户上线后可以通过 REST API 获取历史消息

### 已读状态

- 用户打开会话时自动标记已读
- 标记已读会减少 Redis 中的未读计数
- 已读状态会实时同步给发送方

## 注意事项

1. **WebSocket 连接**：需要在 URL 参数中传递 token
2. **自动重连**：WebSocket 断开后会自动尝试重连（最多 5 次）
3. **降级处理**：WebSocket 不可用时自动降级到 REST API
4. **消息顺序**：消息按时间倒序返回（最新的在前）
5. **分页加载**：滚动到顶部时自动加载更多历史消息

## 示例：在用户主页添加发消息按钮

```vue
<template>
  <div class="user-actions">
    <FollowButton :user-id="userId" />
    <a-button type="primary" @click="handleSendMessage">
      <icon-message />
      发消息
    </a-button>
  </div>
</template>

<script setup>
import { IconMessage } from '@arco-design/web-vue/es/icon';
import { openChatWithUser } from '@/utils/chatHelper';
import FollowButton from '@/components/base/follow/FollowButton.vue';

const props = defineProps({
  userId: {
    type: Number,
    required: true
  }
});

function handleSendMessage() {
  openChatWithUser(props.userId);
}
</script>
```

## 后续优化建议

1. **消息类型扩展**：支持图片、文件、表情等
2. **消息撤回**：允许用户撤回已发送的消息
3. **消息搜索**：在会话中搜索历史消息
4. **群聊功能**：支持多人群聊
5. **消息通知**：浏览器通知、声音提示等
6. **消息加密**：端到端加密保护隐私
