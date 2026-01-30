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
@import '@/assets/style/global.less';

.favorite-item {
    height: 24px;
    display: flex;
    align-items: center;
    gap: @size-3;
    padding: @size-3 @size-4;
    background: @color-bg-white;
    border: @border-1 solid @color-fill-3;
    border-radius: @border-radius-medium;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: @primary-6;
        background: @primary-1;
    }

    .item-icon {
        font-size: 18px;
        color: @color-text-3;
        flex-shrink: 0;
    }

    .item-name {
        font-size: @font-size-body-3;
        color: @color-text-1;
        font-weight: @font-weight-400;
        flex: 1;
    }

    &.create-item {
        border-style: dashed;
        border-color: @color-fill-4;

        .item-icon {
            color: @primary-6;
        }

        .item-name {
            color: @primary-6;
            font-weight: @font-weight-500;
        }

        &:hover {
            border-color: @primary-6;
        }
    }
}
</style>
