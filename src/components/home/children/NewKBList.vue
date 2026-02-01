<template>

  <div class="container">
    <KBList :initialPosts="[]" :load-data="loadKbs" :listenWindowScroll="true"
      :enableAutoLoad="enableAutoLoad"
      hasMoreText="没有更多知识库了" />
  </div>
</template>

<script setup>
import {useKbPaginationStore} from './kbPaginationStore.js';

import KBList from '@/components/home/KBList.vue';
import api from '@/api/index.js';

const props = defineProps({
  enableAutoLoad: {
    type: Boolean,
    default: true
  }
});

//这个组件是加载最新的知识库列表用的
const kbPaginationStore = useKbPaginationStore();

const loadKbs = async (pageSize) => 
{
  if (!props.enableAutoLoad) 
  {
    return [];
  }
  pageSize = Math.min(100, pageSize);
  const { data } = await api.post('/post/kb/cursor', kbPaginationStore.buildRequestParams(pageSize));
  if (data && data.length > 0) 
  {
    const lastItem = data[data.length - 1];
    kbPaginationStore.updatePagination(lastItem);
  }
  return data || [];
};
</script>

<style scoped>
.container{
  padding-left: 20px;
}
</style>