<template>
    <div class="favorite-item create-item" @click="handleCreate">
        <icon-folder class="item-icon" />
        <span class="item-name">创建收藏夹</span>
    </div>
</template>

<script setup>
import {IconFolder} from '@arco-design/web-vue/es/icon';

const emit = defineEmits(['create']);

const handleCreate = () => {
    emit('create');
};
</script>

<style lang="less" scoped>


.favorite-item {
    height: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-2);
    border-radius: var(--border-radius-medium);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: rgb(var(--primary-6));
        background: var(--color-primary-light-1);
    }

    .item-icon {
        font-size: 18px;
        color: var(--color-text-3);
        flex-shrink: 0;
    }

    .item-name {
        font-size: 14px;
        color: var(--color-text-1);
        font-weight: 400;
        flex: 1;
    }

    &.create-item {
        border-style: dashed;
        border-color: var(--color-border-3);

        .item-icon {
            color: rgb(var(--primary-6));
        }

        .item-name {
            color: rgb(var(--primary-6));
            font-weight: 500;
        }

        &:hover {
            border-color: rgb(var(--primary-6));
        }
    }
}
</style>
