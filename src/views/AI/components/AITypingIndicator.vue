<template>
  <div class="message-item ai-message">
    <div class="message-avatar">
      <div class="ai-avatar">
        <img src="@/assets/AI-icon.webp" alt="AI" />
      </div>
    </div>
    <div class="message-content">
      <!-- 检索过程 -->
      <AIRetrievalProcess 
        v-if="retrievalStages.length > 0"
        :stages="retrievalStages"
        :is-complete="false"
      />
      
      <!-- 思考过程 -->
      <div v-if="reasoningContent" class="reasoning-process">
        <div class="reasoning-header" @click="toggleReasoning">
          <div class="reasoning-title">
            <icon-bulb />
            <span>思考过程</span>
          </div>
          <icon-down :class="{ rotated: !isReasoningCollapsed }" />
        </div>
        <div v-show="!isReasoningCollapsed" class="reasoning-content">
          <AIMarkdownRenderer :content="reasoningContent" />
          <span class="cursor-blink">|</span>
        </div>
      </div>
      
      <!-- 实时内容或打字指示器 -->
      <div v-if="streamingContent" class="message-bubble streaming-content">
        <AIMarkdownRenderer :content="streamingContent" />
        <span class="cursor-blink">|</span>
      </div>
      <div v-else-if="retrievalStages.length === 0 && !reasoningContent" class="message-bubble typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { IconBulb, IconDown } from '@arco-design/web-vue/es/icon';
import AIRetrievalProcess from './AIRetrievalProcess.vue';
import AIMarkdownRenderer from './AIMarkdownRenderer.vue';

const props = defineProps({
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
  }
});

const isReasoningCollapsed = ref(true); // 默认收起

const toggleReasoning = () => {
  isReasoningCollapsed.value = !isReasoningCollapsed.value;
};
</script>

<style scoped lang="less">
.message-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;

  .message-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;

    .ai-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

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

    .message-bubble {
      padding: 14px 18px;
      border-radius: 16px;

      &.streaming-content {
        background-color: transparent;
        color: var(--color-text-1);
        padding: 0;
        overflow-wrap: break-word;
        min-height: 24px; // 防止高度跳变

        .cursor-blink {
          display: inline-block;
          animation: blink 1s infinite;
          margin-left: 2px;
        }
      }

      &.typing-indicator {
        display: flex;
        gap: 6px;
        align-items: center;
        padding: 18px 24px;
        background-color: transparent;

        span {
          width: 8px;
          height: 8px;
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

        .cursor-blink {
          display: inline-block;
          animation: blink 1s infinite;
          margin-left: 2px;
        }
      }
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

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
