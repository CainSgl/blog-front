<template>
  <Header />
  <div class="header-container"></div>
  <div class="container">
    <h2 class="section-title">最新文章</h2>
    <NewHomePostList></NewHomePostList>
  </div>
 
</template>

<script setup>
import { onMounted } from 'vue'
import Header from '@/components/layout/Header.vue'

import NewHomePostList from '@/components/home/children/NewHomePostList.vue'


// 页面加载时获取数据
onMounted(() => {
  
})
</script>

<style scoped>
.container {
  width: 100%;
  max-width: 80vw;
  margin: 0 auto;
  padding: 0 20px;
}

@media screen and (max-width: 1080px) {
  .container {
    max-width: none;
    width: 95vw; 
  }
}
@media screen and (max-width: 768px) {
  .container {
    padding: 0 15px;
    width: calc(100% - 5px);
  }
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin: 20px 0;
  color: #333;
}
</style>
