<template>
  <div>
    <div>
<a-layout-header>
    <a-breadcrumb>
      <a-breadcrumb-item 
        v-for="(item, index) in breadcrumbItems" 
        :key="item.id"
        :class="{ 'last-item': index === breadcrumbItems.length - 1 }"
      >
        {{ item.name }}
      </a-breadcrumb-item>
    </a-breadcrumb>
</a-layout-header>
    </div>
    <div style="height: 100%;">
      <MarkdownEditor v-model="textContent" :height="editorHeight" @go-back="goBack" />
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import MarkdownEditor from '@/components/MarkdownEditor.vue';
import api from '@/api/index.js';
import { useKbStore } from '../kbStore.js';

const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();

// 响应式数据
const textContent = ref('');
const editorHeight = ref('calc(100vh - 50px)');
const breadcrumbItems = ref([
  { id: 'home', name: kbStore.kbInfo?.name || '知识库' }
]);

// 从store中获取treeData
const treeData = computed(() => kbStore.treeData);
const kbId = computed(() => kbStore.kbId);
const kbInfo = computed(() => kbStore.kbInfo);

// 返回函数
const goBack = () => {
  console.log(textContent.value);
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
  (newPostId, oldPostId) => {
    if (newPostId && newPostId !== oldPostId) {
      // 加载新文章内容
      loadPostContent(newPostId);
      // 构建面包屑
      buildBreadcrumb(newPostId);
    }
  }
);

// 组件挂载时的逻辑（如果需要）
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
  console.log('Found node result:', result);
  
  if (result) {
    // 构建面包屑项
    const items = [
      { id: 'home', name: kbStore.kbInfo?.name || '知识库' },
      ...result.path.map(node => ({
        id: node.id,
        name: node.name
      }))
    ];
    
    console.log('Breadcrumb items:', items);
    breadcrumbItems.value = items;
  } else {
    // 如果找不到节点，至少显示知识库名称
    breadcrumbItems.value = [
      { id: 'home', name: kbStore.kbInfo?.name || '知识库' }
    ];
  }
};

const loadPostContent = async (postId) => {
  // 获取文章名称用于加载提示
  let postName = '文章';
  const result = findNodeByPostId(treeData.value, postId);
  if (result && result.node) {
    postName = result.node.name || '文章';
  }
  
  // 显示加载提示
  const loadingMsg = Message.loading(`正在加载${postName}...`, 0);
  
  try {
    const { data } = await api.get(`/post`, { id: postId });
    textContent.value = data.content || '';
  } catch (error) {
    console.error('加载文章内容失败:', error);
    Message.error(`加载${postName}失败`);
  } finally {
    // 关闭加载提示
    loadingMsg.close();
  }
};
</script>

<style scoped>
.last-item {
  font-weight: bold;
  color: #165DFF;
}
</style>