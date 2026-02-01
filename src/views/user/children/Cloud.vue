<template>
  <div style="padding:24px">
    <a-image-preview-group v-model:visible="previewVisible" v-model:current="previewCurrent" infinite
      :srcList="previewImageList" />
    <div class="user-cloud">
      <!-- 图片预览弹窗 -->
      <a-page-header title="云存储"
        :subtitle="userInfo ? `用户 ${userInfo ? userInfo.nickname || userInfo.username : userId} 的云存储` : ''"
        @back="handleBack">
        <template #extra>
        </template>
      </a-page-header>

      <div class="storage-overview" style="margin-top: 20px;">
        <a-card :bordered="false">
          <a-space direction="vertical" style="width: 100%;">
            <a-typography-title :heading="6">存储使用情况</a-typography-title>
            <a-progress :percent="usedPercent" :size="'large'" :animation="true">
              <template #text>
                <span>{{ usedStorage }} / {{ totalStorage }}</span>
              </template>
            </a-progress>
            <a-descriptions :column="3" size="large" style="margin-top: 20px;">
              <a-descriptions-item label="已使用">
                {{ usedStorage }}
              </a-descriptions-item>
              <a-descriptions-item label="总容量">
                {{ totalStorage }}
              </a-descriptions-item>
              <a-descriptions-item label="剩余">
                {{ availableStorage }}
              </a-descriptions-item>
            </a-descriptions>
          </a-space>
        </a-card>
      </div>

      <div class="file-manager" style="margin-top: 20px;">
        <a-card :bordered="false">
          <a-row style="margin-bottom: 16px;">
            <a-col :span="12">
              <a-breadcrumb>
                <a-breadcrumb-item>全部文件</a-breadcrumb-item>
                <a-breadcrumb-item>文档</a-breadcrumb-item>
              </a-breadcrumb>
            </a-col>
            <a-col :span="12" style="text-align: right;">
              <!-- 当有文件被选中时显示操作按钮 -->
              <div v-if="selectedRowKeys.length > 0" style="display: inline-block; margin-right: 16px;">
                <a-space>
                  <a-button type="primary" status="danger" @click="handleBatchDelete" size="small">
                    删除 ({{ selectedRowKeys.length }})
                  </a-button>
                </a-space>
              </div>
              <a-radio-group v-model="viewMode" type="button" @change="handleViewModeChange">
                <a-radio value="list">列表</a-radio>
                <a-radio value="grid">网格</a-radio>
              </a-radio-group>
            </a-col>
          </a-row>

          <div v-if="viewMode === 'list'" class="list-view">
            <a-table :row-selection="rowSelection" row-key="shortUrl" :columns="columns" :data="files"
              :pagination="false" @cell-click="handleRowClick" @select="handleTableSelect" @select-all="handleSelectAll"
              @selection-change="handleSelectionChange">
              <template #file-icon="{ record }">
                <a-avatar :size="32" shape="square">
                  <icon-file-image v-if="isImageFile(record.name)" />
                  <icon-file-pdf v-else-if="isPdfFile(record.name)" />
                  <icon-file v-else-if="isTextFile(record.name)" />
                  <icon-drive-file v-else />
                </a-avatar>
              </template>
              <template #name="{ record }">
                <a-typography-text :ellipsis="{
                  rows: 1,
                  tooltip: {
                    content: record.name
                  }
                }">
                  {{ record.name }}
                </a-typography-text>
              </template>
              <template #size="{ record }">
                <span v-if="record.fileSize">{{ formatFileSize(record.fileSize) }}</span>
                <span v-else>未知</span>
              </template>
              <template #updatedAt="{ record }">
                {{ formatDate(record.createdAt) }}
              </template>
              <template #actions="{ record }">
                <a-space>
                  <a-button size="small" @click.stop="handlePreview(record)">预览</a-button>
                  <!-- <a-button size="small" @click.stop="handleNewDownload(record)" :loading="record.download">下载</a-button> -->
                  <a-button size="small" @click.stop="handleDownload(record)" :loading="record.download">下载</a-button>
                </a-space>
              </template>
            </a-table>
          </div>

          <div v-else class="grid-view">
            <a-grid :cols="8" :col-gap="12" :row-gap="12">
              <a-grid-item v-for="file in files" :key="file.shortUrl">
                <FileCard :file="file" @file-click="handleFileClick" />
              </a-grid-item>
            </a-grid>
          </div>
        </a-card>
      </div>
    </div>
  </div>

</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useUserStore} from '@/store/user.js';
import {IconDriveFile, IconFile, IconFileImage, IconFilePdf,} from '@arco-design/web-vue/es/icon';
import {Message, Modal} from '@arco-design/web-vue';
import {showLoginModal} from '@/services/authService';
import FileCard from './components/FileCard.vue';
import api from '@/api/index.js';
import {API_BASE_URL} from '@/config';
import {formatDate} from '@/utils/DateFormatter.js';

const viewMode = ref('list');
const route = useRoute();
const userStore = useUserStore();
const userInfo = ref(null); // 用户信息
const files = ref([]);
const totalStorageBytes = ref(3 * 1024 * 1024 * 1024); // 3GB in bytes
const totalStorage = computed(() => formatBytes(totalStorageBytes.value));
const usedStorageBytes = ref(0); // 实际使用的字节数
const usedStorage = computed(() => formatBytes(usedStorageBytes.value)); // 格式化后的已用存储
const lastId = ref('0'); // 用于游标分页
const hasMore = ref(true); // 是否还有更多数据

// 初始化 userId，并监听路由变化
const userId = ref(route.params.id);


// 图片预览相关状态
const previewVisible = ref(false);
const previewCurrent = ref(0);
const previewImageList = computed(() => {
  // 只获取图片类型的文件，并处理其 URL
  return files.value
    .filter(file => isImageFile(file.name))
    .map(file => {
      // 处理图片 URL，类似 cImg 组件中的逻辑
      if (!file.shortUrl) {
        return '';
      }
      // 如果已经是完整的 URL，则直接返回
      if (file.shortUrl.startsWith('http')) {
        return file.shortUrl;
      }
      // 否则拼接 API_BASE_URL
      return `${API_BASE_URL}/file?f=${file.shortUrl}`;
    });
});


// 计算存储使用百分比
const usedPercent = computed(() => {
  if (!usedStorageBytes.value || !totalStorageBytes.value) return 0;
  return usedStorageBytes.value / totalStorageBytes.value;
});

const availableStorage = computed(() => {
  if (!usedStorageBytes.value || !totalStorageBytes.value) return '0 GB';
  const availableBytes = totalStorageBytes.value - usedStorageBytes.value;
  return formatBytes(Math.max(0, availableBytes)); // 确保不会显示负数
});



// 获取用户信息
const fetchUserInfo = async (id) => {
  try {
    userInfo.value = await userStore.getUserInfo(id)
    // 更新存储使用情况
    if ( userInfo.value.usedMemory !== undefined) {
      // 直接存储字节数
      usedStorageBytes.value = userInfo.value.usedMemory;
    }
  }
  catch (err) {
    console.error('获取用户信息失败:', err);
    throw err; // 重新抛出错误，以便上层处理
  }
};

// 获取文件列表
const fetchFileList = async () => {
  try {
    const params = {
      id: userId.value,
      lastId: lastId.value,
    };
    const { data } = await api.post('/file/list', params);
    const newFiles = data;
    if (newFiles.length > 0) {
      lastId.value = newFiles[newFiles.length - 1].shortUrl;
      hasMore.value = newFiles.length === 30;
    }
    else {
      hasMore.value = false;
    }
    files.value = [...files.value, ...newFiles];
  }
  catch (error) {
    console.error('获取文件列表失败:', error);
    throw error; // 重新抛出错误，以便上层处理
  }
};

// 将字节数转换为可读格式
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
const router = useRouter();
// 组件挂载时加载数据
onMounted(async () => {
  if (userId.value) {
    Message.loading({ id: 'cloudLoading', content: '加载数据中' });
    try {
      // 先获取用户信息以获得存储使用情况
      await fetchUserInfo(userId.value);
      // 然后获取文件列表
      await fetchFileList();
      Message.success({ id: 'cloudLoading', content: '加载成功' });
    }
    catch (error) {
      Message.error('数据加载失败: ' + error.message);
    }
  }
}
);

const handleBack = () => {
  router.push(`/space/${userId.value}`);
};
const handleViewModeChange = (value) => {

  //切换自己的选中状态
};

// 定义表格列
const columns = [
  {
    title: '文件',
    dataIndex: 'file-icon',
    slotName: 'file-icon',
    width: 60
  },
  {
    title: '名称',
    dataIndex: 'name',
    slotName: 'name',
    width: 300
  },
  {
    title: '大小',
    dataIndex: 'size',
    slotName: 'size',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'updatedAt',
    slotName: 'updatedAt',
    width: 180
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 200
  }
];


// 选中的行 key 数组
const selectedRowKeys = ref([]);

// 根据选中的行 keys 自动计算行选择配置
const rowSelection = computed(() => {
  if (selectedRowKeys.value.length === 0) {
    // 如果没有选中任何行，则返回 null（不显示选择框）
    return null;
  }
  else {
    // 返回选择配置
    return {
      type: 'checkbox',
      showCheckedAll: true,
      selectedRowKeys: selectedRowKeys.value,
    };
  }
});

// 处理表格选择事件
const handleTableSelect = (selectedRowKeys2) => {
  // 更新选中的行
  selectedRowKeys.value = selectedRowKeys2;
};

// 处理全选事件
const handleSelectAll = (checked) => {
  if (checked) {
    // 全选，将所有文件的 key 添加到 selectedRowKeys
    selectedRowKeys.value = files.value.map(file => file.shortUrl);
  }
  else {
    // 取消全选
    selectedRowKeys.value = [];
  }
};

// 处理选择变化事件
const handleSelectionChange = (newSelectedRowKeys) => {
  selectedRowKeys.value = newSelectedRowKeys;
};

// 处理行点击事件
const handleRowClick = (record) => {
  const isSelected = selectedRowKeys.value.includes(record.shortUrl);
  if (isSelected) {
    // 当前行已选中，取消选中
    selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== record.shortUrl);
  }
  else {
    // 当前行未选中，添加到选中列表
    selectedRowKeys.value = [...selectedRowKeys.value, record.shortUrl];
  }
};

// 处理预览事件
const handlePreview = (record) => {
  console.log('预览文件:', record);
  if (isImageFile(record.name)) {
    // 如果是图片文件，找到该图片在图片列表中的索引
    const imageIndex = files.value
      .filter(file => isImageFile(file.name))
      .findIndex(file => file.shortUrl === record.shortUrl);

    if (imageIndex !== -1) {
      // 设置当前预览的图片索引
      previewCurrent.value = imageIndex;
      // 打开预览弹窗
      previewVisible.value = true;
    }
  }
  else {
    Message.info('暂不支持该类型文件的预览');
  }
};

// 处理下载事件
const handleDownload = async (record) => {
  console.log('下载文件:', record);
  record.download = true;
  try {
    // 从用户store获取token
    const userStore = useUserStore();
    const token = userStore.getToken();
    if (!token) {
      // 未登录时提示用户并打开登录窗口
      Modal.warning({
        title: '未登录',
        content: '您需要先登录才能下载文件',
        okText: '去登录',
        cancelText: '取消',
        onOk: () => {
          showLoginModal();
        }
      });
      return;
    }

    Message.loading({ id: 'downloadLoading', content: '获取临时url中' });

    // 使用fetch API进行下载，这样可以携带认证头
    const response = await fetch(`${API_BASE_URL}/file/download?f=${encodeURIComponent(record.shortUrl)}`, {
      method: 'GET',
      headers: {
        'token': token,
      },
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    // 获取文件blob数据
    const blob = await response.blob();

    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = record.name || 'download'; // 使用文件名，如果没有则使用'download'
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
  catch (error) {
    console.error('下载失败:', error);
    Message.error({ id: 'downloadLoading', content: record.name + '，下载失败，因为' + error.message });
  }
  finally {
    record.download = false;
  }
};

// 处理分享事件
const handleShare = (record) => {
  console.log('分享文件:', record);
};

// 处理重命名事件
const handleRename = (record) => {
  console.log('重命名文件:', record);
};

// 处理删除事件
const handleDelete = (record) => {
  console.log('删除文件:', record);
  Modal.warning({
    title: '确认删除',
    content: `确定要删除文件 "${record.name}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const userStore = useUserStore();
        const token = userStore.getToken();
        if (!token) {
          showLoginModal();
          return;
        }

        Message.loading({ id: 'deleteLoading', content: '删除中...' });
        // 调用删除API
        await api.post('/file/delete', {
          fileIds: [record.shortUrl] // 单个文件删除
        }, {
          headers: {
            'token': token,
          }
        });

        Message.success({ id: 'deleteLoading', content: '删除成功' });
        // 从本地列表中移除已删除的文件
        files.value = files.value.filter(file => file.shortUrl !== record.shortUrl);
        // 重置选择状态
        selectedRowKeys.value = [];
      }
      catch (error) {
        console.error('删除失败:', error);
        Message.error({ id: 'deleteLoading', content: '删除失败: ' + error.message });
      }
    }
  });
};

// 处理批量删除事件
const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    Message.info('请先选择要删除的文件');
    return;
  }

  Modal.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个文件吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const userStore = useUserStore();
        const token = userStore.getToken();
        if (!token) {
          showLoginModal();
          return;
        }

        Message.loading({ id: 'batchDeleteLoading', content: '批量删除中...', duration: 30000 });
        // 调用批量删除API
        const { data } = await api.get('/file/batchFree', {
          f: selectedRowKeys.value // 传递选中的文件ID数组
        });
        Message.success({ id: 'batchDeleteLoading', content: '批量删除成功' });
        // 从本地列表中移除已删除的文件
        files.value = files.value.filter(file => !selectedRowKeys.value.includes(file.shortUrl));
        // 重置选择状态
        selectedRowKeys.value = [];
      }
      catch (error) {
        console.error('批量删除失败:', error);
        Message.error({ id: 'batchDeleteLoading', content: '批量删除失败: ' + error.message, duration: 800 });
      }
    }
  });
};

// 判断文件类型
const isImageFile = (fileName) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return imageExtensions.includes(ext);
};

const isPdfFile = (fileName) => {
  return fileName.toLowerCase().endsWith('.pdf');
};

const isTextFile = (fileName) => {
  const textExtensions = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.vue'];
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return textExtensions.includes(ext);
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};



const handleFileClick = (file) => {
  console.log('点击文件卡片:', file);
};

</script>

<style lang="less" scoped>
.user-cloud {
  .storage-overview {
    .arco-card {
      background: linear-gradient(135deg, var(--color-primary-light-1), var(--color-secondary-light-1));
    }
  }

  .file-manager {
    .grid-view {
      .file-card {
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .list-view {
      :deep(.arco-table) {
        .arco-table-td {
          cursor: pointer;

          &:hover {
            background-color: var(--color-fill-1);
          }
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .user-cloud {
    :deep(.arco-page-header) {
      .arco-page-header-title {
        font-size: 18px;
      }

      .arco-page-header-subtitle {
        font-size: 12px;
      }
    }

    .storage-overview {
      :deep(.arco-descriptions) {
        .arco-descriptions-item {
          padding: 8px 0;
        }
      }
    }

    .file-manager {
      :deep(.arco-row) {
        flex-direction: column;
        gap: 12px;

        .arco-col {
          width: 100% !important;
          text-align: left !important;
        }
      }

      :deep(.arco-radio-group) {
        width: 100%;
        display: flex;

        .arco-radio {
          flex: 1;
        }
      }

      .grid-view {
        :deep(.arco-grid) {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
        }
      }

      .list-view {
        overflow-x: auto;

        :deep(.arco-table) {
          min-width: 600px;

          .arco-table-th,
          .arco-table-td {
            padding: 8px;
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>