<template>
  <a-layout-header>
    <div class="header-container">
      <div class="header-content">
        <div>
          <a-link :href="`/`" class="nav-option" :class="{ 'nav-option-active': isActiveRoute('/') }">
            <span>首页</span>
          </a-link>
          <a-link :href="`/blog`" class="nav-option" :class="{ 'nav-option-active': isActiveRoute('/blog') }">
            <span>博客</span>
          </a-link>
          <a-link :href="`/knowledge`" class="nav-option" :class="{ 'nav-option-active': isActiveRoute('/knowledge') }">
            <span>知识库</span>
          </a-link>
        </div>

        <div class="search-section">
          <a-input-search :placeholder="'搜索文章...'" size="large" class="search-input" />
        </div>
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
                  <icon-lock :style="{ fontSize: '24px', color: '#bfbfbf', marginBottom: '12px' }" />
                  <p style="margin: 8px 0; font-size: 16px; color: #333;">请先登录</p>
                  <p style="margin: 8px 0; font-size: 14px; color: #999; line-height: 1.5;">登录后体验更多功能</p>
                </div>
                <a-button type="primary" size="large" long @click="showLogin" style="margin-top: 16px;">
                  立即登录
                </a-button>
                <div class="login-features" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #666; margin: 4px 0;">登录后可享受：</p>
                  <ul style="padding-left: 20px; margin: 8px 0; font-size: 12px; color: #666;">
                    <li>个人空间管理</li>
                    <li>知识库功能</li>
                    <li>文档云存储</li>
                    <li>个性化设置</li>
                  </ul>
                </div>
              </div>
            </template>

          </a-popover>
        </div>
      </div>
    </div>

  </a-layout-header>
</template>

<script setup>
import { useUserStore } from '@/store/user.js';
import { storeToRefs } from 'pinia';
import Avatar from '@/components/user/base/Avatar.vue';
import { onMounted, computed } from 'vue';
import { IconMan, IconWoman, IconUser, IconBook, IconFile, IconCloud, IconExport, IconLock } from '@arco-design/web-vue/es/icon';
import { useRouter, useRoute } from 'vue-router';
import { getLoginService, showLoginModal } from '@/services/authService';
import { IconHome } from '@arco-design/web-vue/es/icon';
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
// 使用 storeToRefs 创建响应式引用
const { userInfo } = storeToRefs(userStore);

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
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: @header-height;
  border-bottom: 1px solid @color-border-1;


  .search-section {
    flex: 1 1 auto;
    max-width: 400px;
    margin: 0 20px;

    .search-input {
      width: 100%;
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
  font-size: @font-size-body-3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  color: @color-text-1;
  font-size: 16px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background-color: transparent;
    transition: all 0.3s ease;
    border-radius: 2px;
  }
  
  &:hover {
    color: @arcoblue-6;
    
    &::after {
      width: 70%;
      background-color: @arcoblue-6;
    }
  }
}

.nav-option-active {
  color: @arcoblue-6 !important;
  
  &::after {
    width: 80% !important;
    background-color: @arcoblue-6 !important;
  }
}
</style>
