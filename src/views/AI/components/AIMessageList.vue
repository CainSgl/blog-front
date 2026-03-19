<template>
  <div ref="messageListRef" class="message-list" @scroll="handleScroll">
    <!-- 顶部加载指示器 -->
    <div v-if="isLoadingHistory && messages.length > 0" class="loading-indicator">
      <a-spin size="small" />
      <span>加载历史消息...</span>
    </div>
    
    <!-- 顶部加载触发器 -->
    <div ref="topObserverRef" class="top-observer"></div>
    
    <!-- 空状态 -->
    <div v-if="messages.length === 0 && !isLoadingHistory" class="empty-message">
      <div class="empty-icon">
        <a-avatar :size="64">
          <img src="@/assets/AI-icon.webp" alt="AI" />
        </a-avatar>
      </div>
      <p>你好！我是cainsgl的小助手，有什么可以帮你的吗？(≧∇≦)ﾉ</p>
    </div>
    
    <!-- 初始加载状态 -->
    <div v-if="messages.length === 0 && isLoadingHistory" class="initial-loading">
      <a-spin size="large" />
      <p>加载历史消息...</p>
    </div>

    <!-- 消息列表 -->
    <AIMessageItem
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :user-info="userInfo"
      @send-suggestion="handleSuggestionClick"
    />

    <!-- AI正在输入 -->
    <AITypingIndicator 
      v-if="isTyping" 
      :retrieval-stages="retrievalStages"
      :streaming-content="streamingContent"
      :reasoning-content="reasoningContent"
    />
    
    <!-- 底部占位，确保滚动到底部时有足够空间 -->
    <div ref="bottomObserverRef" class="bottom-observer"></div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import AIMessageItem from './AIMessageItem.vue';
import AITypingIndicator from './AITypingIndicator.vue';

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  isTyping: {
    type: Boolean,
    default: false
  },
  retrievalStages: {
    type: Array,
    default: () => []
  },
  streamingContent: {
    type: String,
    default: ''
  },
  reasoningContent: {
    type: String,
    default: ''
  },
  userInfo: {
    type: Object,
    default: null
  },
  hasMoreHistory: {
    type: Boolean,
    default: true
  },
  isLoadingHistory: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['load-history', 'send-suggestion']);

const messageListRef = ref(null);
const topObserverRef = ref(null);
const bottomObserverRef = ref(null);

const shouldAutoScroll = ref(true);
const isInitialLoad = ref(true);
const userIsScrolling = ref(false); // 用户是否正在滚动
let userScrollTimer = null;

let topObserver = null;
let bottomObserver = null;

// 处理建议点击
const handleSuggestionClick = (suggestion) => {
  emit('send-suggestion', suggestion);
};

// 滚动到底部
const scrollToBottom = (smooth = false) => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTo({
        top: messageListRef.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  });
};

// 处理滚动事件
const handleScroll = () => {
  if (!messageListRef.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = messageListRef.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  // 更新是否应该自动滚动（距离底部小于100px时才自动滚动）
  shouldAutoScroll.value = distanceFromBottom < 100;
  
  // 标记用户正在滚动
  userIsScrolling.value = true;
  
  // 清除之前的定时器
  if (userScrollTimer) {
    clearTimeout(userScrollTimer);
  }
  
  // 500ms 后认为用户停止滚动
  userScrollTimer = setTimeout(() => {
    userIsScrolling.value = false;
  }, 500);
};

// 检查是否需要继续加载（循环检测）
const checkAndLoadMore = async () => {
  if (!messageListRef.value || props.isLoadingHistory || !props.hasMoreHistory) {
    console.log('停止检查加载:', { 
      hasRef: !!messageListRef.value, 
      isLoading: props.isLoadingHistory, 
      hasMore: props.hasMoreHistory 
    });
    return;
  }
  
  await nextTick();
  
  const { scrollHeight, clientHeight } = messageListRef.value;
  
  // 如果内容不足以填满容器，继续加载
  if (scrollHeight <= clientHeight && props.messages.length > 0) {
    console.log('内容不足，继续加载历史消息');
    await loadHistoryMessages();
  }
};

// 加载历史消息
const loadHistoryMessages = async () => {
  if (props.isLoadingHistory || !props.hasMoreHistory) {
    console.log('跳过加载历史消息:', { 
      isLoading: props.isLoadingHistory, 
      hasMore: props.hasMoreHistory 
    });
    return;
  }
  
  console.log('触发加载历史消息');
  
  // 记录当前第一条消息的元素
  const firstMessageBefore = messageListRef.value?.querySelector('.message-item');
  
  // 触发加载
  emit('load-history');
  
  // 等待加载完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 等待 DOM 更新
  await nextTick();
  
  // 如果不是初次加载，保持在原来的消息位置
  if (!isInitialLoad.value && firstMessageBefore && messageListRef.value) {
    const firstMessageAfter = messageListRef.value.querySelector('.message-item');
    if (firstMessageAfter) {
      firstMessageAfter.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
  
  // 加载完成后检查是否需要继续加载
  await checkAndLoadMore();
};

// 初始化 Intersection Observer
const initObservers = () => {
  if (topObserverRef.value) {
    topObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 只有在非初始加载、有消息、有更多历史、且不在加载中时才触发
          if (entry.isIntersecting && 
              !isInitialLoad.value && 
              props.messages.length > 0 && 
              props.hasMoreHistory && 
              !props.isLoadingHistory) {
            console.log('顶部观察器触发加载');
            loadHistoryMessages();
          }
        });
      },
      {
        root: messageListRef.value,
        rootMargin: '200px', // 提前200px触发加载
        threshold: 0.1
      }
    );
    topObserver.observe(topObserverRef.value);
  }

  if (bottomObserverRef.value) {
    bottomObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          shouldAutoScroll.value = entry.isIntersecting;
        });
      },
      {
        root: messageListRef.value,
        rootMargin: '0px',
        threshold: 0.1
      }
    );
    bottomObserver.observe(bottomObserverRef.value);
  }
};

// 清理 Observers
const cleanupObservers = () => {
  if (topObserver) {
    topObserver.disconnect();
    topObserver = null;
  }
  if (bottomObserver) {
    bottomObserver.disconnect();
    bottomObserver = null;
  }
};

// 防抖滚动
let scrollTimer = null;
const debouncedScrollToBottom = (smooth = true) => {
  // 如果用户正在滚动，不要自动滚动
  if (userIsScrolling.value) {
    return;
  }
  
  if (scrollTimer) {
    clearTimeout(scrollTimer);
  }
  scrollTimer = setTimeout(() => {
    scrollToBottom(smooth);
    scrollTimer = null;
  }, 50);
};

// 监听消息变化
watch(() => props.messages.length, (newLength, oldLength) => {
  if (shouldAutoScroll.value && newLength > oldLength) {
    // 新增消息时，等待 DOM 完全渲染后再滚动
    nextTick(() => {
      // 再次等待，确保 Markdown 渲染完成
      setTimeout(() => {
        // 初次加载历史消息时不带动画，其他时候带动画
        scrollToBottom(!isInitialLoad.value);
      }, 100);
    });
  }
  
  // 如果是新增消息（不是初次加载历史），检查是否需要加载更多
  if (newLength > oldLength && !isInitialLoad.value) {
    nextTick(() => {
      checkAndLoadMore();
    });
  }
});

// 监听 AI 输入状态、检索阶段、流式内容和思考过程变化
watch([() => props.isTyping, () => props.retrievalStages, () => props.streamingContent, () => props.reasoningContent], ([isTyping, stages, content, reasoning], [prevIsTyping]) => {
  // 只在流式输出过程中且用户没有滚动时才自动滚动
  if (isTyping && shouldAutoScroll.value && !userIsScrolling.value) {
    debouncedScrollToBottom(true);
  }
  // 当从 typing 变为非 typing 时，不立即滚动（等待新消息添加）
}, { deep: true });

onMounted(() => {
  nextTick(() => {
    initObservers();
    
    // 延迟标记初次加载完成，并检查是否需要加载更多
    setTimeout(async () => {
      isInitialLoad.value = false;
      // 只有在有更多历史且不在加载中时才检查
      if (props.hasMoreHistory && !props.isLoadingHistory) {
        await checkAndLoadMore();
      }
    }, 500);
  });
});

onUnmounted(() => {
  cleanupObservers();
  if (userScrollTimer) {
    clearTimeout(userScrollTimer);
  }
});

defineExpose({
  scrollToBottom
});
</script>

<style scoped lang="less">
.message-list {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  overflow-y: auto;
  overflow-x: hidden;

  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    color: var(--color-text-3);
    font-size: 14px;
    flex-shrink: 0;
  }

  .top-observer,
  .bottom-observer {
    height: 1px;
    flex-shrink: 0;
  }

  .empty-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-3);
    gap: 16px;

    .empty-icon {
      svg {
        opacity: 0.3;
      }
    }

    p {
      margin: 0;
      font-size: 16px;
    }
  }

  .initial-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    color: var(--color-text-3);
    font-size: 14px;
  }
}
</style>
