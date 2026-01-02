<template>
  <div class="user-layout">
    <a-layout style="min-height: 100vh;">
      <a-layout-sider :width="200" :collapsed="isSiderCollapsed" :collapsed-width="50" collapsible 
        breakpoint="md" @collapse="handleCollapseChange">
        <UserSidebar :is-collapsed="isSiderCollapsed" />
      </a-layout-sider>
      <a-layout class="layout-content" :class="{ collapsed: isSiderCollapsed }">
        <a-layout-content>
          <div class="content-wrapper">
            <router-view />
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Layout } from '@arco-design/web-vue';
import UserSidebar from '@/components/layout/UserSidebar.vue';

const isSiderCollapsed = ref(false);
 
const handleCollapseChange = (collapsed) => {
  isSiderCollapsed.value = collapsed;
};
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
    max-height: calc(100vh - 48px); // 减去上下padding，确保刚好占满屏幕
    overflow-y: auto;
  }

  .error-message {
    padding: 40px;
    text-align: center;
  }
}
</style>
