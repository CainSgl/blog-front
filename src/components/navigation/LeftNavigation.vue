<template>
  <div class="left-navigation">
    <a-collapse :default-active-key="['1', '2', '3', '4']" :bordered="false">
      <!-- 个人空间 -->
      <a-collapse-item header="个人空间" key="1">
        <a-menu :default-selected-keys="['home']" @menu-item-click="handleMenuClick">
          <a-menu-item key="home">
            <template #icon>
              <icon-home />
            </template>
            首页
          </a-menu-item>
          <a-menu-item key="profile">
            <template #icon>
              <icon-user />
            </template>
            个人主页
          </a-menu-item>
          <a-menu-item key="knowledge-base">
            <template #icon>
              <icon-book />
            </template>
            知识库
          </a-menu-item>
          <a-menu-item key="document">
            <template #icon>
              <icon-file />
            </template>
            文档
          </a-menu-item>
          <a-menu-item key="cloud-storage">
            <template #icon>
              <icon-cloud />
            </template>
            云存储
          </a-menu-item>
          <a-menu-item key="my-likes">
            <template #icon>
              <icon-heart />
            </template>
            我的点赞
          </a-menu-item>
          <a-menu-item key="history">
            <template #icon>
              <icon-history />
            </template>
            历史记录
          </a-menu-item>
        </a-menu>
      </a-collapse-item>

      <!-- 博客 -->
      <a-collapse-item header="博客" key="2">
        <a-menu @menu-item-click="handleMenuClick">
          <a-menu-item key="latest-blog">
            <template #icon>
              <icon-fire />
            </template>
            最新博客
          </a-menu-item>
          <a-menu-item key="hot-blog">
            <template #icon>
              <icon-star />
            </template>
            最热博客
          </a-menu-item>
        </a-menu>
      </a-collapse-item>

      <!-- 知识库 -->
      <a-collapse-item header="知识库" key="3">
        <a-menu @menu-item-click="handleMenuClick">
          <a-menu-item key="latest-kb">
            <template #icon>
              <icon-fire />
            </template>
            最新知识库
          </a-menu-item>
          <a-menu-item key="hot-kb">
            <template #icon>
              <icon-star />
            </template>
            最热知识库
          </a-menu-item>
        </a-menu>
      </a-collapse-item>

      <!-- 在线聊天 -->
      <a-collapse-item header="在线聊天" key="4">
        <a-menu @menu-item-click="handleMenuClick">
          <a-menu-item key="my-chat">
            <template #icon>
              <icon-message />
            </template>
            我的聊天话题
          </a-menu-item>
          <a-menu-item key="coming-soon" disabled>
            <template #icon>
              <icon-clock-circle />
            </template>
            敬请期待
          </a-menu-item>
        </a-menu>
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import {
  IconHome,
  IconUser,
  IconBook,
  IconFile,
  IconCloud,
  IconHeart,
  IconHistory,
  IconFire,
  IconStar,
  IconMessage,
  IconClockCircle
} from '@arco-design/web-vue/es/icon';

const router = useRouter();

const handleMenuClick = (key) => {
  console.log('点击菜单项:', key);
  // 根据 key 进行路由跳转或其他操作
  // router.push({ name: key });
};
</script>

<style scoped lang="less">
.left-navigation {
  background: #ffffff;
  border-radius: 8px;

  overflow: hidden;

  :deep(.arco-collapse) {
    background: transparent;

    .arco-collapse-item {
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }

    .arco-collapse-item-header {
      padding: 16px 20px;
      font-weight: 600;
      font-size: 15px;
      color: #1d2129;
      background: #fafafa;

      &:hover {
        background: #f2f3f5;
      }
    }

    .arco-collapse-item-content {
      padding: 0;
      background: #ffffff;
    }
  }

  :deep(.arco-menu) {
    background: transparent;

    .arco-menu-item {
      padding: 12px 20px 12px 40px;
      margin: 0;
      border-radius: 0;
      color: #4e5969;
      font-size: 14px;

      &:hover {
        background: #f7f8fa;
        color: #165dff;
      }

      &.arco-menu-selected {
        background: #e8f3ff;
        color: #165dff;
        font-weight: 500;
      }

      &.arco-menu-disabled {
        color: #c9cdd4;
        cursor: not-allowed;
      }
    }

    .arco-icon {
      margin-right: 10px;
      font-size: 16px;
    }
  }
}
</style>
