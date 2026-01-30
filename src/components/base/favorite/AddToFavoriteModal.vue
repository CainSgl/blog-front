<template>
    <a-modal v-model:visible="visible" title="添加到收藏夹" width="auto" :footer="false" @cancel="handleClose">
        <div class="add-to-favorite-modal">
            <a-spin :loading="loading" tip="加载中..." style="display: block;">
                <div class="favorite-list">
                    <!-- 收藏夹列表 -->
                    <div v-for="item in favoriteList" :key="item.id">
                        <FavoriteItem :item="item" :edit="false" @click="handleToggleCollect(item)" />
                    </div>

                    <!-- 创建新收藏夹 -->
                    <FavoriteItemCreate v-if="!loading" @create="showCreateModal" />
                </div>
            </a-spin>
        </div>

        <!-- 创建收藏夹弹窗 -->
        <CreateFavoriteModal v-model="createModalVisible" :type="type" @success="handleCreateSuccess" />
    </a-modal>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import {Message} from '@arco-design/web-vue';
import api from '@/api/index.js';
import FavoriteItem from './FavoriteItem.vue';
import FavoriteItemCreate from './FavoriteItemCreate.vue';
import CreateFavoriteModal from './CreateFavoriteModal.vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    targetId: {
        type: [String, Number],
        required: true
    },
    type: {
        type: String,
        required: true,
        validator: (value) => ['文章', '知识库'].includes(value)
    }
});

const emit = defineEmits(['update:modelValue', 'success']);

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const loading = ref(false);
const favoriteList = ref([]);
const createModalVisible = ref(false);
let loaded;
// 加载收藏夹列表
const loadFavoriteList = async () => {
    if (loaded) {
        return;
    }
    loaded = true;
    try {
        loading.value = true;
        const { data } = await api.get(`/user/group`, { type: props.type });
        favoriteList.value = data[props.type];
    } catch (error) {
        console.error('加载收藏夹列表失败:', error);
        Message.error('加载收藏夹列表失败');
    } finally {
        loading.value = false;
    }
};



// 切换收藏状态
const handleToggleCollect = async (item) => {
    try {
        const id = "loadStar" + item.id
        Message.loading({ id: id, content: '加载中...' });
        visible.value = false;
        await Promise.all([
            api.get('/post/op/star', { id: props.targetId,type:'收藏'+props.type }),
            api.post('/user/collect', { groupId: item.id, targetId: props.targetId })
        ]);
        Message.success({ id: id, content: '已添加到收藏夹' });
        emit('success');

    } catch (error) {
        console.error('操作失败:', error);
        Message.error('操作失败，请重试');
    }
};

// 显示创建收藏夹弹窗
const showCreateModal = () => {
    createModalVisible.value = true;
};

// 创建成功回调
const handleCreateSuccess = async (data) => {
    favoriteList.value = { ...favoriteList.value,data };
};

const handleClose = () => {
    visible.value = false;
};

// 监听弹窗打开，自动加载收藏夹列表
watch(visible, (newVal) => {
    if (newVal) {
        loadFavoriteList();
    }
});
</script>

<style lang="less" scoped>
.add-to-favorite-modal {
    width: calc(60vw - 40px);
    max-width: 800px;
    min-width: 500px;
    padding: 8px 0;

    .favorite-list {
        width: 100%;
        max-height: 500px;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
    }
}

@media (max-width: 768px) {
    .add-to-favorite-modal {
        width: calc(90vw - 20px);
        min-width: 300px;

        .favorite-list {
            grid-template-columns: 1fr;
        }
    }
}
</style>
