<template>
  <div class="step-username">
    <div class="step-header">
      <p>请输入用户名开始注册，用户名仅用于登录，后续不可修改</p>
    </div>
    <a-input v-model="username" placeholder="输入用户名（4-50个字符）" size="large" allow-clear autofocus :max-length="50"
      :error="!!errorMsg" @press-enter="handleNext" />
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <a-button type="primary" size="large" long :loading="loading" @click="handleNext" style="margin-top: 24px">
      下一步
    </a-button>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import api from '@/api'
import {Message} from '@arco-design/web-vue'

const props = defineProps({
  username: {
    type: String,
    default: ''
  },
  formData:{
    type:Object,
    default:{}
  },
  token:{
    type:String
  }
})

const emit = defineEmits(['next'])

const username = ref(props.formData.username)
const errorMsg = ref('')
const loading = ref(false)

const handleNext = async () => {
  const trimmed = username.value?.trim()

  if (!trimmed) {
    errorMsg.value = '请输入用户名'
    return
  }

  if (trimmed.length < 4) {
    errorMsg.value = '用户名至少4个字符'
    return
  }

  if (trimmed.length > 50) {
    errorMsg.value = '用户名最多50个字符'
    return
  }

  errorMsg.value = ''
  loading.value = true

  try {
    const { data } = await api.post('/user/register', {
      username: trimmed,
      step: 1,
      token:props.token
    })
    if (data.msg) {
      errorMsg.value = data.msg
      return;
    }
    emit('next', { ...data, username: trimmed }, true)
  } catch (error) {
    errorMsg.value = error.message || '验证失败，请重试'
    Message.error('验证失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
.step-username {
  width: 100%;
}

.step-header {
  text-align: center;
  margin-bottom: 40px;

  p {
    font-size: 16px;
    color: var(--color-neutral-6);
  }
}

.error-msg {
  color: rgb(var(--danger-6));
  font-size: 14px;
  margin-top: 8px;
}
</style>
