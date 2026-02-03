<template>
  <div class="cainsgl-share-file">
    <div class="share-file-card" @click="handleDownload">
      <div class="file-icon">
        <icon-file :size="32" />
      </div>
      <div class="file-info">
        <div class="file-title">{{ displayTitle }}</div>
        <div class="file-meta">
          <span class="file-id">ID: {{ fileId }}</span>
        </div>
      </div>
      <div class="download-icon">
        <icon-download :size="20" />
      </div>
    </div>

    <!-- 下载确认弹窗 -->
    <a-modal
      v-model:visible="showConfirmModal"
      :title="modalTitle"
      :ok-text="modalOkText"
      cancel-text="取消"
      @ok="handleConfirmDownload"
      @cancel="handleCancelDownload"
    >
      <div class="modal-content">
        <p>{{ modalMessage }}</p>
        <div v-if="fileSize" class="file-size-info">
          <icon-info-circle />
          <span>文件大小：{{ formatFileSize(fileSize) }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { IconFile, IconDownload, IconInfoCircle } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import { API_BASE_URL } from '@/config';
import { useAuthStore } from '@/store/auth';
import api from '@/api/index.js';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});

const authStore = useAuthStore();
const showConfirmModal = ref(false);
const fileSize = ref(null);
const modalTitle = ref('');
const modalMessage = ref('');
const modalOkText = ref('');
const needLogin = ref(false);

// 解析 fileId，格式可能是 "id 自定义描述"
const parsedData = computed(() => {
  const parts = props.fileId.trim().split(/\s+/);
  return {
    id: parts[0] || '',
    customDesc: parts.slice(1).join(' ') || props.description
  };
});

const displayTitle = computed(() => {
  return parsedData.value.customDesc || `文件 ${parsedData.value.id}`;
});

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '未知';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// 获取文件信息
const getFileInfo = async () => {
  try {
    const response = await api.get(`/file/info?f=${parsedData.value.id}`);
    return response.data;
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return null;
  }
};

// 处理下载点击
const handleDownload = async () => {
  try {
    // 获取文件信息
    const fileInfo = await getFileInfo();
    
    if (fileInfo && fileInfo.size) {
      fileSize.value = fileInfo.size;
      
      const fileSizeInMB = fileInfo.size / (1024 * 1024);
      const isLoggedIn = authStore.checkLogin();
      
      // 文件大于 5MB 且用户未登录
      if (fileSizeInMB > 5 && !isLoggedIn) {
        needLogin.value = true;
        modalTitle.value = '需要登录';
        modalMessage.value = '该文件大于 5MB，需要登录才能下载。是否前往登录？';
        modalOkText.value = '去登录';
        showConfirmModal.value = true;
        return;
      }
    }
    
    // 正常下载确认
    needLogin.value = false;
    modalTitle.value = '确认下载';
    modalMessage.value = `确认要下载文件"${displayTitle.value}"吗？`;
    modalOkText.value = '确认下载';
    showConfirmModal.value = true;
    
  } catch (error) {
    console.error('处理下载失败:', error);
    Message.error('获取文件信息失败，请稍后重试');
  }
};

// 确认下载
const handleConfirmDownload = () => {
  if (needLogin.value) {
    // 打开登录弹窗
    authStore.openLogin();
    showConfirmModal.value = false;
  } else {
    // 执行下载
    const fileUrl = `${API_BASE_URL}/file?f=${parsedData.value.id}`;
    window.open(fileUrl, '_blank');
    showConfirmModal.value = false;
  }
};

// 取消下载
const handleCancelDownload = () => {
  showConfirmModal.value = false;
  fileSize.value = null;
  needLogin.value = false;
};
</script>

<style lang="less" scoped>
.cainsgl-share-file {
  margin: 16px 0;

  .share-file-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: @color-fill-1;
    border: 1px solid @color-border-2;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: @color-fill-2;
      border-color: @primary-5;
      box-shadow: @shadow2-center;
    }

    .file-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background-color: @primary-1;
      border-radius: 8px;
      color: @primary-6;
      margin-right: 16px;
    }

    .file-info {
      flex: 1;
      min-width: 0;

      .file-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--color-neutral-10);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-meta {
        font-size: 12px;
        color: var(--color-neutral-6);

        .file-id {
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        }
      }
    }

    .download-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: @primary-6;
      margin-left: 12px;
    }
  }

  .modal-content {
    p {
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--color-neutral-8);
    }

    .file-size-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: @color-fill-2;
      border-radius: 4px;
      font-size: 13px;
      color: var(--color-neutral-6);
    }
  }
}
</style>
