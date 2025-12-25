<template>
  <a-spin :loading="loading" tip="正在加载文章内容..." style="display: block;">
    <div style="padding:10px 0px;">
      <div>
        <a-layout-header style="display: flex;justify-content: space-between; align-items: center;">
          <a-breadcrumb>
            <a-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="item.id"
              :class="{ 'last-item': index === breadcrumbItems.length - 1 }">
              {{ item.name }}
            </a-breadcrumb-item>
          </a-breadcrumb>
          <div style="display: flex; align-items: center;margin-right: 10px">
            <a-tooltip v-if="postInfo.status" :content="getStatusTooltip()">
              <component :is="getStatusIcon()" style="cursor: pointer;font-size: 20px;" size="large" />
            </a-tooltip>
            <span v-if="postInfo.updatedAt" style="color: #666; margin-left: 10px; font-size: 15px;">
              上次更新时间：{{ formatUpdateTime(postInfo.updatedAt) }}
            </span>
          </div>
        </a-layout-header>
      </div>
      <div style="height: 100%;">
       <MarkdownPreviewWrapper :content="textContent" :height="previewHeight" />
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';

import api from '@/api/index.js';
import { useKbStore } from '../kbStore.js';
import { IconFilePdf, IconWifi } from '@arco-design/web-vue/es/icon';

import MarkdownPreviewWrapper from '@/components/md/MarkdownPreviewWrapper.vue';
const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();

// 响应式数据
const textContent = ref('');
const previewHeight = ref('calc(100vh - 84px)');
const loading = ref(false); // 控制文章加载时的旋转动画
const breadcrumbItems = ref([
  { id: 'home', name: kbStore.kbInfo?.name || '知识库' }
]);

// 从store中获取treeData
const treeData = computed(() => kbStore.treeData);
const kbId = computed(() => kbStore.kbId);
const kbInfo = computed(() => kbStore.kbInfo);

const postInfo = ref({})

// 根据postId在树形结构中查找节点
const findNodeByPostId = (nodes, postId) => {
  if (!Array.isArray(nodes)) return null;

  // 确保postId是字符串类型
  const targetPostId = String(postId);

  for (const node of nodes) {
    // 确保node.postId也是字符串类型进行比较
    if (String(node.postId) === targetPostId) {
      return { node, path: [node] };
    }

    // 递归查找子节点
    if (node.children && node.children.length > 0) {
      const result = findNodeByPostId(node.children, postId);
      if (result) {
        // 将当前节点添加到路径开头
        result.path.unshift(node);
        return result;
      }
    }
  }

  return null;
};

// 构建面包屑路径
const buildBreadcrumb = (postId) => {
  if (!postId || !treeData.value) {
    console.log('Missing postId or treeData');
    return;
  }

  const result = findNodeByPostId(treeData.value, postId);

  if (result) {
    // 构建面包屑项
    const items = [
      { id: 'home', name: kbStore.kbInfo?.name || '知识库' },
      ...result.path.map(node => ({
        id: node.id,
        name: node.name
      }))
    ];
    breadcrumbItems.value = items;
  } else {
    // 如果找不到节点，至少显示知识库名称
    breadcrumbItems.value = [
      { id: 'home', name: kbStore.kbInfo?.name || '知识库' }
    ];
  }
};

// 根据状态获取对应的图标组件
const getStatusIcon = () => {
  if (!postInfo.value.status) return null;

  if (postInfo.value.status === '草稿') {
    return IconFilePdf;
  } else if (postInfo.value.status === '已发布') {
    return IconWifi;
  }
  return null;
};

// 获取状态提示信息
const getStatusTooltip = () => {
  if (!postInfo.value.status) return '';

  const statusMap = {
    '草稿': '草稿：互联网的所有人都无法访问你的文章',
    '已发布': '已发布：互联网的所有人都能访问你的文章'
  };

  return statusMap[postInfo.value.status] || postInfo.value.status;
};

// 格式化更新时间
const formatUpdateTime = (time) => {
  if (!time) return '';

  // 假设time是时间戳或可被Date解析的字符串
  const date = new Date(time);
  const now = new Date();

  // 如果是今天，显示时:分
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 如果是今年，显示月-日 时:分
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 其他情况显示年-月-日 时:分
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });   
};

const loadPostContent = async (postId) => {
  // 获取文章名称用于加载提示
  let postName = '文章';
  const result = findNodeByPostId(treeData.value, postId);
  if (result && result.node) {
    postName = result.node.name || '文章';
  }

  // 开始加载，设置loading为true
  loading.value = true;

  try {
    const { data } = await api.get(`/post`, { id: postId,simple:true });
    textContent.value = data.content || '';
    postInfo.value = data;
  } catch (error) {
    console.error('加载文章内容失败:', error);
    Message.error(`加载${postName}失败`);
  } finally {
    // 加载完成，设置loading为false
    loading.value = false;
  }
};

// 监听treeData的变化
watch(treeData, (newVal) => {
  if (newVal && newVal.length > 0) {
    const postId = route.query.p;
    if (postId) {
      buildBreadcrumb(postId);
    }
  }
}, { deep: true });

// 监听路由参数变化
watch(
  () => route.query.p,
  async (newPostId, oldPostId) => {
    if (newPostId && newPostId !== oldPostId) {
      loadPostContent(newPostId);
      buildBreadcrumb(newPostId);
    }
  }
);

// 组件挂载时的逻辑
onMounted(() => {
  const postId = route.query.p;
  console.log('Post ID from route:', postId, 'type:', typeof postId);
  if (postId) {
    // 先加载文章内容
    loadPostContent(postId);

    // 如果treeData已经存在，则构建面包屑
    if (treeData.value && treeData.value.length > 0) {
      buildBreadcrumb(postId);
    }
  }
});
</script>

<style scoped lang="less">
.last-item {
  font-weight: bold;
  color: #165DFF;
}
</style>