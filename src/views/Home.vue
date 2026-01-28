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
import { onMounted, onUnmounted, ref } from 'vue';
import HomeHeader from '../components/home/HomeHeader.vue';
import BannerCarousel from '@/components/home/children/BannerCarousel.vue';
import AnnouncementBanner from '@/components/home/children/AnnouncementBanner.vue';
import PostList from '@/components/home/children/PostList.vue';

const isMobile = ref(true);
let isScrolling = false;
let lastScrollTop = 0;
let scrollEndTimer = null;
let scrollDirection = 'down'; // 记录用户的滚动意图
let userIntentTimer = null; // 用户意图观察定时器
let lastScrollDirection = 'down'; // 上一次的滚动方向
const homeHeaderHeight = ref(0);

// 页面加载时获取数据
onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);

  // 获取 HomeHeader 的高度
  homeHeaderHeight.value = window.innerHeight;

  // 添加滚动监听
  window.addEventListener('scroll', handleScroll, { passive: false });
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('wheel', handleWheel);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('resize', updateScreenSize);
  if (scrollEndTimer) clearTimeout(scrollEndTimer);
  if (userIntentTimer) clearTimeout(userIntentTimer);
});

const handleTouchStart = () => {
  // 触摸开始时清除所有定时器
  if (scrollEndTimer) clearTimeout(scrollEndTimer);
  if (userIntentTimer) clearTimeout(userIntentTimer);
};

const handleTouchMove = (e) => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // 只在 HomeHeader 区域内阻止默认行为
  if (currentScrollTop < homeHeaderHeight.value && currentScrollTop > 0) {
    e.preventDefault();
  }
};

const handleWheel = (e) => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // 记录滚动方向
  scrollDirection = e.deltaY > 0 ? 'down' : 'up';

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

const handleScroll = () => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // 记录当前滚动方向
  if (currentScrollTop > lastScrollTop) {
    scrollDirection = 'down';
  } else if (currentScrollTop < lastScrollTop) {
    scrollDirection = 'up';
  }

  // 检测滚动方向是否改变
  const directionChanged = scrollDirection !== lastScrollDirection;

  // 在 HomeHeader 区域内处理
  if (currentScrollTop < homeHeaderHeight.value) {
    // 如果在顶部区域（小于30%的header高度）且往下滑，立即滑到内容区域
    if (currentScrollTop < homeHeaderHeight.value * 0.3 && scrollDirection === 'down' && !isScrolling) {
      isScrolling = true;
      window.scrollTo({
        top: homeHeaderHeight.value,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isScrolling = false;
      }, 600);
    }
    // 如果在中间区域且方向改变，立即响应用户意图
    else if (currentScrollTop > 10 && currentScrollTop < homeHeaderHeight.value - 10 && directionChanged && !isScrolling) {
      isScrolling = true;

      if (scrollDirection === 'up') {
        // 用户改为往上滑，立即滑到顶部
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        // 用户改为往下滑，立即滑到内容区域
        window.scrollTo({
          top: homeHeaderHeight.value,
          behavior: 'smooth'
        });
      }

      setTimeout(() => {
        isScrolling = false;
      }, 600);
    }
  }

  lastScrollDirection = scrollDirection;
  lastScrollTop = currentScrollTop;
};



const updateScreenSize = () => {
  // 当屏幕宽度大于1024px时，isMobile为false
  isMobile.value = window.innerWidth <= 1024;
  homeHeaderHeight.value = window.innerHeight;
};
</script>

<style scoped lang="less">
.home-page {
  background-color: #f7f8fa;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  scroll-behavior: smooth;
}
:deep(::root)
{
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
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 100%;
  width: 100%;
}



// 中间区域包装器：包含主内容和公告
.center-wrapper {
  flex: 1;
  display: flex;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}

// 中间主内容区域
.main-content {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

// 右侧公告栏
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

// 平板模式：只隐藏左侧目录
@media (max-width: 1200px) {
  .container {
    padding: 12px;
    gap: 16px;
  }

  .left-sidebar {
    display: none; // 平板模式隐藏左侧目录
  }

  .center-wrapper {
    gap: 16px;
  }

  .right-sidebar {
    width: 240px;
  }

  .banner-section {
    height: 250px;
  }
}

// 手机模式：隐藏左侧目录和公告
@media (max-width: 768px) {
  .container {
    padding: 8px;
    gap: 12px;
  }

  .center-wrapper {
    flex-direction: column;
  }

  .right-sidebar {
    display: none; // 手机模式隐藏公告
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
