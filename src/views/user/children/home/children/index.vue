<template>
    <a-typography-title :heading="5" class="section-title">
        置顶文章
    </a-typography-title>
    <a-spin :loading="loading" tip="正在加载置顶文章..." style="display: block;">
        <div ref="containerRef" class="posts-container">
            <template v-if="topPosts.length > 0">
                <PostCard :height="cardHeight" v-for="post in topPosts" :key="post.id" :post="post" />
            </template>
            <template v-else-if="!loading">
                <a-empty description="该用户没有设置置顶文章" />
            </template>
        </div>
    </a-spin>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import PostCard from '@/components/PostCardWrapper.vue';
import api from '@/api/index.js';

const route = useRoute();

// 置顶文章
const topPosts = ref([]);
// 加载状态
const loading = ref(true);
// 容器引用
const containerRef = ref(null);
// 卡片高度
const cardHeight = ref('250px');
// ResizeObserver实例
let resizeObserver = null;

// 根据容器宽度设置卡片高度
const updateCardHeight = (width) => {
    if (width < 400) {
        cardHeight.value = '450px';
    } else {
        cardHeight.value = '250px';
    }
};

// 获取置顶文章
const fetchTopPosts = async (id) => {
    loading.value = true; // 开始加载
    try {
        const response = await api.get('/post/top', { id: id });
        topPosts.value = response.data;
    } catch (err) {
        console.error('获取置顶文章失败:', err);
        topPosts.value = [];
    } finally {
        loading.value = false; // 结束加载
    }
};

// 处理路由参数变化
onMounted(() => {
    fetchTopPosts(route.params.id);
    
    // 初始化容器宽度监听
    if (containerRef.value) {
        // 初始设置高度
        updateCardHeight(containerRef.value.offsetWidth);
        
        // 创建ResizeObserver监听容器大小变化
        resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                updateCardHeight(width);
            }
        });
        
        resizeObserver.observe(containerRef.value);
    }
});

// 组件卸载时清理监听器
onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});
</script>



<style scoped lang="less">
.section-title {
    margin-bottom: 16px;
    padding-left: 12px;
    border-left: 4px solid @primary-6;
}

.posts-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
