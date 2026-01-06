<template>
  <div class="cainsgl-commentable-paragraph" :data-comment-id="commentId">
    <p class="cainsgl-paragraph-content" v-html="text"></p>
    <div class="cainsgl-comment-actions" v-if="showComment">
        评论
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';
import { Button, Textarea } from '@arco-design/web-vue';
import { IconMessage } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  commentId: {
    type: Number,
    required: true
  },
  showComment: {
    type: Boolean,
    default: false
  }
});

const showCommentPanel = ref(false);
const newComment = ref('');
const comments = ref([
  // 示例评论数据，实际应用中应从 API 获取
  {
    id: 1,
    author: '用户A',
    content: '这是一个很好的观点',
    time: '2024-01-01 10:00'
  }
]);

const toggleCommentPanel = () => {
  showCommentPanel.value = !showCommentPanel.value;
};

const submitComment = () => {
  if (newComment.value.trim()) {
    // 添加新评论的逻辑
    const comment = {
      id: comments.value.length + 1,
      author: '当前用户',
      content: newComment.value,
      time: new Date().toLocaleString()
    };
    comments.value.push(comment);
    newComment.value = '';
    showCommentPanel.value = false;
  }
};

const cancelComment = () => {
  newComment.value = '';
  showCommentPanel.value = false;
};
</script>

<style lang="less">
.cainsgl-commentable-paragraph {
  position: relative;
  margin: 16px 0;
  padding: 8px 0;
  
  &:hover {
    background-color: #f9fafb;
    border-radius: 4px;
    
    .cainsgl-comment-actions {
      opacity: 1;
    }
  }
  
  .cainsgl-paragraph-content {
    margin: 0;
    padding-right: 40px; // 为评论按钮留出空间
  }
  
  .cainsgl-comment-actions {
    position: absolute;
    right: 0;
    top: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
    
    .comment-btn {
      color: #94a3b8;
      &:hover {
        color: #64748b;
      }
    }
  }
  
  .comment-panel {
    margin-top: 12px;
    padding: 12px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    
    .comment-input-area {
      margin-bottom: 16px;
      
      .comment-actions {
        margin-top: 8px;
        text-align: right;
        
        .arco-btn {
          margin-left: 8px;
        }
      }
    }
    
    .comment-list {
      .comment-item {
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .comment-author {
          font-weight: 600;
          color: #334155;
          margin-bottom: 4px;
        }
        
        .comment-content {
          color: #475569;
          margin-bottom: 4px;
        }
        
        .comment-time {
          font-size: 0.8em;
          color: #94a3b8;
        }
      }
    }
  }
}
</style>