<template>
  <div class="home-page">


    <HomeHeader />

    <div class="container">
   

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
import {onMounted, onUnmounted, ref} from 'vue';
import HomeHeader from '../../components/home/HomeHeader.vue';
import BannerCarousel from '@/components/home/children/BannerCarousel.vue';
import AnnouncementBanner from '@/components/home/children/AnnouncementBanner.vue';
import PostList from '@/components/home/children/PostList.vue';

const isMobile = ref(true);
let isScrolling = false;
let lastScrollTop = 0;
let scrollEndTimer = null;
let touchStartY = 0;
let touchStartScrollTop = 0;
const homeHeaderHeight = ref(0);

// 页面加载时获取数据
onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);

  // 获取 HomeHeader 的高度
  homeHeaderHeight.value = window.innerHeight;

  // 桌面端使用wheel事件
  if (!isMobile.value) {
    window.addEventListener('wheel', handleWheel, { passive: false });
  }
  
  // 移动端使用touch事件
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('wheel', handleWheel);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
  window.removeEventListener('resize', updateScreenSize);
  if (scrollEndTimer) clearTimeout(scrollEndTimer);
});

const handleTouchStart = (e) => {
  touchStartY = e.touches[0].clientY;
  touchStartScrollTop = window.pageYOffset || document.documentElement.scrollTop;
};

const handleTouchEnd = (e) => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  // 只在header区域且滚动停止在中间位置时才自动调整
  if (currentScrollTop > 50 && currentScrollTop < homeHeaderHeight.value - 50) {
    // 清除之前的定时器
    if (scrollEndTimer) clearTimeout(scrollEndTimer);
    
    // 延迟判断，避免打断用户滚动
    scrollEndTimer = setTimeout(() => {
      const finalScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 如果还在中间区域，根据位置决定滚动方向
      if (finalScrollTop > 50 && finalScrollTop < homeHeaderHeight.value - 50) {
        const threshold = homeHeaderHeight.value * 0.4;
        
        if (finalScrollTop < threshold) {
          // 靠近顶部，滚动到顶部
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        } else {
          // 靠近底部，滚动到内容区
          window.scrollTo({
            top: homeHeaderHeight.value,
            behavior: 'smooth'
          });
        }
      }
    }, 150);
  }
};

const handleWheel = (e) => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // 只在 HomeHeader 区域内处理
  if (currentScrollTop < homeHeaderHeight.value && currentScrollTop > 0) {
    e.preventDefault();

    if (!isScrolling) {
      isScrolling = true;

      if (e.deltaY > 0) {
        // 向下滚动
        window.scrollTo({
          top: homeHeaderHeight.value,
          behavior: 'smooth'
        });
      } else {
        // 向上滚动
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }

      setTimeout(() => {
        isScrolling = false;
      }, 600);
    }
  }
};



const updateScreenSize = () => {
  // 当屏幕宽度大于1024px时，isMobile为false
  isMobile.value = window.innerWidth <= 1024;
  homeHeaderHeight.value = window.innerHeight;
};
</script>

<style scoped lang="less">
.home-page {
  background-color: @color-fill-1;
  width: 100%;
  max-width: 100vw;
  overflow-y:hidden;
}

:deep(::root) {
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
}

.container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: @size-5;
  padding: @size-5;
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 100%;
  width: 100%;
}

.center-wrapper {
  flex: 1;
  display: flex;
  gap: @size-5;
  max-width: 1600px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}

.main-content {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.right-sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  min-width: 0;
  box-sizing: border-box;
}

.top-section {
  width: 100%;
  margin-bottom: @size-5;
}

.banner-section {
  width: 100%;
  height: 300px;
  border-radius: @border-radius-medium;
  overflow: hidden;
  box-shadow: 0 2px 8px fade(#000, 10%);
}

.content-section {
  width: 100%;
}

@media (max-width: 1200px) {
  .container {
    padding: @size-3;
    gap: @size-4;
  }

  .left-sidebar {
    display: none;
  }

  .center-wrapper {
    gap: @size-4;
  }

  .right-sidebar {
    width: 240px;
  }

  .banner-section {
    height: 250px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: @size-2;
    gap: @size-3;
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
    height: 200px;
  }
}

@media (max-width: 480px) {
  .banner-section {
    height: 180px;
  }
}
</style>
