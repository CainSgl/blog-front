<template>
  <div class="home-container">
    <!-- 使用 Header 组件 -->
    <Header transparent-background :show-border="true" :showSearch="false" :padding="false" :scrollThreshold="'120vh'" />

    <!-- 背景图片设置为绝对定位 -->
    <div class="background-container" :style="{ opacity: backgroundOpacity, transform: `translateX(-50%) scale(${backgroundScale})` }">
      <CImg 
        :src="`/file/welcome/background/${randomBgIndex}`" 
        :thumb-src="`/file/welcome/background/thumb/${randomBgIndex}`"
        class="background-img"  
        :preview-visible="false" 
      />
      <!-- 白色半透明遮罩层 -->
      <div class="overlay-mask"></div>
      <div class="rain-container">
        <div v-for="drop in raindrops" :key="drop.id" class="raindrop" :style="getRainDropStyle(drop)"></div>
      </div>
    </div>

    <!-- 导航栏和其他内容元素正常排列 -->
    <div class="content-wrapper">
      <TypewriterWelcome />
      
      <!-- 搜索框区域 -->
      <SearchBox />
    </div>

    <!-- 底部滚动提示 -->
    <div class="scroll-hint" :class="{ 'dark-text': !isAtBottom }" @click="handleScrollHintClick">
      <div class="scroll-hint-text">{{ scrollHintText }}</div>
      <icon-double-down v-if="!isAtBottom" class="scroll-hint-icon" />
      <icon-double-up v-else class="scroll-hint-icon" />
    </div>
  </div>
</template>

<script setup>
import CImg from '@/components/base/image/cImg.vue';
import SearchBox from '@/components/base/SearchBox.vue';
import {computed, onMounted, onUnmounted, ref} from 'vue';
import TypewriterWelcome from '@/views/home/components/TypewriterWelcome.vue';
import {IconDoubleDown, IconDoubleUp} from '@arco-design/web-vue/es/icon';
import Header from '@/components/layout/Header.vue';

const raindrops = ref([]);
const randomBgIndex = Math.floor(Math.random() * 10) % 6;
const lastScrollY = ref(0);
const isAtBottom = ref(false);
const backgroundOpacity = ref(1);
const backgroundScale = ref(1);

// 计算滚动提示文本 - 根据当前位置而不是滚动方向
const scrollHintText = computed(() => {
  return isAtBottom.value ? '向上滚动返回顶部' : '向下滚动探索更多内容';
});

// 处理滚动事件
const handleScroll = () =>
{
  const currentScrollY = window.scrollY || window.pageYOffset;
  const viewportHeight = window.innerHeight;
  
  // 判断当前位置：在顶部还是底部
  // 使用30%作为阈值来判断位置
  const threshold = viewportHeight * 0.3;
  isAtBottom.value = currentScrollY > threshold;
  
  // 计算背景图片的透明度和缩放
  // 滚动范围：0 到 viewportHeight
  // 透明度：1 到 0.2（保持一定可见度）
  // 缩放：1 到 0.9
  const scrollProgress = Math.min(currentScrollY / viewportHeight, 1);
  
  // 使用缓动函数让动画更流畅
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easedProgress = easeOutCubic(scrollProgress);
  
  // 透明度从1降到0.2
  backgroundOpacity.value = 1 - (easedProgress * 0.8);
  
  // 缩放从1降到0.9
  backgroundScale.value = 1 - (easedProgress * 0.1);
  
  lastScrollY.value = currentScrollY;
};

// 初始化雨滴数据
onMounted(() =>
{
  // 创建多个雨滴元素
  for (let i = 0; i < 50; i++)
  {
    raindrops.value.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 0.8 + 0.2, // 随机大小 0.2-1px
      speed: Math.random() * 4 + 3, // 随机下落速度
      delay: Math.random() * 5, // 随机动画延迟
    });
  }
  
  // 添加滚动监听
  window.addEventListener('scroll', handleScroll, { passive: true });
  lastScrollY.value = window.scrollY || window.pageYOffset;
});

// 清理滚动监听
onUnmounted(() =>
{
  window.removeEventListener('scroll', handleScroll);
});

// 计算雨滴样式
const getRainDropStyle = (drop) =>
{
  return {
    left: `${drop.x}%`,
    top: `${drop.y}%`,
    animationDuration: `${drop.speed}s`,
    animationDelay: `${drop.delay}s`,
  };
};

// 处理滚动提示点击事件
const handleScrollHintClick = () =>
{
  if (isAtBottom.value) {
    // 如果在底部，滚动到顶部
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } else {
    // 如果在顶部，滚动到底部（100vh位置）
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  }
};
</script>

<style scoped lang="less">


.home-container {
  position: relative;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20vh;
  gap: 40px;
}

.background-container {
  position: absolute;
  inset: 0 auto auto 50%;
  transform: translateX(-50%);
  width: 100vw;
  height: 100%;
  overflow: visible;
  z-index: 1;
  transform-origin: center center;
  will-change: opacity, transform;
}

.background-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100vh;
  object-fit: contain;
  z-index: 1;
  pointer-events: none;
  user-select: none;
}

.overlay-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100vh;
  background-color: color-mix(in oklab, var(--color-bg-1) 60%, transparent);
  z-index: 2;
  pointer-events: none;
}

.rain-container {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.raindrop {
  position: absolute;
  background: linear-gradient(to bottom, color-mix(in srgb, var(--color-bg-white) 0%, transparent) 0%, color-mix(in srgb, var(--color-bg-white) 80%, transparent) 30%, var(--color-bg-white) 50%, color-mix(in srgb, var(--color-bg-white) 80%, transparent) 70%, color-mix(in srgb, var(--color-bg-white) 0%, transparent) 100%);
  width: 1px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 2px color-mix(in srgb, var(--color-bg-white) 80%, transparent);
  animation: fall linear infinite;
  transform: rotate(15deg);
}

@keyframes fall {
  0% {
    transform: translateX(-10px) translateY(-10vh) rotate(15deg);
    opacity: 0;
  }
  10%, 90% {
    opacity: 0.7;
  }
  100% {
    transform: translateX(100px) translateY(100vh) rotate(15deg);
    opacity: 0;
  }
}

.scroll-hint {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: @size-2;
  animation: fadeInOut 4s ease-in-out infinite;
  cursor: pointer;
  transition: all 0.3s ease;

  &.reverse {
    flex-direction: column-reverse;
  }
}

.scroll-hint-text {
  font-size: @font-size-body-3;
  color: var(--color-text-1);
  text-shadow: 0 2px 4px color-mix(in srgb, var(--color-neutral-10) 30%, transparent);
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.scroll-hint-icon {
  font-size: 24px;
  color: var(--color-text-1);
  filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--color-neutral-10) 30%, transparent));
  animation: arrowBounce 4s ease-in-out infinite;
  transition: all 0.3s ease;
}

.scroll-hint.dark-text {
  .scroll-hint-text {
    color: color-mix(in srgb, var(--color-neutral-10) 80%, transparent);
    text-shadow: 0 2px 4px color-mix(in srgb, var(--color-bg-white) 30%, transparent);
  }

  .scroll-hint-icon {
    color: color-mix(in srgb, var(--color-neutral-10) 80%, transparent);
    filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--color-bg-white) 30%, transparent));
  }
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0;
  }
  20%, 80% {
    opacity: 1;
  }
}

@keyframes arrowBounce {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  20% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(15px);
    opacity: 0;
  }
}

.scroll-hint.reverse .scroll-hint-icon {
  animation: arrowBounceUp 4s ease-in-out infinite;
}

@keyframes arrowBounceUp {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  20% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-15px);
    opacity: 0;
  }
}
</style>
