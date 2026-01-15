<template>
  <div class="container">
    <HomePostList :initialPosts=[] :load-data="loadPosts" :listenWindowScroll="true"
      hasMoreText="你真是一个博学的人，本站的文档都被看光了 ヾ(*´∀ ˋ*)ﾉ" />

    <div v-if="!hasMore">
      <div style="height: 200px;"></div>
      <NewKBList></NewKBList>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import HomePostList from '@/components/home/HomePostList.vue';
import NewKBList from '@/components/home/children/NewKBList.vue';
import api from '@/api/index.js';
//这个组件是加载最新的文章列表用的
const emit = defineEmits(['noData']);
let lastUpdatedAt;
let lastLikeRatio;
let lastId;
function buildRequestParams(pageSize) 
{
  const data = { pageSize };
  if (lastUpdatedAt) 
  {
    data.lastUpdatedAt = lastUpdatedAt;
    data.lastLikeRatio = lastLikeRatio;
    data.lastId = lastId;
  }
  return data;
}
const hasMore = ref(true);
const loadPosts = async (pageSize) => 
{
  pageSize = Math.min(100, pageSize);
  const { data } = await api.post('/post/cursor', buildRequestParams(pageSize));
  if (data && data.length > 0) 
  {
    const lastItem = data[data.length - 1];
    lastUpdatedAt = lastItem.updatedAt;
    lastLikeRatio = lastItem.likeRatio;
    lastId = lastItem.id;
  }
  if (data && data.length < pageSize) 
  {
    console.log(pageSize, data.length);
    hasMore.value = false;
    emit('noData');
  }
  return data || [];
};
</script>

<style scoped></style>
