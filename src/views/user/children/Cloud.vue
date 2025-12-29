<template>
  <div class="user-cloud">
    <a-page-header 
      title="云存储" 
      subtitle="管理您的云端文件"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button>
            <template #icon>
              <icon-export />
            </template>
            导出
          </a-button>
          <a-button type="primary">
            <template #icon>
              <icon-upload />
            </template>
            上传文件
          </a-button>
        </a-space>
      </template>
    </a-page-header>
    
    <div class="storage-overview" style="margin-top: 20px;">
      <a-card :bordered="false">
        <a-space direction="vertical" style="width: 100%;">
          <a-typography-title :heading="6">存储使用情况</a-typography-title>
          <a-progress 
            :percent="usedPercent" 
            :size="'large'" 
            :animation="true"
            :color="'var(--color-primary-light-4)'"
          >
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
            <a-radio-group 
              v-model="viewMode" 
              type="button"
              @change="handleViewModeChange"
            >
              <a-radio value="list">列表</a-radio>
              <a-radio value="grid">网格</a-radio>
            </a-radio-group>
          </a-col>
        </a-row>
        
        <a-table 
          v-if="viewMode === 'list'"
          :columns="columns" 
          :data="files" 
          :pagination="false"
          @cell-click="handleRowClick"
        >
          <template #file-icon="{ record }">
            <a-avatar :size="32" shape="square">
              <icon-file v-if="record.type === 'doc'" />
              <icon-file-text v-else-if="record.type === 'md'" />
              <icon-file-image v-else-if="record.type === 'image'" />
              <icon-file-pdf v-else-if="record.type === 'pdf'" />
              <icon-drive-file v-else />
            </a-avatar>
          </template>
          <template #name="{ record }">
            <a-typography-text 
              :ellipsis="{ 
                rows: 1, 
                tooltip: { 
                  content: record.name 
                } 
              }"
            >
              {{ record.name }}
            </a-typography-text>
          </template>
          <template #size="{ record }">
            {{ formatFileSize(record.size) }}
          </template>
          <template #updatedAt="{ record }">
            {{ formatDate(record.updatedAt) }}
          </template>
          <template #actions="{ record }">
            <a-space>
              <a-button size="small" @click="handlePreview(record)">预览</a-button>
              <a-button size="small" @click="handleDownload(record)">下载</a-button>
              <a-dropdown trigger="click">
                <a-button size="small" type="text">
                  <icon-more />
                </a-button>
                <template #content>
                  <a-doption @click="handleShare(record)">分享</a-doption>
                  <a-doption @click="handleRename(record)">重命名</a-doption>
                  <a-doption @click="handleDelete(record)" style="color: var(--color-danger)">删除</a-doption>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </a-table>
        
        <div v-else class="grid-view">
          <a-grid :cols="8" :col-gap="12" :row-gap="12">
            <a-grid-item 
              v-for="file in files" 
              :key="file.id"
              @click="handleFileClick(file)"
            >
              <a-card 
                hoverable 
                class="file-card"
                :style="{ textAlign: 'center', cursor: 'pointer' }"
              >
                <div style="margin: 12px;">
                  <a-avatar :size="48" shape="square" style="margin-bottom: 8px;">
                    <icon-file v-if="file.type === 'doc'" />
                    <icon-file-text v-else-if="file.type === 'md'" />
                    <icon-file-image v-else-if="file.type === 'image'" />
                    <icon-file-pdf v-else-if="file.type === 'pdf'" />
                    <icon-drive-file v-else />
                  </a-avatar>
                  <a-typography-paragraph 
                    :ellipsis="{ 
                      rows: 2 
                    }"
                    style="margin: 0; font-size: 12px;"
                  >
                    {{ file.name }}
                  </a-typography-paragraph>
                  <div style="font-size: 12px; color: var(--color-text-3); margin-top: 4px;">
                    {{ formatFileSize(file.size) }}
                  </div>
                </div>
              </a-card>
            </a-grid-item>
          </a-grid>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  IconUpload, 
  IconExport, 
  IconFile, 

  IconFileImage, 
  IconFilePdf,
  IconDriveFile,
  IconMore,
} from '@arco-design/web-vue/es/icon';

const viewMode = ref('list'); // 'list' or 'grid'

const files = ref([
  {
    id: 1,
    name: '项目计划书.docx',
    type: 'doc',
    size: 1048576,
    updatedAt: '2025-12-28T10:30:00',
    owner: '当前用户'
  },
  {
    id: 2,
    name: '年度总结.pdf',
    type: 'pdf',
    size: 2097152,
    updatedAt: '2025-12-27T15:45:00',
    owner: '当前用户'
  },
  {
    id: 3,
    name: '产品设计图.png',
    type: 'image',
    size: 5242880,
    updatedAt: '2025-12-26T09:20:00',
    owner: '当前用户'
  },
  {
    id: 4,
    name: '技术文档.md',
    type: 'md',
    size: 102400,
    updatedAt: '2025-12-25T14:10:00',
    owner: '当前用户'
  },
  {
    id: 5,
    name: '会议记录.docx',
    type: 'doc',
    size: 51200,
    updatedAt: '2025-12-24T11:30:00',
    owner: '当前用户'
  },
  {
    id: 6,
    name: '数据报告.xlsx',
    type: 'doc',
    size: 1048576,
    updatedAt: '2025-12-23T16:20:00',
    owner: '当前用户'
  }
]);

const totalStorage = ref('10 GB');
const usedStorage = ref('4.2 GB');

const usedPercent = computed(() => {
  // 计算使用百分比，这里简化处理
  return 42; // 4.2GB / 10GB = 42%
});

const availableStorage = computed(() => {
  return (10 - 4.2).toFixed(1) + ' GB';
});

const columns = ref([
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
    title: '修改时间',
    dataIndex: 'updatedAt',
    slotName: 'updatedAt',
    width: 180
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 200
  }
]);

const handleBack = () => {
  console.log('返回');
};

const handleViewModeChange = (value) => {
  console.log('视图模式切换为:', value);
};

const handleRowClick = (record) => {
  console.log('点击文件:', record);
};

const handleFileClick = (file) => {
  console.log('点击文件卡片:', file);
};

const handlePreview = (record) => {
  console.log('预览文件:', record);
};

const handleDownload = (record) => {
  console.log('下载文件:', record);
};

const handleShare = (record) => {
  console.log('分享文件:', record);
};

const handleRename = (record) => {
  console.log('重命名文件:', record);
};

const handleDelete = (record) => {
  console.log('删除文件:', record);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
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
</style>