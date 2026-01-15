<template>
    <div class="comment-input-wrapper">
        <Avatar :src="currentUserInfo.avatarUrl" :size="48" v-if="showSelf" />
        <a-textarea v-model="content" :placeholder="placeholder" :maxlength="{ length: 255, errorOnly: true }"
            :auto-size="{ minRows: 2, maxRows: 4 }" @keydown.enter="handleEnterKey" show-word-limit allow-clear
            ref="commentInputRef" />
        <div>
            <a-button type="primary" @click="handleAddComment" :disabled="!content.trim()" class="submit-btn"
                :loading="submitting">
                发送
            </a-button>
            <div class="comment-count" style="margin-top:10px" v-if="version">当前版本：{{ version }}</div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user.js';
import Avatar from '@/components/user/base/Avatar.vue';

const userStore = useUserStore();
// 定义组件属性
const props = defineProps({
  version: {
    type: Number,
    default: null
  },
  onSubmitComment: {
    type: Function,
    required: true
  },
  placeholder: {
    type: String,
    default: '评论一下吧！'
  },
  showSelf: {
    type: Boolean,
    default: true
  },
  autoFocus: {
    type: Boolean,
    default: true
  }
});
const commentInputRef = ref(null);
// 暴露聚焦方法给父组件
defineExpose({
  focus: () => 
  {
    nextTick(() => 
    {
      if (!autoFocus.value) 
      {
        console.error('该组件autoFocus为false，禁止聚焦');
        return;
      }
      if (commentInputRef.value) 
      {
        commentInputRef.value.focus();
      }
    });
  }
});



// 评论输入相关
const content = ref('');
const submitting = ref(false);
const currentUserInfo = ref({});

// 处理回车键
const handleEnterKey = (event) => 
{
  // 只有在按下 Ctrl+Enter 或 Alt+Enter 时才提交评论
  if (event.ctrlKey || event.altKey || event.metaKey) 
  {
    event.preventDefault(); // 阻止默认换行行为
    handleAddComment();
  }
  // 如果只按 Enter 键，则允许换行（默认行为）
};

// 处理添加评论
const handleAddComment = async () => 
{
  if (!content.value.trim()) 
  {
    Message.warning('请输入评论内容');
    return;
  }
  if (submitting.value) 
  {
    return;
  }
  submitting.value = true;
  try 
  {
    // 调用父组件传递的函数执行添加评论操作
    await props.onSubmitComment(content.value);
    // 清空输入框
    content.value = '';
  }
  finally 
  {
    submitting.value = false;
  }
};

onMounted(async () => 
{
  const info = await userStore.getUserInfo();
  currentUserInfo.value = info;
  if (autoFocus.value) 
  {
    commentInputRef.value.focus();
    return;
  }

});
</script>

<style scoped lang="less">
.comment-input-wrapper {
    display: flex;
    gap: 8px;
    padding: 12px;
    background-color: white;
    position: sticky;
    bottom: 0;
    z-index: 10;

    :deep(.arco-input-wrapper),
    :deep(.arco-textarea-wrapper) {
        border-radius: 5px !important;
        flex: 1;
        align-self: center;
    }
}

.comment-count {
    font-size: 13px;
    font-weight: 400;
    color: @color-text-4;
}
</style>