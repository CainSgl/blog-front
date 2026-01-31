<template>
  <Header></Header>
  <div class="header-container"></div>
  <div class="knowledge-base" @mousemove="handleMouseMove">
    <div v-if="!hasError" class="sidebar" :class="{ collapsed: isCollapsed }">
      <div v-show="!isCollapsed">
        <div class="tree-menu">
          <div class="kb-header">
            <h3>{{ kbInfo.name }}</h3>
            <div class="favorite-button" @click="handleFavorite">
              <IconStarFill v-if="kbStore.hasStar" class="star-icon active" />
              <IconStar v-else class="star-icon" />
            </div>
          </div>
          <div class="home-node" @click="goToHome">
            <div class="node-content">
              <span class="node-name">
                <IconHome class="action-icon" />
                <span>首页</span>
              </span>
            </div>
          </div>
          <TreeMenu :tree-data="treeData" :edit="edit" @clickPost="handleClickPost" :kb-id="kbId"
            :height="treeMenuHeight" />

        </div>
      </div>
      <div class="collapse-button" v-show="!isCollapsed && showCollapseButton" @click="toggleCollapse">
        <IconDoubleLeft class="collapse-icon" size="large"> </IconDoubleLeft>
      </div>

    </div>



    <div class="content">
      <router-view />
      <div class="collapse-button-fixed" v-if="isCollapsed" v-show="isCollapsed && showCollapseButton"
        @click="toggleCollapse">
        <IconDoubleRight class="collapse-icon" size="large"></IconDoubleRight>
      </div>
    </div>
    <!-- 收藏弹窗 -->
    <AddToFavoriteModal v-model="showFavoriteModal" :targetId="kbId" :isIn="kbStore.hasStar" type="知识库"
      @success="handleFavoriteSuccess" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import TreeMenu from '@/views/kb/components/treemenu/TreeMenuWrapper.vue';
import AddToFavoriteModal from '@/components/base/favorite/AddToFavoriteModal.vue';

import { IconDoubleLeft, IconDoubleRight, IconHome, IconStar, IconStarFill } from '@arco-design/web-vue/es/icon';
import { useRoute, useRouter } from 'vue-router';
import { useKbStore } from './kbStore.js';
import { useUserStore } from '@/store/user';
import { messageManager } from '@/api/request.js';
import { Message, Modal } from '@arco-design/web-vue';
import Header from '@/components/layout/Header.vue';
import api from '@/api/index';

const hasError = ref(false);

const route = useRoute();
const router = useRouter();
const noKb = ref(false);
const isCollapsed = ref(false);
const kbInfo = ref({
  name: '获取中...',
  likeCount: 0
});
const edit = ref(false);
const kbStore = useKbStore();
// 收藏相关状态
const showFavoriteModal = ref(false);

// collapse-button 精细控制相关状态
const showCollapseButton = ref(window.innerWidth >= 800);  // 默认根据屏幕宽度决定是否显示
const hideTimer = ref(null);

// 检查屏幕宽度的函数
function checkScreenSize() {
  return window.innerWidth >= 800;
}

// 收藏功能
const handleFavorite = async () => {
  if (!kbStore.hasStar) {
    showFavoriteModal.value = true;
  }
  else {
    // 显示确认弹窗
    Modal.confirm({
      title: '取消收藏',
      content: '确定要取消收藏这个知识库吗？',
      okText: '确定',
      cancelText: '取消',
      onBeforeOk: async (done) => {
        try {
          const id = 'unStar' + kbId.value;
          await Promise.all([
            api.get('/post/op/star', { id: kbId.value, type: "收藏知识库", add: false }),
            api.delete('/user/collect', { id: kbId.value, type: '知识库' })
          ]);
          Message.success({ id: id, content: '已取消收藏' });
          kbStore.hasStar = false;
          done(true);
        }
        catch (error) {
          console.error('取消收藏失败:', error);
          Message.error('取消收藏失败，请重试');
          done(false);
        }
      }
    });
  }
};

// 收藏成功回调
const handleFavoriteSuccess = () => {
  kbStore.hasStar = true;
};
onMounted(async () => {
  const kbParam = route.query.kb;
  if (kbParam) {
    try {
      const kbData = await kbStore.getKbInfo(kbParam);
      if (kbData) {
        kbId.value = kbData.id;
        kbInfo.value = kbData;

        const userInfo = await useUserStore().getUserInfo();
        if (kbData.userId == userInfo.id) {
          edit.value = true;
        }
        // 如果当前路由是KB父路由（没有子路由匹配），则跳转到KBIndex
        if (route.name === 'KB') {
          router.push({ name: 'KBIndex', query: { kb: kbId.value } });
        }
      }
      else {
        // 获取知识库信息失败，重定向到404页面
        router.push({ name: 'NoKb' });
        noKb.value = true;
      }
    }
    catch (error) {
      hasError.value = true;
      if (messageManager.hasMessage('由于私密性设置无法访问该知识库')) {
        router.push({ name: 'NoPermission', query: { kb: kbParam, require: 'kb' } });
        Message.warning({
          id: '由于私密性设置无法访问该知识库',
          content: '该知识库由于私密性设置无法访问',
          duration: 3000,
        });
        return;
      }
      if (error.data.code == '40000' && error.data.msg) {
        if (messageManager.hasMessage(error.data.msg)) {
          let returnUrl = route.query.returnUrl;
          if (!returnUrl) {
            // 构造当前URL作为returnUrl参数
            const currentUrl = window.location.href;
            returnUrl = encodeURIComponent(currentUrl);
          }
          Message.warning({
            id: error.data.msg,
            content: '该知识库仅粉丝可见，请先关注。',
            duration: 3000,
          });

          // 跳转到KBIndex页面并携带returnUrl参数
          router.push({
            name: 'KBIndex',
            query: {
              kb: kbParam,
              userId: error.data.msg,
              returnUrl: returnUrl,
            }
          });
        }
      }

    }
  }
  else {
    console.log('没有');
    //重定向到404页面
    router.push({ name: 'NotFound' });
  }

  // 初始化时检查屏幕尺寸
  if (!checkScreenSize()) {
    showCollapseButton.value = false;
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 窗口大小变化处理函数
function handleResize() {
  if (!checkScreenSize()) {
    showCollapseButton.value = false;
    isCollapsed.value = true;  // 在小屏幕上默认折叠侧边栏
  }
  else {
    // 在大屏幕上恢复显示按钮
    showCollapseButton.value = true;
  }
}

const kbId = ref('-1');
const treeMenuHeight = ref('calc(100vh - 220px)'); // 默认高度计算

function handleClickPost(node) {
  const pageName = route.name;
  //是的话跳转到查看页面，否则不改变页面
  console.log(pageName);
  if (pageName === 'KBEdit') {
    router.push({ name: pageName, query: { kb: kbId.value, p: node.postId } });
  }
  else {
    router.push({ name: 'KBView', query: { kb: kbId.value, p: node.postId } });
  }
}
const treeData = computed(() => kbStore.treeData);

function goToHome() {
  router.push({ name: 'KBIndex', query: { kb: kbId.value } });
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function handleMouseMove(event) {
  if (!checkScreenSize()) {
    showCollapseButton.value = false;
    return;
  }

  const screenWidth = window.innerWidth;
  const mouseX = event.clientX;
  const threshold = isCollapsed.value ? screenWidth * 0.1 : screenWidth * 0.2 + 80;

  if (mouseX <= threshold) {
    showCollapseButton.value = true;
    handleMouseLeave();
  }
  else {
    clearHideTimer();
    showCollapseButton.value = false;
  }
}

function handleMouseLeave() {
  clearHideTimer();
  hideTimer.value = setTimeout(() => {
    showCollapseButton.value = false;
  }, 500);
}

function clearHideTimer() {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
    hideTimer.value = null;
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  clearHideTimer();
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize);
});



</script>

<style scoped lang="less">
.knowledge-base {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar {
  min-width: 290px;
  width: 16%;
  padding: @size-5;
  height: 100vh;
  box-sizing: border-box;
  border-right: @border-1 solid @color-border-2;
  position: relative;
  transition: width 0.3s ease;

  &.collapsed {
    width: 0;
    min-width: 0;
    padding: @size-5 0;
  }
}

.sidebar.collapsed .tree-menu,
.sidebar.collapsed {
  opacity: 0;
  pointer-events: none;
}

.tree-menu {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.kb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: @size-2;
  margin-bottom: @size-3;

  h3 {
    flex: 1;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .favorite-button {
    flex-shrink: 0;
    cursor: pointer;
    padding: @size-1;
    border-radius: @border-radius-small;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background-color: @color-fill-2;
    }

    .star-icon {
      font-size: @size-5;
      color: @color-text-3;
      transition: color 0.2s ease;

      &.active {
        color: @warning-6;
      }

      &:hover {
        color: @warning-6;
      }
    }
  }
}

.content {
  flex: 1;
  overflow: hidden;
  height: 100vh;
  box-sizing: border-box;
}

.home-node {
  padding: @size-1 @size-3;
  cursor: pointer;
  border-radius: @border-radius-small;
  margin: 2px 0;
  transition: all 0.2s ease;
  position: relative;
  border: @border-2 solid transparent;
  min-height: 24px;
  background-color: @color-fill-1;

  &:hover {
    background-color: @color-fill-2;
  }

  .node-content {
    display: flex;
    align-items: center;
    gap: @size-2;
    height: 100%;
    min-height: 24px;

    .node-name {
      flex: 1;
      font-size: @font-size-body-3;
      color: @color-text-1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: @size-2;
      line-height: 1;
    }
  }
}

.action-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  padding: 2px;
  border-radius: @border-radius-small;
  transition: all 0.2s ease;
  flex-shrink: 0;
  align-self: center;
}

.collapse-button-fixed {
  position: fixed;
  top: 25%;
  left: 0;
  user-select: none;
  transform: translateY(-25%);
  width: 14px;
  height: 60px;
  background: @color-bg-white;
  border: @border-1 solid @color-border-2;
  border-radius: 0 @size-3 @size-3 0;
  box-shadow: 2px 0 8px fade(#000, 10%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.3s ease;

  &:hover {
    background: @color-fill-1;
  }

  .collapse-icon {
    color: @color-text-3;
    font-size: @font-size-title-1;
    transition: all 0.3s ease;

    &:hover {
      color: @color-text-1;
    }
  }

  @media (hover: none) {
    display: flex !important;
  }
}

.collapse-button {
  user-select: none;
  position: absolute;
  top: 25%;
  right: -16px;
  transform: translateY(-25%);
  width: 14px;
  height: 60px;
  background: @color-bg-white;
  border: @border-1 solid @color-border-2;
  border-radius: 0 @size-3 @size-3 0;
  box-shadow: 2px 0 8px fade(#000, 10%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: @color-fill-1;
  }

  .collapse-icon {
    color: @color-text-3;
    font-size: @font-size-title-1;
    transition: all 0.3s ease;

    &:hover {
      color: @color-text-1;
    }
  }

  @media (hover: none) {
    display: flex !important;
  }
}

.sidebar.collapsed .collapse-button {
  right: -24px;
  border-radius: 0 @size-3 @size-3 0;
}
</style>