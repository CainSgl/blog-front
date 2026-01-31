<template>
    <div class="favorite-item" @mouseenter="isHovered = true" @mouseleave="isHovered = false" @click="handleItemClick">
        <icon-folder class="item-icon" v-if="localItem.publish" style="height: 24px;" />
        <svg v-else width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd"
                d="M16 5.15A5.85 5.85 0 0010.15 11v3.15H10A2.85 2.85 0 007.15 17v7A2.85 2.85 0 0010 26.85h12A2.85 2.85 0 0024.85 24v-7A2.85 2.85 0 0022 14.15h-.15V11A5.85 5.85 0 0016 5.15zm4.15 9V11a4.15 4.15 0 00-8.3 0v3.15h8.3zM11 15.85h-1A1.15 1.15 0 008.85 17v7c0 .635.515 1.15 1.15 1.15h12A1.15 1.15 0 0023.15 24v-7A1.15 1.15 0 0022 15.85H11z"
                fill="#4E5969" />
            <path d="M16 19v2" stroke="#4E5969" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="item-name">{{ localItem.name }}</span>
        <transition name="fade" mode="out-in">
            <div v-if="!isHovered || !edit">
                <span class="item-count" key="count">{{ localItem.count || 0 }}</span>
            </div>
            <div v-else>
                <icon-more-vertical class="item-more" key="more" @click.stop="showEditModal" />
            </div>
        </transition>
    </div>
    <!-- 编辑模态框 -->
    <div v-if="edit">
        <a-modal v-model:visible="editModalVisible" title="编辑收藏夹" @ok="handleSave" @cancel="handleCancel">
            <a-form :model="editForm" layout="vertical">
                <a-form-item label="收藏夹名称" required>
                    <a-input v-model="editForm.name" placeholder="请输入收藏夹名称" allow-clear />
                </a-form-item>
                <a-form-item label="收藏夹描述">
                    <a-textarea v-model="editForm.description" placeholder="请输入收藏夹描述（可选）" allow-clear
                        :auto-size="{ minRows: 3, maxRows: 5 }" />
                </a-form-item>
                <a-form-item label="公开设置">
                    <a-switch v-model="editForm.publish" checked-text="公开" unchecked-text="私密" />
                </a-form-item>
            </a-form>
            <template #footer>
                <div class="modal-footer">
                    <a-popconfirm content="确定要删除这个收藏夹吗？删除后无法恢复。" @ok="handleDelete" position="top">
                        <a-button type="primary" status="danger">删除</a-button>
                    </a-popconfirm>
                    <div class="modal-footer-right">
                        <a-button @click="handleCancel">取消</a-button>
                        <a-button type="primary" @click="handleSave">保存</a-button>
                    </div>
                </div>
            </template>
        </a-modal>
    </div>
</template>

<script setup>
import {reactive, ref} from 'vue';
import {IconFolder, IconMoreVertical} from '@arco-design/web-vue/es/icon';
import {Message} from '@arco-design/web-vue';
import api from '@/api/index.js';

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    edit: {
        type: Boolean,
        default: false,
    }
});

const emit = defineEmits(['deleted', 'updated', 'click']);

const isHovered = ref(false);
const editModalVisible = ref(false);
const editForm = reactive({
    name: '',
    description: '',
    publish: false
});

// 本地数据，用于实时更新显示
const localItem = ref({ ...props.item });

const handleItemClick = () => {
    emit('click', localItem.value);
};

const showEditModal = () => {
    editForm.name = localItem.value.name || '';
    editForm.description = localItem.value.description || '';
    editForm.publish = localItem.value.publish || false;
    editModalVisible.value = true;
};

const handleSave = async () => {
    if (!editForm.name.trim()) {
        Message.warning('请输入收藏夹名称');
        return;
    }

    const loadingId = 'save-favorite' + localItem.value.id;
    Message.loading({ id: loadingId, content: '保存中...' });
    editModalVisible.value = false;
    try {
        await api.put(`/user/group`, {
            id: localItem.value.id,
            name: editForm.name,
            description: editForm.description,
            publish: editForm.publish
        });

        // 更新本地数据
        localItem.value = { ...localItem.value, ...editForm };




        // 再显示成功消息
        Message.success({ id: loadingId, content: '更新成功' });
        emit('updated', localItem.value);
    } catch (error) {
        console.error('更新收藏夹失败:', error);
        Message.error({ id: loadingId, content: '更新失败，请稍后重试' });
    }
};

const handleDelete = async () => {
    const loadingId = 'delete-favorite' + localItem.value.id;
    Message.loading({ id: loadingId, content: '删除中...' });
    editModalVisible.value = false;
    try {
        await api.delete(`/user/group`, { id: localItem.value.id });
        // 再显示成功消息
        Message.success({ id: loadingId, content: '删除成功' });
        emit('deleted', localItem.value.id);
    } catch (error) {
        console.error('删除收藏夹失败:', error);
        Message.error({ id: loadingId, content: '删除失败，请稍后重试' });
    }
};


const handleCancel = () => {
    editModalVisible.value = false;
};
</script>

<style lang="less" scoped>


.favorite-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-bg-2);
    border: 1px solid var(--color-fill-3);
    border-radius: var(--border-radius-medium);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-primary-6);
        background: var(--color-primary-light-1);
    }

    .item-icon {
        font-size: 18px;
        color: var(--color-neutral-6);
        flex-shrink: 0;
    }

    .item-name {
        font-size: 14px;
        color: var(--color-neutral-10);
        font-weight: 400;
        flex: 1;
    }

    .item-count {
        font-size: 12px;
        color: var(--color-neutral-4);
        background: var(--color-fill-2);
        padding: 2px 10px;
        border-radius: 10px;
        font-weight: 500;
        flex-shrink: 0;
    }

    .item-more {
        font-size: 18px;
        color: var(--color-neutral-4);
        flex-shrink: 0;
        padding: 2px;
        border-radius: var(--border-radius-small);
        transition: all 0.08s;

        &:hover {
            background: var(--color-primary-light-4);
            color: var(--color-primary-6);
        }
    }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.08s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .modal-footer-right {
        display: flex;
        gap: 12px;
    }
}
</style>
