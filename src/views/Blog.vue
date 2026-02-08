<template>
  <Header />
  <div class="header-container"></div>
  <div class="main-container">
    <div class="content-wrapper">
      <!-- 切换按钮 -->
      <div class="view-switcher">
        <a-radio-group v-model="viewMode" type="button" size="large">
          <a-radio value="stream">无限滚动</a-radio>
          <a-radio value="pagination">分页查询</a-radio>
        </a-radio-group>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <PostList 
          v-if="viewMode === 'stream'" 
        />
        <PaginatedPostList v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Header from '@/components/layout/Header.vue';
import PostList from '@/components/home/children/PostList.vue';
import PaginatedPostList from '@/components/home/children/PaginatedPostList.vue';

const viewMode = ref('stream'); // 'stream' 或 'pagination'

// 页面加载时获取数据
onMounted(() => {
  // 从 localStorage 恢复用户的选择
  const savedMode = localStorage.getItem('blog_view_mode');
  if (savedMode) {
    viewMode.value = savedMode;
  }
});

// 监听 viewMode 变化，保存到 localStorage
const saveViewMode = () => {
  localStorage.setItem('blog_view_mode', viewMode.value);
};

// 使用 watch 监听变化
import { watch } from 'vue';
watch(viewMode, saveViewMode);
</script>

<style scoped>
.main-container {
  background-color: var(--color-bg-1);
  width: 100%;
  overflow-x: hidden;
  margin: 0 auto;
  display: flex;
  gap: 20px;
}

.content-wrapper {
  flex: 1;
  max-width: 1800px;
  margin: 100px auto;
  padding: 0 20px;
}

.view-switcher {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.content-area {
  width: 100%;
}

@media (max-width: 768px) {
  .content-wrapper {
    margin: 80px auto 20px;
    padding: 0 10px;
  }
}
</style>
