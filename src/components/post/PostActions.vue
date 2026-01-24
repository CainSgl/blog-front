<template>
    <div class="post-actions-wrapper">
        <div v-if="!isExpanded" class="action-trigger" @click="toggleExpand">
            <icon-double-right :style="{ fontSize: '12px' }" />
        </div>

        <div v-show="isExpanded" class="post-actions-panel">
            <div class="action-item" @click="handleLike">
                <a-tooltip content="点赞" position="right">
                    <div class="action-button" :class="{ active: isLiked }">
                        <icon-heart :style="{ fontSize: '24px' }" />
                        <span class="action-count" v-if="likeCount > 0">{{ formatCount(likeCount) }}</span>
                    </div>
                </a-tooltip>
            </div>

            <div class="action-item" @click="handleFavorite">
                <a-tooltip content="收藏" position="right">
                    <div class="action-button" :class="{ active: isFavorited }">
                        <icon-star :style="{ fontSize: '24px' }" />
                    </div>
                </a-tooltip>
            </div>

            <div class="action-item" @click="handleComment">
                <a-tooltip content="评论" position="right">
                    <div class="action-button">
                        <icon-message :style="{ fontSize: '24px' }" />
                        <span class="action-count" v-if="commentCount > 0">{{ formatCount(commentCount) }}</span>
                    </div>
                </a-tooltip>
            </div>

            <div class="action-item" @click="handleReport">
                <a-tooltip content="举报" position="right">
                    <div class="action-button">
                        <icon-exclamation-circle :style="{ fontSize: '24px' }" />
                    </div>
                </a-tooltip>
            </div>

            <!-- 收起按钮 -->
            <div class="action-divider"></div>
            <div class="action-item" @click="toggleExpand">
                <div class="action-button collapse-button">
                    <icon-double-left :style="{ fontSize: '18px' }" />
                </div>
            </div>
        </div>

        <!-- 收藏弹窗 -->
        <AddToFavoriteModal v-model="showFavoriteModal" :targetId="postId" :isIn="isFavorited" type="文章"
            @success="handleFavoriteSuccess" />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { IconHeart, IconStar, IconMessage, IconExclamationCircle, IconDoubleRight, IconDoubleLeft } from '@arco-design/web-vue/es/icon';
import AddToFavoriteModal from '@/components/user/favorite/AddToFavoriteModal.vue';

const props = defineProps({
    postId: {
        type: [String, Number],
        required: true
    },
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    isLiked: {
        type: Boolean,
        default: false
    },
    isFavorited: {
        type: Boolean,
        default: false
    },
});

const emit = defineEmits(['like', 'favorite', 'comment', 'report']);

// 控制展开/收起状态
const isExpanded = ref(true);

// 收藏弹窗
const showFavoriteModal = ref(false);

// 切换展开/收起
const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};

// 格式化数字显示
const formatCount = (count) => {
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count;
};

// 点赞
const handleLike = () => {
    emit('like');
};

// 收藏
const handleFavorite = () => {
    if (!props.isFavorited) {
        showFavoriteModal.value = true;
    }else
    {
        //直接
         emit('favorite',false);
    }

};

// 收藏成功回调
const handleFavoriteSuccess = () => {
    emit('favorite',true);
};

// 评论
const handleComment = () => {
    emit('comment');
};

// 举报
const handleReport = () => {
    emit('report');
};
</script>

<style lang="less" scoped>
.post-actions-wrapper {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    display: flex;
    align-items: center;

    @media screen and (max-width: 768px) {
        display: none;
    }
}

.action-trigger {
    width: 20px;
    height: 48px;
    background-color: var(--color-bg-2);
    border-radius: 0 6px 6px 0;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-text-2);
    transition: all 0.3s ease;

    &:hover {
        background-color: var(--color-bg-3);
        color: rgb(var(--primary-6));
        width: 24px;
    }
}

.post-actions-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background-color: var(--color-bg-2);
    padding: 16px 14px;
    border-radius: 0 12px 12px 0;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
}

.action-item {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
        transform: scale(1.1);
    }
}

.action-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--color-text-2);
    transition: color 0.3s ease;

    &:hover {
        color: rgb(var(--primary-6));
    }

    &.active {
        color: rgb(var(--primary-6));
    }

    &.collapse-button {
        opacity: 0.6;

        &:hover {
            opacity: 1;
        }
    }
}

.action-count {
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
}

.action-divider {
    height: 1px;
    background-color: var(--color-border-2);
    margin: 4px 0;
}
</style>
