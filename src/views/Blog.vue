<template>
  <Header />
  <div class="header-container"></div>
  <div class="main-container">
    <div class="content-wrapper">
      <!-- 切换按钮 -->
      <div class="view-switcher">
        <a-radio-group v-model="viewMode" type="button" size="large">
          <a-radio value="stream">流式加载</a-radio>
          <a-radio value="pagination">分页查询</a-radio>
        </a-radio-group>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <NewHomePostList 
          v-if="viewMode === 'stream'" 
          @noData="handleNoData"
        />
        <PaginatedPostList v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Header from '@/components/layout/Header.vue';
import NewHomePostList from '@/components/home/children/NewHomePostList.vue';
import PaginatedPostList from '@/components/home/children/PaginatedPostList.vue';

const isMobile = ref(true);
const showNewKBList = ref(true);
const viewMode = ref('stream'); // 'stream' 或 'pagination'

// 页面加载时获取数据
onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
  
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

const updateScreenSize = () => {
  // 当屏幕宽度大于1024px时，isMobile为false
  isMobile.value = window.innerWidth <= 1024;
};

function handleNoData() {
  console.log('文章没数据了，让他去看看知识库的');
  showNewKBList.value = false;
}
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
}

.view-switcher {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  padding: 0 20px;
}

.content-area {
  width: 100%;
}
</style>
