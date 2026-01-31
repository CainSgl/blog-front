<template>
  <Header />
  <div class="user-layout">
    <a-layout style="min-height: 100vh;">
      <a-layout-sider :width="200" :collapsed="isSiderCollapsed" :collapsed-width="50" collapsible breakpoint="md"
        @collapse="handleCollapseChange">
        <UserSidebar :is-collapsed="isSiderCollapsed" :is-me="isMe" />
      </a-layout-sider>
      <a-layout class="layout-content"  :class="{ collapsed: isSiderCollapsed }" >
        <a-layout-content>
          <div class="content-wrapper">
            <div class="header-container"></div>
            <div  id="router-page-container" style="max-height: calc(100dvh - 75px); overflow-y: auto;">
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user.js';
import UserSidebar from '@/components/layout/UserSidebar.vue';

const isSiderCollapsed = ref(false);
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 判断当前查看的是否是自己的主页
const isMe = computed(() => {
  const currentUserId = userStore.userInfo?.id;
  const pageUserId = route.params.id;
  return currentUserId && pageUserId && currentUserId === pageUserId;
});

const handleCollapseChange = (collapsed) => {
  isSiderCollapsed.value = collapsed;
};

onMounted(async () => {
  const userId = route.params.id;
  const userInfo = await userStore.getUserInfo(userId)
  console.log(userInfo.nickname)
  const username=userInfo.nickname||userInfo.username||'无名客'
  document.title = username + '的个人空间'
});
</script>

<style lang="less" scoped>
.user-layout {
 
  :deep(.arco-layout) {
    background-color: var(--color-bg-1);
  }

  :deep(.arco-layout-sider) {
    background-color: var(--color-bg-2);
  }

  .layout-content {
    background-color: var(--color-bg-1);

    .ant-layout { 
      background-color: transparent;
    }

    :deep(.arco-layout-content) {
      background-color: var(--color-bg-1);
    }
  }

  .content-wrapper {
    background-color: var(--color-bg-1);
  }

  .error-message {
    padding: 40px;
    text-align: center;
  }
}
</style>
