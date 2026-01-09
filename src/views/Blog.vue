<template>
  <Header />
  <div class="header-container"></div>
  <div class="main-container">
    <div class="content-wrapper">
      <div>
        <NewHomePostList @noData="handleNoData"></NewHomePostList>
      </div>
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
  max-width: 1800px;
  margin: 100px auto;
}

</style>
