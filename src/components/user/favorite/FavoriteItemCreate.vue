<template>
    <div class="favorite-item create-item" @click="handleCreate">
        <icon-folder class="item-icon" />
        <span class="item-name">创建收藏夹</span>
    </div>
</template>

<script setup>
import { IconFolder } from '@arco-design/web-vue/es/icon';

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
    background: #fff;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #00aeec;
        background: #f0f9ff;
    }

    .item-icon {
        font-size: 18px;
        color: #4e5969;
        flex-shrink: 0;
    }

    .item-name {
        font-size: 14px;
        color: #1d2129;
        font-weight: 400;
        flex: 1;
    }

    &.create-item {
        border-style: dashed;
        border-color: #c9ccd0;

        .item-icon {
            color: #00aeec;
        }

        .item-name {
            color: #00aeec;
            font-weight: 500;
        }

        &:hover {
            border-color: #00aeec;
        }
    }
}
</style>
