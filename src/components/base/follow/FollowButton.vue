<template>
  <a-button v-if="userId" :type="isFollowing ? 'outline' : 'primary'" size="large" :loading="loading" @click="toggleFollow">
    {{ loading ? '' : (isFollowing ? '已关注' : '关注') }}
  </a-button>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue';
import {Modal} from '@arco-design/web-vue';
import {useUserStore} from '@/store/user.js';
import followCache from '../../../views/user/children/home/components/followCache.js';

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
const fetchFollowStatus = async () => 
{
  if (!props.userId) return;

  loading.value = true;
  try 
  {
    // 使用缓存获取关注状态
    const response = await followCache.getFollowStatus(props.userId);
    isFollowing.value = response;
  }
  catch (err) 
  {
    console.error('获取关注状态失败:', err);
    isFollowing.value = false;
  }
  finally 
  {
    loading.value = false;
  }
};

// 切换关注状态
const toggleFollow = async () => 
{
  if (!props.userId) return;
  loading.value = true;
  // 检查是否正在关注自己
  const currentUserInfo = await userStore.getUserInfo();
  if (currentUserInfo && currentUserInfo.id === props.userId) 
  {
    Modal.warning({
      title: '提示',
      content: '你时时刻刻都在关注自己哦',
      okText: '确定'
    });
    loading.value = false;
    return;
  }

  try 
  {
    if (isFollowing.value) 
    {
      // 取消关注
      await followCache.unfollow(props.userId);
     
      isFollowing.value = false;
      emit('followChanged', isFollowing.value);
    }
    else 
    {
      // 关注
      await followCache.follow(props.userId);
      isFollowing.value = true;
      emit('followChanged', isFollowing.value);
    }
  }
  catch (err) 
  {
    console.error('操作失败:', err);
  }
  finally 
  {
    loading.value = false;
  }
};

onMounted(() => 
{
  fetchFollowStatus();
});

// 监听 userId 变化，当 userId 改变时重新获取关注状态
watch(() => props.userId, (newUserId) => 
{
  if (newUserId) 
  {
    fetchFollowStatus();
  }
  else 
  {
    // 当 userId 为 null 或空时，重置状态
    isFollowing.value = false;
  }
});
</script>

<style scoped>
/* 关注按钮样式将继承父组件的样式 */
</style>