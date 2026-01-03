<template>
  <div class="menu-wrapper"  >
    <!-- 展开状态的菜单 -->
    <a-menu v-if="!isCollapsed" :selected-keys="selectedKeys" :default-opened-keys="openedKeys"
      @menu-item-click="handleMenuItemClick" class="enlarged-menu">
      <a-menu-item key="UserHomeIndex" class="enlarged-menu-item"
        :style="selectedKeys[0] === 'UserHomeIndex' ? { backgroundColor: menuBackgroundColors['UserHomeIndex'], borderRadius: '26px' } : {}">
        <icon-home :style="{ color: '#0842A0', backgroundColor: '#A8C7FA' }" />
        <span class="enlarged-text">主页</span>
      </a-menu-item>
      <a-menu-item key="UserKnowledge" class="enlarged-menu-item"
        :style="selectedKeys[0] === 'UserKnowledge' ? { backgroundColor: menuBackgroundColors['UserKnowledge'], borderRadius: '26px' } : {}">
        <icon-book :style="{ color: '#0F5223', backgroundColor: '#6DD58C' }" />
        <span class="enlarged-text">知识库</span>
      </a-menu-item>
      <a-menu-item key="UserDocs" class="enlarged-menu-item"
        :style="selectedKeys[0] === 'UserDocs' ? { backgroundColor: menuBackgroundColors['UserDocs'], borderRadius: '26px' } : {}">
        <icon-file :style="{ color: '#5629A4', backgroundColor: '#D9BAFD' }" />
        <span class="enlarged-text">文档</span>
      </a-menu-item>
      <a-menu-item key="UserCloud" class="enlarged-menu-item"
        :style="selectedKeys[0] === 'UserCloud' ? { backgroundColor: menuBackgroundColors['UserCloud'], borderRadius: '26px' } : {}">
        <icon-cloud :style="{ color: '#004A77', backgroundColor: '#7FCFFF' }" />
        <span class="enlarged-text">云存储</span>
      </a-menu-item>
    </a-menu>

    <a-menu v-else :selected-keys="selectedKeys" :default-opened-keys="openedKeys"
      @menu-item-click="handleMenuItemClick" class="collapsed-menu">
      <a-menu-item key="UserHomeIndex"
        :style="selectedKeys[0] === 'UserHomeIndex' ? { backgroundColor: menuBackgroundColors['UserHomeIndex'], borderRadius: '35px' } : {}">
        <icon-home :size="24"
          :style="selectedKeys[0] === 'UserHomeIndex' ? { color: '#0842A0', backgroundColor: '#A8C7FA' } : {}" />
        <span>主页</span>
      </a-menu-item>
      <a-menu-item key="UserKnowledge"
        :style="selectedKeys[0] === 'UserKnowledge' ? { backgroundColor: menuBackgroundColors['UserKnowledge'], borderRadius: '35px' } : {}">
        <icon-book :size="24"
          :style="selectedKeys[0] === 'UserKnowledge' ? { color: '#0F5223', backgroundColor: '#6DD58C' } : {}" />
        <span>知识库</span>
      </a-menu-item>
      <a-menu-item key="UserDocs"
        :style="selectedKeys[0] === 'UserDocs' ? { backgroundColor: menuBackgroundColors['UserDocs'], borderRadius: '35px' } : {}">
        <icon-file :size="24"
          :style="selectedKeys[0] === 'UserDocs' ? { color: '#5629A4', backgroundColor: '#D9BAFD' } : {}" />
        <span>文档</span>
      </a-menu-item>
      <a-menu-item key="UserCloud"
        :style="selectedKeys[0] === 'UserCloud' ? { backgroundColor: menuBackgroundColors['UserCloud'], borderRadius: '35px' } : {}">
        <icon-cloud :size="24"
          :style="selectedKeys[0] === 'UserCloud' ? { color: '#004A77', backgroundColor: '#7FCFFF' } : {}" />
        <span>云存储</span>
      </a-menu-item>
    </a-menu>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Menu } from '@arco-design/web-vue';
import {
  IconHome,
  IconBook,
  IconFile,
  IconCloud
} from '@arco-design/web-vue/es/icon';
const menuBackgroundColors = {
  UserHomeIndex: '#A8C7FA',
  UserKnowledge: '#6DD58C',
  UserDocs: '#D9BAFD',
  UserCloud: '#7FCFFF'
};

const route = useRoute();
const router = useRouter();

// 从父组件接收是否收起的状态
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
});

// 根据当前路由设置选中的菜单项
const selectedKeys = ref([route.name]);
const openedKeys = ref(['user-follow']); // 默认展开关注子菜单

// 监听路由变化，更新选中的菜单项
watch(() => route.name, (newRouteName) => {
  selectedKeys.value = [newRouteName];
}, { immediate: true });

const handleMenuItemClick = (key) => {
  // 跳转到对应的路由
  if (route.name !== key) {
    router.push({ name: key });
  }
};

defineEmits(['menu-item-click']);
</script>

<style lang="less" scoped>
.menu-wrapper {

  :deep(.arco-menu) {
    border-right: none;
  }

  :deep(.enlarged-menu) {
    margin-top: 25vh;

    .arco-menu-item {
      font-size: 16px;
      height: 48px;
      line-height: 48px;
      margin: 6px 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease; // 统一过渡效果

      .arco-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        padding: 7px;
        margin-right: 12px;
        background-color: var(--color-fill-2);
        border-radius: 50%;
        color: var(--color-text-1);
        flex-shrink: 0;
        z-index: 1;
        position: relative;
        transition: all 0.3s ease;
      }

      .enlarged-text {
        font-size: 16px;
        transition: all 0.3s ease;
      }

      // hover 伪元素效果
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(170, 170, 170, 0.103);
        border-radius: 35px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 0;
      }

      &:hover:not(.arco-menu-selected)::before {
        opacity: 1;
      }
    }

    // 选中和 hover 状态的圆润边角样式
    .arco-menu-item:hover {
      border-radius: 35px;
    }

    .arco-menu-item.arco-menu-selected {
      height: 48px;
      line-height: 48px;
      margin: 6px 0;
      padding: 0;
      // border-radius: 26px;
      color: var(--color-text-1);

      // 选中状态下图标居中
      .arco-icon {
        width: 26px;
        height: 26px;
        padding: 7px;
        margin-left: 40px;
      }


    }
  }

  :deep(.collapsed-menu) {
    margin-top: 30vh;

    .arco-menu-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 0;
      border-radius: 35px;


      .arco-icon {
        margin: 0 auto 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      span {
        display: none;
      }

      // hover 伪元素效果
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(170, 170, 170, 0.103);
        border-radius: 35px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 0;
      }

      &:hover:not(.arco-menu-selected)::before {
        opacity: 1;
      }

      &:hover {
        border-radius: 35px;
      }
    }
  }

}
</style>
