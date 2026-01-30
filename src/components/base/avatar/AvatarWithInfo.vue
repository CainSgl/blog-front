<template>
    <a-popover v-if="user" trigger="hover" :position="position"
        :content-style="{ minWidth: '300px', maxWidth: '400px' }">
        <a :href="`/space/${user.id}`" target="_blank" :hoverable="false">
        <Avatar :size="size" class="user-avatar" :style="{ ...avatarStyle, cursor: 'pointer' }" :draggable="false"
            :src="user.avatarUrl">
        </Avatar>
        </a>
        <template #content>
            <div class="user-info-popover">
                <div class="user-header">
                    <Avatar :size="60" class="user-avatar" @click="goToUserSpace" :src="user.avatarUrl"
                        :style="{ ...avatarStyle, cursor: 'pointer' }">
                    </Avatar>
                    <div class="user-basic-info">
                        <div class="user-name-row">
                            <span class="user-nickname">{{ user.nickname }}</span>
                            <icon-man v-if="user.gender === '男'"
                                :style="{ color: '#55acee', fontSize: '16px', marginLeft: '2px' }" />
                            <icon-woman v-if="user.gender === '女'"
                                :style="{ color: '#e85695', fontSize: '16px', marginLeft: '2px' }" />
                            <a-tag color="arcoblue" size="small" style="margin-left: 2px;">LV.{{ user.level }}</a-tag>
                        </div>
                            
                        <div class="user-stats">
                            <span class="stat-item">
                                <strong>{{ user.followerCount }}</strong> 粉丝
                            </span>
                            <span class="stat-item" style="margin: 0 12px;">
                                <strong>{{ user.followingCount }}</strong> 关注
                            </span>
                            <span class="stat-item">
                                <strong>{{ user.likeCount }}</strong> 获赞
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="user.status === 'banned'" class="user-info-item banned-info">
                    <span style="color: red; font-weight: bold;">该用户已被封禁</span>
                </div>
                <div v-else class="user-registration">
                    <strong>注册时间：</strong>
                    <span>{{ formatDate(user.createdAt) }}</span>
                </div>
                <div v-if="user.bio" class="user-info-item bio-section">
                    <span class="bio-text">{{ user.bio }}</span>
                </div>
            </div>
        </template>
    </a-popover>
    <Avatar v-else :size="size" :style="{ ...avatarStyle }" :loading="true" />
</template>

<script setup>
import {IconMan, IconWoman} from '@arco-design/web-vue/es/icon';
import {useRouter} from 'vue-router';
import Avatar from '@/components/base/avatar/Avatar.vue';
import {formatDate} from '@/utils/DateFormatter.js';

const props = defineProps({
  user: {
    type: Object,
  },
  size: {
    type: [Number, String],
    default: 40
  },
  avatarStyle: {
    type: Object,
    default: () => ({})
  },
  position: {
    type: String,
    default: 'rt'
  }
});

const router = useRouter();

// 跳转到用户空间页面
const goToUserSpace = () => 
{
  if (props.user) 
  {
    const routeData = router.resolve({ name: 'User', params: { id: props.user.id } });
    window.open(routeData.href, '_blank');
  }
};
</script>

<style scoped lang="less">
@import '@/assets/style/global.less';

.user-avatar {
    margin-right: @size-3;
    cursor: pointer;
}

.user-info-popover {
    padding: @size-3;
    user-select: none;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.user-header {
    display: flex;
    align-items: center;
    margin-bottom: @size-2;
}

.user-basic-info {
    margin-left: 30px;
    flex: 1;
    min-width: 0; // 允许flex item收缩到内容以下
}

.user-name-row {
    display: flex;
    align-items: center;
    margin-bottom: @size-1;

    .user-nickname {
        font-size: @font-size-title-1;
        font-weight: @font-weight-700;
    }

    >.arco-tag {
        margin-left: @size-2;
    }

    >[class*="icon"] {
        display: flex;
        align-items: center;
    }
}

.user-stats {
    display: flex;
    font-size: @font-size-body-1;
    color: @color-text-3;
    margin: 6px 0;

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        strong {
            font-size: @font-size-body-3;
            color: @color-text-2;
            margin-bottom: 2px;
        }
    }
}

.user-registration {
    font-size: @font-size-body-1;
    color: @color-text-3;

    strong {
        color: @color-text-2;
    }
}

.user-info-item {
    margin-bottom: @size-2;

    &:last-child {
        margin-bottom: 0;
    }

    strong {
        display: inline-block;
        margin-bottom: @size-1;
        color: @color-text-2;
    }
}

.banned-info {
    color: @danger-6;
    font-weight: @font-weight-700;
    border-top: @border-1 solid @color-fill-3;
    padding-top: @size-2;
    margin-top: @size-2;
}

.bio-section {
    margin-top: @size-4;
}

.bio-text {
    color: @color-text-2;
    font-size: @font-size-body-2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
}
</style>