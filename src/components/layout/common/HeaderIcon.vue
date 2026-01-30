<template>
  <div class="avatar-section">
    <a-popover trigger="hover" position="br" :content-style="{ minWidth: '300px', maxWidth: '400px' }">
      <Avatar :src="userInfo?.avatarUrl" class="avatar-trigger"
        @click="openInNewTab(`/space/${userInfo?.id}`)" />
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
                <div class="stat-item">
                  <span class="stat-label">粉丝</span>
                  <span class="stat-value">{{ userInfo?.followerCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">关注</span>
                  <span class="stat-value">{{ userInfo?.followingCount || 0 }}</span>
                </div>
                <div class="stat-item">
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
            <div class="option-item" @click="openInNewTab(`/space/${userInfo?.id}`)">
              <icon-user />
              <span>我的空间</span>
            </div>
            <div class="option-item" @click="openInNewTab(`/space/${userInfo?.id}/knowledge`)">
              <icon-book />
              <span>我的知识库</span>
            </div>
            <div class="option-item" @click="openInNewTab(`/space/${userInfo?.id}/docs`)">
              <icon-file />
              <span>我的文档</span>
            </div>
            <div class="option-item" @click="openInNewTab(`/space/${userInfo?.id}/cloud`)">
              <icon-cloud />
              <span>云空间</span>
            </div>
            <div class="option-item" @click="logout">
              <icon-export />
              <span>退出登录</span>
            </div>
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
        </div>
      </template>
    </a-popover>
  </div>
</template>

<script setup>
import {useUserStore} from '@/store/user.js';
import {storeToRefs} from 'pinia';
import Avatar from '@/components/user/base/Avatar.vue';
import {
  IconBook,
  IconCloud,
  IconExport,
  IconFile,
  IconLock,
  IconMan,
  IconUser,
  IconWoman
} from '@arco-design/web-vue/es/icon';
import {useRouter} from 'vue-router';
import {getLoginService, showLoginModal} from '@/services/authService';

const userStore = useUserStore();
const router = useRouter();
const { userInfo } = storeToRefs(userStore);

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
  await router.push({ name: 'Home' });
};
</script>

<style scoped lang="less">
.avatar-section {
  flex: 0 0 auto;

  .avatar-trigger {
    cursor: pointer;
  }

  // 小手机端优化
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
        }
      }

      .user-stats {
        display: flex;
        font-size: @font-size-caption;
        color: @color-text-2;
        margin-top: 6px;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: @size-4;

          &:last-child {
            margin-right: 0;
          }

          .stat-label {
            font-size: @font-size-body-2;
            color: @color-text-4;
          }

          .stat-value {
            font-size: @font-size-body-3;
            font-weight: bold;
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
        color: @color-text-4;
        white-space: nowrap;
      }
    }
  }

  .user-options {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid @color-border-1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .option-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: @font-size-body-3;

    &:hover {
      background-color: #f5f5f5;
    }

    > *:first-child {
      margin-right: @size-2;
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
      color: #bfbfbf;
      margin-bottom: 16px;
    }

    .login-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }

    .login-subtitle {
      margin: 0;
      font-size: 14px;
      color: #999;
      line-height: 1.5;
    }
  }

  .login-button {
    margin-top: 20px;
  }

  .login-features {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid @color-border-2;

    .features-title {
      font-size: 12px;
      color: @color-text-3;
      margin: 0 0 8px 0;
    }

    .features-list {
      padding-left: 20px;
      margin: 0;
      font-size: 12px;
      color: @color-text-3;
      line-height: 1.8;

      li {
        margin: 4px 0;
      }
    }
  }
}
</style>
