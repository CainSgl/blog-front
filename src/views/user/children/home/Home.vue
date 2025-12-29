<template>
  <div class="user-home">
    <a-card class="user-profile-card" :bordered="false">
      <div class="user-profile-header">
        <div class="user-avatar-section">
          <AvatarSection :user-info="userInfo" />
          <div class="user-name-row">
            <a-typography-title :heading="4" class="username">
              {{ userInfo?.nickname || userInfo?.username || '未知用户' }}
            </a-typography-title>
            <a-tag v-if="userInfo?.status == 'banned'" color="red" size="small" style="margin-left: 8px;">已封禁</a-tag>
            <a-tag color="arcoblue" size="small" style="margin-left: 2px;">LV.{{ userInfo?.level }}</a-tag>
            <icon-man v-if="userInfo?.gender === '男'"
              :style="{ color: '#55acee', fontSize: '16px', marginLeft: '2px' }" />
            <icon-woman v-else-if="userInfo?.gender === '女'"
              :style="{ color: '#e85695', fontSize: '16px', marginLeft: '2px' }" />
          </div>
          <div class="user-profile-actions">
            <FollowButton 
              :user-id="userId" 
              @follow-changed="handleFollowChange"
            />
            <a-button size="large" style="margin-left: 12px;">私信</a-button>
          </div>
        </div>
       
        <div class="user-stats">
          <div class="stat-item follower-stat" :class="{ 'stat-active': isOnFollowersPage }" @click="goToFollowerPage">
            <span class="stat-label">粉丝</span>
            <span class="stat-value stat-clickable">{{ userInfo?.followerCount || 0 }}</span>
          </div>
          <div class="stat-item following-stat" :class="{ 'stat-active': isOnFollowingPage }" @click="goToFollowingPage">
            <span class="stat-label">关注</span>
            <span class="stat-value stat-clickable">{{ userInfo?.followingCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">获赞</span>
            <span class="stat-value">{{ userInfo?.likeCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">文章数量</span>
            <span class="stat-value">{{ userInfo?.postCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">阅读量</span>
            <span class="stat-value">{{ userInfo?.articleViewCount || 0 }}</span>
          </div>
        </div>
         <div class="user-bio" v-if="userInfo?.bio">
          <p>{{ userInfo.bio }}</p>
        </div>
      </div>
    </a-card>
    <!-- 置顶文章区域 -->
    <div class="top-posts-section" >
        <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IconUser,
  IconMan,
  IconWoman
} from '@arco-design/web-vue/es/icon';

import api from '@/api/index.js';
import AvatarSection from '@/components/user/home/AvatarSection.vue';
import FollowButton from '@/components/user/home/FollowButton.vue';

const route = useRoute();
const router = useRouter();
const userInfo = ref(null);

// 获取用户ID
const userId = computed(() => route.params.id);

// 计算当前是否在粉丝页面
const isOnFollowersPage = computed(() => {
  return route.path === `/space/${userId.value}/followers`;
});

// 计算当前是否在关注页面
const isOnFollowingPage = computed(() => {
  return route.path === `/space/${userId.value}/following`;
});

// 获取用户信息
const fetchUserInfo = async (id) => {
  try {
    const response = await api.get('/user', { id: id });
    userInfo.value = response.data;
  } catch (err) {
    console.error('获取用户信息失败:', err);
  }
};


// 处理关注状态变化
const handleFollowChange = async (shouldFollow) => {
  if (!userId.value) return;
  
  try {
    if (shouldFollow) {
      // 关注 - 更新用户信息中的粉丝数
      if (userInfo.value) {
        userInfo.value.followerCount = (userInfo.value.followerCount || 0) + 1;
      }
    } else {
      // 取消关注 - 更新用户信息中的粉丝数
      if (userInfo.value) {
        userInfo.value.followerCount = Math.max(0, (userInfo.value.followerCount || 0) - 1);
      }
    }
  } catch (err) {
    console.error('操作失败:', err);
  }
};

// 跳转到粉丝页面
const goToFollowerPage = () => {
  if (userId.value) {
    // 检查当前是否已经在粉丝页面
    if (route.path === `/space/${userId.value}/followers`) {
      // 如果已经在粉丝页面，则返回到用户主页
      router.push(`/space/${userId.value}`);
    } else {
      // 如果不在粉丝页面，则跳转到粉丝页面
      router.push(`/space/${userId.value}/followers`);
    }
  }
};

// 跳转到关注页面
const goToFollowingPage = () => {
  if (userId.value) {
    // 检查当前是否已经在关注页面
    if (route.path === `/space/${userId.value}/following`) {
      // 如果已经在关注页面，则返回到用户主页
      router.push(`/space/${userId.value}`);
    } else {
      // 如果不在关注页面，则跳转到关注页面
      router.push(`/space/${userId.value}/following`);
    }
  }
};

onMounted(() => {
  if (userId.value) {
    fetchUserInfo(userId.value);
  }
});
</script>

<style lang="less" scoped>
.user-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;

  :deep(.arco-statistic) {
    display: inline-block;
    margin-right: 40px;
  }

  :deep(.arco-list-item-meta) {
    align-items: flex-start;
  }

  .user-profile-card {
    border: none;
    /* 移除边框 */

    .user-profile-header {
      padding: 24px 0;

      .user-avatar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 16px;

        .arco-avatar {
          margin-bottom: 20px;
        }

        .user-name-row {
          display: flex;
          align-items: center;
          margin-bottom: 16px;

          .username {
            margin: 0 8px 0 0;
          }
        }

        .user-profile-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }
      }

      .user-stats {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 16px 0;
        .stat-item {
          padding:0px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
          }
        }
      }
    }
  }

  .user-bio {
    padding: 16px 24px;
    margin: 16px 0;
    background-color: @color-bg-1;
    border-radius: 6px;
    border-left: 4px solid @primary-4;
    font-size: 14px;
    color: #555;
    line-height: 1.6;
    text-align: center;
    word-wrap: break-word;
    word-break: break-all;
  }

  .stat-item {
    transition: color 0.3s ease;
    
    &.follower-stat,
    &.following-stat {
      cursor: pointer;
      border-radius: 4px;
      padding: 4px 8px;
      
      &:hover {
        .stat-label,
        .stat-value {
          color: @primary-4 !important;
        }
      }
      
      &.stat-active {

        .stat-label,
        .stat-value {
          color: @primary-4 !important;
        }
      }
    }
  }

  .stat-clickable {
    cursor: pointer;
    transition: color 0.3s ease;
    
    &:hover {
      color: @primary-4 !important;
    }
  }

  .top-posts-section {
    margin-top: 24px;
  }
}
</style>