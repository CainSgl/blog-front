<template>
    <a-typography-title :heading="5" class="section-title">
        置顶文章
    </a-typography-title>
    <a-spin :loading="loading" tip="正在加载置顶文章..." style="display: block;">
        <div class="posts-container">
            <template v-if="topPosts.length > 0">
                <PostCard v-for="post in topPosts" :key="post.id" :post="post" />
            </template>
            <template v-else-if="!loading">
                <a-empty description="该用户没有设置置顶文章" />
            </template>
        </div>
    </a-spin>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PostCard from '@/components/PostCard.vue';
import api from '@/api/index.js';

const route = useRoute();

// 置顶文章
const topPosts = ref([]);
// 加载状态
const loading = ref(true);

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
