<template>
  <div class="step-nickname">
    <div class="step-header">
      <p>完成个人信息</p>
      <a-link @click="handleSkip">稍后完善</a-link>
    </div>

    <!-- 头像部分 -->
    <div class="avatar-wrapper">
      <AvatarSection :user-info="userInfo" />
    </div>

    <!-- 基本信息表单 -->
    <a-form :model="form" layout="vertical" class="info-form">
      <a-form-item label="昵称" required>
        <a-input 
          v-model="form.nickname" 
          placeholder="输入昵称（2-20个字符）" 
          size="large" 
          allow-clear 
          autofocus 
          :max-length="20"
          :error="!!errorMsg.nickname"
        />
        <div v-if="errorMsg.nickname" class="error-msg">{{ errorMsg.nickname }}</div>
      </a-form-item>

      <a-form-item label="性别">
        <a-radio-group v-model="form.gender" size="large">
          <a-radio value="男">男</a-radio>
          <a-radio value="女">女</a-radio>
          <a-radio value="">保密</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="个人简介">
        <a-textarea 
          v-model="form.bio" 
          placeholder="介绍一下自己吧" 
          :max-length="200" 
          :rows="4" 
          show-word-limit
          :error="!!errorMsg.bio"
        />
        <div v-if="errorMsg.bio" class="error-msg">{{ errorMsg.bio }}</div>
      </a-form-item>
    </a-form>

    <a-button 
      type="primary" 
      size="large" 
      long 
      :loading="loading" 
      @click="handleNext" 
      style="margin-top: 24px"
    >
      完成
    </a-button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api'
import { Message } from '@arco-design/web-vue'
import AvatarSection from '@/components/user/home/AvatarSection.vue'
import { useUserStore } from '@/store/user.js';
const props = defineProps({
  formData: {
    type: Object,
    default: () => ({})
  },
  token: {
    type: String
  }
})

const emit = defineEmits(['next'])


const userInfo = ref()

// 表单数据
const form = reactive({
  nickname: props.formData.nickname || '',
  gender: props.formData.gender || '',
  bio: props.formData.bio || ''
})

// 错误信息
const errorMsg = reactive({
  nickname: '',
  bio: ''
})

const loading = ref(false)

// 跳过此步骤
const handleSkip = () => {
  emit('next', { ...props.formData }, false)
}

const userStore = useUserStore();
// 提交表单
const handleNext = async () => {
    await userStore.updateUserInfo({
      nickname: form.nickname.trim(),
      gender: form.gender,
      bio: form.bio
    });
    emit('next', { 
      ...props.formData, 
      nickname: form.nickname.trim(),
      gender: form.gender,
      bio: form.bio.trim()
    }, true)
}

onMounted(async ()=>{
    loading.value=true;
    userInfo.value = await userStore.getUserInfo();
    loading.value=false;
})
</script>

<style scoped lang="less">
.step-nickname {
  width: 100%;
}

.step-header {
  text-align: center;
  margin-bottom: 32px;

  p {
    font-size: 16px;
    color: @color-text-3;
    margin-bottom: 8px;
  }
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.info-form {
  width: 100%;

  :deep(.arco-form-item) {
    margin-bottom: 20px;
  }

  :deep(.arco-form-item-label) {
    font-size: 14px;
    color: @color-text-2;
  }

  :deep(.arco-radio-group) {
    display: flex;
    gap: 24px;
  }
}

.error-msg {
  color: rgb(var(--danger-6));
  font-size: 14px;
  margin-top: 8px;
}
</style>
