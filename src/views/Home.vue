<template>
  <div class="home">
    <h1>欢迎来到首页</h1>
    <p>这是一个使用 Vite + Vue 3 + Vue Router + Arco Design + Pinia 的项目</p>
    
    <!-- 用户信息展示 -->

     <p>{{userInfo}}</p> 
    
    <div class="test-section">
      <a-space direction="vertical" size="large">
        <a-button type="primary" @click="testShowLogin">测试登录弹窗</a-button>
        <a-button @click="testRequireLogin">测试需要登录的功能</a-button>
        <a-button type="outline" @click="testLogout">测试登出</a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup>
import { showLoginModal, requireLogin } from '@/services/authService';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

// 组件挂载时获取用户信息
onMounted(async () => 
{
  await userStore.getUserInfo();
});

const testShowLogin = () => 
{
  showLoginModal();
};

const testRequireLogin = () => 
{
  if (!requireLogin()) 
  {
    console.log('需要登录才能执行此操作');
  }
  else 
  {
    console.log('已登录，可以执行操作');
  }
};

const testLogout = () => 
{
  // 使用用户存储来清除用户信息
  userStore.clearUserInfo();
  console.log('已登出');
};
</script>

<style scoped>
.home {
  padding: 32px;
  text-align: center;
}

.test-section {
  margin-top: 48px;
  display: flex;
  justify-content: center;
}
</style>
