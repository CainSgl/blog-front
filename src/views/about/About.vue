<template>
  <div style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
    <Header></Header>
    <div class="header-container"></div>
    <div class="about-page">

      <!-- 侧边栏导航 -->
      <AboutSidebar ref="sidebarRef" @node-select="handleNodeSelect" />
      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 面包屑导航 -->
        <AboutBreadcrumb :breadcrumbs="breadcrumbs" @clear-selection="clearSelection"
          @breadcrumb-click="handleBreadcrumbClick" />

        <!-- 内容展示区 -->
        <div class="content-area">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <a-spin size="large" tip="加载中..." />
          </div>
          <WelcomeView v-else-if="currentView === 'welcome'" @enter-directory="handleEnterDirectory" />
          <ArticleView v-else-if="currentView === 'article'" :node="currentNode"
            @scroll-to-bottom="handleScrollToBottom" @scroll-to-top="handleScrollToTop" />
          <DirView v-else-if="currentView === 'dir'" :node="currentNode" :has-previous="hasPreviousNode"
            @load-more="handleLoadMore" @item-click="handleDirItemClick" @load-previous="handleLoadPrevious" />
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import AboutSidebar from './components/AboutSidebar.vue';
import AboutBreadcrumb from './components/AboutBreadcrumb.vue';
import ArticleView from './components/ArticleView.vue';
import WelcomeView from './components/WelcomeView.vue';
import DirView from './components/DirView.vue';
import api from '@/api/index'
import Header from '@/components/layout/Header.vue';

const route = useRoute();
const router = useRouter();

const sidebarRef = ref(null);
const loading = ref(false);
const breadcrumbs = ref([]);
const treeData = ref([]); // 存储树形数据
// 当前视图类型: 'welcome' | 'article' | 'dir'
const currentView = ref('welcome');
const currentNode = ref(null);

// 计算是否有上一级节点
const hasPreviousNode = computed(() => {
  if (!currentNode.value || !sidebarRef.value) {
    return false;
  }

  const rawTreeData = sidebarRef.value.rawTreeData;
  if (!rawTreeData || rawTreeData.length === 0) {
    return false;
  }

  // 查找上一个节点
  const prevNode = findPreviousNode(rawTreeData, currentNode.value.id);
  return prevNode !== null;
});

const parseRoute = () => {
  const path = route.path;

  // /about/view/:id - 文章视图
  if (path.startsWith('/about/view/')) {
    currentView.value = 'article';
  }
  // /about/dir/:id - 目录视图
  else if (path.startsWith('/about/dir/')) {
    currentView.value = 'dir';
  }
  // /about - 欢迎页
  else {
    currentView.value = 'welcome';
  }
};


watch(() => route.path, () => {
  parseRoute();
}, { immediate: true });

// 处理节点选择
const handleNodeSelect = async (node) => {
  if (!node) {
    return;
  }
  if (node.postId) {
    currentNode.value = node;
    if (!node.content) {
      api.get('/system/about/content', { id: node.postId }).then(({ data }) => {
        console.log("获取内容", data);
        node.content = data;
        const newnode = { ...node, content: data };
        currentNode.value = newnode;
      });

    }
    router.push(`/about/view/${node.id}`);
  } else {
    currentNode.value = node;
    router.push(`/about/dir/${node.id}`);
  }
};

// 查找下一个兄弟节点（包括子节点）
const findNextNode = (nodes, currentId) => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // 找到当前节点
    if (node.id === currentId) {
      // 如果有子节点，返回第一个子节点
      if (node.children && node.children.length > 0) {
        return node.children[0];
      }

      // 如果有下一个兄弟节点，返回下一个兄弟节点
      if (i < nodes.length - 1) {
        return nodes[i + 1];
      }

      // 如果没有下一个兄弟节点，返回父节点的下一个兄弟节点
      return null;
    }

    // 递归查找子节点
    if (node.children && node.children.length > 0) {
      const result = findNextNode(node.children, currentId);
      if (result) {
        return result;
      }

      // 如果在子节点中找到了当前节点但没有下一个节点
      // 检查当前节点是否有下一个兄弟节点
      const hasCurrentInChildren = node.children.some(child => child.id === currentId || hasNodeInTree(child.children, currentId));
      if (hasCurrentInChildren && i < nodes.length - 1) {
        return nodes[i + 1];
      }
    }
  }

  return null;
};

// 查找上一个节点（包括父节点和兄弟节点）
const findPreviousNode = (nodes, currentId, parent = null) => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // 找到当前节点
    if (node.id === currentId) {
      // 如果有上一个兄弟节点
      if (i > 0) {
        const prevSibling = nodes[i - 1];
        // 返回上一个兄弟节点的最后一个可见后代，或者上一个兄弟节点本身
        return getLastVisibleDescendant(prevSibling);
      }

      // 如果没有上一个兄弟节点，返回父节点
      return parent;
    }

    // 递归查找子节点
    if (node.children && node.children.length > 0) {
      const result = findPreviousNode(node.children, currentId, node);
      if (result) {
        return result;
      }
    }
  }

  return null;
};

// 获取节点的最后一个可见后代
const getLastVisibleDescendant = (node) => {
  if (!node.children || node.children.length === 0) {
    return node;
  }
  // 递归获取最后一个子节点的最后一个后代
  return getLastVisibleDescendant(node.children[node.children.length - 1]);
};

// 辅助函数：检查节点是否在树中
const hasNodeInTree = (nodes, targetId) => {
  if (!nodes) return false;

  for (const node of nodes) {
    if (node.id === targetId) return true;
    if (node.children && hasNodeInTree(node.children, targetId)) {
      return true;
    }
  }
  return false;
};

// 处理滚动到底部事件（向下跳转）
const handleScrollToBottom = () => {
  if (!currentNode.value || !sidebarRef.value) {
    return;
  }

  // 从 sidebar 组件获取树形数据
  const rawTreeData = sidebarRef.value.rawTreeData;

  if (!rawTreeData || rawTreeData.length === 0) {
    console.warn('无法获取树形数据');
    return;
  }

  // 查找下一个节点
  const nextNode = findNextNode(rawTreeData, currentNode.value.id);

  if (nextNode) {
    // 选中下一个节点
    sidebarRef.value.selectNodeById(nextNode.id);
  }
};

// 处理滚动到顶部事件（向上跳转）
const handleScrollToTop = () => {
  if (!currentNode.value || !sidebarRef.value) {
    return;
  }

  // 从 sidebar 组件获取树形数据
  const rawTreeData = sidebarRef.value.rawTreeData;

  if (!rawTreeData || rawTreeData.length === 0) {
    console.warn('无法获取树形数据');
    return;
  }

  // 查找上一个节点
  const prevNode = findPreviousNode(rawTreeData, currentNode.value.id);

  if (prevNode) {
    // 选中上一个节点
    sidebarRef.value.selectNodeById(prevNode.id);
  }
};

// 处理目录视图的向上加载（返回父级）
const handleLoadPrevious = () => {
  if (!currentNode.value || !sidebarRef.value) {
    return;
  }

  // 从 sidebar 组件获取树形数据
  const rawTreeData = sidebarRef.value.rawTreeData;

  if (!rawTreeData || rawTreeData.length === 0) {
    console.warn('无法获取树形数据');
    return;
  }

  // 查找上一个节点（与 ArticleView 的向上跳转逻辑一致）
  const prevNode = findPreviousNode(rawTreeData, currentNode.value.id);

  if (prevNode) {
    // 选中上一个节点
    sidebarRef.value.selectNodeById(prevNode.id);
  } else {
    // 如果没有上一个节点，返回欢迎页
    clearSelection();
  }
};

// 清除选择
const clearSelection = () => {
  sidebarRef.value?.clearSelection();
  breadcrumbs.value = [];
  // 返回欢迎页
  router.push('/about');
};

// 处理面包屑点击
const handleBreadcrumbClick = (crumb, index) => {
  if (index === breadcrumbs.value.length - 1) return;

  sidebarRef.value?.selectNode(crumb.key);
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
};

// 处理目录视图中的加载更多
const handleLoadMore = () => {
  if (!currentNode.value || !sidebarRef.value) {
    return;
  }

  // 从 sidebar 组件获取树形数据
  const rawTreeData = sidebarRef.value.rawTreeData;

  if (!rawTreeData || rawTreeData.length === 0) {
    console.warn('无法获取树形数据');
    return;
  }

  // 查找下一个节点（与 ArticleView 的向下跳转逻辑一致）
  const nextNode = findNextNode(rawTreeData, currentNode.value.id);

  if (nextNode) {
    // 选中下一个节点
    sidebarRef.value.selectNodeById(nextNode.id);
  }
};

// 处理目录视图中的项目点击
const handleDirItemClick = (item) => {
  // 不直接修改路由，而是通知 sidebar 选中对应节点
  // sidebar 会通过 node-select 事件通知回来，然后再修改路由
  if (sidebarRef.value && item.id) {
    sidebarRef.value.selectNodeById(item.id);
  }
};

// 处理从欢迎页进入目录
const handleEnterDirectory = () => {
  if (!sidebarRef.value) {
    return;
  }

  // 从 sidebar 组件获取树形数据
  const rawTreeData = sidebarRef.value.rawTreeData;

  if (!rawTreeData || rawTreeData.length === 0) {
    console.warn('无法获取树形数据');
    return;
  }

  // 选中第一个节点
  const firstNode = rawTreeData[0];
  if (firstNode) {
    sidebarRef.value.selectNodeById(firstNode.id);
  }
};

// 初始化
onMounted(() => {
  parseRoute();
});
</script>

<style scoped lang="less">
.about-page {
  display: flex;
  flex: 1;
  width: 100%;

  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;


}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}
</style>
