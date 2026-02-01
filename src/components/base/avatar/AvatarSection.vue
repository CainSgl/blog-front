<template>
  <div class="user-avatar-wrapper">
    <Avatar :size="120" class="user-avatar" :trigger-type="trigger" @click="handleAvatarClick"
      :src="props.userInfo?.avatarUrl">
      <template #trigger-icon v-if="trigger">
        <IconEdit :size="40" />
      </template>
    </Avatar>

    <!-- 图片裁剪模态框 -->
    <ImageCropperModal ref="imageCropperRef" v-model="cropperModalVisible" :aspect-ratio="1" :auto="false"
      :edit-file-name="false" @confirm="handleCroppedImage" />
  </div>
</template>

<script setup>
import {IconEdit} from '@arco-design/web-vue/es/icon';
import Avatar from '@/components/base/avatar/Avatar.vue';
import {useUserStore} from '@/store/user.js';
import {nextTick, onMounted, ref, watch} from 'vue';
import ImageCropperModal from '@/components/base/image/ImageCropperModal.vue';
import api from '@/api/index.js';
import {Message} from '@arco-design/web-vue';
import {getDateNow} from '@/utils/DateFormatter.js';

const props = defineProps({
  userInfo: {
    type: Object,
    default: null
  },
});
const emit = defineEmits(['update'])

const currentUserInfo = ref(false);
const cropperModalVisible = ref(false);
const imageCropperRef = ref(null);
const userStore = useUserStore();
const trigger = ref(null);

onMounted(async () => 
{
  currentUserInfo.value = await userStore.getUserInfo();
});

// 监听 props.userInfo 和 currentUserInfo 的变化，更新 trigger 值
watch([() => props.userInfo, currentUserInfo], ([newUserInfo, currentUser]) => 
{
  trigger.value = currentUser && newUserInfo?.id === currentUser.id ? 'mask' : null;
}, { immediate: true });

// 处理头像点击事件
const handleAvatarClick = () => 
{
  trigger.value=currentUserInfo.value.id==props.userInfo?.id ? 'mask' : null;
  console.log('props.userInfo:', props.userInfo);
  if (currentUserInfo.value.id==props.userInfo?.id) 
  {
    // 触发文件选择
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => 
    {
      const file = e.target.files[0];
      if (!file) return;
      // 创建图片对象用于裁剪组件
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => 
      {
        // 显示裁剪模态框
        cropperModalVisible.value = true;

        // 等待模态框打开后设置图片
        await nextTick();
        setTimeout(() => 
        {
          if (imageCropperRef.value) 
          {
            imageCropperRef.value.setImage(img);
          }
        }, 100);
      };
    };
    input.click();
  }
};

// 处理裁剪后的图片
const handleCroppedImage = async (croppedFile) => 
{
  try 
  {
    Message.loading({
      id: 'upload-avatar',
      content: '头像上传中...',
      duration: 15000,
    });

    // 生成新的文件名：用户ID_时间戳.原扩展名
    const fileExtension = croppedFile.name.split('.').pop() || 'jpg';
    const newFileName = `${userStore.userInfo?.id || 'user'}的头像图片_${getDateNow()}.${fileExtension}`;
    const renamedFile = new File([croppedFile], newFileName, { type: croppedFile.type });

    // 创建FormData对象 
    const formData = new FormData();
    formData.append('file', renamedFile);
    api.get('/file/free', { f: props.userInfo?.avatarUrl });
    // 使用api上传文件 
    const { data } = await api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // 更新用户头像
    const avatarUrl = data.shortUrl;
    await userStore.updateUserInfo({ avatarUrl });
    
    // 触发更新事件
    emit('update', avatarUrl);
    
    Message.success({
      id: 'upload-avatar',
      content: '头像更新成功',
      duration: 1000,
    });
  }
  catch (error) 
  {
    console.error('头像上传失败:', error);
    Message.error({
      id: 'upload-avatar',
      content: '头像上传失败，请稍后重试',
      duration: 1000,
    });
  }
  finally 
  {
    cropperModalVisible.value = false;
  }
};


</script>

<style lang="less" scoped>


.user-avatar-wrapper {
  margin-bottom: @size-4;
}
</style>