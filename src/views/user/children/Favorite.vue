<template>
    <div class="user-favorite" style="padding:24px">
        <UserPageHeader :userId="userId" title="收藏夹" subtitle="收藏" @back="handleBack" :showSearch="false" api-url="''" />

        <div class="content-area">
            <a-card :bordered="false" class="favorite-card">
                <a-spin :loading="loading" tip="正在加载..." style="display: block;">
                    <div class="favorite-container" v-if="!loading">
                        <div v-for="group in favoriteGroups" :key="group.key" class="favorite-group">
                            <div class="group-header" @click="toggleGroup(group.key)">
                                <icon-down :class="['expand-icon', { expanded: expandedGroups[group.key] }]" />
                                <component :is="getIconComponent(group.icon)" class="group-icon" />
                                <span class="group-title">{{ group.title }}</span>
                                <span class="group-count">{{ groupData[group.type]?.length || 0 }}</span>
                            </div>
                            <transition name="slide">
                                <div v-show="expandedGroups[group.key]" class="group-items">
                                    <div v-for="item in groupData[group.type]" :key="item.id">
                                        <FavoriteItem :item="item" @deleted="handleDeleteFavorite" :edit="isCurrentUser" @click="handleFavoriteClick"/>
                                    </div>
                                    <div v-if="isCurrentUser">
                                        <FavoriteItemCreate @create="handleCreateFavorite(group.type)" />
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                    <div v-else style="min-width: 100%; min-height: 70dvh;"></div>
                </a-spin>
            </a-card>
        </div>

        <!-- 创建收藏夹对话框 -->
        <CreateFavoriteModal 
            v-model="createModalVisible" 
            :type="currentType"
            @success="handleCreateSuccess"
        />

        <!-- 收藏夹详情弹窗 -->
        <FavoriteDetailModal 
            v-model="detailModalVisible" 
            :favoriteData="selectedFavorite"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IconFile, IconBook, IconDown } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import api from '@/api/index.js';
import { useUserStore } from '@/store/user.js';
import UserPageHeader from './common/UserPageHeader.vue';
import FavoriteItem from '@/components/user/favorite/FavoriteItem.vue';
import FavoriteItemCreate from '@/components/user/favorite/FavoriteItemCreate.vue';
import FavoriteDetailModal from '@/components/user/favorite/FavoriteDetailModal.vue';
import CreateFavoriteModal from '@/components/user/favorite/CreateFavoriteModal.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const userId = ref(route.params.id);

// 收藏夹分组配置
const favoriteGroups = [
    { key: 'article', type: '文章', icon: 'IconFile', title: '文章' },
    { key: 'kb', type: '知识库', icon: 'IconBook', title: '知识库' }
];

// 获取图标组件
const getIconComponent = (iconName) => {
    const iconMap = {
        IconFile,
        IconBook
    };
    return iconMap[iconName];
};


const groupData = ref({});
const loading = ref(true);

// 展开状态
const expandedGroups = ref({
    article: true,
    kb: true
});

// 创建收藏夹对话框
const createModalVisible = ref(false);
const currentType = ref('');

// 收藏夹详情弹窗
const detailModalVisible = ref(false);
const selectedFavorite = ref(null);

const toggleGroup = (groupKey) => {
    expandedGroups.value[groupKey] = !expandedGroups.value[groupKey];
};

const loadFavorites = async () => {
    loading.value = true;
    try {
        const response = await api.get('/user/group',{userId:userId.value});
        groupData.value = response.data || {};
    } catch (error) {
        console.error('加载收藏失败:', error);
        groupData.value = {};
    } finally {
        loading.value = false;
    }
};

const handleCreateFavorite = (type) => {
    currentType.value = type;
    createModalVisible.value = true;
};

const handleCreateSuccess = (data) => {
    if (groupData.value[currentType.value]) {
        groupData.value[currentType.value].push(data);
    } else {
        groupData.value[currentType.value] = [data];
    }
};

const handleDeleteFavorite = (id) => {
    // 从本地数据中删除
    for (const type in groupData.value) {
        const items = groupData.value[type];
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            break;
        }
    }
};

const handleBack = () => {
    router.push(`/space/${userId.value}`);
};

const handleFavoriteClick = (favorite) => {
    selectedFavorite.value = favorite;
    detailModalVisible.value = true;
};
const currentUserInfo = ref({ id: -1 });

// 计算当前是否为访问自己的文章列表
const isCurrentUser = computed(() => 
{
  return currentUserInfo.value.id == userId.value;
});
onMounted(async () => {
    if (userId.value) {
        loadFavorites();
        currentUserInfo.value = await userStore.getUserInfo();
    }
});
</script>

<style lang="less" scoped>
.user-favorite {
    margin: 0 auto;
  
    max-width: 1200px;
    .content-area {
        margin-top: 20px;

        .favorite-card {
            min-height: 400px;
            width: 100%;

            :deep(.arco-card-body) {
                padding: 24px;
            }
        }
    }

    .favorite-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }



    // 分组样式
    .favorite-group {
        margin-top: 16px;
        width: 100%;

        .group-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            background: #f7f8fa;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
            user-select: none;

            &:hover {
                background: #e8f3ff;
            }

            .expand-icon {
                font-size: 12px;
                color: #86909c;
                transition: transform 0.2s;

                &.expanded {
                    transform: rotate(0deg);
                }

                &:not(.expanded) {
                    transform: rotate(-90deg);
                }
            }

            .group-icon {
                font-size: 16px;
               
            }

            .group-title {
                font-size: 15px;
                font-weight: 600;
                color: #1d2129;
                flex: 1;
            }

            .group-count {
                font-size: 13px;
                color: #86909c;
                background: #fff;
                padding: 2px 8px;
                border-radius: 10px;
            }
        }

        .group-items {
            margin-top: 8px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
        }
    }
}

// 展开/收起动画
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 1000px;
    margin-top: 8px;
}
</style>