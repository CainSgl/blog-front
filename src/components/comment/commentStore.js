import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/api/index.js";
export const useCommentStore = defineStore("comment", () => {
  // 抽屉显示状态
  const drawerVisible = ref(false);
  //记录postId和version，需要使用
  const postId = ref();
  const version = ref();
  const commentCountMap = ref(new Map());
  const paragrahphId=ref(null);
  const getParagraphCommentCountByPost = async (postIdCache, versionCache) => {
    postId.value = postIdCache;
    version.value = versionCache;
    const { data } = await api.get("/paragraph/comment", {
      id: postId.value,
      version: version.value,
    });
    // 将返回的数据转换为Map，以dataId为key，count为value
    const newMap = new Map();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        newMap.set(item.dataId, item.count);
      });
    }
    commentCountMap.value = newMap;
    return commentCountMap.value;
  };
  // 隐藏抽屉
  const hideCommentDrawer = () => {
    drawerVisible.value = false;
  };

  // 切换抽屉显示状态
  const toggleCommentDrawer = (paragrahphIdCache) => {
    paragrahphId.value = paragrahphIdCache;
    lastCreatedAt=null;
    lastLikeCount=null;
    drawerVisible.value = !drawerVisible.value;
  };
  let lastCreatedAt;
  let lastLikeCount;
  // 加载评论数据的函数（mock数据）
  const loadCommentData = async () => {
    const { data } = await api.get('/comment',{postId:postId.value,version:version.value,dataId:paragrahphId.value,lastCreatedAt:lastCreatedAt,lastLikeCount:lastLikeCount});
    if(data.length>0){
      lastCreatedAt=data[data.length-1].createdAt;
      lastLikeCount=data[data.length-1].likeCount;
    }
    return {
      data: data,
      hasMore: data.length >10,
    };
  };

  const getCommentCountById = (commentId) => {
    return commentCountMap.value.get(commentId) || 0;
  };

  // 更新指定段落的评论计数
  const incrementCommentCount = (commentId) => {
    const currentCount = commentCountMap.value.get(commentId) || 0;
    commentCountMap.value.set(commentId, currentCount + 1);
  };

  return {
    drawerVisible,
    hideCommentDrawer,
    toggleCommentDrawer,
    loadCommentData,
    getParagraphCommentCountByPost,
    getCommentCountById,
    incrementCommentCount,
    paragrahphId,
    commentCountMap,
    postId,
    version,
  };
});
