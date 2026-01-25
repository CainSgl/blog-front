<template>
    <a-modal v-model:visible="visible" :title="favoriteData?.name || '收藏夹详情'" width="auto" :footer="false"
        @cancel="handleClose">
        <div class="favorite-detail-modal">
            <a-spin :loading="loading" tip="加载中..." style="display:block">
                <div class="modal-content">
                    <div class="content-grid" :class="{ 'kb-grid': hasKbItems, 'post-grid': !hasKbItems }">
                        <div v-for="item in contentItems" :key="item.collect.id" class="grid-item">
                            <a-link v-if="item.type == '文章'" :href="`/p/${item.target.id}`" target="_ablank" :hoverable="false" class="post-link">
                                <PostCardWrapper :post="item.target" :height="'300px'" />
                            </a-link>
                            <div v-if="item.type == '知识库'"  :hoverable="false" class="kb-link">
                                <KbCard :kbInfo="item.target" :show-status="true" :onlyFans="true" />
                            </div>
                        </div>
                    </div>

                    <a-empty v-if="!loading && contentItems.length === 0" description="暂无收藏内容" />

                    <div class="pagination-wrapper" v-if="total > 0">
                        <a-pagination v-model:current="current" v-model:page-size="pageSize" :total="total"
                            :page-size-options="[10, 20, 30, 50]" show-total show-page-size @change="handlePageChange"
                            @page-size-change="handlePageSizeChange" />
                    </div>
                </div>
            </a-spin>
        </div>
    </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '@/api/index.js';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import KbCard from '@/components/kb/KbCard.vue';
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    favoriteData: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:modelValue']);

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// 检查是否有知识库项目
const hasKbItems = computed(() => {
    return contentItems.value.some(item => item.type === '知识库');
});

const loading = ref(false);
const contentItems = ref([]);
const total = ref(0);
const pages = ref(0);
const current = ref(1);
const pageSize = ref(20);
const hasMore = ref(false);

// 加载收藏夹内容
const loadContent = async () => {
    if (!props.favoriteData?.id) return;

    loading.value = true;
    try {
        const { data } = await api.post(`/user/collect/page`, {
            page: current.value,
            id: props.favoriteData.id,
            pageSize: pageSize.value
        });
        console.log(data)
        contentItems.value = data.records;
        total.value = data.total;
        pages.value = data.pages;
        current.value = data.current;
        pageSize.value = data.size;
        hasMore.value = data.hasMore;
    } catch (error) {
        console.error('加载收藏夹内容失败:', error);
        contentItems.value = [];
        total.value = 0;
    } finally {
        loading.value = false;
    }
};

// 页码改变
const handlePageChange = (page) => {
    current.value = page;
    loadContent();
};

// 每页条数改变
const handlePageSizeChange = (size) => {
    pageSize.value = size;
    current.value = 1;
    loadContent();
};
let opened;
function init() {
    contentItems.value = [];
    total.value = 0;
    pages.value = 0
    current.value = 1;
    pageSize.value = 20;
    hasMore.value = false;

}
// 监听弹窗打开
watch(() => props.modelValue, (newVal) => {
    if (newVal && props.favoriteData) {
        if (opened == props.favoriteData.id) {
            return;
        }
        opened = props.favoriteData.id;
        init();
        loadContent();
    }
});

const handleClose = () => {
    visible.value = false;
};
</script>

<style lang="less" scoped>
.favorite-detail-modal {
    width: calc(90vw - 40px);
    max-width: 1200px;
    min-width: 320px;
    padding: 12px;

    .modal-content {
        min-height: 600px;
        max-height: calc(85vh - 120px);
        overflow-y: auto;

        .content-grid {
            display: grid;
            gap: 16px;
            width: 100%;

            &.post-grid {
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            }

            &.kb-grid {
                grid-template-columns: repeat(auto-fill, 180px);
                justify-content: start;
            }

            .grid-item {
                display: flex;
                justify-content: center;
                align-items: flex-start;

                .post-link {
                    width: 100%;
                }

                .kb-link {
                    width: 180px;
                }
            }
        }

        .pagination-wrapper {
            margin-top: 24px;
            display: flex;
            justify-content: center;
        }
    }
}

@media (max-width: 768px) {
    .favorite-detail-modal {
        width: calc(95vw - 20px);
        min-width: 280px;
        padding: 8px;

        .modal-content {
            min-height: 500px;
            max-height: calc(80vh - 100px);

            .content-grid {
                &.post-grid {
                    grid-template-columns: 1fr;
                }

                &.kb-grid {
                    grid-template-columns: repeat(auto-fill, 180px);
                    justify-content: center;
                }
            }
        }
    }
}
</style>
