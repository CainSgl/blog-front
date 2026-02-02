<template>
  <div class="post-recommend" v-if="postId && recommendList && recommendList.length > 0">
    <div class="recommend-title">相似文档推荐</div>
    <div class="recommend-list">
      <div v-for="(post, index) in recommendList">
        <a-link :href="`/p/${post.id}`" :hoverable="false">
          <div style="width: 100%;;height: 17vw;max-height: 300px; min-height: 200px;" v-if="index <= 6">
            <PostCardWrapper :only-fans="true" :key="post.id" :post="post" :height="'100%'"   :width="'100%'"/>
          </div>
          <a-affix :offset-top="80 + (index- 7)*50"  v-else>
            <div style="width: 100%;height: 17vw;max-height: 300px; min-height: 200px;">
              <PostCardWrapper  :only-fans="true" :key="post.id" :post="post" :height="'100%'" :width="'100%'" />
            </div>
          </a-affix>
        </a-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue';
import api from '@/api/index.js';
import PostCardWrapper from '../../../components/post/PostCardWrapper.vue';

const props = defineProps({
  postId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['recommendItemClick']);

const recommendList = ref([]);

const fetchRecommendData = async () => 
{
  console.log('Fetching recommend data for post:', props.postId);
  if (!props.postId) 
  {
    return;
  }
  try 
  {
    const { data } = await api.get('/post/recommend', { id: props.postId });
    recommendList.value = data || [];
  }
  catch (error) 
  {
    console.error('Failed to fetch recommend data:', error);
    recommendList.value = [];
  }
};

// 监听 postId 变化，重新获取数据
watch(() => props.postId, (newPostId) => 
{
  if (newPostId) 
  {
    fetchRecommendData();
  }
  else 
  {
    recommendList.value = [];
  }
}, { immediate: true });




</script>

<style scoped lang="less">
.post-recommend {
  padding: 16px;
  width: 100%;
  box-sizing: border-box;

  .recommend-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 12px;
    color: var(--color-neutral-8);
  }

  .recommend-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>