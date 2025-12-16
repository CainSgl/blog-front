<template>
  <a-form :model="codeLoginForm" @submit="handleCodeLogin">
    <a-form-item field="phone" label="手机号">
      <a-input
        v-model="codeLoginForm.phone"
        placeholder="请输入手机号"
        size="large"
        allow-clear
      />
    </a-form-item>
    
    <a-form-item field="code" label="验证码">
      <div class="code-input-wrapper">
        <a-input
          v-model="codeLoginForm.code"
          placeholder="请输入验证码"
          size="large"
          allow-clear
        />
        <a-button
          type="primary"
          size="large"
          :disabled="isCountingDown"
          @click="sendCode"
        >
          {{ countdownText }}
        </a-button>
      </div>
    </a-form-item>
    
    <a-form-item>
      <a-button
        type="primary"
        size="large"
        long
        :loading="isLoading"
        @click="handleCodeLogin"
      >
        登录
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();

// 定义组件属性
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['login-success']);

// 验证码登录表单数据
const codeLoginForm = reactive({
  phone: '',
  code: ''
});

// 验证码倒计时相关
const isCountingDown = ref(false);
const countdown = ref(60);
let countdownTimer = null;

const countdownText = computed(() => 
{
  return isCountingDown.value ? `${countdown.value}秒后重新获取` : '获取验证码';
});

// 发送验证码
const sendCode = () => 
{
  if (!codeLoginForm.phone) 
  {
    // 这里可以添加手机号验证提示
    return;
  }
  
  // 启动倒计时
  isCountingDown.value = true;
  countdown.value = 60;
  
  countdownTimer = setInterval(() => 
  {
    countdown.value--;
    if (countdown.value <= 0) 
    {
      clearInterval(countdownTimer);
      isCountingDown.value = false;
    }
  }, 1000);
};

// 处理验证码登录
const handleCodeLogin = async () => 
{
  if (!codeLoginForm.phone || !codeLoginForm.code) 
  {
    return;
  }
  
  // 这里应该调用验证码登录的接口
  // 暂时使用与密码登录相同的逻辑作为示例
  const loginData = {
    phone: codeLoginForm.phone,
    code: codeLoginForm.code
  };
  
  const result = await authStore.login(loginData);
  if (result.success) 
  {
    // 清空表单
    codeLoginForm.phone = '';
    codeLoginForm.code = '';
    
    // 清除倒计时
    if (countdownTimer) 
    {
      clearInterval(countdownTimer);
      isCountingDown.value = false;
    }
    
    // 发送登录成功事件
    emit('login-success');
  }
};
</script>

<style scoped lang="less">
.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input-wrapper :deep(.arco-input-wrapper) {
  flex: 1;
  border-color: @color-border-2;
  &:hover {
    border-color: @primary-6;
  }
  &:focus-within {
    border-color: @primary-6;
    box-shadow: 0 0 0 2px fade(@primary-1, 30%);
  }
}

.code-input-wrapper :deep(.arco-btn) {
  flex-shrink: 0;
}

/* 设置输入框样式 */
:deep(.arco-input-wrapper) {
  border-color: @color-border-2;
  &:hover {
    border-color: @primary-6;
  }
  &:focus-within {
    border-color: @primary-6;
    box-shadow: 0 0 0 2px fade(@primary-1, 30%);
  }
}

/* 设置标签样式 */
:deep(.arco-form-item-label) {
  color: @color-text-2;
  font-size: @font-size-body-3;
  font-weight: @font-weight-500;
}

/* 设置主按钮样式 */
:deep(.arco-btn-primary) {
  background-color: @primary-6;
  border-color: @primary-6;
  &:hover {
    background-color: @primary-5;
    border-color: @primary-5;
  }
  &:active {
    background-color: @primary-7;
    border-color: @primary-7;
  }
}

/* 设置验证码按钮样式 */
:deep(.arco-btn-primary:not(.arco-btn-disabled)) {
  background-color: @primary-6;
  border-color: @primary-6;
  &:hover {
    background-color: @primary-5;
    border-color: @primary-5;
  }
  &:active {
    background-color: @primary-7;
    border-color: @primary-7;
  }
}

/* 设置禁用状态的验证码按钮 */
:deep(.arco-btn-primary.arco-btn-disabled) {
  background-color: @color-fill-2;
  border-color: @color-border-2;
  color: @color-text-4;
}
</style>