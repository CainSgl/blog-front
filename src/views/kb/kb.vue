<template>
  <div class="knowledge-base" @mousemove="handleMouseMove" >
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
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
          <TreeMenu :tree-data="treeData" :edit="true" @clickPost="handleClickPost" :kb-id="kbId" />
          <LikeButton :initial-like-count="kbInfo.likeCount" :kb-id="kbId" @like="handleLike" v-if="!noKb" class="like-button-wrapper" />
        </div>
      </div>

      <div class="collapse-button" v-show="showCollapseButton " @click="toggleCollapse">
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
import { onMounted, onUnmounted, ref } from 'vue';
import TreeMenu from '@/components/TreeMenuWrapper.vue';
import LikeButton from '@/components/LikeButton.vue';
import api from '@/api/index.js';
import { IconHome, IconDoubleLeft, IconDoubleRight } from '@arco-design/web-vue/es/icon';
import { useRoute, useRouter } from 'vue-router';
import { useKbStore } from './kbStore.js';



const route = useRoute();
const router = useRouter();
const noKb = ref(false);
const isCollapsed = ref(false);
const kbInfo = ref({
  name: '获取中...',
  likeCount: 0
});
const kbStore = useKbStore();

// collapse-button 精细控制相关状态
const showCollapseButton = ref(false);
const hideTimer = ref(null);
function handleLike() {

}
onMounted(async () => {
  const kbParam = route.query.kb;
  if (kbParam) {
    const kbIdreq = kbParam;
    try {
      const { data } = await api.get('/kb', { id: kbIdreq });
      //TODO，现在全部是正确的，后续加隐私设置
      kbId.value = data.first.id;
      kbInfo.value = data.first;
      treeData.value = data.second;

      // Store data in Pinia store
      kbStore.setKbId(data.first.id);
      kbStore.setKbInfo(data.first);
      kbStore.setTreeData(data.second);
    }
    catch (error) {
      console.error(error);
      //要么没登陆，要么资源不存在(权限不足也是这个)
      if (error.data.code == '40004') {
        //展示404
        router.push({ name: 'NoKb' });
        noKb.value = true;
      }
    }
  }
  else {
    console.log('没有');
    //重定向到404页面
    router.push({ name: 'NotFound' });
  }
});

const kbId = ref('-1');
function handleClickPost(node) {
  const pageName = route.name;
  //是的话跳转到查看页面，否则不改变页面
  console.log(pageName)
  if (pageName === 'KBIndex') {
    router.push({ name: 'KBView', query: { kb: kbId.value, p: node.postId } });
  } else {
    
    router.push({ name: pageName, query: { kb: kbId.value, p: node.postId } });
  }
}
const treeData = ref([]);

function goToHome() {
  router.push({ name: 'KBIndex', query: { kb: kbId.value } });
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

// collapse-button 精细控制方法
function handleMouseMove(event) {
  const screenWidth = window.innerWidth;
  const mouseX = event.clientX;
  const threshold = isCollapsed.value ? screenWidth * 0.1 : screenWidth * 0.3;

  if (mouseX <= threshold) {
    showCollapseButton.value = true;
    handleMouseLeave();
  } else {
    handleMouseLeave();
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
.sidebar.collapsed .like-button-wrapper {
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
  top: 50%;
  right: -22px;
  transform: translateY(-50%);
  width: 20px;
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
  right: -12px;
}


</style>