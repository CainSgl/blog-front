<template>
  <div class="step-password">
    <div class="step-header">
      <p>请创建一个安全的密码</p>
    </div>
    <a-input-password v-model="password" placeholder="输入密码（至少6位）" size="large" allow-clear autofocus :error="!!errorMsg"
      @press-enter="handleNext">
      <template #prefix>
        <icon-lock />
      </template>
    </a-input-password>
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <a-input-password v-model="confirmPassword" placeholder="确认密码" size="large" allow-clear :error="!!errorMsg"
      @press-enter="handleNext" style="margin-top: 16px">
      <template #prefix>
        <icon-lock />
      </template>
    </a-input-password>
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
import {ref} from 'vue'
import {IconLock} from '@arco-design/web-vue/es/icon'
import api from '@/api'

const props = defineProps({
  password: {
    type: String,
    default: ''
  },
  confirmPassword: {
    type: String,
    default: ''
  },
  token:{
    type:String
  }
})

const emit = defineEmits(['next', 'back'])

const password = ref(props.password)
const confirmPassword = ref(props.confirmPassword)
const errorMsg = ref('')
const loading = ref(false)

const handleNext = async () => {
  const pwd = password.value?.trim()
  const confirmPwd = confirmPassword.value?.trim()

  if (!pwd) {
    errorMsg.value = '请输入密码'
    return
  }

  if (pwd.length < 6) {
    errorMsg.value = '密码至少6位'
    return
  }

  if (!confirmPwd) {
    errorMsg.value = '请再次输入密码'
    return
  }

  if (pwd !== confirmPwd) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  try {
    errorMsg.value = ''
    const { data } = await api.post('/user/register', {
      password: pwd,
      step: 3,
      token: props.token
    })
    if (data?.msg) {
      errorMsg.value = data.msg
      return;
    }
    emit('next', { password: pwd, confirmPassword: confirmPwd }, true)
  } finally {
    loading.value = false;
  }

}

const handleBack = () => {
  emit('back')
}
</script>

<style scoped lang="less">
.step-password {
  width: 100%;
}

.step-header {
  text-align: center;
  margin-bottom: 40px;

  p {
    font-size: @font-size-title-1;
    color: @color-text-3;
  }
}

.error-msg {
  color: @danger-6;
  font-size: @font-size-body-3;
  margin-top: @size-2;
}
</style>
