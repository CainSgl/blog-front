<template>
  <div class="cainsgl-commentable-paragraph" :class="{ 'no-comments': commentCount < 1 }" :data-comment-id="commentId"
    ref="paragraphRef"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchmove="handleTouchMove">
    <span v-html="text" class="paragraph-text"></span>
    <!-- 文字选中后的评论按钮（PC端） -->
    <div v-if="showCommentButton && commentCount < 1 && !isMobile" class="comment-button"
      :style="{ top: buttonPosition.top + 'px', left: buttonPosition.left + 'px' }" @click="handleCommentParClick">
      <icon-message :size="20" />
      <span class="comment-text">评论</span>
    </div>
    <!-- 移动端评论图标（无评论时） -->
    <div v-if="isMobile && commentCount < 1" class="mobile-comment-icon" @click="handleCommentParClick">
      <icon-message :size="16" />
    </div>
    <!-- 已存在的评论徽章 -->
    <div class="comment-badge" @click="handleCommentClick" v-if="commentCount > 0">
      <span class="comment-count">{{ commentCount > 99 ? '99+' : commentCount }}</span>
    </div>

    <!-- 评论模态框 -->
    <ModalWrapper v-if="commentCount < 1 && commentModalVisible" v-model:visible="commentModalVisible" title="评论"
      @ok="submitComment" @cancel="commentModalVisible = false" ok-text="提交" cancel-text="取消" :mask-closable="true"
      width="520px">
      <a-textarea v-model="commentContent" placeholder="请输入您的评论..." :auto-size="{ minRows: 4, maxRows: 8 }"
        :maxlength="255" show-word-limit />
    </ModalWrapper>
  </div>
</template>

<script setup>
import {computed, defineProps, onMounted, onUnmounted, ref, watch} from 'vue';
import {useCommentStore} from '@/components/comment/commentStore.js';
import {storeToRefs} from 'pinia';
import {IconMessage} from '@arco-design/web-vue/es/icon';
import {Message} from '@arco-design/web-vue';
import api from '@/api/index.js';
import ModalWrapper from '@/components/base/ModalWrapper.vue';

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
const { targetDataId, targetParVersion } = storeToRefs(commentStore);
const paragraphRef = ref(null);
const showCommentButton = ref(false);
const buttonPosition = ref({ top: 0, left: 0 });
const commentModalVisible = ref(false);
const commentContent = ref('');
const isMobile = ref(false);
const longPressTimer = ref(null);
const touchMoved = ref(false);

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
  commentModalVisible.value = false;
  const id = 'paragraph' + commentStore.postId + ":" + props.commentId
  Message.loading({ id: id, content: '发送评论中...' });
  await api.post('/comment/paragraph/comment', { postId: commentStore.postId, version: commentStore.version, dataId: props.commentId, content: commentContent.value });
  // 成功发布评论后，更新评论计数
  commentStore.incrementCommentCount(props.commentId);
  Message.success({ id: id, content: '成功发布评论' });
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
    }
    else {
      showCommentButton.value = false;
    }
  }
  catch (error) {
    // 如果获取选择区域失败，隐藏按钮
    showCommentButton.value = false;
  }
};



// 检测是否为移动设备
const detectMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth <= 768;
};

// 移动端长按事件处理
const handleTouchStart = (event) => {
  if (!isMobile.value || commentCount.value > 0) return;
  
  touchMoved.value = false;
  longPressTimer.value = setTimeout(() => {
    if (!touchMoved.value) {
      // 长按触发评论
      handleCommentParClick();
      // 震动反馈（如果设备支持）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, 500); // 500ms 长按
};

const handleTouchMove = () => {
  touchMoved.value = true;
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
  }
};

const handleTouchEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
  }
};

// 监听鼠标释放事件（仅PC端）
const handleMouseUp = () => {
  if (isMobile.value) return;
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

function updateWhenTargetDataIdUpdate(newTargetDataId) {
  //先匹配版本是否相吻合
  if (targetParVersion.value !== commentStore.version) {
    return;
  }
  if (newTargetDataId && newTargetDataId == props.commentId) {
    console.log('匹配成功！准备滚动到段落并打开抽屉');

    // 轮询等待 DOM 元素准备好
    const tryScroll = (retryCount = 0, maxRetries = 20) => {
      if (paragraphRef.value) {
        console.log('DOM 元素已准备好，开始滚动');
        const scrollContainer = document.querySelector('.cainsgl-markdown-preview');
        console.log(scrollContainer);
        if (scrollContainer) {
          // 获取段落相对于容器的位置
          const paragraphRect = paragraphRef.value.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const relativeTop = paragraphRect.top - containerRect.top + scrollContainer.scrollTop;

          // 滚动到段落位置，居中显示
          const scrollToPosition = relativeTop - (scrollContainer.clientHeight / 2) + (paragraphRect.height / 2);
          scrollContainer.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
          });
        }

        // 延迟打开抽屉，等待滚动完成
        setTimeout(() => {
          commentStore.toggleCommentDrawer(props.commentId);
          // 清空 targetDataId，避免重复触发
          targetDataId.value = null;
        }, 500);
      } else if (retryCount < maxRetries) {
        console.log(`DOM 元素未准备好，100ms 后重试 (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => tryScroll(retryCount + 1, maxRetries), 100);
      } else {
        console.error('等待 DOM 元素超时，无法滚动到目标段落');
        // 清空 targetDataId，避免卡住
        targetDataId.value = null;
      }
    };

    tryScroll();
  }
}



watch(targetDataId, (newTargetDataId) => {
  updateWhenTargetDataIdUpdate(newTargetDataId);
}, { immediate: true });

onMounted(() => {
  detectMobile();
  window.addEventListener('resize', detectMobile);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('resize', detectMobile);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('click', handleClickOutside);
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
  }
});
</script>

<style scoped>
.cainsgl-commentable-paragraph {
  position: relative;
}

.paragraph-text {
  user-select: text;

}

.no-comments:hover {
  background-color: var(--color-fill-1);
}

.comment-button {
  z-index: 10000;
  position: absolute;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: rgb(var(--primary-4));
  color: var(--color-white);
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--color-shadow-light);
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
  background-color: var(--color-fill-2);
  color: var(--color-neutral-10);
  border-radius: 50%;
  font-size: 12px;
  text-align: center;
  transition: all 0.2s ease;
}

.comment-badge:hover {
  background-color: var(--color-fill-3);
  color: var(--color-neutral-10);
}

.comment-count {
  display: block;
  width: 100%;
}

.mobile-comment-icon {
  display: inline-block;
  margin-left: 6px;
  padding: 4px;
  color: var(--color-text-3);
  cursor: pointer;
  vertical-align: middle;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.mobile-comment-icon:active {
  background-color: var(--color-fill-2);
  color: rgb(var(--primary-6));
}

/* 移动端优化 */
@media (max-width: 768px) {
  .no-comments:hover {
    background-color: transparent;
  }
  
  .paragraph-text {
    user-select: text;
    -webkit-user-select: text;
  }
}
</style>