<template>
  <a-modal v-model:visible="visible" title="Bilibili 登录" :width="500" @cancel="handleCancel" :footer="true">
    <div class="bilibili-login-content">
      <div class="token-section">
        <div class="label">Token（自动生成）</div>
        <a-typography-paragraph :copyable="token ? true : false" class="token-display">
          {{ token || '获取中...' }}
        </a-typography-paragraph>
      </div>

      <div class="uid-section">
        <div class="label">请输入 Bilibili UID</div>
        <a-input v-model="uid" placeholder="请输入您的 Bilibili UID" size="large" :max-length="20" allow-clear />
      </div>

      <!-- 错误信息显示 -->
      <div v-if="errorMsg" class="error-message">
        {{ errorMsg }}
      </div>
    </div>
    <a-link :href="'https://www.yuque.com/leifengyang/springboot3/rg4wqgdbg8mfv04q'" target="_ablank">
      点我查看如何操作
    </a-link>

    <template #footer>

      <div class="modal-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" :loading="loginLoading" @click="handleOk">确认登录</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '@/api'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const visible = defineModel('visible', { type: Boolean, default: false })
const token = ref('')
const uid = ref('')
const loading = ref(false)
const loginLoading = ref(false)
const errorMsg = ref('')

// 监听弹窗打开，获取 token
watch(visible, async (newVal) => {
  if (newVal) {
    loading.value = true
    errorMsg.value = ''
    try {
      if (token.value) {
        return;
      }
      const { data } = await api.get('/user/auth/o/bilibili')
      token.value = data.token || data
    } catch (error) {
      console.error('获取 Bilibili token 失败:', error)
      token.value = '获取失败，请重试'
      Message.error('获取 Token 失败，请重试')
    } finally {
      loading.value = false
    }
  } else {
    // 关闭时重置
    uid.value = ''
    errorMsg.value = ''
  }
})

const handleCancel = () => {
  visible.value = false
}

const handleOk = async () => {
  if (!uid.value) {
    Message.warning('请输入 Bilibili UID')
    return
  }

  // 清除之前的错误信息
  errorMsg.value = ''
  loginLoading.value = true

  try {
    const { data } = await api.get('/user/auth/o/bilibili/fine', {
      token: token.value,
      uid: uid.value
    })

    // 如果返回的数据中有 msg，说明是错误信息
    if (data.msg) {
      errorMsg.value = data.msg
      if (data.modal) {
        Message.warning(data.modal)
      }
      if (data.token) {
        token.value = data.token
      }
      return
    }
    console.log(data)
  } catch (error) {
    console.error('Bilibili 登录失败:', error)
    errorMsg.value = error.msg || '登录失败，请重试'
  } finally {
    loginLoading.value = false
  }
}
</script>

<style scoped lang="less">
.bilibili-login-content {
  padding: 20px 0;

  .token-section,
  .uid-section {
    margin-bottom: 24px;

    .label {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.85);
      margin-bottom: 8px;
      font-weight: 500;
    }
  }

  .token-display {
    background: #f5f5f5;
    padding: 12px 16px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #333;
    word-break: break-all;
    margin-bottom: 0;

    :deep(.arco-typography) {
      margin-bottom: 0;
    }
  }

  .error-message {
    color: @danger-6;
    font-size: @font-size-body-3;
    margin-top: 12px;
    padding: 8px 12px;
    background-color: @danger-1;
    border-radius: @border-radius-small;
    border: 1px solid @danger-2;
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 0 0;
}
</style>
