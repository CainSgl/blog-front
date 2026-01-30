<template>
    <div class="post-actions-wrapper">
        <div v-if="!isExpanded" class="action-trigger" @click="toggleExpand">
            <icon-double-right :style="{ fontSize: '12px' }" />
        </div>

        <div v-show="isExpanded" class="post-actions-panel">
            <div class="action-item" @click="handleLike">
                <a-tooltip content="点赞" position="right">
                    <div class="action-button like-button" :class="{ 'liked': isLiked }">
                        <icon-heart-fill v-if="isLiked" :style="{ fontSize: '24px' }" />
                        <icon-heart v-else :style="{ fontSize: '24px' }" />
                        <span class="action-count">{{ formatCount(likeCount) }}</span>
                    </div>
                </a-tooltip>
            </div>

            <div class="action-item" @click="handleFavorite">
                <a-tooltip content="收藏" position="right">
                    <div class="action-button favorite-button" :class="{ 'favorited': isFavorited }">
                        <icon-star-fill v-if="isFavorited" :style="{ fontSize: '24px' }" />
                        <icon-star v-else :style="{ fontSize: '24px' }" />
                          <span class="action-count" >{{ formatCount(starCount) }}</span>
                    </div>
                </a-tooltip>
            </div>

            <div class="action-item" @click="handleComment">
                <a-tooltip content="评论" position="right">
                    <div class="action-button comment-button">
                        <icon-message :style="{ fontSize: '24px' }" />
                        <span class="action-count" >{{ formatCount(commentCount) }}</span>
                    </div>
                </a-tooltip>
            </div>

            <div class="action-item" @click="handleReport">
                <a-tooltip content="举报" position="right">
                    <div class="action-button report-button">
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
import {ref} from 'vue';
import {Message, Modal} from '@arco-design/web-vue';
import {
  IconDoubleLeft,
  IconDoubleRight,
  IconExclamationCircle,
  IconHeart,
  IconHeartFill,
  IconMessage,
  IconStar,
  IconStarFill
} from '@arco-design/web-vue/es/icon';
import AddToFavoriteModal from '@/components/user/favorite/AddToFavoriteModal.vue';
import api from '@/api/index'

const props = defineProps({
    postId: {
        type: [String, Number],
        required: true
    },
    likeCount: {
        type: Number,
        default: 0
    },
    starCount:{
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
    authorId:{
        type:String
    }
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
const handleLike = async () => {
    try {
        const id = props.isLiked ? 'unlike' + props.postId : 'like' + props.postId;
         Message.loading({ 
            id: id, 
            content: '加载中...' 
        });
        await api.get('/post/op/like', { id: props.postId, add: !props.isLiked,authorId:props.authorId});
        Message.success({ 
            id: id, 
            content: props.isLiked ? '已取消点赞' : '点赞成功' 
        });
        emit('like', !props.isLiked);
    } catch (error) {
        console.error('点赞操作失败:', error);
        Message.error('操作失败，请重试');
    }
};

// 收藏
const handleFavorite = async () => {
    if (!props.isFavorited) {
        showFavoriteModal.value = true;
    } else {
        // 显示确认弹窗
        Modal.confirm({
            title: '取消收藏',
            content: '确定要取消收藏这篇文章吗？',
            okText: '确定',
            cancelText: '取消',
            onBeforeOk: async (done) => {
                try {
                    const id = 'unStar' + props.postId;
                    await Promise.all([
                        api.get('/post/op/star', { id: props.postId,type:"收藏文章", add: false }),
                        api.delete('/user/collect', { id: props.postId, type: '文章' })
                    ]);
                    Message.success({ id: id, content: '已取消收藏' });
                    emit('favorite', false);
                    done(true);
                } catch (error) {
                    console.error('取消收藏失败:', error);
                    Message.error('取消收藏失败，请重试');
                    done(false);
                }
            }
        });
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

    &.like-button:hover {
        color: rgb(var(--primary-4));
    }

    &.favorite-button:hover {
        color: rgb(var(--warning-6));
    }

    &.liked {
        color: rgb(var(--primary-4));
    }

    &.favorited {
        color: rgb(var(--warning-6));
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
