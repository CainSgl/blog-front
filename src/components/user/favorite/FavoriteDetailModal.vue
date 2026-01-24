<template>
    <a-modal 
        v-model:visible="visible" 
        :title="favoriteData?.name || '收藏夹详情'" 
        width="auto"
        :footer="false"
        @cancel="handleClose"
    >
        <div class="favorite-detail-modal">
            <a-spin :loading="loading" tip="加载中..." style="display:block">
                <div class="modal-content">
                    <a-grid :cols="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }" :colGap="16" :rowGap="16">
                        <a-grid-item v-for="item in contentItems.target" :key="item.collect.id">
                            <a-link v-if="favoriteData.type=='文章'" :href="`/p/${item.id}`" :hoverable="false">
                                <PostCardWrapper :post="item" :height="'200px'" />
                            </a-link>
                             <a-link v-if="favoriteData.type=='知识库'" :href="`/p/${item.id}`" :hoverable="false">
                                <KbCard   :show-status="true" :onlyFans="true" />
                            </a-link>
                        </a-grid-item>
                    </a-grid>

                    <a-empty v-if="!loading && contentItems.length === 0" description="暂无收藏内容" />

                    <div class="pagination-wrapper" v-if="total > 0">
                        <a-pagination 
                            v-model:current="current"
                            v-model:page-size="pageSize"
                            :total="total"
                            :page-size-options="[10, 20, 30, 50]"
                            show-total
                            show-page-size
                            @change="handlePageChange"
                            @page-size-change="handlePageSizeChange"
                        />
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
        const result = await api.post(`/user/collect/page`, {
            page: current.value,
            id: props.favoriteData.id,
            pageSize: pageSize.value
        });
        
        contentItems.value = result.records || [];
        total.value = result.total || 0;
        pages.value = result.pages || 0;
        current.value = result.current || 1;
        pageSize.value = result.size || 20;
        hasMore.value = result.size >= pageSize.value;
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

// 监听弹窗打开
watch(() => props.modelValue, (newVal) => {
    if (newVal && props.favoriteData) {
        current.value = 1;
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
        }
    }
}
</style>
