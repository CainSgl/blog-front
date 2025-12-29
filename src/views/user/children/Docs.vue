<template>
  <div class="user-docs">
    <a-page-header 
      title="我的文档" 
      subtitle="管理您的文档"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button>
            <template #icon>
              <icon-import />
            </template>
            导入
          </a-button>
          <a-button type="primary">
            <template #icon>
              <icon-plus />
            </template>
            新建文档
          </a-button>
        </a-space>
      </template>
    </a-page-header>
    
    <div class="content-area" style="margin-top: 20px;">
      <a-card :bordered="false">
        <a-tabs default-active-key="recent" type="rounded">
          <a-tab-pane key="recent" title="最近">
            <a-table 
              :columns="columns" 
              :data="recentDocs" 
              :pagination="false"
              @cell-click="handleRowClick"
            >
              <template #file-icon="{ record }">
                <a-avatar :size="32" shape="square">
                  <icon-file v-if="record.type === 'doc'" />
                  <icon-file-text v-else-if="record.type === 'md'" />
                  <icon-file-image v-else-if="record.type === 'image'" />
                  <icon-file-pdf v-else />
                </a-avatar>
              </template>
              <template #title="{ record }">
                <a-typography-text 
                  :ellipsis="{ 
                    rows: 1, 
                    tooltip: { 
                      content: record.title 
                    } 
                  }"
                >
                  {{ record.title }}
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
                  <a-button size="small" @click="handleEdit(record)">编辑</a-button>
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
          </a-tab-pane>
          <a-tab-pane key="all" title="全部">
            <a-table 
              :columns="columns" 
              :data="allDocs" 
              :pagination="{ 
                showTotal: true, 
                showJumper: true, 
                pageSize: 10 
              }"
              @cell-click="handleRowClick"
            >
              <template #file-icon="{ record }">
                <a-avatar :size="32" shape="square">
                  <icon-file v-if="record.type === 'doc'" />
                  <icon-file-text v-else-if="record.type === 'md'" />
                  <icon-file-image v-else-if="record.type === 'image'" />
                  <icon-file-pdf v-else />
                </a-avatar>
              </template>
              <template #title="{ record }">
                <a-typography-text 
                  :ellipsis="{ 
                    rows: 1, 
                    tooltip: { 
                      content: record.title 
                    } 
                  }"
                >
                  {{ record.title }}
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
                  <a-button size="small" @click="handleEdit(record)">编辑</a-button>
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
          </a-tab-pane>
          <a-tab-pane key="favorites" title="收藏">
            <a-result status="info" title="暂无收藏的文档" sub-title="您可以收藏喜欢的文档到这里">
              <template #extra>
                <a-button type="primary">去收藏</a-button>
              </template>
            </a-result>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  IconPlus, 
  IconImport, 
  IconFile, 
  IconFileImage, 
  IconFilePdf,
  IconMore,
  IconClose 
} from '@arco-design/web-vue/es/icon';

const recentDocs = ref([
  {
    id: 1,
    title: 'Vue3响应式系统详解.md',
    type: 'md',
    size: 102400,
    updatedAt: '2025-12-28T10:30:00',
    owner: '当前用户'
  },
  {
    id: 2,
    title: '前端性能优化指南.pdf',
    type: 'pdf',
    size: 2048000,
    updatedAt: '2025-12-27T15:45:00',
    owner: '当前用户'
  },
  {
    id: 3,
    title: 'JavaScript高级程序设计笔记.docx',
    type: 'doc',
    size: 512000,
    updatedAt: '2025-12-26T09:20:00',
    owner: '当前用户'
  },
  {
    id: 4,
    title: 'React最佳实践总结.md',
    type: 'md',
    size: 76800,
    updatedAt: '2025-12-25T14:10:00',
    owner: '当前用户'
  }
]);

const allDocs = ref([
  {
    id: 1,
    title: 'Vue3响应式系统详解.md',
    type: 'md',
    size: 102400,
    updatedAt: '2025-12-28T10:30:00',
    owner: '当前用户'
  },
  {
    id: 2,
    title: '前端性能优化指南.pdf',
    type: 'pdf',
    size: 2048000,
    updatedAt: '2025-12-27T15:45:00',
    owner: '当前用户'
  },
  {
    id: 3,
    title: 'JavaScript高级程序设计笔记.docx',
    type: 'doc',
    size: 512000,
    updatedAt: '2025-12-26T09:20:00',
    owner: '当前用户'
  },
  {
    id: 4,
    title: 'React最佳实践总结.md',
    type: 'md',
    size: 76800,
    updatedAt: '2025-12-25T14:10:00',
    owner: '当前用户'
  },
  {
    id: 5,
    title: 'CSS布局技巧汇总.docx',
    type: 'doc',
    size: 256000,
    updatedAt: '2025-12-24T11:30:00',
    owner: '当前用户'
  },
  {
    id: 6,
    title: 'Node.js开发指南.pdf',
    type: 'pdf',
    size: 3072000,
    updatedAt: '2025-12-23T16:20:00',
    owner: '当前用户'
  }
]);

const columns = ref([
  {
    title: '文件',
    dataIndex: 'file-icon',
    slotName: 'file-icon',
    width: 60
  },
  {
    title: '标题',
    dataIndex: 'title',
    slotName: 'title',
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

const handleRowClick = (record) => {
  console.log('点击文档:', record);
};

const handleEdit = (record) => {
  console.log('编辑文档:', record);
};

const handleDownload = (record) => {
  console.log('下载文档:', record);
};

const handleShare = (record) => {
  console.log('分享文档:', record);
};

const handleRename = (record) => {
  console.log('重命名文档:', record);
};

const handleDelete = (record) => {
  console.log('删除文档:', record);
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
.user-docs {
  .content-area {
    min-height: 400px;
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
</style>