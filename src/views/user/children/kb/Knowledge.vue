<template>
  <div class="user-knowledge">
    <UserPageHeader :userId="userId" title="知识库" subtitle="知识库" searchPlaceholder="搜索知识库..." searchWidth="300px"
      :sortOptions="sortOptions" apiUrl="/kb/list" @sort-change="handleSortChangeFromHeader"
      @search="handleSearchFromHeader" @back="handleBack" />

    <!-- 为当前用户添加状态选择ContentArea -->
    <div v-if="isCurrentUser" class="status-filter-area">
      <div class="status-filter-container">

        <a-radio-group v-model="kbStatus" type="button" @change="handleStatusChange">
          <a-radio value="">全部</a-radio>
          <a-radio value="草稿">私密</a-radio>
          <a-radio value="已发布">公开</a-radio>
          <a-radio value="待审核">审核中</a-radio>
          <a-radio value="已下架">已下架</a-radio>
        </a-radio-group>
      </div>
    </div>

    <ContentArea :loading="loading" :list-data="knowledgeBases" :card-width="cardWidth"
      :card-height="cardHeight" @page-size-change="handlePageSizeChange">
      <template #default>
        <div class="kb-list">
          <a-dropdown alignPoint v-for="kb in knowledgeBases" :key="kb.id"
            :trigger="isCurrentUser ? 'contextMenu' : []">
            <KbCard :kb-info="loading ? {} : kb" :showStatus="kbStatus == ''" />
            <template #content>
              <a-doption>
                <a-link :href="`/kb?kb=${kb.id}`" :hoverable="false" target="_ablank">
                  <template #icon><icon-home /></template>
                  前往知识库主页
                </a-link>
              </a-doption>
              <a-doption v-if="isCurrentUser" @click="handleChangeKb(kb.id)">
                <template #icon><icon-settings /></template>
                更新信息
              </a-doption>
              <a-doption v-if="isCurrentUser" @click="handleDeleteKb(kb.id)">
                <template #icon><icon-delete /></template>
                删除该知识库
              </a-doption>
            </template>
          </a-dropdown>
          <div v-if="isCurrentUser" class="create-kb-card">
            <a-popconfirm content="创建公开知识库还是私密知识库？（后续可修改）" okText="公开" cancelText="私密" @ok="handleCreateKb(true)"
              @cancel="handleCreateKb(false)">
              <a-card class="kb-card-container" :bordered="false" :body-style="{ padding: 0 }">
                <div class="kb-cover-empty">
                  <div class="create-icon">
                    <IconPlus />
                  </div>
                  <div class="create-text">创建知识库</div>
                </div>
              </a-card>
            </a-popconfirm>
          </div>
        </div>
      </template>
      <template #empty>
        <a-empty style="padding: 40px 0;" v-if="!isCurrentUser" description="该用户未上传任何知识库" />
      </template>
    </ContentArea>
    <div class="pagination-wrapper" v-if="knowledgeBases.length > 0">
      <a-pagination size="large" :total="total" :current="currentPage" :page-size="pageSize" show-total show-jumper
        @change="handlePageChange" />
    </div>

    <!-- 编辑知识库弹窗 -->
    <ModalWrapper v-model:visible="editModalVisible" title="编辑知识库" @ok="handleUpdateKb" @cancel="handleCancelEdit"
      :ok-loading="updateLoading" ok-text="保存" cancel-text="取消" width="600px">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="知识库名称" required>
          <a-input v-model="editForm.name" placeholder="请输入知识库名称" :max-length="50" show-word-limit />
        </a-form-item>

        <a-form-item label="公开设置">
          <a-switch v-model="editForm.publish" checked-text="公开" unchecked-text="私密" />
        </a-form-item>

        <a-form-item label="封面">
          <div>
            <div v-if="editForm.coverUrl"
              style="display: flex;align-items: center;justify-content: center;margin-top:20px;">
              <CImg :src="editForm.coverUrl" alt="封面预览" style="width: 180px;" />
            </div>
            <div style="display: flex;align-items: center;justify-content: center;margin-top:20px">
              <Upload :custom-request="customRequest" :show-file-list="false" :multiple="false" accept="image/*"
                @progress="uploadingImage = true">
                <a-button type="dashed" :loading="uploadingImage" style="margin-top: 12px;">
                  <template #icon>
                    <IconPlus />
                  </template>
                  {{ editForm.coverUrl ? '修改封面' : '上传封面' }}
                </a-button>
              </Upload>
            </div>
          </div>


        </a-form-item>
      </a-form>
    </ModalWrapper>

    <!-- 图片裁剪模态框 -->
    <ImageCropperModal ref="imageCropperRef" v-model="cropperModalVisible" :aspect-ratio="1"
      @confirm="handleCroppedImage" />

    <!-- 删除知识库确认弹窗 -->
    <ModalWrapper v-model:visible="deleteModalVisible" :title="`是否删除 ${deleteKbInfo.name}？`" @cancel="handleCancelDelete"
      :footer="true" width="500px">
      <a-form :model="deleteForm" layout="vertical">
        <a-form-item>
          <a-alert type="warning" style="margin-bottom: 16px;">
            请输入知识库名称以确认危险删除操作
          </a-alert>
        </a-form-item>
        <a-form-item label="知识库名称" required>
          <a-input v-model="deleteForm.confirmName" :placeholder="`请输入：${deleteKbInfo.name}`" />
        </a-form-item>
      </a-form>
      <template #footer>

        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <a-button type="primary" @click="handleConfirmDelete(false)">
            删除但移动到回收站
          </a-button>
          <a-button type="primary" status="danger" @click="handleConfirmDelete(true)"
            :disabled="deleteForm.confirmName !== deleteKbInfo.name">
            删除且不保留文档
          </a-button>
        </div>
      </template>
    </ModalWrapper>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconDelete, IconHome, IconPlus, IconSettings } from '@arco-design/web-vue/es/icon';
import { Message, Upload } from '@arco-design/web-vue';
import KbCard from '@/components/kb/KbCard.vue';
import api from '@/api/index.js';
import { useUserStore } from '@/store/user.js';
import UserPageHeader from '../components/UserPageHeader.vue';
import ContentArea from '../components/ContentArea.vue';
import CImg from '@/components/base/image/cImg.vue';
import ImageCropperModal from '@/components/base/image/ImageCropperModal.vue';
import ModalWrapper from '@/components/base/ModalWrapper.vue';

// 定义排序选项
const sortOptions = [
  { label: '最近创建', value: 'created_at' },
  { label: '最多点赞', value: 'like_count' }
];

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 从路由参数获取用户ID
const userId = ref(route.params.id);
const userInfo = ref(null);
const currentUserInfo = ref({ id: -1 });

// 计算当前是否为访问自己的知识库
const isCurrentUser = computed(() => {
  return currentUserInfo.value.id == userId.value;
});

const knowledgeBases = ref([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);

// 获取用户信息
const fetchUserInfo = async (id) => {
  try {
    userInfo.value = await userStore.getUserInfo(id)
  }
  catch (err) {
    console.error('获取用户信息失败:', err);
  }
};


// 排序相关数据
const sortBy = ref('created_at'); // 默认按最新发布排序
// pageSize 现在由 ContentArea 组件管理，这里只需要保留一个响应式的引用
const pageSize = ref(10); // 默认值

// 卡片尺寸常量
const cardWidth = 180;
const cardHeight = 200;
// 知识库状态筛选
const kbStatus = ref(''); // 默认为全部

const searchValue = ref('');
const loadKnowledgeBases = async (page = 1) => {
  loading.value = true;
  try {
    Message.loading({ id: 'loadKnowledgeBases', content: '加载中' })
    // 构建请求参数
    const params = {
      page: page,
      size: pageSize.value,
      userId: userId.value,
      simple: total.value > 0,
      option: sortBy.value // 添加排序字段
    };

    // 添加状态筛选参数
    if (kbStatus.value) {
      params.status = kbStatus.value;
    }

    const currentUserInfo = await userStore.getUserInfo();
    if (currentUserInfo.id == userId.value) {
      params.size = pageSize.value - 1;
    }
    // 如果有搜索关键词，则添加到请求参数中
    if (useSearch && searchValue.value && searchValue.value.trim()) {
      params.keyword = searchValue.value.trim();
    }

    const { data } = await api.post('/post/kb/list', params);
    knowledgeBases.value = data.records;
    if (total.value <= 0) {
      total.value = data.total;
    }
    currentPage.value = page;
    Message.success({ id: 'loadKnowledgeBases', content: '加载完毕' })
  }
  catch (error) {
    console.error('加载知识库列表失败:', error);
    knowledgeBases.value = [];
    total.value = 0;
  }
  finally {
    loading.value = false;
  }
};

const handleBack = () => {
  // 返回到用户主页
  router.push(`/space/${userId.value}`);
};

let useSearch = false;

// 从公共组件传递的事件处理
const handleSortChangeFromHeader = (value) => {
  sortBy.value = value;
  // 排序变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadKnowledgeBases(1);
};

const handleSearchFromHeader = (value) => {
  currentPage.value = 1;
  total.value = -1;
  if (value && value.trim()) {
    useSearch = true;
    loadKnowledgeBases(currentPage.value);
  }
  else if (value) {
    if (useSearch) {
      console.log('之前搜索过，现在是复原');
      useSearch = false;
      loadKnowledgeBases(currentPage.value);
    }
  }
  searchValue.value = value;

};

// 处理状态选择变化
const handleStatusChange = (value) => {
  kbStatus.value = value;
  console.log(value);
  // 状态变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadKnowledgeBases(1);
};

// 处理分页变化
const handlePageChange = (page) => {
  loadKnowledgeBases(page);
};

function handleCreateKb(isPublic = true) {
  // 将知识库类型作为查询参数传递
  const routeData = router.resolve({
    name: 'KBCreate',
    query: {
      type: isPublic ? 'public' : 'private'
    }
  });
  window.open(routeData.href, '_blank');
}




// 组件挂载时加载数据
onMounted(async () => {
  if (userId.value) {
    const [currentUserInfoData] = await Promise.all([
      userStore.getUserInfo(),
      fetchUserInfo(userId.value)
    ]);
    currentUserInfo.value = currentUserInfoData;
  }
});


// 删除知识库相关
const deleteModalVisible = ref(false);
const deleteKbInfo = ref({
  id: null,
  name: '',
  coverUrl: ''
});
const deleteForm = ref({
  confirmName: ''
});

// 打开删除确认弹窗
const handleDeleteKb = (kbId) => {
  const kb = knowledgeBases.value.find(item => item.id === kbId);
  if (kb) {
    deleteKbInfo.value = {
      id: kb.id,
      name: kb.name || '',
      coverUrl: kb.coverUrl || ''
    };
    deleteForm.value.confirmName = '';
    deleteModalVisible.value = true;
  }
};

// 取消删除
const handleCancelDelete = () => {
  deleteModalVisible.value = false;
  deleteKbInfo.value = {
    id: null,
    name: '',
    coverUrl: ''
  };
  deleteForm.value.confirmName = '';
};

// 确认删除知识库
const handleConfirmDelete = async (deleteDocuments = false) => {
  if (deleteForm.value.confirmName !== deleteKbInfo.value.name) {
    Message.warning('知识库名称不匹配');
    return;
  }

  try {
    const kbId = deleteKbInfo.value.id;
    const coverUrl = deleteKbInfo.value.coverUrl;

    // 先从本地移除
    const deleteIndex = knowledgeBases.value.findIndex(item => item.id === kbId);
    if (deleteIndex !== -1) {
      knowledgeBases.value.splice(deleteIndex, 1);
      total.value -= 1;
    }

    // 关闭弹窗
    deleteModalVisible.value = false;

    // 后台执行删除操作
    (async () => {
      try {
        // 如果知识库有封面，先删除封面文件
        if (coverUrl) {
          try {
            await api.get('/file/free', { f: coverUrl });
          } catch (error) {
            console.error('删除封面失败:', error);
          }
        }

        // 删除知识库
        const params = { id: kbId };
        if (deleteDocuments) {
          params.removePost = true;
        }
        const { data } = await api.delete('/post/kb', params);

        if (deleteDocuments) {
          Message.success(`删除成功，已删除知识库及其下的 ${data} 个文档`);
        } else {
          Message.success(`删除成功，已自动将 ${data} 个文章更改为回收站`);
        }

        // 如果当前页还有数据可以补充，则请求下一条
        const currentPageStart = (currentPage.value - 1) * pageSize.value;
        const hasMoreData = total.value > currentPageStart + knowledgeBases.value.length;

        if (hasMoreData) {
          // 请求当前页的最后一条数据（即下一条数据）
          const params = {
            page: currentPage.value,
            size: pageSize.value,
            userId: userId.value,
            simple: true,
            option: sortBy.value
          };

          if (kbStatus.value) {
            params.status = kbStatus.value;
          }

          const currentUserInfo = await userStore.getUserInfo();
          if (currentUserInfo.id == userId.value) {
            params.size = pageSize.value - 1;
          }

          if (useSearch && searchValue.value && searchValue.value.trim()) {
            params.keyword = searchValue.value.trim();
          }

          try {
            const { data } = await api.post('/post/kb/list', params);
            // 只取最后一条新数据补充到列表末尾
            if (data.records && data.records.length > knowledgeBases.value.length) {
              const newItem = data.records[data.records.length - 1];
              knowledgeBases.value.push(newItem);
            }
          } catch (error) {
            console.error('获取补充数据失败:', error);
          }
        } else if (knowledgeBases.value.length === 0 && currentPage.value > 1) {
          // 如果当前页已经没有数据了，且不是第一页，则跳转到上一页
          currentPage.value -= 1;
          loadKnowledgeBases(currentPage.value);
        }
      } catch (error) {
        console.error('删除知识库失败:', error);
        Message.error('删除失败，请稍后重试');
        // 删除失败，重新加载列表
        loadKnowledgeBases(currentPage.value);
      }
    })();

    // 重置删除表单
    deleteKbInfo.value = {
      id: null,
      name: '',
      coverUrl: ''
    };
    deleteForm.value.confirmName = '';
  } catch (error) {
    console.error('删除操作失败:', error);
    Message.error('操作失败，请稍后重试');
  }
};

// 编辑知识库相关
const editModalVisible = ref(false);
const updateLoading = ref(false);
const editForm = ref({
  id: null,
  name: '',
  publish: true,
  coverUrl: ''
});

// 图片上传相关
const uploadingImage = ref(false);
const cropperModalVisible = ref(false);
const imageCropperRef = ref();
const currentImageFile = ref(null);
const formData = ref(null);
let originalCoverUrl = '';

// 打开编辑弹窗
const handleChangeKb = (kbId) => {
  const kb = knowledgeBases.value.find(item => item.id === kbId);
  if (kb) {
    editForm.value = {
      id: kb.id,
      name: kb.name || '',
      publish: kb.status !== '草稿',
      coverUrl: kb.coverUrl || ''
    };
    originalCoverUrl = kb.coverUrl || '';
    formData.value = null;
    editModalVisible.value = true;
  }
};

// 更新知识库
const handleUpdateKb = async () => {
  if (!editForm.value.name || !editForm.value.name.trim()) {
    Message.warning('请输入知识库名称');
    return;
  }

  updateLoading.value = true;
  try {
    const requestData = {
      id: editForm.value.id,
      name: editForm.value.name.trim(),
      status: editForm.value.publish ? '已发布' : '草稿'
    };

    // 如果有新的图片需要上传
    if (formData.value !== null) {
      Message.loading({
        id: 'upload-cover',
        content: '正在上传封面...',
        duration: 15000
      });

      if (originalCoverUrl) {
        api.get('/file/free', { f: originalCoverUrl });
      }

      // 上传图片
      const { data } = await api.post('/file/upload', formData.value, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      requestData.coverUrl = data.shortUrl;
      formData.value = null;

      Message.success({
        id: 'upload-cover',
        content: '封面上传成功',
      });
    }

    await api.put('/post/kb', requestData);
    Message.success('更新成功');
    editModalVisible.value = false;

    // 无感更新：直接更新列表中的对应项
    const updateIndex = knowledgeBases.value.findIndex(item => item.id === editForm.value.id);
    if (updateIndex !== -1) {
      // 保留原有数据，只更新修改的字段
      knowledgeBases.value[updateIndex] = {
        ...knowledgeBases.value[updateIndex],
        name: requestData.name,
        status: requestData.status,
        coverUrl: requestData.coverUrl || knowledgeBases.value[updateIndex].coverUrl
      };
    }
  } catch (error) {
    console.error('更新知识库失败:', error);
    Message.error('更新失败，请稍后重试');
  } finally {
    updateLoading.value = false;
  }
};

// 取消编辑
const handleCancelEdit = () => {
  editModalVisible.value = false;
  editForm.value = {
    id: null,
    name: '',
    publish: true,
    coverUrl: ''
  };
  formData.value = null;
  originalCoverUrl = '';
};

// 处理裁剪后的图片
const handleCroppedImage = async (croppedFile) => {
  try {
    const newFormData = new FormData();
    newFormData.append('file', croppedFile);
    formData.value = newFormData;

    // 创建本地预览URL
    const localUrl = URL.createObjectURL(croppedFile);
    editForm.value.coverUrl = localUrl;

    Message.success({
      id: 'upload-cropped-image:' + croppedFile.name,
      content: '封面已更新，将在保存时上传',
      duration: 3000,
    });

    cropperModalVisible.value = false;
    currentImageFile.value = null;
  } catch (error) {
    console.error('处理裁剪图片失败:', error);
    Message.error({
      id: 'upload-cropped-image:' + croppedFile.name,
      content: '处理裁剪图片失败，请稍后重试',
      duration: 3000,
    });
    throw error;
  }
};

// Arco Design Upload组件的自定义上传方法
const customRequest = async (options) => {
  const { fileItem, onError, onSuccess } = options;
  const file = fileItem.file;

  if (!file.type.startsWith('image/')) {
    console.error('请选择图片文件');
    Message.error('请选择图片文件');
    onError();
    return;
  }

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    currentImageFile.value = file;
    cropperModalVisible.value = true;

    await nextTick();
    setTimeout(() => {
      if (imageCropperRef.value) {
        imageCropperRef.value.setImage(img);
      }
    }, 100);

    onSuccess();
  };
  img.onerror = () => {
    console.error('图片加载失败');
    Message.error('图片加载失败');
    onError();
  };
};

// 处理pageSize变化事件
const handlePageSizeChange = (newPageSize) => {
  // 更新本地的 pageSize 值
  pageSize.value = newPageSize;

  // pageSize变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadKnowledgeBases(1);
};
</script>

<style lang="less" scoped>
.user-knowledge {
  max-width: 1400px;
  overflow: hidden;
  margin: 0 auto;
  padding: 0 20px;

  .kb-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;
    padding: 16px 0;
    align-items: flex-start;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 48px;
  }

  .status-filter-area {
    padding: 16px 0;
    border-bottom: 1px solid @color-border-1;

    .status-filter-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
    }
  }

  .create-kb-card {
    width: 180px;
    position: relative;
    height: 262px;

    .kb-card-container {
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      height: 100%;
      border: 1px dashed @color-border-2;

      &:hover {
        border-color: @link-6;
        box-shadow: 0 4px 12px 0 fade(@primary-6, 15%);
      }
    }

    .kb-cover-empty {
      width: 100%;
      height: 262px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: @color-fill-1;
      transition: all 0.3s ease;

      &:hover {
        background-color: @color-fill-2;
      }
    }

    .create-icon {
      font-size: 48px;
      color: var(--color-neutral-4);
      margin-bottom: 8px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      width: 100%;
    }

    .create-text {
      font-size: 14px;
      color: var(--color-neutral-4);
      transition: all 0.3s ease;
      margin-top: 0;
      line-height: 1.4;
      width: 100%;
      text-align: center;
    }

    &:hover {
      .create-icon,
      .create-text {
        color: @link-6;
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .user-knowledge {
    padding: 0 12px;

    .kb-list {
      gap: 12px;
      padding: 12px 0;
      justify-content: center;
    }

    .pagination-wrapper {
      margin-top: 24px;
      
      :deep(.arco-pagination) {
        flex-wrap: wrap;
        justify-content: center;
      }
    }

    .status-filter-area {
      padding: 12px 0;

      .status-filter-container {
        flex-direction: column;
        align-items: flex-start;
        padding: 0 12px;
        gap: 8px;

        :deep(.arco-radio-group) {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;

          .arco-radio {
            flex: 1;
            min-width: calc(50% - 4px);
            text-align: center;
          }
        }
      }
    }

    .create-kb-card {
      width: 150px;
      height: 220px;

      .kb-cover-empty {
        height: 220px;
      }

      .create-icon {
        font-size: 36px;
      }

      .create-text {
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 1080px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: 16px;
  }
}
</style>