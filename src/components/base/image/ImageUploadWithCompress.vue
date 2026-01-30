<template>
  <div class="image-upload-with-compress">
    <a-upload
      :custom-request="handleUpload"
      :show-file-list="false"
      accept="image/*"
      :before-upload="beforeUpload"
    >
      <template #upload-button>
        <div class="upload-trigger">
          <icon-plus />
          <div class="upload-text">上传图片</div>
        </div>
      </template>
    </a-upload>

    <!-- 图片压缩弹窗 -->
    <ImageCompressor
      v-model="showCompressor"
      @confirm="handleCompressConfirm"
      ref="compressorRef"
    />

    <!-- 已上传的图片列表 -->
    <div class="image-list" v-if="imageList.length > 0">
      <div 
        v-for="(img, index) in imageList" 
        :key="index"
        class="image-item"
      >
        <img :src="img.url" alt="预览" />
        <div class="image-actions">
          <icon-delete @click="removeImage(index)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup >
import {ref} from 'vue';
import {Message} from '@arco-design/web-vue';
import {IconDelete, IconPlus} from '@arco-design/web-vue/es/icon';
import ImageCompressor from './ImageCompressor.vue';
import {compressImage} from '@/utils/imageCompressor.js';

const props = defineProps({
  // 是否自动压缩（不显示压缩弹窗）
  autoCompress: {
    type: Boolean,
    default: false
  },
  // 自动压缩的配置
  compressOptions: {
    type: Object,
    default: () => ({
      quality: 0.95,
      maxWidth: 1920,
      maxHeight: 1080
    })
  },
  // 最大文件大小（MB），超过此大小强制压缩
  maxSize: {
    type: Number,
    default: 5
  }
});

const emit = defineEmits(['upload', 'change']);

const showCompressor = ref(false);
const compressorRef = ref(null);
const currentFile = ref(null);
const imageList = ref([]);

// 上传前检查
const beforeUpload = (file) => 
{
  const isImage = file.type.startsWith('image/');
  if (!isImage) 
  {
    Message.error('只能上传图片文件');
    return false;
  }
  
  return true;
};

// 处理上传
const handleUpload = async (option) => 
{
  const { fileItem } = option;
  currentFile.value = fileItem.file;
  
  const fileSizeMB = fileItem.file.size / 1024 / 1024;
  
  // 判断是否需要压缩
  if (props.autoCompress || fileSizeMB > props.maxSize) 
  {
    // 自动压缩
    try 
    {
      Message.info('正在压缩图片...');
      const compressed = await compressImage(currentFile.value, props.compressOptions);
      await uploadFile(compressed);
    }
    catch (error) 
    {
      Message.error('图片压缩失败');
      console.error(error);
    }
  }
  else 
  {
    // 显示压缩弹窗让用户选择
    showCompressor.value = true;
    compressorRef.value?.setImage(currentFile.value);
  }
};

// 压缩确认
const handleCompressConfirm = async (compressedFile) => 
{
  await uploadFile(compressedFile);
};

// 上传文件（这里模拟上传，实际项目中替换为真实的上传逻辑）
const uploadFile = async (file) => 
{
  try 
  {
    // 创建预览 URL
    const url = URL.createObjectURL(file);
    
    // 添加到列表
    imageList.value.push({
      file,
      url,
      name: file.name,
      size: file.size
    });
    
    Message.success('上传成功');
    
    // 触发事件
    emit('upload', file);
    emit('change', imageList.value);
  }
  catch (error) 
  {
    Message.error('上传失败');
    console.error(error);
  }
};

// 删除图片
const removeImage = (index) => 
{
  const img = imageList.value[index];
  URL.revokeObjectURL(img.url);
  imageList.value.splice(index, 1);
  emit('change', imageList.value);
};

defineExpose({
  imageList
});
</script>

<style scoped lang="less">
@import '@/assets/style/global.less';

.image-upload-with-compress {
  width: 100%;
}

.upload-trigger {
  width: 100px;
  height: 100px;
  border: @border-1 dashed @color-border-2;
  border-radius: @border-radius-small;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: @primary-6;
    color: @primary-6;
  }
}

.upload-text {
  margin-top: @size-2;
  font-size: @font-size-body-3;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: @size-2;
  margin-top: @size-2;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: @border-radius-small;
  overflow: hidden;
  border: @border-1 solid @color-fill-3;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover .image-actions {
    opacity: 1;
  }
}

.image-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;

  svg {
    color: @color-bg-white;
    font-size: @size-5;
  }
}
</style>
