<template>
  <div class="register-page">
    <!-- 渐变背景组件 -->
    <GradientBackground :showText="false" :hasBorderRadius="false" />

    <!-- 注册表单区域 -->
    <div class="register-container">
      <div class="register-card">
        <!-- 步骤指示器 -->
        <div class="step-indicator">
          <div v-for="(step, index) in steps" :key="index" class="step-dot"
            :class="{ active: currentStep === index, completed: currentStep > index }" />
        </div>

        <!-- 动态步骤组件 -->
        <transition name="slide-fade" mode="out-in">
          <component :is="currentStepComponent" @next="handleStepNext" @back="handleStepBack" :token="token"
            :formData="formData" />
        </transition>

        <div class="register-footer">
          <span>已有账号？</span>
          <a-link @click="goToLogin">立即登录</a-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import GradientBackground from '@/components/loginModal/children/GradientBackground.vue'
import StepUsername from './children/StepUsername.vue'
import StepEmail from './children/StepEmail.vue'
import StepPassword from './children/StepPassword.vue'
import StepConfirm from './children/StepConfirm.vue'
import StepNickname from './children/StepNickname.vue'
import api from '@/api'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store/user'
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 当前步骤
const currentStep = ref(0)
const token = ref(null)
// 步骤列表
const steps = ['用户名', '邮箱', '密码', '确认', '昵称']

// 保存各步骤的数据
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: ''
})

// 当前步骤组件
const currentStepComponent = computed(() => {
  const components = [StepUsername, StepEmail, StepPassword, StepConfirm, StepNickname]
  return components[currentStep.value]
})

// 定时器引用
let renewalTimer = null

// 重置续期计时器
const resetRenewalTimer = () => {
  // 清除旧的计时器
  if (renewalTimer) {
    clearTimeout(renewalTimer)
  }

  // 只有在有 token 的情况下才设置新的计时器
  if (token.value) {
    renewalTimer = setTimeout(async () => {
      try {
        console.log("20秒无操作，自动续期 token")
        Message.loading({ id: 'token-renewal', content: "token 即将过期，正在续期..." })
        await api.post('/user/register', { token: token.value })
        Message.success({ id: 'token-renewal', content: "已自动续期，请继续完成注册" })
        // 续期成功后，重新开始计时
        resetRenewalTimer()
      } catch (error) {
        Message.error('Token 续期失败，请重新注册')
      }
    }, 20000) // 20秒后执行
  }
}
const userStore = useUserStore()
const handleStepNext = (data, reset) => {
  if (currentStep.value === 0 && data) {
    // 用户名步骤
    formData.value.username = data.username || ''
  } else if (currentStep.value === 1 && data) {
    // 邮箱步骤
    formData.value.email = data.email || ''
  } else if (currentStep.value === 2 && data) {
    // 密码步骤
    formData.value.password = data.password || ''
    formData.value.confirmPassword = data.confirmPassword || ''
  } else if (currentStep.value == 3) {
     token.value = null;
    userStore.setToken(data.token)
  } else if (currentStep.value === 4 && data) {
    token.value = null;
    formData.value.nickname = data.nickname || ''
  }

  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    const returnUrl = route.query.returnUrl
    if (returnUrl) {
      window.location.href = decodeURIComponent(returnUrl)
    } else {
      router.push('/')
    }
  }

  if (data?.token) {
    token.value = data.token
  }
  if (reset) {
    resetRenewalTimer()
  }
}

// 处理步骤后退
const handleStepBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const goToLogin = () => {
  const returnUrl = route.query.returnUrl
  if (returnUrl) {
    // 如果有 returnUrl，直接跳转到该地址
    window.location.href = decodeURIComponent(returnUrl)
  } else {
    // 否则跳转到首页并打开登录弹窗
    router.push('/')
    setTimeout(() => {
      authStore.openLogin()
    }, 100)
  }
}

// 组件卸载时清理计时器
onUnmounted(() => {
  if (renewalTimer) {
    clearTimeout(renewalTimer)
  }
})
</script>

<style scoped lang="less">
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 渐变背景 */
:deep(.character-flow-background) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.register-container {
  width: 100%;
  max-width: 600px;
  position: relative;
  z-index: 2;
  padding: 20px;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 60px 80px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 48px;

  .step-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: @color-fill-3;
    transition: all 0.3s ease;

    &.active {
      width: 32px;
      border-radius: 5px;
      background: rgb(var(--primary-6));
    }

    &.completed {
      background: rgb(var(--primary-6));
    }
  }
}

.register-footer {
  text-align: center;
  margin-top: auto;
  padding-top: 32px;
  font-size: 14px;
  color: @color-text-2;

  span {
    margin-right: 8px;
  }
}

/* 步骤切换动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

@media (max-width: 768px) {
  .register-container {
    max-width: 100%;
  }

  .register-card {
    padding: 40px 32px;
    min-height: 450px;
  }

  .step-indicator {
    margin-bottom: 32px;
  }
}

@media (max-width: 480px) {
  .register-card {
    padding: 32px 24px;
  }
}
</style>
