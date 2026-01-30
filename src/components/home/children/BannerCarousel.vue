<template>
  <div class="banner-carousel">
    <a-carousel :auto-play="autoPlay" show-arrow="hover" indicator-type="slider" class="carousel-wrapper"
                transition-timing-function="cubic-bezier(0.34, 0.69, 0.1, 1)" v-model:current="currentIndex">
      <a-carousel-item v-for="(item, index) in bannerList" :key="index" class="carousel-item">
        <div class="banner-item" @click="handleBannerClick(item)">
          <cImg :src="item.coverUrl" :preview-visible="false" class="banner-image" />
          <div class="banner-overlay">
            <div :key="currentIndex" class="banner-info" :style="{ background: item.color }">
              <h3 class="banner-title">{{ item.title }}</h3>
              <p class="banner-description">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </a-carousel-item>
    </a-carousel>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import api from '@/api/index.js';
import CImg from '../../base/cImg.vue';

const router = useRouter();

const props = defineProps({
  bannerData: {
    type: Array,
    default: () => []
  },
  autoPlay: {
    type: [Object, Boolean],
    default: () => ({
      interval: 3000,
      hoverToPause: true
    })
  }
});

const currentIndex = ref(0);
const bannerList = ref([]);

// 处理 banner 点击事件
const handleBannerClick = (item) => {
  if (!item.url) return;

  // 如果 url 以 http 开头，直接跳转到外部链接
  if (item.url.startsWith('http')) {
    window.open(item.url, '_blank');
  }
  else {
    // 否则在内部路由跳转
    router.push(item.url);
  }
};

onMounted(async () => {
  const { data } = await api.get('/system/carousel');
  bannerList.value = data || [];
});
</script>



<style scoped lang="less">
.banner-carousel {
  width: 100%;
  max-width: 100%;
  position: relative;
  height: 100%;
  overflow: hidden;
  &:before {
    content: '';
    display: block;
    padding-top: 33.33%;
  }
}

.carousel-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.carousel-item {
  width: 100%;
  height: 100%;
}

.banner-item {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  &:hover {
    .banner-image {
      transform: scale(1.05);
    }

  }
}

.banner-image {
  width: 100%;
  max-width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.34, 0.69, 0.1, 1);
}

.banner-overlay {
  position: absolute;
  bottom: 20px;

  left: 30px;
  right: 30px;
  pointer-events: none;
}

.banner-info {
  border-radius: 12px;
  padding: 20px 24px;
  pointer-events: auto;
}

.banner-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.banner-description {
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}


// 响应式设计 - 平板
@media (max-width: 768px) {
  .banner-overlay {
    left: 20px;
    right: 20px;
  }

  .banner-info {
    padding: 16px 20px;
  }

  .banner-title {
    font-size: 22px;
    margin-bottom: 6px;
  }

  .banner-description {
    font-size: 14px;
  }
}

// 响应式设计 - 手机
@media (max-width: 480px) {
  .carousel-wrapper {
    border-radius: 8px;
  }

  .banner-overlay {
    left: 15px;
    right: 15px;
  }

  .banner-info {
    padding: 14px 18px;
    border-radius: 10px;
  }

  .banner-title {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .banner-description {
    font-size: 13px;
    line-height: 1.4;
  }
}
</style>