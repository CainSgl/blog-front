<template>
  <div class="welcome-container">
    <a-spin :loading="loading" tip="加载首页内容中..." style="width: 100%;min-height: 400px;">
      <MarkdownPreview 
        v-if="content" 
        :content="content" 
        :show-comment="false"
        :use-window-scroll="false"
      />
      <a-empty v-else-if="!loading" description="暂无内容" />
    </a-spin>

    <!-- 向下滑动进度条 -->
    <ScrollProgressTrigger 
      ref="progressTriggerRef" 
      :enabled="!loading && !!content" 
      direction="down"  
      progress-tip="向下滑动进入目录"
      @progress-complete="handleProgressComplete" 
    />
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import MarkdownPreview from '@/components/md/MarkdownPreview.vue';
import ScrollProgressTrigger from '@/components/about/ScrollProgressTrigger.vue';
import api from '@/api';

const emit = defineEmits(['enter-directory']);

const content = ref('');
const loading = ref(false);
const progressTriggerRef = ref(null);

const fetchContent = async () => {
  loading.value = true;
  try {
    const response = await api.get('/system/about/content');
    if (response.data) {
      content.value = response.data;
    }
  } catch (error) {
    console.error('获取首页内容失败:', error);
  } finally {
    loading.value = false;
  }
};

// 处理向下进度完成事件
const handleProgressComplete = () => {
  emit('enter-directory');
};

onMounted(() => {
  fetchContent();
});
</script>

<style scoped lang="less">
.welcome-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
