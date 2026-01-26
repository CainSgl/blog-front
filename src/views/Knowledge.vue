<template>
  <Header />
  <div class="header-container"></div>
  <div class="main-container">
    <div class="content-wrapper">
      <div>
        <NewKBList></NewKBList>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Header from '@/components/layout/Header.vue';
import NewKBList from '@/components/home/children/NewKBList.vue';

const isMobile = ref(true);

// 页面加载时获取数据
onMounted(() => 
{
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
});

const updateScreenSize = () => 
{
  // 当屏幕宽度大于1024px时，isMobile为false
  isMobile.value = window.innerWidth <= 1024;
};
</script>

<style scoped>
.main-container {
  width: 100%;
  overflow-x: hidden;
  margin: 0 auto;
  display: flex;
  gap: 20px;
}

.content-wrapper {
  flex: 1;
  max-width: 1800px;
  margin: 100px auto;
}
</style>
