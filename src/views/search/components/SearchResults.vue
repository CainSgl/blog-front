<template>
    <!-- 加载状态 -->
    <div v-if="loading && results.length === 0" class="loading-container">
        <a-spin size="large" tip="搜索中..." />
    </div>

    <!-- 搜索结果列表 -->
    <div v-else-if="results.length > 0" class="results-list">
        <a-link :href="`/space/${post.id}`" :hoverable="false" v-for="post in results" :key="post.id" target="_ablank">
            <div class="post-card-container">
                <PostCardWrapper   :height="'100%'" :post="post" :showStatus="false" :showBottom="false"
                    :inHtlm="true" />
            </div>

        </a-link>


        <!-- 加载更多指示器 -->
        <div ref="loadMoreTrigger" class="load-more-trigger">
            <a-spin v-if="loadingMore" tip="加载更多..." />
            <div v-else-if="hasMore" class="load-more-hint">
                向下滚动加载更多
            </div>
            <div v-else class="no-more-hint">
                没有更多结果了
            </div>
        </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && searchQuery" class="empty-state">
        <a-empty description="未找到相关结果">
            <template #image>
                <icon-search :style="{ fontSize: '64px', color: '#c9cdd4' }" />
            </template>
        </a-empty>
    </div>

    <!-- 初始状态 -->
    <div v-else class="initial-state">
        <div class="initial-content">
            <icon-search :style="{ fontSize: '80px', color: '#e5e6eb' }" />
            <p class="initial-text">输入关键词开始搜索</p>
        </div>
    </div>
</template>

<script setup>
import {nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import {IconSearch} from '@arco-design/web-vue/es/icon';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import {Message} from '@arco-design/web-vue';
import api from '@/api/index.js';

const route = useRoute();

const emit = defineEmits(['updateTotal']);

// 搜索参数
const searchQuery = ref('');
const searchMode = ref('term');
const useTag = ref(true);
const useContent = ref(true);
const useTitle = ref(true);

// 搜索结果
const results = ref([]);
const hasMore = ref(true);

// 加载状态
const loading = ref(false);
const loadingMore = ref(false);

// IntersectionObserver 相关
const loadMoreTrigger = ref(null);
let observer = null;
let searchAfter;
let vectorOffset = 1;

// 从路由参数中解析搜索条件
const parseRouteParams = () => {
    searchQuery.value = route.query.query || '';
    searchMode.value = route.query.mode || 'term';
    
    // 解析 filters 参数来确定搜索范围
    const filtersParam = route.query.filters || '';
    const filters = filtersParam ? filtersParam.split(',').filter(f => f) : [];
    
    // 如果没有指定 filters，默认全部搜索
    if (filters.length === 0) {
        useTag.value = true;
        useContent.value = true;
        useTitle.value = true;
    } else {
        useTag.value = filters.includes('tag');
        useContent.value = filters.includes('content');
        useTitle.value = filters.includes('title');
    }
};

// 执行搜索
const performSearch = async () => {
    if (!searchQuery.value.trim()) return;
    if (!hasMore.value) return;

    try {
        // 根据搜索模式调用不同的API
        if (searchMode.value === 'semantic') {
            // 语义搜索
            const { data } = await api.post('/post/search/vector', {
                query: searchQuery.value,
                vectorOffset: vectorOffset
            });
            // 语义搜索调用一次后就没有更多了
            hasMore.value = false;
            // 处理语义搜索返回的数据
            if (data && Array.isArray(data)) {
                results.value.push(...data);
                // 第一次搜索时更新总数
                if (results.value.length === data.length) {
                    emit('updateTotal', data.length);
                }
            }
        } else if (searchMode.value === 'precise') {
            // 精准搜索
            const { data } = await api.post('/post/search', {
                query: searchQuery.value,
                vectorOffset: vectorOffset
            });
            hasMore.value = false;

            if (data.data && Array.isArray(data.data)) {
                results.value.push(...data.data);
                // 第一次搜索时更新总数
                if (results.value.length === data.data.length) {
                    emit('updateTotal', data.total || data.data.length);
                }
            }
        } else {
            // 词项搜索（默认）
            const { data } = await api.post('/post/search/es', {
                query: searchQuery.value,
                size: 20,
                useTag: useTag.value,
                useContent: useContent.value,
                useTitle: useTitle.value,
                searchAfter
            });

            searchAfter = data.searchAfter;
            hasMore.value = data.hasMore;

            if (data.data && Array.isArray(data.data)) {
                results.value.push(...data.data);
                // 第一次搜索时更新总数
                if (results.value.length === data.data.length) {
                    emit('updateTotal', data.total);
                }
            }
        }
    } catch (error) {
        console.error('搜索失败:', error);
        Message.error('搜索失败，请稍后重试');
    } finally {
        loading.value = false;
        loadingMore.value = false;
        
        // 确保 DOM 更新后设置 observer
        await nextTick();
        setupObserver();
    }
};

// 加载更多
const loadMore = () => {
    if (loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    performSearch();
};



// 设置 IntersectionObserver
const setupObserver = () => {
    // 清理旧的 observer
    if (observer) {
        observer.disconnect();
    }

    if (!loadMoreTrigger.value) return;

    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
                loadMore();
            }
        },
        {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        }
    );

    observer.observe(loadMoreTrigger.value);
};

// 监听路由变化
watch(() => route.query, () => {
    // 重置搜索状态
    results.value = [];
    hasMore.value = true;
    searchAfter = undefined;
    vectorOffset = 1;
    loading.value = true;

    parseRouteParams();
    performSearch();
}, { deep: true });

onMounted(() => {
    parseRouteParams();

    if (searchQuery.value) {
        loading.value = true;
        performSearch();
    }
});

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
    }
});
</script>

<style scoped lang="less">
.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.results-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.load-more-trigger {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 32px 0;
    min-height: 80px;
}

.load-more-hint,
.no-more-hint {
    color: #86909c;
    font-size: 14px;
    text-align: center;
}

.no-more-hint {
    padding: 16px 0;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.empty-state,
.initial-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.initial-content {
    text-align: center;
}

.initial-text {
    margin-top: 16px;
    color: #86909c;
    font-size: 16px;
}

@media (max-width: 450px) {
    .post-card-container {
        height: 300px;
    }
}
</style>
