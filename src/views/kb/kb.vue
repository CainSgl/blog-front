<template>
  <div class="knowledge-base" @mousemove="handleMouseMove">
    <div v-if="!hasError" class="sidebar" :class="{ collapsed: isCollapsed }">
      <div v-show="!isCollapsed">
        <div class="tree-menu">
          <div class="kb-header">
            <h3>{{ kbInfo.name }}</h3>
          </div>
          <div class="home-node" @click="goToHome">
            <div class="node-content">
              <span class="node-name">
                <IconHome class="action-icon" />
                <span>首页</span>
              </span>
            </div>
          </div>
          <TreeMenu :tree-data="treeData" :edit="edit" @clickPost="handleClickPost" :kb-id="kbId" :height="treeMenuHeight"  />
          
        </div>
      </div>

      <div class="collapse-button" v-show="showCollapseButton" @click="toggleCollapse">
        <IconDoubleRight v-if="isCollapsed" class="collapse-icon" size="large"></IconDoubleRight>
        <IconDoubleLeft v-else class="collapse-icon" size="large"> </IconDoubleLeft>
      </div>
    </div>



    <div class="content">
      <router-view />
    </div>

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import TreeMenu from '@/components/navigation/treemenu/TreeMenuWrapper.vue';

import { IconHome, IconDoubleLeft, IconDoubleRight } from '@arco-design/web-vue/es/icon';
import { useRoute, useRouter } from 'vue-router';
import { useKbStore } from './kbStore.js';
import { useUserStore } from '@/store/user';
import { messageManager } from '@/api/request.js';
import { Message } from '@arco-design/web-vue';
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

// collapse-button 精细控制相关状态
const showCollapseButton = ref(window.innerWidth >= 800);  // 默认根据屏幕宽度决定是否显示
const hideTimer = ref(null);

// 检查屏幕宽度的函数
function checkScreenSize() 
{
  return window.innerWidth >= 800;
}
function handleLike() 
{

}
onMounted(async () => 
{
  const kbParam = route.query.kb;
  if (kbParam) 
  {
    try 
    {
      const kbData = await kbStore.getKbInfo(kbParam);
      //如果是无权限操作，说明
      if (kbData) 
      {
        kbId.value = kbData.id;
        kbInfo.value = kbData;
        const userInfo = await useUserStore().getUserInfo();
        if (kbData.userId == userInfo.id) 
        {
          edit.value = true;
        }
        // 如果当前路由是KB父路由（没有子路由匹配），则跳转到KBIndex
        if (route.name === 'KB') 
        {
          router.push({ name: 'KBIndex', query: { kb: kbId.value } });
        }
      }
      else 
      {
        // 获取知识库信息失败，重定向到404页面
        router.push({ name: 'NoKb' });
        noKb.value = true;
      }
    }
    catch (error) 
    {
      hasError.value = true;
      if (messageManager.hasMessage('由于私密性设置无法访问该知识库')) 
      {
        router.push({ name: 'NoPermission', query: { kb: kbParam, require: 'kb' } });
        Message.warning({
          id: '由于私密性设置无法访问该知识库',
          content: '该知识库由于私密性设置无法访问',
          duration: 3000,
        });
        return;
      }
      if (error.data.code == '40000' && error.data.msg) 
      {
        if (messageManager.hasMessage(error.data.msg)) 
        {
          let returnUrl = route.query.returnUrl;
          if (!returnUrl) 
          {
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
  else 
  {
    console.log('没有');
    //重定向到404页面
    router.push({ name: 'NotFound' });
  }

  // 初始化时检查屏幕尺寸
  if (!checkScreenSize()) 
  {
    showCollapseButton.value = false;
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 窗口大小变化处理函数
function handleResize() 
{
  if (!checkScreenSize()) 
  {
    showCollapseButton.value = false;
    isCollapsed.value = true;  // 在小屏幕上默认折叠侧边栏
  }
  else 
  {
    // 在大屏幕上恢复显示按钮
    showCollapseButton.value = true;
  }
}

const kbId = ref('-1');
const treeMenuHeight = ref('calc(100vh - 220px)'); // 默认高度计算

function handleClickPost(node) 
{
  const pageName = route.name;
  //是的话跳转到查看页面，否则不改变页面
  console.log(pageName);
  if (pageName === 'KBEdit') 
  {
    router.push({ name: pageName, query: { kb: kbId.value, p: node.postId } });
  }
  else 
  {
    router.push({ name: 'KBView', query: { kb: kbId.value, p: node.postId } });
  }
}
const treeData = computed(() => kbStore.treeData);

function goToHome() 
{
  router.push({ name: 'KBIndex', query: { kb: kbId.value } });
}

function toggleCollapse() 
{
  isCollapsed.value = !isCollapsed.value;
}

// collapse-button 精细控制方法
function handleMouseMove(event) 
{
  // 如果屏幕宽度小于800px，不显示收起按钮
  if (!checkScreenSize()) 
  {
    showCollapseButton.value = false;
    return;
  }

  const screenWidth = window.innerWidth;
  const mouseX = event.clientX;
  const threshold = isCollapsed.value ? screenWidth * 0.1 : screenWidth * 0.2 + 80;

  if (mouseX <= threshold) 
  {
    showCollapseButton.value = true;
    handleMouseLeave();
  }
  else 
  {
    clearHideTimer();
    showCollapseButton.value = false;
  }
}

function handleMouseLeave() 
{
  clearHideTimer();
  hideTimer.value = setTimeout(() => 
  {
    showCollapseButton.value = false;
  }, 500);
}

function clearHideTimer() 
{
  if (hideTimer.value) 
  {
    clearTimeout(hideTimer.value);
    hideTimer.value = null;
  }
}

// 组件卸载时清理定时器
onUnmounted(() => 
{
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
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  border-right: 1px solid #e5e6eb;
  position: relative;
  transition: width 0.3s ease;

  &.collapsed {
    width: 0;
    min-width: 0;
    padding: 20px 0;
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



.content {
  flex: 1;
  overflow: hidden;
  height: 100vh;
  box-sizing: border-box;
}

.home-node {
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 0;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
  min-height: 24px;
  background-color: #f7f7f7;

  &:hover {
    background-color: #e4e3e3;
  }

  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
    min-height: 24px;

    .node-name {
      flex: 1;
      font-size: 14px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 1;
    }
  }
}

.action-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  align-self: center;
}

.collapse-button {
  user-select: none;
  position: absolute;
  top: 25%;
  right: -16px;
  transform: translateY(-25%);
  width: 14px;
  height: 60px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 0 12px 12px 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.3s ease;

  &:hover {
    background: #f7f7f7;
  }

  .collapse-icon {
    color: #666;
    transition: transform 0.3s ease;


    &:hover {
      color: #333;
    }
  }
}

.sidebar.collapsed .collapse-button {
  right: -17px;
}
</style>