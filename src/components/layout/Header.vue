<template>
  <a-layout-header>
    <transition name="header-slide">
      <div class="header-container" v-show="showHeader" :class="{
        'transparent-background': transparentBackground,
        'header-fixed': isHeaderFixed && showHeader
      }">
        <div class="header-content" :class="{ 'with-padding': padding }"
          :style="{ borderBottom: showBorder ? `1px solid ${borderColor}` : 'none' }">
          <div>
            <a-link v-for="nav in navLinks" :key="nav.path" :href="nav.path" class="nav-option"
              :class="{ 'nav-option-active': isActiveRoute(nav.path) }" :hoverable="hoverable">
              <span :style="{ color: isActiveRoute(nav.path) ? undefined : 'var(--primary-4)' }">{{ nav.label }}</span>
            </a-link>
          </div>

          <div class="search-section" v-if="showSearch">
            <SearchBox :alwaysShowFilter="false" :mini="true" />
          </div>

          <div class="right-section">
            <!-- 头像部分 -->
            <div>
              <HeaderIcon />
            </div>
            <!-- 登录后显示的功能入口 -->
            <div class="user-actions" v-if="userInfo?.id != '-1'">
              <a-dropdown trigger="hover" v-model:popup-visible="messageDropdownVisible">
                <div class="action-item" @click="handleMessageClick">
                  <div >
                    <a-badge :count="msgCount" :max-count="99" :offset="['5px', '0px', '0px', '15px']">
                      <icon-notification :size="20" />
                    </a-badge>
                  </div>
                  <span class="action-text">消息</span>
                </div>
                <template #content>
                  <a-doption v-for="msg in messageOptions" :key="msg.path" @click="openInNewTab(msg.path)">
                    <template #icon>
                      <component :is="msg.icon" />
                    </template>
                    <div class="dropdown-option-content">
                      <span>{{ msg.label }}</span>
                      <a-badge :count="userInfo?.[msg.countKey] || 0" :max-count="99" />
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>

              <div v-for="action in userActions" :key="action.path" class="action-item"  @click="openInNewTab(`/space/${userInfo?.id}/${action.path}`)">
                <HistoryPreview v-if="action.path === 'history'" >
                  <component :is="action.icon" :size="20" />
                </HistoryPreview>
                <component v-else :is="action.icon" :size="20" />
                <span class="action-text">{{ action.label }}</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </transition>
  </a-layout-header>
</template>

<script setup>
import { useUserStore } from '@/store/user.js';
import { storeToRefs } from 'pinia';
import SearchBox from '@/components/base/SearchBox.vue';
import HeaderIcon from './common/HeaderIcon.vue';
import HistoryPreview from './common/HistoryPreview.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  IconBook,
  IconEmail,
  IconExclamationCircle,
  IconFile,
  IconHeart,
  IconHistory,
  IconMessage,
  IconNotification,
  IconStar
} from '@arco-design/web-vue/es/icon';
import { useRoute, useRouter } from 'vue-router';
import { showLoginModal } from '@/services/authService';

// 导航链接配置
const navLinks = [
  { path: '/', label: '首页' },
  { path: '/blog', label: '博客' },
  { path: '/knowledge', label: '知识库' },
  { path: '/about', label: '关于' }
];

// 消息下拉菜单配置
const messageOptions = [
  { path: '/messages/reply', label: '回复我的', icon: IconMessage, countKey: 'msgReplyCount' },
  { path: '/messages/like', label: '收到的赞', icon: IconHeart, countKey: 'msgLikeCount' },
  { path: '/messages/message', label: '消息', icon: IconEmail, countKey: 'msgMessageCount' },
  { path: '/messages/report', label: '举报消息', icon: IconExclamationCircle, countKey: 'msgReportCount' }
];

// 用户操作项配置
const userActions = [
  { path: 'favorites', label: '收藏',  icon: IconStar },
  { path: 'history', label: '历史',  icon: IconHistory },
  { path: 'knowledge', label: '知识库',  icon: IconBook },
  { path: 'docs', label: '文档', icon: IconFile }
];

// 滚动相关状态
const showHeader = ref(true); // 控制 header 是否显示
const isHeaderFixed = ref(false); // 控制是否使用 fixed 定位
let lastScrollTop = 0;
const scrollDelta = 5; // 滚动方向判断的最小差值，避免抖动

// 将 scrollThreshold 转换为像素值
const getScrollThresholdInPixels = () => {
  const threshold = props.scrollThreshold;

  // 如果是数字，直接返回
  if (typeof threshold === 'number') {
    return threshold;
  }

  // 如果是字符串
  if (typeof threshold === 'string') {
    // 处理 vh 单位
    if (threshold.endsWith('vh')) {
      const vhValue = parseFloat(threshold);
      return (window.innerHeight * vhValue) / 100;
    }
    // 处理 px 单位或纯数字字符串
    return parseFloat(threshold);
  }

  // 默认值
  return 400;
};

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
    default: 'var(--color-neutral-10)'
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  padding: {
    type: Boolean,
    default: false
  },
  scrollThreshold: {
    type: [String, Number],
    default: '400px' // 支持 '400px', '50vh', 400 等格式
  }
});

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
// 使用 storeToRefs 创建响应式引用
const { userInfo } = storeToRefs(userStore);
const msgCount = computed(() => {
  return userInfo.value?.msgReplyCount || 0 + userInfo.value?.msgLikeCount || 0 + userInfo.value?.msgMessageCount || 0 + userInfo.value?.msgReportCount || 0
})
// 响应式屏幕尺寸检测
const isSmallScreen = ref(window.innerWidth < 768);

const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 768;
};

// 检测是否有鼠标（非触摸设备）
const hasMouse = ref(true);
const messageDropdownVisible = ref(false);

// 处理消息图标点击
const handleMessageClick = () => {
  // 如果是触摸设备（没有鼠标）
  if (!hasMouse.value) {
    // 如果下拉菜单未显示，则显示下拉菜单，不跳转
    if (!messageDropdownVisible.value) {
      messageDropdownVisible.value = true;
      return;
    }
  }
  
  // 有鼠标的设备，或者下拉菜单已显示时，执行跳转
  openInNewTab('/messages/reply');
};

// 处理滚动事件
const handleScroll = () => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const threshold = getScrollThresholdInPixels();
  const scrollDiff = currentScrollTop - lastScrollTop;

  // 滚动位置低于阈值时，使用原来的定位，始终显示
  if (currentScrollTop <= threshold) {
    isHeaderFixed.value = false;
    showHeader.value = true;
  } else {
    // 滚动位置超过阈值时，切换为 fixed 定位
    isHeaderFixed.value = true;

    // 根据滚动方向控制显示/隐藏
    if (scrollDiff > scrollDelta) {
      // 向下滚动 - 隐藏 header
      showHeader.value = false;
    } else if (scrollDiff < -scrollDelta) {
      // 向上滚动 - 显示 header
      showHeader.value = true;
    }
    // 如果滚动差值在 [-scrollDelta, scrollDelta] 之间，保持当前状态不变
  }

  lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // 检测设备是否支持触摸
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  hasMouse.value = !isTouchDevice;
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
});

// 判断当前路由是否与给定路径匹配
const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// 在新标签页中打开指定路径
const openInNewTab = (path) => {
  if (userInfo.value.id == '-1') {
    showLoginModal();
    return;
  }
  const fullPath = router.resolve(path).href;
  window.open(fullPath, '_blank');
};

onMounted(async () => {
  userInfo.value = await userStore.getUserInfo();
});
</script>

<style scoped lang="less">
@header-height: 64px;
.header-container {
  background-color: var(--color-bg-2);
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  border-bottom: 1px solid var(--color-border-1);
  transition: transform 0.3s ease;

  &.header-fixed {
    position: fixed;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--color-text-1) 10%, transparent);
  }

  &.transparent-background {
    background-color: color-mix(in srgb, var(--color-bg-2) 95%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: none !important;

    :deep(.arco-input) {
      background-color: color-mix(in srgb, var(--color-bg-5) 70%, transparent) !important;

      &:hover {
        background-color: color-mix(in srgb, var(--color-bg-5) 85%, transparent);
      }

      &:focus {
        background-color: color-mix(in srgb, var(--color-bg-5) 90%, transparent);
      }
    }
  }
}

.header-slide-enter-active,
.header-slide-leave-active {
  transition: transform 0.3s ease;
}

.header-slide-enter-from,
.header-slide-leave-to {
  transform: translateY(-110%);
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
    flex: 1;
    margin: 0 20px;
    min-width: 0;
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--color-neutral-8);

      &:hover {
        color: var(--color-neutral-10);
        background-color: var(--color-fill-2);
      }

      .action-text {
        font-size: 12px;
        white-space: nowrap;
      }
    }
  }

  @media (max-width: 1024px) {
    padding: 0 16px;

    &.with-padding {
      padding: 0 24px;
    }

    .search-section {
      margin: 0 12px;
    }

    .right-section {
      gap: 12px;
    }

    .user-actions {
      gap: 8px;

      .action-item {
        padding: 6px;

        .action-text {
          display: none;
        }
      }
    }
  }

  @media (max-width: 899px) and (min-width: 769px) {

    .user-actions .action-item:nth-child(4),
    .user-actions .action-item:nth-child(5) {
      display: none;
    }
  }

  @media (max-width: 819px) and (min-width: 769px) {
    .user-actions .action-item:nth-child(2) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    padding: 0 12px;

    &.with-padding {
      padding: 0 16px;
    }

    .search-section {
      display: none;
    }

    .right-section {
      gap: 8px;
    }

    .user-actions {
      gap: 4px;

      .action-item {
        padding: 4px;
      }
    }
  }

  @media (max-width: 480px) {
    padding: 0 8px;

    &.with-padding {
      padding: 0 12px;
    }

    .right-section {
      gap: 4px;
    }

    .user-actions {
      gap: 2px;

      .action-item:nth-child(n+3) {
        display: none;
      }
    }
  }
}

.dropdown-option-content {
  margin: 5px;
}

.nav-option {
  margin: 0 12px;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  transition: opacity 0.2s;
  color: var(--color-neutral-10);
  &:hover{
    color: var(--color-neutral-10);
  }
  @media (max-width: 1239px) and (min-width: 769px) {

    &:nth-child(2),
    &:nth-child(3) {
      display: none;
    }
  }

  @media (max-width: 1024px) {
    margin: 0 8px;
    padding: 8px 12px;
    font-size: 15px;
  }

  @media (max-width: 819px) and (min-width: 769px) {
    &:nth-child(4) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    margin: 0 4px;
    padding: 6px 8px;
    font-size: 14px;
  }

  @media (max-width: 480px) {
    margin: 0 2px;
    padding: 4px 6px;
    font-size: 13px;
  }
}

.nav-option-active {
  color: var(--color-primary-4) !important;
}
</style>
