<template>
  <Header />
  <div class="header-container"></div>
  <div class="main-container">
    <div class="left-wrapper">
      <div style="width: 100vw;"></div>
    </div>
    <div class="content-wrapper">
      <div class="banner-container">
        <BannerCarousel style="width: 100%;" />
      </div>
      <!-- 在小屏幕上，公告栏显示在 Banner 下方 -->
      <div v-if="isMobile" class="announcement-wrapper-mobile">
        <AnnouncementBanner></AnnouncementBanner>
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
import { onMounted, ref } from 'vue'
import Header from '@/components/layout/Header.vue'
import BannerCarousel from '@/components/home/children/BannerCarousel.vue'
import NewHomePostList from '@/components/home/children/NewHomePostList.vue'
import NewKBList from '@/components/home/children/NewKBList.vue'
import AnnouncementBanner from '../components/home/children/AnnouncementBanner.vue'

const isMobile = ref(true)
const showNewKBList = ref(true)
// 页面加载时获取数据
onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
})

const updateScreenSize = () => {
  // 当屏幕宽度大于1024px时，isMobile为false
  isMobile.value = window.innerWidth <= 1024
}
function handleNoData() {
  console.log("文章没数据了，让他去看看知识库的")
  showNewKBList.value = false
}
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
}

.banner-container {
  max-height: 300px;
  max-width: 900px;
  min-width: 844px;
  width: 66vw;
  margin: 20px 0 0 0;
  margin-bottom: 30px;
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
    max-width: 100%;
    width: 100%;
    min-width: 200px;
  }
}

@media (max-width: 1024px) {
  .main-container {
    flex-direction: column;
  }

  .banner-container {
    margin-bottom: 0px;
  }
}

@media (max-width: 768px) {
  .main-container {
    padding: 0 10px;
  }
}

@media (max-width: 480px) {
  .main-container {
    padding: 0 5px;
  }
}
</style>
