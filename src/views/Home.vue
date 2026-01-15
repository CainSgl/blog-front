<template>
  <Header :transparentBackground="true" :textColor="'white'" :showBorder="false" :hoverable="false" />

  <HomeHeader />
 
  <div class="main-container">
    <div class="left-wrapper">
      <div style="width: 100vw;"></div>
    </div>
    <div class="content-wrapper">
      <div class="banner-container">
        <BannerCarousel style="width: 100%;height: 100%;"/>
      </div>
      <div>
        <NewHomePostList @noData="handleNoData"></NewHomePostList>
      </div>
    </div>
    <!-- 在大屏幕上，公告栏显示在右侧 -->
    <div v-if="!isMobile" class="announcement-wrapper">
      <AnnouncementBanner></AnnouncementBanner>
      <NewKBList :enableAutoLoad="showNewKBList"  style="margin-top: 40px;"></NewKBList>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Header from '@/components/layout/Header.vue';
import BannerCarousel from '@/components/home/children/BannerCarousel.vue';
import NewHomePostList from '@/components/home/children/NewHomePostList.vue';
import NewKBList from '@/components/home/children/NewKBList.vue';
import AnnouncementBanner from '../components/home/children/AnnouncementBanner.vue';
import HomeHeader from '../components/home/HomeHeader.vue';
const isMobile = ref(true);
const showNewKBList = ref(true);
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
function handleNoData() 
{
  console.log('文章没数据了，让他去看看知识库的');
  showNewKBList.value = false;
}
</script>

<style scoped>
.main-container {
  width: 100%;
  overflow-x: hidden;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  max-width: 1600px; /* 设置最大宽度以适应轮播图和其他内容 */
  margin: 0 auto;
  padding: 0 20px; /* 添加水平内边距 */
}

.content-wrapper {
  flex: 1;
}

.banner-container {
  height: 300px;
  width: 100%; /* 响应式宽度 */
}

.announcement-wrapper-mobile {
  margin: 20px 20px;
  padding-bottom: 30px;
}

.left-wrapper {
  width: 6vw;
  max-width: 250px;
}

.announcement-wrapper {
  width: 20vw;
  max-width: 500px;
  min-width: 300px;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .left-wrapper {
    display: none;
  }

  .banner-container {
    width: 100%;
    height: 300px;
    margin: 20px auto 30px;
  }
}

@media (max-width: 1024px) {
  .main-container {
    flex-direction: column;
    align-items: center; /* 在小屏幕上居中内容 */
  }

  .banner-container {
    width: 100%; /* 在小屏幕上占满宽度 */
  }
}

@media (max-width: 768px) {
  .main-container {
    padding: 0 10px;
  }
    
  .banner-container {
    height: 150px; /* 在极小屏幕上减小高度以保持比例 */
    width: 100%; /* 响应式宽度 */
  }
}

@media (max-width: 480px) {
  .main-container {
    padding: 0 5px;
  }
}
</style>
