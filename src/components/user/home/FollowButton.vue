<template>
  <a-button :type="isFollowing ? 'outline' : 'primary'" size="large" :loading="loading" @click="toggleFollow">
    {{ loading ? '' : (isFollowing ? '已关注' : '关注') }}
  </a-button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { defineProps, defineEmits } from 'vue';
import api from '@/api/index.js';
import { Modal } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user.js';

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

const userStore = useUserStore();

const isFollowing = ref(false);
const loading = ref(false);
const emit = defineEmits(['followChanged']);

// 获取关注状态
const fetchFollowStatus = async () => {
  if (!props.userId) return;

  loading.value = true;
  try {
    const response = await api.get('/follow', { id: props.userId });
    isFollowing.value = response.data;
  } catch (err) {
    console.error('获取关注状态失败:', err);
    isFollowing.value = false;
  } finally {
    loading.value = false;
  }
};

// 切换关注状态
const toggleFollow = async () => {
  if (!props.userId) return;
  loading.value = true;
  // 检查是否正在关注自己
  const currentUserInfo =await userStore.getUserInfo();
  if (currentUserInfo && currentUserInfo.id === props.userId) {
    Modal.warning({
      title: '提示',
      content: '你无法取消关注，因为关注自己是一件很重要的事情！',
      okText: '确定'
    });
    loading.value = false;
    return;
  }

  try {
    if (isFollowing.value) {
      // 取消关注
      await api.delete('/follow', { id: props.userId });
      isFollowing.value =false;
      emit('followChanged', isFollowing.value);
    } else {
      // 关注
      await api.post('/follow', { id: props.userId });
      isFollowing.value =true;
      emit('followChanged', isFollowing.value);
    }
  } catch (err) {
    console.error('操作失败:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFollowStatus();
});
</script>

<style scoped>
/* 关注按钮样式将继承父组件的样式 */
</style>