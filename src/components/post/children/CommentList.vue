<template>
    <div class="comments-header">
        <h2>评论</h2>
        <div class="comment-count"> {{ commentCountText }}</div>
    </div>
    <div class="comment-list" v-if="postId">
        <div style="margin-top: 30px;">
              <ReplyInput :autoFocus="false" :version="version"  :on-submit-comment="handleSubmitComment"  />
        </div>
      

        <div v-if="!loading && commentList.length === 0" class="no-comments">
            {{ noCommentsText }}
        </div>
        <div class="comments-container" ref="commentsContainerRef">
            <Comment v-for="comment in commentList" :key="comment.id" :comment-data="comment" />
        </div>
        <div v-if="loading && commentList.length > 0" class="loading-more">加载更多中...</div>
        <div v-if="!hasMore && commentList.length > 0" class="no-more">没有更多评论了</div>
        <a-spin v-show="loading" style="width: 100%;" :loading="loading" tip="加载中" />
    </div>
</template>

<script setup>
import { defineProps, ref, onMounted, watch, onUnmounted, nextTick } from 'vue';
import Comment from '@/components/comment/Comment.vue';
import ReplyInput from '@/components/comment/ReplyInput.vue';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';
import {getDateNow} from '@/utils/DateFormatter.js';
import { useUserStore } from '@/store/user.js';

const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  postCount: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 0
  },
  noCommentsText:{
    type:String,
    default:'暂无评论，快来抢沙发吧！'
  },
  commentCountText:{
     type:String,
    default:'也可以看看段评哦'
  }
});
const userStore = useUserStore();
const commentList = ref([]);
const loading = ref(false);
const hasMore = ref(true);

let lastCreatedAt = null;
let lastLikeCount = null;
let lastId=null;
// 添加一个变量来追踪是否是加载更多
let isLoadMore = false;

// 滚动容器引用
const commentsContainerRef = ref(null);

const fetchCommentData = async (loadMore = false) => 
{
  if (!props.postId) 
  {
    return;
  }
  if (!hasMore.value && loadMore) 
  {
    return;
  }

  isLoadMore = loadMore;
  loading.value = true;
  try 
  {
    const params = { postId: props.postId };
    if (loadMore && lastCreatedAt !== null && lastLikeCount !== null) 
    {
      params.lastCreatedAt = lastCreatedAt;
      params.lastLikeCount = lastLikeCount;
      params.lastId = lastId;
    }
    const { data } = await api.get('/post/comment', params);
    if (data && data.length > 0) 
    {
      if (loadMore) 
      {
        commentList.value = [...commentList.value, ...data];
      }
      else 
      {
        commentList.value = data;
      }
      lastCreatedAt = data[data.length - 1].createAt;
      lastLikeCount = data[data.length - 1].likeCount;
      lastId = data[data.length - 1].id;
    }
    if (data && data.length < 10) 
    {
      hasMore.value = false;
    }
  }
  catch (error) 
  {
    console.error('获取评论数据失败:', error);
  }
  finally 
  {
    loading.value = false;
  }
};

// 滚动事件处理
const handleScroll = () => 
{
  if (!commentsContainerRef.value || loading.value || !hasMore.value) 
  {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.value;
  // 当滚动到底部附近时加载更多数据
  if (scrollTop + clientHeight >= scrollHeight - 10) 
  {
    fetchCommentData(true); // 加载更多
  }
};

// 处理提交评论
const handleSubmitComment = async (content) => 
{
  try 
  {
    const { data } = await api.post('/post/comment', { 
      postId: props.postId, 
      version: props.version, 
      content: content 
    });
    const currentUserInfo = await userStore.getUserInfo();
    commentList.value.unshift({
      id:data.id,
      userId:currentUserInfo.id,
      content:data.content,
      replyCount:0,
      likeCount:0,
      createdAt:new Date()
    });
    Message.success('成功发布评论');
  }
  catch (error) 
  {
    console.error('发布评论失败:', error);
    Message.error('发布评论失败，请重试！');
  }
};

// 监听 postId 变化，重新获取数据
watch(() => props.postId, (newPostId) => 
{
  if (newPostId) 
  {
    lastCreatedAt = null;
    lastLikeCount = null;
    hasMore.value = true;
    fetchCommentData();
  }
}, { immediate: true });
onMounted(async () => 
{
  await fetchCommentData();
});

// 组件卸载时移除事件监听
onUnmounted(() => 
{
  
});
</script>

<style scoped lang="less">
.comments-header {
    display: flex;
    align-items: center;
    h2 {
        margin: 0;
        font-weight: 500;
        display: flex;
        align-items: center;
        height: 1.5em;
    }
}
.comments-container{
    margin-top:30px;
}
.comment-count {
    margin: 0 30px 0 6px;
    font-size: 13px;
    font-weight: 400;
    color: @color-text-4; 
}

.comment-list {
    width: 100%;
    padding: 0 16px 16px 16px;
}


.no-comments {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 14px;
}

.loading-more,
.no-more {
    text-align: center;
    padding: 10px;
    color: #999;
    font-size: 14px;
}


</style>