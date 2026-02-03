# 聊天功能使用说明

## 功能特点

- ✅ 左右分栏布局：左侧会话列表，右侧消息内容
- ✅ 100dvh 全屏高度
- ✅ CSS `flex-direction: column-reverse` 实现消息倒序显示（新消息在下方）
- ✅ Intersection Observer API 实现滚动加载历史消息
- ✅ WebSocket 实时消息推送
- ✅ 组件化设计，易于维护

## 文件结构

```
src/
├── services/
│   ├── chatService.js          # REST API 服务
│   └── chatWebSocket.js        # WebSocket 服务
├── components/base/chat/
│   ├── ChatSessionList.vue     # 会话列表容器
│   ├── ChatSessionItem.vue     # 单个会话项
│   ├── ChatMessageList.vue     # 消息列表容器
│   └── ChatMessageItem.vue     # 单个消息项
└── views/messages/children/
    └── Message.vue             # 聊天主页面
```

## 核心实现

### 1. 消息倒序显示

使用 CSS 的 `flex-direction: column-reverse` 实现：

```css
.message-list-content {
  display: flex;
  flex-direction: column-reverse;
  overflow-y: auto;
}
```

这样新消息会自动出现在底部，无需手动滚动。

### 2. 滚动加载历史消息

在消息列表顶部放置观察目标：

```vue
<div ref="observerTarget" class="observer-target"></div>
```

使用 Intersection Observer 监听：

```javascript
observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        emit('loadMore');
      }
    });
  },
  { threshold: 0.1 }
);
observer.observe(observerTarget.value);
```

当用户滚动到顶部时，自动触发 `loadMore` 事件加载更多历史消息。

### 3. WebSocket 实时通信

- 连接：`chatWebSocket.connect(token)`
- 发送消息：`chatWebSocket.sendMessage(receiverId, content)`
- 接收消息：`chatWebSocket.onMessage(handler)`

## 使用方式

1. 在路由中配置聊天页面
2. 用户登录后自动连接 WebSocket
3. 点击会话列表中的会话，加载消息
4. 输入框输入消息，按回车或点击发送按钮发送
5. 滚动到顶部自动加载历史消息

## API 对接

确保后端 API 符合以下规范：

- `GET /chat/sessions?lastId={lastId}` - 获取会话列表
- `POST /chat/messages` - 获取消息列表
- `POST /chat/session?otherUserId={otherUserId}` - 创建会话
- `ws://your-domain/ws/chat?token={token}` - WebSocket 连接

## 注意事项

- 使用 `100dvh` 确保在移动端也能正确显示全屏高度
- 消息列表使用 `column-reverse` 后，滚动条在顶部加载更多
- WebSocket 断线会自动重连（3秒后）
- 未读消息数会在会话列表中显示红色徽章


## ChatButton 通用组件

### 功能

通用的私信按钮组件，点击后自动创建会话并跳转到聊天页面。

### 使用方式

```vue
<template>
  <!-- 默认样式 -->
  <ChatButton :user-id="userId" />
  
  <!-- 自定义文字 -->
  <ChatButton :user-id="userId" text="发消息" />
  
  <!-- 带图标 -->
  <ChatButton :user-id="userId" :show-icon="true" />
  
  <!-- 主要按钮样式 -->
  <ChatButton :user-id="userId" type="primary" />
</template>

<script setup>
import ChatButton from '@/components/base/chat/ChatButton.vue';
</script>
```

### Props

| 参数 | 说明 | 类型 | 默认值 | 必填 |
|------|------|------|--------|------|
| userId | 对方用户ID | String/Number | - | 是 |
| text | 按钮文字 | String | '私信' | 否 |
| size | 按钮大小 | String | 'large' | 否 |
| type | 按钮类型 | String | 'default' | 否 |
| showIcon | 是否显示图标 | Boolean | false | 否 |

### 功能说明

1. 点击按钮后自动调用 `createSession` API 创建或获取会话
2. 创建成功后跳转到 `/messages/message?sessionId=xxx`
3. Message.vue 会自动打开对应的会话
4. 如果未关注对方，会提示"需要关注对方才能发起会话"
5. 按钮在请求过程中会显示 loading 状态

### 已集成位置

- ✅ 用户主页 (`src/views/user/children/home/Home.vue`)
