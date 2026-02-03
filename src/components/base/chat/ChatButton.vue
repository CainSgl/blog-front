<template>
  <a-button 
    :size="size" 
    :type="type"
    :loading="loading"
    @click="handleChat"
    style="border:none"
  >
    <template #icon v-if="showIcon">
      <icon-message />
    </template>
    {{ text }}
  </a-button>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { IconMessage } from '@arco-design/web-vue/es/icon';
import api from '@/api';

const props = defineProps({
  // 对方用户ID
  userId: {
    type: [String, Number],
    required: true
  },
  // 按钮文字
  text: {
    type: String,
    default: '私信'
  },
  // 按钮大小
  size: {
    type: String,
    default: 'large'
  },
  // 按钮类型
  type: {
    type: String,
    default: 'default'
  },
  // 是否显示图标
  showIcon: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const loading = ref(false);

const handleChat = async () => {
  if (!props.userId) {
    Message.warning('用户信息不存在');
    return;
  }

  loading.value = true;
  try {
    // 创建或获取会话
    const { data: session } = await api.post(`/chat/session?otherUserId=${props.userId}`);
    
    // 跳转到聊天页面，并传递会话ID
    router.push({
      path: '/messages/message',
      query: { sessionId: session.id }
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    if (error.code === '403') {
      Message.error('需要关注对方才能发起会话');
    } else {
      Message.error('创建会话失败，请稍后重试');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="less">

</style>
