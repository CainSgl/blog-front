<template>
  
  <a-form :model="loginForm" @submit="handleLogin">
    <a-form-item field="username" label="用户名" :help="usernameHelp" :validate-status="usernameValidateStatus">
      <a-input
        v-model="loginForm.username"
        placeholder="请输入用户名/邮件/手机号"
        size="large"
        allow-clear
        :class="{ 'invalid-input': isUsernameInvalid }"
        autocomplete="username"
      />
    </a-form-item>
    
    <a-form-item field="password" label="密码" :help="passwordHelp" :validate-status="passwordValidateStatus">
      <a-input-password
        v-model="loginForm.password"
        placeholder="请输入密码"
        size="large"
        allow-clear
        :class="{ 'invalid-input': isPasswordInvalid }"
        autocomplete="current-password"
      />
    </a-form-item>
    
    <!-- 登录错误信息显示 -->
    <div v-if="loginError" class="login-error-message">
      {{ loginError }}
    </div>
    
    <a-form-item>
      <a-button
        type="primary"
        size="large"
        long
        :loading="isLoading"
        @click="handleLogin"
      >
        登录
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue';
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

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
});

// 表单提交标志
const isFormSubmitted = ref(false);

// 登录错误信息
const loginError = ref('');

// 计算属性：检查用户名是否有效（长度>=4）
const isUsernameInvalid = computed(() => 
{
  return loginForm.username.length > 0 && loginForm.username.length < 4;
});

// 用户名验证状态
const usernameValidateStatus = computed(() => 
{
  if (loginForm.username.length === 0 && isFormSubmitted.value) return 'error';
  return isUsernameInvalid.value ? 'error' : '';
});

// 用户名帮助文本
const usernameHelp = computed(() => 
{
  if (loginForm.username.length === 0 && isFormSubmitted.value) return '用户名不能为空';
  return isUsernameInvalid.value ? '用户名长度至少长4位' : '';
});

// 计算属性：检查密码是否有效（长度>=6）
const isPasswordInvalid = computed(() => 
{
  return loginForm.password.length > 0 && loginForm.password.length < 6;
});

// 密码验证状态
const passwordValidateStatus = computed(() => 
{
  if (loginForm.password.length === 0 && isFormSubmitted.value) return 'error';
  return isPasswordInvalid.value ? 'error' : '';
});

// 密码帮助文本
const passwordHelp = computed(() => 
{
  if (loginForm.password.length === 0 && isFormSubmitted.value) return '密码不能为空';
  return isPasswordInvalid.value ? '密码长度至少长6位' : '';
});

// 处理登录
const handleLogin = async () => 
{
  // 清除之前的错误信息
  loginError.value = '';
  
  // 设置表单已提交标志
  isFormSubmitted.value = true;
  // 如果用户名或密码为空，则不继续执行登录逻辑
  if (isUsernameInvalid.value || isPasswordInvalid.value || !loginForm.username || !loginForm.password) 
  {
    return;
  }
  try
  {
    await authStore.login(loginForm);
    authStore.closeLogin();
    // 发射登录成功事件
    emit('login-success');
  }
  catch(error)
  {
    // 显示具体的错误信息给用户
    if (error && error.message) 
    {
      loginError.value = error.message;
    }
    else if (error && error.data && error.data.msg) 
    {
      loginError.value = error.data.msg;
    }
    else 
    {
      loginError.value = '登录失败，请稍后重试';
    }
    console.log('登录失败:', error);
  }
};
</script>

<style scoped lang="less">
/* 禁止除输入框外的所有元素被选中 */
div {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 允许输入框被选中 */
:deep(input) {
  -webkit-user-select: auto;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

/* 显示密码的眼睛图标 */
:deep(.arco-input-password-icon) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  color: @color-text-2;
}

:deep(.arco-input-password-icon:hover) {
  color: @primary-6;
}

/* 使用全局主题变量设置输入框样式 */
:deep(.arco-input-wrapper) {
  border-color: @color-border-2;
  &:hover {
    border-color: @primary-6;
  }
  &:focus-within {
    border-color: @primary-6;
  }
}

/* 输入框无效时的红边框样式 */
:deep(.arco-input-wrapper.invalid-input) {
  border-color: @danger-6 !important;
  &:hover {
    border-color: @danger-5 !important;
  }
  &:focus-within {
    border-color: @danger-6 !important;
  }
}

/* 设置标签样式 */
:deep(.arco-form-item-label) {
  color: @color-text-2;
  font-size: @font-size-body-3;
  font-weight: @font-weight-500;
}

/* 设置按钮样式 */
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

/* 登录错误信息样式 */
.login-error-message {
  color: @danger-6;
  font-size: @font-size-body-3;
  margin-bottom: 12px;
  margin-left: 85px;
  padding: 8px 12px;
  background-color: @danger-1;
  border-radius: @border-radius-small;
  border: 1px solid @danger-2;
  width: calc(100% - 85px);
  max-width: calc(400px - 85px);
  box-sizing: border-box;
}
</style>