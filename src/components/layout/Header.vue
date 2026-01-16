<template>
  <a-layout-header>
    <div class="header-container" :class="{ 'transparent-background': transparentBackground }">
      <div class="header-content" :class="{ 'with-padding': padding }"
        :style="{ borderBottom: showBorder ? `1px solid ${borderColor}` : 'none' }">
        <div>
          <a-link :href="`/`" class="nav-option" :class="{ 'nav-option-active': isActiveRoute('/') }"
            :hoverable="hoverable">
            <span :style="{ color: textColor }">首页</span>
          </a-link>
          <a-link :href="`/blog`" class="nav-option" :class="{ 'nav-option-active': isActiveRoute('/blog') }"
            :hoverable="hoverable">
            <span :style="{ color: textColor }">博客</span>
          </a-link>
          <a-link :href="`/knowledge`" class="nav-option" :class="{ 'nav-option-active': isActiveRoute('/knowledge') }"
            :hoverable="hoverable">
            <span :style="{ color: textColor }">知识库</span>
          </a-link>
          <a-link :href="`/about`" class="nav-option" :class="{ 'nav-option-active': isActiveRoute('/about') }"
            :hoverable="hoverable">
            <span :style="{ color: textColor }">关于</span>
          </a-link>
          <a-link href="https://github.com" target="_blank" class="nav-option github-link"
            :hoverable="hoverable">
            <icon-github :size="24" class="github-icon"/>
            <span :style="{ color: textColor }">GitHub</span>
          </a-link>
        </div>

        <div class="search-section" v-if="showSearch">
          <a-input-search :placeholder="'搜索文章...'" size="large" class="search-input" />
        </div>


        <div class="right-section">
           <div class="avatar-section">
            <a-popover trigger="hover" position="br" :content-style="{ minWidth: '300px', maxWidth: '400px' }">
              <Avatar :size="40" :src="userInfo?.avatarUrl" class="avatar-trigger"
                @click="openInNewTab(`/space/${userInfo?.id}`)" />
              <template #content>
                <div class="user-info-popover" v-if="userInfo.id != '-1'">
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
          <!-- 登录后显示的功能入口 -->
          <div class="user-actions" v-if="userInfo.id != '-1'">
            <div class="action-item" @click="openInNewTab('/messages')">
              <a-tooltip content="消息" :popup-visible="isSmallScreen ? undefined : false">
                <a-badge :count="0" dot-style="width: 8px; height: 8px;">
                  <icon-notification :size="20" />
                </a-badge>
              </a-tooltip>
              <span class="action-text">消息</span>
            </div>

            <div class="action-item" @click="openInNewTab(`/space/${userInfo?.id}/favorites`)">
              <a-tooltip content="收藏" :popup-visible="isSmallScreen ? undefined : false">
                <icon-star :size="20" />
              </a-tooltip>
              <span class="action-text">收藏</span>
            </div>

            <div class="action-item" @click="openInNewTab(`/space/${userInfo?.id}/history`)">
              <a-tooltip content="历史" :popup-visible="isSmallScreen ? undefined : false">
                <icon-history :size="20" />
              </a-tooltip>
              <span class="action-text">历史</span>
            </div>

            <div class="action-item" @click="openInNewTab(`/space/${userInfo?.id}/knowledge`)">
              <a-tooltip content="我的知识库" :popup-visible="isSmallScreen ? undefined : false">
                <icon-book :size="20" />
              </a-tooltip>
              <span class="action-text">知识库</span>
            </div>

            <div class="action-item" @click="openInNewTab(`/space/${userInfo?.id}/docs`)">
              <a-tooltip content="我的文档" :popup-visible="isSmallScreen ? undefined : false">
                <icon-file :size="20" />
              </a-tooltip>
              <span class="action-text">文档</span>
            </div>
          </div>

         
        </div>

      </div>
    </div>

  </a-layout-header>
</template>

<script setup>
import { useUserStore } from '@/store/user.js';
import { storeToRefs } from 'pinia';
import Avatar from '@/components/user/base/Avatar.vue';
import { onMounted, ref, onUnmounted } from 'vue';
import { IconMan, IconWoman, IconUser, IconBook, IconFile, IconCloud, IconExport, IconLock, IconNotification, IconStar, IconHistory, IconGithub } from '@arco-design/web-vue/es/icon';
import { useRouter, useRoute } from 'vue-router';
import { getLoginService, showLoginModal } from '@/services/authService';

// 定义组件属性
const props = defineProps({
  transparentBackground: {
    type: Boolean,
    default: false
  },
  hoverable: {
    type: Boolean,
    default: true
  },
  showBorder: {
    type: Boolean,
    default: true
  },
  borderColor: {
    type: String,
    default: '@color-border-1'
  },
  textColor: {
    type: String,
    default: '@color-text-1'
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  padding: {
    type: Boolean,
    default: false
  }
});

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
// 使用 storeToRefs 创建响应式引用
const { userInfo } = storeToRefs(userStore);

// 响应式屏幕尺寸检测
const isSmallScreen = ref(window.innerWidth < 768);

const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 768;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 判断当前路由是否与给定路径匹配
const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

const logout = async () => {
  const loginService = getLoginService();
  loginService.logout();
  // 退出登录后重定向到首页
  await router.push({ name: 'Home' });
};

// 在新标签页中打开指定路径
const openInNewTab = (path) => {
  if (userInfo.value.id == '-1') {
    //必须登录才行，打开登录弹窗
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

onMounted(async () => {
  userInfo.value = await userStore.getUserInfo();
});
</script>

<style scoped lang="less">
.header {
  width: 100%;
  height: @header-height;

}

@header-height: 64px;
@logo-height: 40px;
@avatar-size: 40px;

.header-container {
  background-color: @color-bg-1;
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  border-bottom: 1px solid @color-border-1;

  &.transparent-background {
    background-color: rgba(255, 255, 255, 0.9);
    border-bottom: none !important;

    .search-input {
      :deep(.arco-input) {
        background-color: rgba(255, 255, 255, 0.5) !important;
      }

      :deep(.arco-input-hover) {
        background-color: rgba(255, 255, 255, 0.7);
      }

      :deep(.arco-input-focused) {
        background-color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: @header-height;
  transition: all 0.3s ease;

  &.with-padding {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 40px;
  }

  .search-section {
    flex: 1 1 auto;
    max-width: 400px;
    margin: 0 20px;

    .search-input {
      width: 100%;
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      color: @color-text-2;

      &:hover {
        color: @color-text-1;
        background-color: @color-fill-2;
      }

      .action-text {
        font-size: 12px;
        white-space: nowrap;
      }
    }
  }

  @media (max-width: 768px) {
    .user-actions {
      .action-item {
        .action-text {
          display: none;
        }
      }
    }
  }

  .avatar-section {
    flex: 0 0 auto;

    .avatar-trigger {
      cursor: pointer;
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
  }

  .option-item:hover {
    background-color: #f5f5f5;
  }

  .option-item>*:first-child {
    margin-right: @size-2;
  }
}

.nav-option {
  margin: 0 12px;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 4px;
  transition: opacity 0.2s;
  color: @color-text-1;

  &:hover {
    color: @color-text-1;
  }
}

.nav-option-active {
  color: @primary-4 !important;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .github-icon {
    display: flex;
    align-items: center;
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
