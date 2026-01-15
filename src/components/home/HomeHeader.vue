<template>

  <div class="home-container">
    <!-- 背景图片设置为绝对定位 -->
    <div class="background-container">
      <CImg :src="'/welcome/background'" class="background-img"  :preview-visible="false" ></CImg>
      <div class="rain-container">
        <div v-for="drop in raindrops" :key="drop.id" class="raindrop" :style="getRainDropStyle(drop)"></div>
      </div>
    </div>
    
    <!-- 导航栏和其他内容元素正常排列 -->
    <div class="content-wrapper">
      <TypewriterWelcome />
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/layout/Header.vue';
import CImg from '@/components/base/cImg.vue';
import { onMounted, ref } from 'vue';
import TypewriterWelcome from '@/components/typewriter/TypewriterWelcome.vue';
const raindrops = ref([]);

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
</script>

<style scoped lang="less">
.home-container {
  position: relative;

  min-height: 300px;
  margin: 0 auto;
  height: 27vh;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 65px;
}



.background-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.background-img {
  position: absolute;
  left: 0;
  height: 25vh;
  max-height: 350px;
  min-height: 185px;
  object-fit: cover;
  z-index: 1;
}

.rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.raindrop {
  position: absolute;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 30%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.8) 70%, rgba(255, 255, 255, 0) 100%);
  width: 1px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
  animation: fall linear infinite;
  transform: rotate(15deg); /* 让雨滴倾斜，模拟下雨效果 */
}

@keyframes fall {
  0% {
    transform: translateX(-10px) translateY(-10vh) rotate(15deg);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    transform: translateX(100px) translateY(100vh) rotate(15deg);
    opacity: 0;
  }
}

</style>
