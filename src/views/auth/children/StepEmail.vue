<template>
  <div class="step-email">
    <div class="step-header">
      <p>请输入邮箱地址，目前未实现检验功能</p><a-link  @click="handleNextNoV">一键跳过</a-link>
    </div>
    <a-input v-model="email" placeholder="输入邮箱地址" size="large" allow-clear autofocus
      :error="!!errorMsg" @press-enter="handleNext" />
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <a-space direction="vertical" fill style="margin-top: 24px">
      <a-button type="primary" size="large" long :loading="loading" @click="handleNext">
        下一步
      </a-button>
      <a-button size="large" long @click="handleBack">
        返回
      </a-button>
    </a-space>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api'
import { Message } from '@arco-design/web-vue'

const props = defineProps({
  formData: {
    type: String,
    default: ''
  },
  token:{
    type:String
  }
})

const emit = defineEmits(['next', 'back'])

const email = ref(props.formData.email)
const errorMsg = ref('')
const loading = ref(false)

const handleNextNoV = () => {
  emit('next', { email: email.value })
}

const handleBack = () => {
  emit('back')
}


const handleNext = async () => {
  const trimmed = email.value?.trim()

  if (!trimmed) {
    errorMsg.value = '请输入邮箱'
    return
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }

  errorMsg.value = ''
  loading.value = true

  try {
    const { data } = await api.post('/user/register', {
      email: trimmed,
      token: props.token,
      step: 2
    })
    if (data?.msg) {
      errorMsg.value = data.msg
      return;
    }
    emit('next', { ...data, email: trimmed }, true)
  } catch (error) {
    errorMsg.value = error.message || '验证失败，请重试'
    Message.error('验证失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
.step-email {
  width: 100%;
}

.step-header {
  text-align: center;
  margin-bottom: 40px;

  p {
    font-size: 16px;
    color: @color-text-3;
  }
}

.error-msg {
  color: rgb(var(--danger-6));
  font-size: 14px;
  margin-top: 8px;
}
</style>
