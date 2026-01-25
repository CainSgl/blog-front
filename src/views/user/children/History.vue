<template>
    <div class="history-page">
        <div class="page-header">
            <h2>浏览历史</h2>
        </div>

        <div class="history-container">
            <a-timeline v-if="historyList.length > 0" :reverse="false">
                <a-timeline-item v-for="item in historyList" :key="item.id" :label="formatDate(item.browse_time)">
                    <div class="history-item">
                        <div class="browse-info">
                            <span class="browse-count">共查看 {{ item.count }} 次</span>
                        </div>
                        <PostCardWrapper :post="item" :width="'100%'" :height="200"
                            @clickCard="handleClickCard" />
                    </div>
                </a-timeline-item>
            </a-timeline>

            <a-empty v-else-if="!loading && historyList.length === 0" description="暂无浏览历史" />

            <div class="loading-container" v-if="loading">
                <a-spin />
            </div>

            <div ref="loadMoreTrigger" class="load-trigger"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';
import { formatDate } from '@/utils/DateFormatter.js';

const router = useRouter();

const historyList = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const after = ref(null);
const limit = 10;
const loadMoreTrigger = ref(null);
let observer = null;

// 加载历史记录
const loadHistory = async () => {
    if (loading.value || !hasMore.value) return;

    loading.value = true;
    try {
        const params = {
            limit: limit
        };

        if (after.value) {
            params.after = after.value;
        }
        const { data } = await api.get('/post/view/history', params);
        console.log(data);
        historyList.value.push(...data.items);
        after.value = data.after;
        hasMore.value = data.items.length>=limit;
    } catch (error) {
        console.error('加载历史记录失败:', error);
        Message.error('加载历史记录失败');
    } finally {
        loading.value = false;
    }
};

// 点击卡片跳转
const handleClickCard = (post) => {
    const routeData = router.resolve({ name: 'Post', params: { id: post.id } });
    window.open(routeData.href, '_blank');
};

// 设置 IntersectionObserver
const setupObserver = () => {
    if (!loadMoreTrigger.value) return;

    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && hasMore.value && !loading.value) {
                loadHistory();
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

onMounted(() => {
    loadHistory();
    setupObserver();
});

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
    }
});
</script>

<style scoped lang="less">
.history-page {
    width: 100%;
    min-height: 100vh;
    background-color: @color-bg-1;

    .page-header {
        padding: 24px 32px;
        background-color: @color-bg-2;
        border-bottom: 1px solid @color-border-2;

        h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: @color-text-1;
        }
    }

    .history-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 24px;

        :deep(.arco-timeline) {
            padding-left: 20px;
        }

        :deep(.arco-timeline-item-label) {
            width: 140px;
            text-align: right;
            padding-right: 24px;
            font-size: 13px;
            color: @color-text-3;
        }

        .history-item {
            margin-bottom: 20px;

            .browse-info {
                margin-bottom: 12px;

                .browse-count {
                    font-size: 12px;
                    color: @color-text-3;
                    background-color: @color-fill-2;
                    padding: 4px 12px;
                    border-radius: 4px;
                    display: inline-block;
                }
            }
        }

        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 0;
        }

        .load-trigger {
            height: 20px;
            width: 100%;
        }
    }
}

@media (max-width: 768px) {
    .history-page {
        .page-header {
            padding: 16px 20px;

            h2 {
                font-size: 20px;
            }
        }

        .history-container {
            padding: 20px 16px;

            :deep(.arco-timeline-item-label) {
                width: 90px;
                padding-right: 12px;
                font-size: 11px;
            }
        }
    }
}
</style>
