<template>
  <Header />
  <div class="user-layout">
    <a-layout style="min-height: 100vh;">
      <a-layout-sider :width="200" :collapsed="isSiderCollapsed" :collapsed-width="50" collapsible breakpoint="md"
        @collapse="handleCollapseChange">
        <UserSidebar :is-collapsed="isSiderCollapsed" />
      </a-layout-sider>
      <a-layout class="layout-content" :class="{ collapsed: isSiderCollapsed }">
        <a-layout-content>
          <div class="content-wrapper">
            <div class="header-container"></div>
            <div style="max-height: calc(100dvh - 120px);">
              <router-view />
            </div>

          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import Header from '@/components/layout/Header.vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user.js';
import UserSidebar from '@/components/layout/UserSidebar.vue';

const isSiderCollapsed = ref(false);
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const handleCollapseChange = (collapsed) => {
  isSiderCollapsed.value = collapsed;
};

// 检查ID是否有效（非空、非-1等无效值）
const isValidId = (id) => {
  return id && id !== '' && id !== 'null' && id !== 'undefined' && parseInt(id) !== -1;
};

onMounted(async () => {
  const userId = route.params.id;

  // 如果ID无效，获取当前用户ID并重定向
  if (!isValidId(userId)) {
    try {
      const currentUserInfo = await userStore.getUserInfo();
      if (currentUserInfo && isValidId(currentUserInfo.id)) {
        // 重定向到当前用户的页面
        router.replace(`/space/${currentUserInfo.id}`);
      }
    }
    catch (error) {
      console.error('获取当前用户信息失败:', error);
    }
  }
});
</script>

<style lang="less" scoped>
.user-layout {
  .layout-content {
    .ant-layout {
      background-color: transparent;
    }
  }

  .content-wrapper {
    padding: 24px;
    max-height: calc(100vh - 48px-64px); // 减去上下padding，确保刚好占满屏幕
    overflow-y: auto;
  }

  .error-message {
    padding: 40px;
    text-align: center;
  }
}
</style>
