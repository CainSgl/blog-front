<template>
  <Header />
  <div class="header-container"></div>
  <div class="main-container">
    <div class="content-wrapper">
      <div class="kb-container">
        <KBList 
          :initialItems="[]" 
          :load-data="loadKbs" 
          :listenWindowScroll="true"
          :enableAutoLoad="true"
          hasMoreText="没有更多知识库了" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/layout/Header.vue';
import KBList from '@/components/home/KBList.vue';
import api from '@/api/index.js';
import { useKbPaginationStore } from '@/components/home/children/kbPaginationStore.js';

const kbPaginationStore = useKbPaginationStore();

const loadKbs = async (pageSize) => {
  pageSize = Math.min(100, pageSize);
  const { data } = await api.post('/post/kb/cursor', kbPaginationStore.buildRequestParams(pageSize));
  if (data && data.length > 0) {
    const lastItem = data[data.length - 1];
    kbPaginationStore.updatePagination(lastItem);
  }
  return data || [];
};
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

.kb-container {
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .content-wrapper {
    margin: 80px auto 20px;
    padding: 0 8px;
  }
}
</style>
