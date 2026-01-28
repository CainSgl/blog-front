<template>
    <div class="history-page">
        <a-affix :offset-top="64"  target-container="#router-page-container">
            <div class="page-header">
                <h2>浏览历史</h2>
                <div class="header-actions">
                    <a-button v-if="!isSelectMode" type="outline" @click="enterSelectMode">
                        <template #icon><icon-edit /></template>
                        管理
                    </a-button>
                    <template v-else>
                        <a-space>
                            <a-button type="outline" @click="toggleSelectAll">
                                {{ isAllSelected ? '取消全选' : '全选' }}
                            </a-button>
                            <a-button type="primary" status="danger" :disabled="selectedItems.size === 0"
                                @click="handleDeleteSelected">
                                <template #icon><icon-delete /></template>
                                删除选中 ({{ selectedItems.size }})
                            </a-button>
                            <a-popconfirm content="确定要清空所有历史记录吗？此操作不可恢复！" type="error" @ok="handleClearAll">
                                <a-button type="outline" status="danger">
                                    <template #icon><icon-delete /></template>
                                    清空所有
                                </a-button>
                            </a-popconfirm>
                            <a-button @click="exitSelectMode">取消</a-button>
                        </a-space>
                    </template>
                </div>
            </div>
        </a-affix>

        <div class="history-container">
            <div v-if="historyList.length > 0" class="history-grid">
                <div v-for="item in historyList" :key="item.id" class="history-item"
                    :class="{ 'select-mode': isSelectMode, 'selected': selectedItems.has(item.id) }"
                    @click="handleItemClick(item)">
                    <div class="browse-info">
                        <a-checkbox v-if="isSelectMode" :model-value="selectedItems.has(item.id)" @click.stop
                            @change="toggleSelect(item.id)" />
                        <span class="browse-count">共查看 {{ item.count }} 次</span>
                        <span class="browse-time">{{ formatDate(item.browseTime) }}</span>
                    </div>
                    <a-link :hoverable="false" :href="isSelectMode?'':`/p/${item.postId}`">
                        <PostCardWrapper :showStatus="false" :post="item" :width="'100%'" :height="210" />
                    </a-link>
                </div>
            </div>

            <a-empty v-else-if="!loading && historyList.length === 0" description="暂无浏览历史" />

            <div class="loading-container" v-if="loading">
                <a-spin />
            </div>

            <div ref="loadMoreTrigger" class="load-trigger"></div>
        </div>

        <a-back-top :visible-height="300" target-container="#router-page-container" />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import api from '@/api/index.js';
import { Message, Modal } from '@arco-design/web-vue';
import { IconEdit, IconDelete } from '@arco-design/web-vue/es/icon';
import { formatDate } from '@/utils/DateFormatter.js';

const router = useRouter();

const historyList = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const after = ref(null);
const limit = 10;
const loadMoreTrigger = ref(null);
let observer = null;

// 选择模式相关
const isSelectMode = ref(false);
const selectedItems = ref(new Set());

// 是否全选
const isAllSelected = computed(() => {
    return historyList.value.length > 0 && selectedItems.value.size === historyList.value.length;
});

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
        hasMore.value = data.items.length >= limit;
    } catch (error) {
        console.error('加载历史记录失败:', error);
        Message.error('加载历史记录失败');
    } finally {
        loading.value = false;
    }
};

// 进入选择模式
const enterSelectMode = () => {
    isSelectMode.value = true;
    selectedItems.value.clear();
};

// 退出选择模式
const exitSelectMode = () => {
    isSelectMode.value = false;
    selectedItems.value.clear();
};

// 切换选中状态
const toggleSelect = (id) => {
    if (selectedItems.value.has(id)) {
        selectedItems.value.delete(id);
    } else {
        selectedItems.value.add(id);
    }
};

// 全选/取消全选
const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedItems.value.clear();
    } else {
        historyList.value.forEach(item => {
            selectedItems.value.add(item.id);
        });
    }
};

// 处理项目点击
const handleItemClick = (item) => {
    if (isSelectMode.value) {
        toggleSelect(item.id);
    } else {
        router.push(`/p/${item.postId}`);
    }
};

// 删除选中项
const handleDeleteSelected = () => {
    if (selectedItems.value.size === 0) return;

    Modal.warning({
        title: '确认删除',
        content: `确定要删除选中的 ${selectedItems.value.size} 条历史记录吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
            try {
                const ids = Array.from(selectedItems.value);
                const id = 'deleteHistory' + ids
                Message.loading({ id: id, content: `预计删除 ${ids.length} 条历史记录` });
                await api.delete('/post/view/history', { ids });
                // 从列表中移除已删除的项
                historyList.value = historyList.value.filter(item => !selectedItems.value.has(item.id));

                Message.success({ id: id, content: `成功删除 ${ids.length} 条历史记录` });
                selectedItems.value.clear();

                // 如果列表为空，退出选择模式
                if (historyList.value.length === 0) {
                    exitSelectMode();
                }
            } catch (error) {
                console.error('删除历史记录失败:', error);
                 Message.error({ id: id, content: `删除失败，请重试` });
            
            }
        }
    });
};

// 清空所有历史记录
const handleClearAll = async () => {
    try {
        Message.loading({ id: 'deleteAll', content: "删除中..." });
        await api.delete('/post/view/history/all');
        historyList.value = [];
        selectedItems.value.clear();
        exitSelectMode();
        Message.success({ id: 'deleteAll', content: "已清空所有历史记录" });
    } catch (error) {
        console.error('清空历史记录失败:', error);
        Message.error('清空失败，请重试');
    }
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
        background-color: @color-bg-white;
        border-bottom: 1px solid @color-border-2;
        display: flex;
        justify-content: space-between;
        align-items: center;
      
        z-index: 100;

        h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: @color-text-1;
        }

        .header-actions {
            display: flex;
            gap: 12px;
        }
    }

    .history-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 24px;

        .history-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }

        .history-item {
            position: relative;
            padding: 8px;
            border-radius: 8px;
            border: 2px solid transparent;
            transition: all 0.2s ease;

            &.select-mode {
                cursor: pointer;

                :deep(.arco-link) {
                    pointer-events: none;
                    cursor: pointer;
                }

                &:hover {
                    background-color: @color-fill-1;
                }

                &.selected {
                    background-color: @primary-1;
                    border-color: @primary-6;
                }
            }

            .browse-info {
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 12px;

                .browse-count {
                    font-size: 12px;
                    color: @color-text-3;
                    background-color: @color-fill-2;
                    padding: 4px 12px;
                    border-radius: 4px;
                }

                .browse-time {
                    font-size: 12px;
                    color: @color-text-4;
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
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;

            h2 {
                font-size: 20px;
            }

            .header-actions {
                width: 100%;

                :deep(.arco-space) {
                    width: 100%;
                    flex-wrap: wrap;
                }

                :deep(.arco-btn) {
                    flex: 1;
                    min-width: 80px;
                }
            }
        }

        .history-container {
            padding: 20px 16px;

            .history-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }
    }
}
</style>
