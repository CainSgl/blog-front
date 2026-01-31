<template>
  <a-card hoverable class="file-card" :style="{ textAlign: 'center', cursor: 'pointer' }" @click="handleFileClick">
    <div style="margin: 12px;">
      <a-avatar :size="48" shape="square" style="margin-bottom: 8px;">
        <icon-file-image v-if="isImageFile(file.name)" />
        <icon-file-pdf v-else-if="isPdfFile(file.name)" />

        <icon-drive-file v-else />
      </a-avatar>
      <a-typography-paragraph :ellipsis="{
        rows: 2
      }" style="margin: 0; font-size: 12px;">
        {{ file.name }}
      </a-typography-paragraph>
      <div class="file-info">
        <span v-if="file.fileSize">{{ formatFileSize(file.fileSize) }}</span>
        <span v-else>未知</span>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import {IconDriveFile, IconFileImage, IconFilePdf} from '@arco-design/web-vue/es/icon';

// 定义组件属性
const props = defineProps({
  file: {
    type: Object,
    required: true
  }
});

// 定义组件事件
const emit = defineEmits(['file-click']);

// 判断文件类型
const isImageFile = (fileName) => 
{
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return imageExtensions.includes(ext);
};

const isPdfFile = (fileName) => 
{
  return fileName.toLowerCase().endsWith('.pdf');
};

const isTextFile = (fileName) => 
{
  const textExtensions = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.vue'];
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return textExtensions.includes(ext);
};

const formatFileSize = (bytes) => 
{
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleFileClick = () => 
{
  emit('file-click', props.file);
};
</script>

<style lang="less" scoped>
.file-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px fade(#000, 10%);
  }
}

.file-info {
  font-size: @font-size-body-1;
  color: var(--color-neutral-6);
  margin-top: @size-1;
}

@media (max-width: 1380px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: @size-4;
  }
}
</style>