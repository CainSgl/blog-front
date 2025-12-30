<template>
  <div class="user-layout">
    <a-layout style="min-height: 100vh;">
      <!-- <a-layout-sider :width="400" :collapsed="isSiderCollapsed" :collapsed-width="60" collapsible :trigger="click"
        breakpoint="md">
        <BookTagMenu @collapse-change="handleCollapseChange" />
      </a-layout-sider> -->
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
import BookTagMenu from '@/components/user/home/BookTagMenu.vue';

const isSiderCollapsed = ref(false);

const handleCollapseChange = (collapsed) => {
  isSiderCollapsed.value = collapsed;
};
</script>

<style lang="less" scoped>
.layout-content {
  background-color: var(--color-bg-1);

  .ant-layout {
    background-color: transparent;
  }
}

.content-wrapper {
  padding: 24px;
}

.error-message {
  padding: 40px;
  text-align: center;
}
</style>
