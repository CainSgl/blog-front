<template>
  <div class="cainsgl-commentable-paragraph" :class="{ 'no-comments': commentCount < 1 }" :data-comment-id="commentId"
    ref="paragraphRef">
    <span v-html="text" class="paragraph-text"></span>
    <!-- 文字选中后的评论按钮 -->
    <div v-if="showCommentButton && commentCount < 1" class="comment-button"
      :style="{ top: buttonPosition.top + 'px', left: buttonPosition.left + 'px' }" @click="handleCommentParClick">
      <icon-message :size="20" />
      <span class="comment-text">评论</span>
    </div>
    <!-- 已存在的评论徽章 -->
    <div class="comment-badge" @click="handleCommentClick" v-if="commentCount > 0">
      <span class="comment-count">{{ commentCount > 99 ? '99+' : commentCount }}</span>
    </div>

    <!-- 评论模态框 -->
    <a-modal v-if="commentCount < 1 && commentModalVisible" v-model:visible="commentModalVisible" title="评论"
      @ok="submitComment" @cancel="commentModalVisible = false" ok-text="提交" cancel-text="取消" :mask-closable="true">
      <a-textarea v-model="commentContent" placeholder="请输入您的评论..." :auto-size="{ minRows: 4, maxRows: 8 }"
        :maxlength="255" show-word-limit />
    </a-modal>
  </div>
</template>

<script setup>
import { defineProps, computed, ref, onMounted, onUnmounted } from 'vue';
import { useCommentStore } from '@/components/comment/commentStore.js';
import { IconMessage } from '@arco-design/web-vue/es/icon'
import { Modal } from '@arco-design/web-vue';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user.js';
import api from '@/api/index.js';
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  commentId: {
    type: Number,
    required: true
  }
});

const commentStore = useCommentStore();
const paragraphRef = ref(null);
const showCommentButton = ref(false);
const buttonPosition = ref({ top: 0, left: 0 });
const commentModalVisible = ref(false);
const commentContent = ref('');

// 计算评论数量
const commentCount = computed(() => {
  return commentStore.getCommentCountById(props.commentId);
});

// 处理评论点击事件
const handleCommentClick = () => {
 commentStore.toggleCommentDrawer(props.commentId);
};
const handleCommentParClick = () => {
  commentModalVisible.value = true;
};
// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    Message.warning('请输入评论内容');
    return;
  }
  if (!props.commentId) {
    Message.error('发生了未知的错误，请尝试刷新页面！');
    return;
  }
  commentModalVisible.value=false;
  await api.post('/paragraph/comment', { postId: commentStore.postId, version: commentStore.version, dataId: props.commentId, content: commentContent.value })
  // 成功发布评论后，更新评论计数
  commentStore.incrementCommentCount(props.commentId);
  Message.success('成功发布评论');
};

// 检查文本是否被选中
const checkSelection = () => {
  const selection = window.getSelection();
  if (!selection.toString().trim()) {
    showCommentButton.value = false;
    return;
  }

  try {
    // 检查选中的文本是否在当前段落内
    const selectedRange = selection.getRangeAt(0);
    const parentElement = selectedRange.commonAncestorContainer;

    // 查找最近的祖先元素
    let currentElement = parentElement.nodeType === Node.ELEMENT_NODE ? parentElement : parentElement.parentElement;
    while (currentElement && currentElement !== paragraphRef.value) {
      currentElement = currentElement.parentElement;
    }

    if (currentElement === paragraphRef.value) {
      // 获取选中区域的位置
      const rect = selectedRange.getBoundingClientRect();
      const paragraphRect = paragraphRef.value.getBoundingClientRect();

      // 将相对于视口的坐标转换为相对于段落元素的坐标
      buttonPosition.value = {
        top: rect.top - paragraphRect.top - 40, // 在选中区域上方显示按钮
        left: rect.left - paragraphRect.left + (rect.width / 2) - 30 // 水平居中于选中区域
      };

      showCommentButton.value = true;
    } else {
      showCommentButton.value = false;
    }
  } catch (error) {
    // 如果获取选择区域失败，隐藏按钮
    showCommentButton.value = false;
  }
};



// 监听鼠标释放事件
const handleMouseUp = () => {
  setTimeout(() => { // 使用setTimeout确保在选择完成后获取到选中内容
    checkSelection();
  }, 1);
};

// 监听点击其他地方的事件
const handleClickOutside = (event) => {
  if (paragraphRef.value && !paragraphRef.value.contains(event.target) &&
    !event.target.classList.contains('comment-button')) {
    showCommentButton.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="less">
.cainsgl-commentable-paragraph {
  position: relative;
  display: inline-block;
}

.paragraph-text {
  user-select: text; // 确保文本可以选择
}

.no-comments {
  &:hover {
    background-color: rgba(128, 128, 128, 0.048);
  }
}

.comment-button {
  position: absolute;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: @primary-4;
  color: white;
  border-radius: 18px;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
  transition: all 0.2s ease;
}

.comment-icon {
  margin-right: 4px;
  font-size: 14px;
}

.comment-text {
  font-size: 12px;
  font-weight: 500;
}

.comment-badge {
  margin-left: 6px;
  user-select: none;
  cursor: pointer;
  display: inline-block;
  width: 18px;
  height: 18px;
  padding: 2px;
  background-color: #E5E6EB;
  color: #86909C;
  border-radius: 50%;
  font-size: 12px;
  text-align: center;
}

.comment-count {
  display: block;
  width: 100%;
}
</style>