import { defineStore } from "pinia";
import { ref } from "vue";

export const useCommentStore = defineStore("comment", () => {
  // 抽屉显示状态
  const drawerVisible = ref(false);
  // 当前评论ID
  const currentCommentId = ref(null);
  const paragrahphId = ref(-1);
  
  // 评论数据相关
  const comments = ref([]);
  
  // 隐藏抽屉
  const hideCommentDrawer = () => {
    drawerVisible.value = false;
  };

  // 切换抽屉显示状态
  const toggleCommentDrawer = (paragrahphId) => {
    drawerVisible.value = !drawerVisible.value;
    paragrahphId.value = paragrahphId;
  };
  
  // 加载评论数据的函数（mock数据）
  const loadCommentData = async (page, pageSize) => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成mock数据
    const mockComments = [];
    const startIndex = (page - 1) * pageSize;
    
    // 模拟总共只有25条评论，当超过总数时返回空数组或不足数量的数组
    const totalComments = 25;
    const remainingComments = totalComments - startIndex;
    
    const commentsToAdd = Math.min(pageSize, remainingComments);
    
    if (commentsToAdd > 0) {
      for (let i = 0; i < commentsToAdd; i++) {
        const commentIndex = startIndex + i;
        mockComments.push({
          id: commentIndex + 1,
          content: `这是第 ${commentIndex + 1} 条评论内容这是第 ${commentIndex + 1} 条评论内容这是第 ${commentIndex + 1} 条评论内容这是第 ${commentIndex + 1} 条评论内容`,
          author: `用户${commentIndex + 1}`,
          time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
          avatar: `https://example.com/avatar${(commentIndex + 1) % 5}.png`,
          replies: []
        });
      }
    }
    
    return {
      data: mockComments,
      hasMore: startIndex + commentsToAdd < totalComments
    };
  };

  return {
    drawerVisible,
    currentCommentId,
    paragrahphId,
    comments,
    hideCommentDrawer,
    toggleCommentDrawer,
    loadCommentData,
  };
});
