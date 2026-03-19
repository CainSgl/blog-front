<template>
  <div 
    class="message-item"
    :class="{ 
      'user-message': message.role === 'user', 
      'ai-message': message.role === 'assistant' 
    }"
  >
    <div class="message-avatar">
      <Avatar v-if="message.role === 'user'" :src="userInfo?.avatarUrl" :size="40" />
      <div v-else class="ai-avatar">
        <img src="@/assets/AI-icon.webp" alt="AI" />
      </div>
    </div>
    <div class="message-content">
      <!-- AI 消息的检索过程 -->
      <AIRetrievalProcess 
        v-if="message.role === 'assistant' && message.retrievalStages && message.retrievalStages.length > 0"
        :stages="message.retrievalStages"
        :is-complete="true"
      />
      
      <!-- AI 消息的思考过程 -->
      <div v-if="message.role === 'assistant' && message.reasoningContent" class="reasoning-process">
        <div class="reasoning-header" @click="toggleReasoning">
          <div class="reasoning-title">
            <icon-bulb />
            <span>思考过程</span>
          </div>
          <icon-down :class="{ rotated: !isReasoningCollapsed }" />
        </div>
        <div v-show="!isReasoningCollapsed" class="reasoning-content">
          <AIMarkdownRenderer :content="message.reasoningContent" />
        </div>
      </div>
      
      <!-- 消息内容 -->
      <div class="message-bubble">
        <template v-if="message.role === 'user'">
          {{ message.content }}
        </template>
        <AIMarkdownRenderer v-else :content="message.content" />
      </div>
      <!-- 补充建议 -->
      <transition name="suggestions-fade">
        <div v-if="message.role === 'assistant' && (message.isGeneratingSuggestions || message.suggestions)" class="suggestions-container">
          <div v-if="message.isGeneratingSuggestions" class="suggestions-loading">
            <div class="suggestion-placeholder"></div>
            <div class="suggestion-placeholder"></div>
            <div class="suggestion-placeholder"></div>
          </div>
          <transition-group v-else-if="message.suggestions && message.suggestions.length > 0" name="suggestion-item" tag="div" class="suggestions-list">
            <button
              v-for="(suggestion, index) in visibleSuggestions"
              :key="suggestion"
              class="suggestion-item"
              @click="handleSuggestionClick(suggestion, index)"
            >
              {{ suggestion }}
            </button>
          </transition-group>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { IconBulb, IconDown } from '@arco-design/web-vue/es/icon';
import Avatar from '@/components/base/avatar/Avatar.vue';
import AIRetrievalProcess from './AIRetrievalProcess.vue';
import AIMarkdownRenderer from './AIMarkdownRenderer.vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  userInfo: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['send-suggestion']);

const isReasoningCollapsed = ref(true); // 默认收起
const visibleSuggestions = ref([]);
const clickedIndex = ref(null);

const toggleReasoning = () => {
  isReasoningCollapsed.value = !isReasoningCollapsed.value;
};

const handleSuggestionClick = (suggestion, index) => {
  clickedIndex.value = index;
  
  // 先从可见列表中移除这个建议（触发动画）
  visibleSuggestions.value = visibleSuggestions.value.filter((_, i) => i !== index);
  
  // 等待动画完成后发送消息
  setTimeout(() => {
    emit('send-suggestion', suggestion);
    clickedIndex.value = null;
  }, 300); // 与 CSS 动画时间匹配
};

// 监听 message.suggestions 的变化，更新可见建议列表
watch(() => props.message.suggestions, (newSuggestions) => {
  if (newSuggestions && newSuggestions.length > 0) {
    visibleSuggestions.value = [...newSuggestions];
  } else {
    visibleSuggestions.value = [];
  }
}, { immediate: true });

// 监听 message 的变化
watch(() => props.message, (newVal) => {
  if (newVal.role === 'assistant') {
    console.log('AIMessageItem - 消息更新:', {
      id: newVal.id,
      hasSuggestions: !!newVal.suggestions,
      suggestions: newVal.suggestions,
      isGeneratingSuggestions: newVal.isGeneratingSuggestions
    });
  }
}, { deep: true, immediate: true });
</script>

<style scoped lang="less">
.message-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 8px;
  }

  &.user-message {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;

      .message-bubble {
        background-color: rgb(var(--primary-6));
        color: white;
      }
    }
  }

  &.ai-message {
    .message-bubble {
      background-color: transparent;
      color: var(--color-text-1);
      padding: 0;
    }
  }

  .message-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;

    @media (max-width: 480px) {
      width: 32px;
      height: 32px;
    }

    .ai-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      @media (max-width: 480px) {
        width: 32px;
        height: 32px;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    max-width: calc(100% - 56px);
    min-width: 0;
    overflow: hidden;

    @media (max-width: 480px) {
      max-width: calc(100% - 40px);
    }

    .message-bubble {
      padding: 14px 18px;
      border-radius: 16px;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
      box-sizing: border-box;

      @media (max-width: 480px) {
        padding: 10px 14px;
        border-radius: 12px;
      }
    }

    .reasoning-process {
      background-color: var(--color-fill-1);
      border: 1px solid var(--color-border-2);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 8px;

      .reasoning-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: var(--color-fill-2);
        border-bottom: 1px solid var(--color-border-2);
        cursor: pointer;
        user-select: none;
        transition: all 0.2s;

        &:hover {
          background-color: var(--color-fill-3);
        }

        .reasoning-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-2);

          svg {
            font-size: 14px;
            color: rgb(var(--warning-6));
          }
        }

        .arco-icon-down {
          font-size: 12px;
          color: var(--color-text-3);
          transition: transform 0.3s;

          &.rotated {
            transform: rotate(-180deg);
          }
        }
      }

      .reasoning-content {
        padding: 12px 16px;
        color: var(--color-text-2);
        font-size: 13px;
        line-height: 1.6;
        overflow-wrap: break-word;
      }
    }

    .suggestions-container {
      margin-top: 12px;

      .suggestions-loading {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .suggestion-placeholder {
          height: 36px;
          background: linear-gradient(
            90deg,
            var(--color-fill-2) 25%,
            var(--color-fill-3) 50%,
            var(--color-fill-2) 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s ease-in-out infinite;
          border-radius: 8px;
          border: 1px solid var(--color-border-2);
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      }

      .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .suggestion-item {
          padding: 10px 14px;
          background-color: var(--color-fill-1);
          border: 1px solid var(--color-border-2);
          border-radius: 8px;
          color: var(--color-text-2);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          line-height: 1.5;

          &:hover {
            background-color: var(--color-fill-2);
            border-color: rgb(var(--primary-6));
            color: rgb(var(--primary-6));
            transform: translateX(4px);
          }

          &:active {
            transform: translateX(2px);
          }
        }
      }
    }
  }
}

// 建议容器淡入淡出动画
.suggestions-fade-enter-active,
.suggestions-fade-leave-active {
  transition: all 0.3s ease;
}

.suggestions-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.suggestions-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

// 单个建议项的动画
.suggestion-item-enter-active {
  transition: all 0.3s ease;
}

.suggestion-item-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}

.suggestion-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.suggestion-item-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.9);
}

.suggestion-item-move {
  transition: transform 0.3s ease;
}
</style>
