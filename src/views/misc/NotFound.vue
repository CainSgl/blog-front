<template>
  <div class="not-found-page">
    <Header />
    
    <div class="not-found-content">
      <h1>找不到该页面</h1>
      <p>抱歉，您访问的页面不存在</p>
      
      <div class="links">
        <a-link @click="goHome">返回首页</a-link>
        <span class="separator">|</span>
        <a-link @click="goBack">返回上一页</a-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Header from '@/components/layout/Header.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="less">
.not-found-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 40px 20px;
  text-align: center;

  h1 {
    font-size: 32px;
    font-weight: 600;
    color: var(--color-neutral-10);
    margin: 0 0 16px 0;
  }

  p {
    font-size: 16px;
    color: var(--color-neutral-8);
    margin: 0 0 32px 0;
  }

  .links {
    display: flex;
    align-items: center;
    gap: 16px;

    .separator {
      color: var(--color-neutral-6);
    }
  }
}

@media (max-width: 768px) {
  .not-found-content {
    h1 {
      font-size: 24px;
    }

    p {
      font-size: 14px;
    }
  }
}
</style>
