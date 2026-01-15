<template>
  <div class="home-page">
    <Header :transparentBackground="true" :textColor="'white'" :showBorder="false" :hoverable="false" />

    <HomeHeader />

    <div class="container">
      <!-- 左侧目录区域 -->
      <div class="left-sidebar">
        <LeftNavigation />
      </div>

      <!-- 中间区域：主内容 + 公告 -->
      <div class="center-wrapper">
        <!-- 中间主内容区域 -->
        <div class="main-content">
          <!-- 顶部区域：轮播图 -->
          <div class="top-section">
            <div class="banner-section">
              <BannerCarousel />
            </div>
          </div>

          <!-- 文章列表区域 -->
          <div class="content-section">
            <PostList />
          </div>
        </div>

        <!-- 右侧公告栏 -->
        <div class="right-sidebar">
          <AnnouncementBanner />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Header from '@/components/layout/Header.vue';
import HomeHeader from '../components/home/HomeHeader.vue';
import BannerCarousel from '@/components/home/children/BannerCarousel.vue';
import AnnouncementBanner from '@/components/home/children/AnnouncementBanner.vue';
import PostList from '@/components/home/children/PostList.vue';
import LeftNavigation from '@/components/navigation/LeftNavigation.vue';

const isMobile = ref(true);

// 页面加载时获取数据
onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
});

const updateScreenSize = () => {
  // 当屏幕宽度大于1024px时，isMobile为false
  isMobile.value = window.innerWidth <= 1024;
};
</script>

<style scoped lang="less">
.home-page {
  background-color: #f7f8fa;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
  margin: 0 auto;
}

// 左侧目录区域
.left-sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  max-height: calc(100vh - 100px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c9cdd4;
    border-radius: 3px;

    &:hover {
      background: #a9aeb8;
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

// 中间区域包装器：包含主内容和公告
.center-wrapper {
  flex: 1;
  display: flex;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

// 中间主内容区域
.main-content {
  flex: 1;
  max-width: 1280px;
  width: 100%;
}

// 右侧公告栏
.right-sidebar {
  min-width: 100px;
  width: 15vw;
  max-width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
}

.top-section {
  width: 100%;
  margin-bottom: 20px;
}

.banner-section {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-section {
  width: 100%;
}

@media (max-width: 1024px) {
  .container {
    flex-direction: column;
    padding: 12px;
    gap: 16px;
  }

  .center-wrapper {
    flex-direction: column;
  }

  .right-sidebar {
    display: none;
  }

  .main-content {
    max-width: 100%;
  }

  .banner-section {
    height: 250px;
  }
}

// 响应式设计 - 手机
@media (max-width: 768px) {
  .container {
    padding: 8px;
    gap: 12px;
  }
  .left-sidebar {
    display: none; // 小屏幕隐藏左侧目录
  }
  .banner-section {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .banner-section {
    height: 180px;
  }
}
</style>
