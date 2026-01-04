<template>
    <div class="banner-carousel">
        <a-carousel :auto-play="autoPlay" show-arrow="hover" indicator-type="slider" class="carousel-wrapper"
            transition-timing-function="cubic-bezier(0.34, 0.69, 0.1, 1)" v-model:current="currentIndex">
            <a-carousel-item v-for="(item, index) in bannerList" :key="index" class="carousel-item" style="width: 100%;height: 100%;">
                <div class="banner-item" @click="handleBannerClick(item)" >
                    <cImg   :src="item.coverUrl" :preview-visible="false" style="width: 100%;height: 100%;" />
                </div>
            </a-carousel-item>
        </a-carousel>
        <!-- 动态背景遮罩层 -->
        <div class="dynamic-overlay">
            <div class="banner-content">
                <h3 class="banner-title">{{ currentBanner.title }}</h3>
                <p class="banner-description">{{ currentBanner.description }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/index.js'
import CImg from '../../base/cImg.vue'

const router = useRouter()

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
})

// 当前显示的 banner 索引
const currentIndex = ref(0)

// 使用传入的 bannerData，如果没有则使用默认数据
const bannerList = ref([])

// 获取当前显示的 banner 数据
const currentBanner = computed(() => {
    const list = bannerList.value;
    return list[currentIndex.value] || list[0] || { title: '', description: '' };
})

// 处理 banner 点击事件
const handleBannerClick = (item) => {
    if (!item.url) return;
    
    // 如果 url 以 http 开头，直接跳转到外部链接
    if (item.url.startsWith('http')) {
        window.open(item.url, '_blank');
    } else {
        // 否则在内部路由跳转
        router.push(item.url);
    }
}

onMounted(async () => {
    const {data} = await api.get('/system/carousel')
    bannerList.value = data || []

})
</script>



<style scoped lang="less">
.banner-carousel {
    width: 100%;
    position: relative;
    &:before {
        content: '';
        display: block;
        padding-top:33.33333333333333%;
    }
}

.carousel-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.banner-item {
    width: 100%;
    height: 100%;
    cursor: pointer;
    &:hover {
        opacity: 0.95;
    }
}

// 固定背景遮罩层
.fixed-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    :deep(.arco-carousel-indicator-slider) {
        --color: v-bind('currentBanner.color || "black"');
        background: linear-gradient(to top,
                color-mix(in srgb, var(--color) 60%, transparent) 0%,
                color-mix(in srgb, var(--color) 30%, transparent) 50%,
                color-mix(in srgb, var(--color) 0%, transparent) 100%);
    }

    padding: 30px;
    color: white;
    z-index: 10; // 确保文字在图片上方
}

// 动态背景遮罩层
.dynamic-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top,
            color-mix(in srgb, v-bind('currentBanner.color || "black"') 30%, transparent) 0%,
            color-mix(in srgb, v-bind('currentBanner.color || "black"') 15%, transparent) 50%,
            color-mix(in srgb, v-bind('currentBanner.color || "black"') 0%, transparent) 100%);
    padding: 30px;
    color: white;
    z-index: 10;
}

.banner-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-description {
    font-size: 16px;
    margin: 0;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

// 响应式设计 - 平板设备
@media (max-width: 768px) {
    .banner-title {
        font-size: 20px;
    }
    
    .banner-description {
        font-size: 14px;
    }
    
    .dynamic-overlay {
        padding: 20px;
    }
}

// 响应式设计 - 手机设备
@media (max-width: 480px) {
    .banner-title {
        font-size: 18px;
    }
    
    .banner-description {
        font-size: 13px;
    }
    
    .dynamic-overlay {
        padding: 15px;
    }
}
</style>