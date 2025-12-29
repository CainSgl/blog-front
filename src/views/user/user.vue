<template>
  <div class="user-layout">
    <a-layout style="min-height: 100vh;">
      <a-layout-sider :collapsed="collapsed" :collapsible="true" :width="240" :breakpoint="['md']"
        @collapse="handleCollapse" class="sider">
        <a-menu :selected-keys="selectedKeys" :style="{ height: '100%', borderRight: '1px solid var(--color-border)' }"
          @menu-item-click="handleMenuClick">
          <a-menu-item key="UserHomeIndex">
            <icon-home />
            <span>主页</span>
          </a-menu-item>
          <a-menu-item key="UserKnowledge">
            <icon-book />
            <span>知识库</span>
          </a-menu-item>
          <a-menu-item key="UserDocs">
            <icon-file />
            <span>文档</span>
          </a-menu-item>
          <a-menu-item key="UserCloud">
            <icon-cloud />
            <span>云存储</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout class="layout-content">
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
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IconHome,
  IconBook,
  IconFile,
  IconCloud
} from '@arco-design/web-vue/es/icon';

const route = useRoute();
const router = useRouter();
const collapsed = ref(false);
const selectedKeys = ref(['UserHome']);

// 监听路由变化，更新选中的菜单项
watch(
  () => route.name,
  (newRouteName) => {
    console.log(newRouteName);
    selectedKeys.value = [newRouteName];
  },
  { immediate: true }
);

// 处理菜单点击
const handleMenuClick = (key) => {
  router.push({
    name: key
  });
};

// 处理侧边栏折叠
const handleCollapse = (value) => {
  collapsed.value = value;
};
</script>

<style lang="less" scoped>
.user-layout {
  .sider {
    background-color: var(--color-bg-2);
    position: relative;
  }

  .layout-content {
    background-color: var(--color-bg-1);
  }

  .error-message {
    padding: 40px;
    text-align: center;
  }

  // 增大菜单图标尺寸
  :deep(.arco-menu-item) {
    .arco-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  }
}
</style>
