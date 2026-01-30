<template>
  <div class="step-confirm">
    <div class="step-header">
      <p>请确认您的注册信息</p>
    </div>

    <a-input v-model="formData.username" placeholder="用户名" size="large" disabled style="margin-bottom: 16px" />
    <a-input v-model="formData.email" placeholder="邮箱" size="large" disabled style="margin-bottom: 24px" />

    <a-checkbox v-model="agree" style="margin-bottom: 24px">
      我已阅读并同意
      <a-link>《用户协议》</a-link>
      和
      <a-link>《隐私政策》</a-link>
    </a-checkbox>

    <a-button type="primary" size="large" long :loading="loading" @click="handleSubmit">
      完成注册
    </a-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '@/api'
const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  token: {
    type: String
  }
})

const emit = defineEmits(['next'])

const agree = ref(true)
const loading = ref(false)

const handleSubmit = async () => {
  if (!agree.value) {
    Message.warning('请先阅读并同意用户协议和隐私政策')
    return
  }
  loading.value = true;
  try {
    const { data } = await api.post('/user/register', {
      token: props.token,
      step: 4
    })
    emit('next', data, true)
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="less">
.step-confirm {
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
</style>
