<template>
  <div class="input-area">
    <div class="input-wrapper" :class="{ focused: isInputFocused }">
      <!-- 文本输入框 -->
      <a-textarea
        v-model="inputValue"
        placeholder="输入消息，按 Enter 发送..."
        :auto-size="{ minRows: 1, maxRows: 6 }"
        :max-length="2000"
        @keydown.enter.exact.prevent="handleSend"
        @focus="isInputFocused = true"
        @blur="isInputFocused = false"
      />
      
      <!-- 底部配置栏 -->
      <div class="input-footer">
        <div class="config-options">
          <!-- 记忆选项 -->
          <div class="config-item">
            <span class="config-label">记忆</span>
            <a-switch v-model="configValue.memory" size="small" />
          </div>

          <!-- RAG选项 -->
          <div class="config-item">
            <span class="config-label">RAG</span>
            <a-select 
              v-model="configValue.rag" 
              size="small" 
              style="width: 100px;"
              :popup-container="'body'"
            >
              <a-option value="auto" label="自动">
                <div class="option-content">
                  <div class="option-title">自动</div>
                  <div class="option-desc">自动判断</div>
                </div>
              </a-option>
              <a-option value="on" label="开">
                <div class="option-content">
                  <div class="option-title">开</div>
                  <div class="option-desc">始终检索</div>
                </div>
              </a-option>
              <a-option value="off" label="关">
                <div class="option-content">
                  <div class="option-title">关</div>
                  <div class="option-desc">始终不检索</div>
                </div>
              </a-option>
            </a-select>
          </div>

          <!-- 模型选择 -->
          <div class="config-item">
            <span class="config-label">模型</span>
            <a-select v-model="configValue.model" size="small" style="width: 80px;">
              <a-option value="auto">自动</a-option>
              <a-option value="mini">Mini</a-option>
              <a-option value="lite">Lite</a-option>
              <a-option value="pro">Pro</a-option>
            </a-select>
          </div>
        </div>

        <div class="input-actions">
          <a-button 
            type="primary" 
            size="small"
            @click="handleSend"
            :disabled="!inputValue.trim() || disabled"
            :loading="disabled"
          >
            <template #icon>
              <icon-send />
            </template>
            发送
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { IconSend } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['send', 'update:config']);

const inputValue = ref('');
const isInputFocused = ref(false);

const configValue = computed({
  get: () => props.config,
  set: (val) => emit('update:config', val)
});

const handleSend = () => {
  if (!inputValue.value.trim() || props.disabled) return;
  
  emit('send', inputValue.value.trim());
  inputValue.value = '';
};
</script>

<style scoped lang="less">
.input-area {
  position: sticky;
  bottom: 0;
  padding: 20px 32px 32px;
  background: linear-gradient(to bottom, transparent, var(--color-bg-1) 20px);
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  z-index: 10;

  .input-wrapper {
    border: 1px solid var(--color-border-2);
    border-radius: 12px;
    background-color: var(--color-bg-2);
    transition: all 0.2s;
    overflow: hidden;

    &.focused {
      border-color: rgb(var(--primary-6));
      box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.1);
    }

    :deep(.arco-textarea-wrapper) {
      background: transparent;
      border: none;
      padding: 16px 16px 0;

      .arco-textarea {
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
        font-size: 15px;
        line-height: 1.6;

        &:focus {
          background: transparent;
          border: none;
          box-shadow: none;
        }

        &::placeholder {
          color: var(--color-text-3);
        }
      }
    }

    .input-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background-color: transparent;

      .config-options {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;

        .config-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .config-label {
            font-size: 13px;
            color: var(--color-text-2);
            white-space: nowrap;
          }
        }
      }

      .input-actions {
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
