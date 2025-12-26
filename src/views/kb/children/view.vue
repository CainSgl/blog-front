<template>
  <a-spin :loading="loading" tip="正在加载文章内容..." style="display: block;">
    <div>
      <div style="padding:10px 0px;">
        <KBCardHeader :post-info="postInfo" :kb-id="kbId" :tree-data="treeData" :kb-info="kbInfo" :on-back="goBack" />
      </div>
      <div style="height: 100%;padding-left:16px;">
        <MarkdownPreviewWrapper :content="textContent" :height="previewHeight" />
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';

import KBCardHeader from '@/components/kb/KBCardHeader.vue';
import api from '@/api/index.js';
import { useKbStore } from '../kbStore.js';
import { messageManager } from '@/api/request.js';

import MarkdownPreviewWrapper from '@/components/md/MarkdownPreviewWrapper.vue';
const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();

// 响应式数据
const textContent = ref('');
const previewHeight = ref('calc(100vh - 124px)');
const loading = ref(false); // 控制文章加载时的旋转动画

// 从store中获取treeData
const treeData = computed(() => kbStore.treeData);
const kbInfo = computed(() => kbStore.kbInfo);
const kbId = computed(() => route.query.kb);

const postInfo = ref({})

const loadPostContent = async (postId) => {
  // 获取文章名称用于加载提示
  let postName = '文章';
  // 开始加载，设置loading为true
  loading.value = true;
  try {
    const { data } = await api.get(`/post`, { id: postId, simple: true });
    textContent.value = data.content || '';
    postInfo.value = data;
  } catch (error) {
    console.error('加载文章内容失败:', error);
    if (messageManager.hasMessage("40101")) {
       Message.warning({
        id: "40101",
        content: '该文章由于私密性设置无法访问',
        duration: 3000,
      });
      router.push({ name: 'NoPermission', query: { kb: kbId.value } });
    } else {
      Message.error(`加载${postName}失败`);
    }
  } finally {
    // 加载完成，设置loading为false
    loading.value = false;
  }
};

// 监听路由参数变化
watch(
  () => route.query.p,
  async (newPostId, oldPostId) => {
    if (newPostId && newPostId !== oldPostId) {
      loadPostContent(newPostId);
    }
  }
);

// 返回函数
const goBack = () => {
  router.push({ name: 'KBIndex', query: { kb: kbId.value } });
};

// 组件挂载时的逻辑（如果需要）
onMounted(() => {
  const postId = route.query.p;
  console.log('Post ID from route:', postId, 'type:', typeof postId);
  if (postId) {
    // 先加载文章内容
    loadPostContent(postId);
  }
});
</script>
