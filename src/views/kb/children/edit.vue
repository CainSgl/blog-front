<template>
  <div>
    <div>
<a-layout-header>
    <a-breadcrumb>
    <a-breadcrumb-item>Home</a-breadcrumb-item>
    <a-breadcrumb-item>Channel</a-breadcrumb-item>
    <a-breadcrumb-item>News</a-breadcrumb-item>
  </a-breadcrumb>
</a-layout-header>
    </div>
    <div style="height: 100%;">
      <MarkdownEditor v-model="textContent" :height="editorHeight" @go-back="goBack" />
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MarkdownEditor from '@/components/MarkdownEditor.vue';
import api from '@/api/index.js';

const route = useRoute();
const router = useRouter();

// 响应式数据
const textContent = ref('');
const editorHeight = ref('calc(100vh - 50px)');

// 返回函数
const goBack = () => {
  console.log(textContent.value);
};

// 组件挂载时的逻辑（如果需要）
onMounted(() => {
  // 这里可以根据需要添加初始化逻辑
  // 例如从路由参数或其他地方获取初始内容
  const postId = route.query.p;
  if (postId) {
    // 可以在这里加载特定文章的内容
    loadPostContent(postId);
  }
});

// 加载文章内容的函数（示例）
const loadPostContent = async (postId) => {
  try {
    // 示例API调用，根据实际API调整
    const { data } = await api.get(`/post`, { id: postId });
    textContent.value = data.content || '';
  } catch (error) {
    console.error('加载文章内容失败:', error);
  }
};
</script>

<style scoped></style>