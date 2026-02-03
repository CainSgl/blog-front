<template>
  <div class="avatar-section">
    <a-popover trigger="click" position="br" :content-style="{ minWidth: '300px', maxWidth: '400px' }" v-model:popup-visible="popoverVisible">
      <Avatar :src="userInfo?.avatarUrl" class="avatar-trigger"  />
      <template #content>
        <div class="user-info-popover" v-if="userInfo?.id != '-1'">
          <div class="user-header">
            <Avatar :size="60" class="user-avatar" :src="userInfo?.avatarUrl" />
            <div class="user-basic-info">
              <div class="user-name-row">
                <span class="user-nickname">{{ userInfo?.nickname || userInfo?.username || '-' }}</span>
                <icon-man v-if="userInfo?.gender === '男'"
                  :style="{ color: '#55acee', fontSize: '16px', marginLeft: '2px' }" />
                <icon-woman v-else-if="userInfo?.gender === '女'"
                  :style="{ color: '#e85695', fontSize: '16px', marginLeft: '2px' }" />
                <a-tag color="arcoblue" size="small" style="margin-left: 8px;">LV.{{ userInfo?.level }}</a-tag>
              </div>
              <div class="user-stats">
                <div class="stat-item stat-clickable" @click="goToFollowers">
                  <span class="stat-label">粉丝</span>
                  <span class="stat-value">{{ userInfo?.followerCount || 0 }}</span>
                </div>
                <div class="stat-item stat-clickable" @click="goToFollowing">
                  <span class="stat-label">关注</span>
                  <span class="stat-value">{{ userInfo?.followingCount || 0 }}</span>
                </div>
                <div class="stat-item stat-clickable" @click="goToLikes">
                  <span class="stat-label">获赞</span>
                  <span class="stat-value">{{ userInfo?.likeCount || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 用户经验条 -->
          <div class="user-experience" v-if="userInfo">
            <div class="exp-container">
              <span class="level-text">LV.{{ userInfo?.level }}</span>
              <a-progress :percent="userInfo?.experience / userInfo?.nextLevelTotalExp" :show-text="false"
                class="exp-progress" size="small" />
              <span class="level-text">LV.{{ userInfo?.level + 1 }}</span>
            </div>
          </div>
          <!-- 用户选项菜单 -->
          <div class="user-options">
            <template v-for="option in menuOptions" :key="option.label">

              <div class="option-item" @click="option.action">
                <component :is="option.icon" />
                <span>{{ option.label }}</span>

              </div>
              <a-divider :margin="0" v-if="option.divider" />
            </template>

            <ThemeSwitcher />
          </div>

        </div>
        <div class="login-prompt" v-else>
          <div class="login-message">
            <icon-lock class="lock-icon" />
            <p class="login-title">请先登录</p>
            <p class="login-subtitle">登录后体验更多功能</p>
          </div>
          <a-button type="primary" size="large" long @click="showLogin" class="login-button">
            立即登录
          </a-button>
          <div class="login-features">
            <p class="features-title">登录后可享受：</p>
            <ul class="features-list">
              <li>个人空间管理</li>
              <li>知识库功能</li>
              <li>文档云存储</li>
              <li>历史记录</li>
              <li>个性化设置</li>
            </ul>
          </div>
          <a-divider :margin="5" />
          <ThemeSwitcher />
        </div>
      </template>
    </a-popover>

    <!-- 升级弹窗 -->
    <LevelUpModal ref="levelUpModalRef" />
    <!-- 签到记录弹窗 -->
    <CheckInModal ref="checkInModalRef" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user.js';
import { storeToRefs } from 'pinia';
import Avatar from '@/components/base/avatar/Avatar.vue';
import ThemeSwitcher from '@/components/base/ThemeSwitcher.vue';
import LevelUpModal from '@/components/base/checkin/LevelUpModal.vue';
import CheckInModal from '@/components/base/checkin/CheckInModal.vue';
import {
  IconExport,
  IconLock,
  IconMan,
  IconUser,
  IconWoman,
  IconEraser,
  IconCalendar
} from '@arco-design/web-vue/es/icon';
import { useRouter } from 'vue-router';
import { getLoginService, showLoginModal } from '@/services/authService.js';
import { Message } from '@arco-design/web-vue';
import api from '@/api/index.js';
import { performCheckIn, isCacheValid, getCheckInCache } from '@/services/checkInService.js';

const userStore = useUserStore();
const router = useRouter();
const { userInfo } = storeToRefs(userStore);
const levelUpModalRef = ref(null);
const checkInModalRef = ref(null);
const popoverVisible = ref(false);

// 检测是否有鼠标（非触摸设备）
const hasMouse = ref(true);

onMounted(() => {
  // 检测设备是否支持触摸
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  hasMouse.value = !isTouchDevice;
});

// 自动签到
onMounted(() => {
  autoCheckIn();
});

// 自动签到逻辑
const autoCheckIn = async () => {
  if (!userStore.isUserLoggedIn() || !userInfo.value || userInfo.value.id === -1) {
    return;
  }

  // 检查缓存
  const cache = getCheckInCache();

  // 如果缓存有效（userId和date匹配），说明今天已签到
  if (isCacheValid(cache, userInfo.value.id)) {
    return;
  }

  // 没签到，执行签到
  try {
    const result = await performCheckIn(userInfo.value.id);
    
    if (result.success) {
      Message.success(`签到成功！获得 ${result.expGained} 经验`);

      // 重新获取用户信息
      const oldLevel = userInfo.value.level;
      const currentUserResponse = await api.get('/user/current');
      await userStore.updateUserInfo(currentUserResponse.data,true);

      // 检查是否升级
      const newLevel = currentUserResponse.data.level;
      if (newLevel > oldLevel) {
        levelUpModalRef.value?.open(oldLevel, newLevel);
      }
    }
  } catch (error) {
    console.error('自动签到失败:', error);
  }
};





// 处理头像点击
const handleAvatarClick = () => {
  // 如果是触摸设备（没有鼠标）
  if (!hasMouse.value) {
    // 如果弹出层未显示，则显示弹出层，不跳转
    if (!popoverVisible.value) {
      popoverVisible.value = true;
      return;
    }
  }
  
  // 有鼠标的设备，或者弹出层已显示时，执行跳转
  openInNewTab(`/space/${userInfo.value?.id}`);
};

// 在新标签页中打开指定路径
const openInNewTab = (path) => {
  if (userInfo.value.id == '-1') {
    showLogin();
    return;
  }
  const fullPath = router.resolve(path).href;
  window.open(fullPath, '_blank');
};

// 显示登录弹窗
const showLogin = () => {
  showLoginModal();
};

// 退出登录
const logout = async () => {
  const loginService = getLoginService();
  loginService.logout();
  window.location.reload();
};

// 打开签到记录
const openCheckIn = () => {
  if (!userStore.isUserLoggedIn()) {
    showLogin();
    return;
  }
  checkInModalRef.value?.open(userInfo.value);
};

// 跳转到粉丝页面
const goToFollowers = () => {
  if (!userStore.isUserLoggedIn()) {
    showLogin();
    return;
  }
  popoverVisible.value = false;
  router.push(`/space/${userInfo.value?.id}/followers`);
};

// 跳转到关注页面
const goToFollowing = () => {
  if (!userStore.isUserLoggedIn()) {
    showLogin();
    return;
  }
  popoverVisible.value = false;
  router.push(`/space/${userInfo.value?.id}/following`);
};

// 跳转到获赞页面
const goToLikes = () => {
  if (!userStore.isUserLoggedIn()) {
    showLogin();
    return;
  }
  popoverVisible.value = false;
  router.push('/messages/like');
};

// 菜单选项配置
const menuOptions = computed(() => [
  {
    label: '我的空间',
    icon: IconUser,
    action: () => openInNewTab(`/space/${userInfo.value?.id}`)
  },
  {
    label: '查看签到',
    icon: IconCalendar,
    action: openCheckIn,
    divider: true
  },
  {
    label: '退出登录',
    icon: IconExport,
    action: logout,
    divider: true,
  },
  {
    label:'清除缓存',
    icon:IconEraser,
    action:()=>{
      userStore.clearCache();
      window.location.reload();
    },
  }
]);
</script>

<style scoped lang="less">
.avatar-section {
  flex: 0 0 auto;

  .avatar-trigger {
    cursor: pointer;
  }

  @media (max-width: 480px) {
    :deep(.avatar-trigger) {
      width: 32px !important;
      height: 32px !important;
    }
  }
}

.user-info-popover {
  padding: @size-3;
  user-select: none;
  word-wrap: break-word;
  overflow-wrap: break-word;


  .user-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .user-basic-info {
      margin-left: 16px;
      flex: 1;
      min-width: 0;

      .user-name-row {
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        .user-nickname {
          font-size: @font-size-title-1;
          font-weight: bold;
          color: var(--color-neutral-10);
        }
      }

      .user-stats {
        display: flex;
        font-size: @font-size-caption;
        color: var(--color-neutral-8);
        margin-top: 6px;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: @size-4;
          border-radius: 4px;
          padding: 4px 8px;
          transition: all 0.3s ease;

          &:last-child {
            margin-right: 0;
          }

          &.stat-clickable {
            cursor: pointer;

            &:hover {
              background-color: var(--color-fill-2);

              .stat-label,
              .stat-value {
                color: rgb(var(--primary-6)) !important;
              }
            }
          }

          .stat-label {
            font-size: @font-size-body-2;
            color: var(--color-neutral-6);
            transition: color 0.3s ease;
          }

          .stat-value {
            font-size: @font-size-body-3;
            font-weight: bold;
            color: var(--color-neutral-10);
            transition: color 0.3s ease;
          }
        }
      }
    }
  }

  .user-experience {
    margin-top: 12px;

    .exp-container {
      display: flex;
      align-items: center;
      gap: @size-2;

      .exp-progress {
        flex: 1;
      }

      .level-text {
        font-size: @font-size-caption;
        color: var(--color-neutral-6);
        white-space: nowrap;
      }
    }
  }

  .user-options {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border-2);
    display: flex;
    flex-direction: column;
    gap: 8px;

    .option-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: @font-size-body-3;
      color: var(--color-neutral-10);

      &:hover {
        background-color: var(--color-fill-2);
      }

      >*:first-child {
        margin-right: @size-2;
      }
    }
  }
}

.login-prompt {
  padding: @size-3;

  .login-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: @size-3 0;

    .lock-icon {
      font-size: 32px;
      color: var(--color-neutral-6);
      margin-bottom: 16px;
    }

    .login-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--color-neutral-10);
    }

    .login-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--color-neutral-6);
      line-height: 1.5;
    }
  }

  .login-button {
    margin-top: 20px;
  }

  .login-features {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-2);

    .features-title {
      font-size: 12px;
      color: var(--color-neutral-6);
      margin: 0 0 8px 0;
    }

    .features-list {
      padding-left: 20px;
      margin: 0;
      font-size: 12px;
      color: var(--color-neutral-6);
      line-height: 1.8;

      li {
        margin: 4px 0;
      }
    }
  }
}
</style>
