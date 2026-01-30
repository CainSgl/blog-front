<template>
  <div style="padding:24px">
    <div class="user-docs">
    <UserPageHeader :userId="userId" title="文章列表" subtitle="文章" searchPlaceholder="搜索文章..." :sortOptions="sortOptions"
      apiUrl="/post/list" @sort-change="handleSortChangeFromHeader" @search="handleSearchFromHeader"
      @back="handleBack" />

    <!-- 为当前用户添加状态选择ContentArea -->
    <div v-if="isCurrentUser" class="status-filter-area">
      <div class="status-filter-container">
        <div class="status-and-tip">
          <a-radio-group v-model="postStatus" type="button" @change="handleStatusChange">
            <a-radio value="">全部</a-radio>
            <a-radio value="草稿">草稿</a-radio>
            <a-radio value="已发布">已公开</a-radio>
            <a-radio value="仅粉丝">仅粉丝</a-radio>
            <a-radio value="无知识库归属">回收站</a-radio>
            <a-radio value="待审核">审核中</a-radio>
            <a-radio value="已下架">已下架</a-radio>
          </a-radio-group>
          <span class="create-tip">{{ getCreateTipText }}</span>
        </div>
      </div>
    </div>

    <ContentArea :loading="loading" :list-data="posts" loading-tip="正在加载文章..." :card-width="cardWidth"
      :card-height="cardHeight-90" :height-offset="600" @page-size-change="handlePageSizeChange" emptyHeight="50vh">
      <template #default>
        <div class="posts-list">
          <!-- 文章卡片将在这里展示 -->
          <a-dropdown alignPoint v-for="post in posts" :key="post.id"
            :trigger="isCurrentUser ? 'contextMenu' : []">
            <PostCard :showStatus="postStatus==''" :height="cardHeight" :width="cardWidth"
              :post="loading?{}:post" />
            <template #content>
              <a-doption @click="openInBlog(post.id)">
                <a-link :href="`/p/${post.id}`" :hoverable="false" target="_ablank">
                <template #icon><icon-file /></template>
                在博客页面打开
                </a-link>
              </a-doption>
              <a-doption v-if="post.kbId" @click="openInKb(post.id, post.kbId)">
                   <a-link :href="`/kb/view?kb=${post.kbId}&p=${post.id}`" :hoverable="false" target="_ablank">
                <template #icon><icon-book /></template>
                在知识库页面打开
                </a-link>
              </a-doption>
              <a-doption v-if="isCurrentUser && post.status === '无知识库归属'" @click="handleMountToKb(post.id)">
                <template #icon><icon-link /></template>
                挂载到知识库
              </a-doption>
              <a-doption v-if="isCurrentUser" @click="handleEditPost(post.id)">
                <template #icon><icon-settings /></template>
                修改信息
              </a-doption>
              <a-doption v-if="isCurrentUser" @click="handleDeletePost(post.id)">
                <template #icon><icon-delete /></template>
                删除
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </template>
      <template #empty>
        <a-empty style="padding: 40px 0;" description="暂无文章" />
      </template>
    </ContentArea>
    <div class="pagination-wrapper">
      <a-pagination size="large" :total="total" :current="currentPage" :page-size="pageSize" show-total show-jumper
        @change="handlePageChange" />
    </div>
  </div>

    <!-- 编辑文章弹窗 -->
    <a-modal v-model:visible="editModalVisible" title="编辑文章信息" @ok="handleUpdatePost" @cancel="handleCancelEdit"
      :ok-loading="updateLoading" ok-text="保存" cancel-text="取消" width="600px">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="文章标题" required>
          <a-input v-model="editForm.title" placeholder="请输入文章标题" :max-length="60" show-word-limit />
        </a-form-item>

        <a-form-item label="文章摘要">
          <a-textarea v-model="editForm.summary" placeholder="请输入文章摘要" :auto-size="{ minRows: 3, maxRows: 6 }"
            :max-length="255" show-word-limit />
        </a-form-item>

        <a-form-item label="是否置顶">
          <a-switch v-model="editForm.isTop" checked-text="置顶" unchecked-text="默认" />
        </a-form-item>

        <a-form-item label="文章标签">
          <a-select v-model="editForm.tags" multiple allow-create filterable placeholder="请选择或输入标签"
            :max-tag-count="8">
            <a-option v-for="tag in editForm.tags" :key="tag" :value="tag">{{ tag }}</a-option>
          </a-select>
        </a-form-item>

        <a-form-item label="封面">
          <div>
            <div v-if="editForm.img" style="display: flex;align-items: center;justify-content: center;margin-top:20px;">
              <CImg :src="editForm.img" alt="封面预览" style="width: 300px;" />
            </div>
            <div style="display: flex;align-items: center;justify-content: center;margin-top:20px">
              <Upload :custom-request="customRequest" :show-file-list="false" :multiple="false" accept="image/*"
                @progress="uploadingImage = true">
                <a-button type="dashed" :loading="uploadingImage" style="margin-top: 12px;">
                  <template #icon>
                    <IconPlus />
                  </template>
                  {{ editForm.img ? '修改封面' : '上传封面' }}
                </a-button>
              </Upload>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片裁剪模态框 -->
    <ImageCropperModal ref="imageCropperRef" v-model="cropperModalVisible" :aspect-ratio="1.5"
      @confirm="handleCroppedImage" />

    <!-- 知识库选择弹窗 -->
    <KnowledgeBaseSelector v-model="kbSelectorVisible" :userId="userId" @confirm="handleKbSelected" />

  </div>
  
</template>

<script setup>
import {computed, nextTick, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {IconBook, IconDelete, IconFile, IconLink, IconPlus, IconSettings} from '@arco-design/web-vue/es/icon';
import {Message, Modal, Upload} from '@arco-design/web-vue';
import api from '@/api/index.js';
import PostCard from '@/components/post/PostCard.vue';
import UserPageHeader from './common/UserPageHeader.vue';
import ContentArea from './common/ContentArea.vue';
import CImg from '@/components/base/cImg.vue';
import ImageCropperModal from '@/components/base/ImageCropperModal.vue';
import {useUserStore} from '@/store/user.js';
import KnowledgeBaseSelector from '@/components/user/favorite/showFavorite/KnowledgeBaseSelector.vue';

// 定义排序选项
const sortOptions = [
    { label: '最近更新', value: 'updated_at' },
  { label: '最新发布', value: 'published_at' },
  { label: '最多观看', value: 'view_count' },
  { label: '最多点赞', value: 'like_count' }

];
const sortBy = ref('updated_at'); // 默认按最新发布排序
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 从路由参数获取用户ID
const userId = ref(route.params.id);
const userInfo = ref(null);
const currentUserInfo = ref({ id: -1 });

// 计算当前是否为访问自己的文章列表
const isCurrentUser = computed(() => 
{
  return currentUserInfo.value.id == userId.value;
});

// 获取用户信息
const fetchUserInfo = async (id) => 
{
  try 
  {
    userInfo.value= await userStore.getUserInfo(id)
  }
  catch (err) 
  {
    console.error('获取用户信息失败:', err);
  }
};

// 文章数据
const posts = ref([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);
const getCreateTipText = computed(() => 
{
  switch(postStatus.value) 
  {
  case '':
    return '若需要创建文档，请先创建知识库！';
  case '草稿':
    return '文章若是草稿状态，将不会被公开展示。';
  case '已发布':
    return '互联网的所有人均可以访问。';
  case '无知识库归属':
    return '回收站内的文档是没有知识库归属的文档。建议绑定知识库以方便管理！';
  case '待审核':
    return '你的文档信息将会在审核通过后公开展示。';
  case '已下架':
    return '已下架的文档将不再公开展示。若需要重新公开展示，请联系管理员。';
  case '仅粉丝':
    return '只有粉丝才能观看该文章！';
  default:
    return '若需要创建文档，请先创建知识库！';
  }
});

// 排序相关数据
const pageSize = ref(10); // 默认值

// 卡片尺寸常量
const cardWidth = 260;
const cardHeight = 400;

// 文章状态筛选
const postStatus = ref(''); // 默认为全部

const searchValue = ref('');
// 加载文章列表
const loadPosts = async (page = 1) => 
{
  loading.value = true;
  try 
  {
    // 构建请求参数
    const params = {
      page: page,
      size: pageSize.value,
      userId: userId.value,
      simple: total.value > 0,
      option: sortBy.value // 添加排序字段
    };

    // 添加状态筛选参数
    if (postStatus.value) 
    {
      params.status = postStatus.value;
    }

    // 如果有搜索关键词，则添加到请求参数中
    if (useSearch && searchValue.value && searchValue.value.trim()) 
    {
      params.keyword = searchValue.value.trim();
    }

    const { data } = await api.post('/post/list', params);
    posts.value = data.records;
    if (total.value <= 0) 
    {
      total.value = data.total;
    }
    currentPage.value = page;
  }
  catch (error) 
  {
    console.error('加载文章列表失败:', error);
    posts.value = [];
    total.value = 0;
  }
  finally 
  {
    loading.value = false;
  }
};

const handleBack = () => 
{
  // 返回到用户主页
  router.push(`/space/${userId.value}`);
};

let useSearch = false;

// 从公共组件传递的事件处理
const handleSortChangeFromHeader = (value) => 
{
  sortBy.value = value;
  // 排序变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};

const handleSearchFromHeader = (value) => 
{
  console.log(value)
  currentPage.value = 1;
  total.value = -1;
    searchValue.value = value;
  if (value && value.trim()) 
  {
    useSearch = true;
    loadPosts(currentPage.value);
  }
  else
  {
    if (useSearch) 
    {
      console.log('之前搜索过，现在是复原');
      useSearch = false;
      loadPosts(currentPage.value);
    }
  }

};

// 处理状态选择变化
const handleStatusChange = (value) => 
{
  postStatus.value = value;
  console.log(value);
  // 状态变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};

// 处理分页变化
const handlePageChange = (page) => 
{
  loadPosts(page);
};

// 组件挂载时加载数据
onMounted(async () => 
{
  if (userId.value) 
  {
    const [currentUserInfoData] = await Promise.all([
      userStore.getUserInfo(),
      fetchUserInfo(userId.value)
    ]);
    currentUserInfo.value = currentUserInfoData;
  }
});

// 右键菜单功能
const openInBlog = (postId) => {
  // 在博客页面打开文章
  console.log('在博客页面打开:', postId);
};

const openInKb = (postId, kbId) => {
  // 在知识库页面打开文章
  console.log('在知识库页面打开:', postId, kbId);
};

// 知识库选择相关
const kbSelectorVisible = ref(false);
const currentMountPostId = ref(null);

const handleMountToKb = (postId) => {
  currentMountPostId.value = postId;
  kbSelectorVisible.value = true;
};

const handleKbSelected = async (kb) => {
  if (!currentMountPostId.value || !kb) return;

  try {
    Message.loading({
      id: 'mount-to-kb',
      content: '正在挂载到知识库...',
    });

    await api.get('/post/setKb', {
      id: currentMountPostId.value,
      kbId: kb.id
    });

    Message.success({
      id: 'mount-to-kb',
      content: `已成功挂载到知识库：${kb.name}`
    });

    // 更新列表中的文章信息
    const postIndex = posts.value.findIndex(item => item.id === currentMountPostId.value);
    if (postIndex !== -1) {
      posts.value[postIndex] = {
        ...posts.value[postIndex],
        kbId: kb.id,
        status: kb.status === '已发布' ? '已发布' : posts.value[postIndex].status
      };
    }

    currentMountPostId.value = null;
  } catch (error) {
    console.error('挂载到知识库失败:', error);
    Message.error({
      id: 'mount-to-kb',
      content: '挂载失败，请稍后重试'
    });
  }
};

// 编辑文章相关
const editModalVisible = ref(false);
const updateLoading = ref(false);
const editForm = ref({
  id: null,
  title: '',
  summary: '',
  img: '',
  isTop: false,
  tags: []
});

// 图片上传相关
const uploadingImage = ref(false);
const cropperModalVisible = ref(false);
const imageCropperRef = ref();
const currentImageFile = ref(null);
const formData = ref(null);
let originalImg = '';

// 打开编辑弹窗
const handleEditPost = (postId) => {
  const post = posts.value.find(item => item.id === postId);
  if (post) {
    editForm.value = {
      id: post.id,
      title: post.title || '',
      summary: post.summary || '',
      img: post.img || '',
      isTop: post.isTop || false,
      tags: post.tags ? [...post.tags] : []
    };
    originalImg = post.img || '';
    formData.value = null;
    editModalVisible.value = true;
  }
};

// 更新文章信息
const handleUpdatePost = async () => {
  if (!editForm.value.title || !editForm.value.title.trim()) {
    Message.warning('请输入文章标题');
    return;
  }

  updateLoading.value = true;
  try {
    const requestData = {
      id: editForm.value.id,
      title: editForm.value.title.trim(),
      summary: editForm.value.summary?.trim() || '',
      isTop: editForm.value.isTop,
      tags: editForm.value.tags || []
    };
    const updateId='更新文章'+editForm.value.id
    Message.loading({id:updateId,content:"推送数据中..."});
    // 如果有新的图片需要上传
    if (formData.value !== null) {
      Message.loading({
        id: 'upload-img',
        content: '正在上传封面...',
        duration: 15000
      });

      if (originalImg) {
        api.get('/file/free', { f: originalImg });
      }

      // 上传图片
      const { data } = await api.post('/file/upload', formData.value, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      requestData.img = data.shortUrl;
      formData.value = null;

      Message.success({
        id: 'upload-img',
        content: '封面上传成功',
      });
    }

    await api.put('/post', requestData);
    Message.success({id:updateId,content:'更新成功'});
    editModalVisible.value = false;

    // 无感更新：直接更新列表中的对应项
    const updateIndex = posts.value.findIndex(item => item.id === editForm.value.id);
    if (updateIndex !== -1) {
      posts.value[updateIndex] = {
        ...posts.value[updateIndex],
        title: requestData.title,
        summary: requestData.summary,
        isTop: requestData.isTop,
        tags: requestData.tags,
        img: requestData.img || posts.value[updateIndex].img
      };
    }
  } catch (error) {
    console.error('更新文章失败:', error);
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
    title: '',
    summary: '',
    img: '',
    isTop: false,
    tags: []
  };
  formData.value = null;
  originalImg = '';
};

// 删除文章
const handleDeletePost = (postId) => {
  const post = posts.value.find(item => item.id === postId);

  Modal.warning({
    title: '确认删除',
    content: '删除文章后将无法恢复，确定要删除吗？',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger'
    },
    onBeforeOk: async () => {
      try {
        Message.loading({
          id: 'delete-post',
          content: '正在删除文章...',
        });

        // 如果文章有封面，先删除封面文件
        if (post && post.img) {
          try {
            api.get('/file/free', { f: post.img });
          } catch (error) {
            console.error('删除封面失败:', error);
          }
        }

        // 删除文章
        await api.delete('/post', { id: postId });

        Message.success({
          id: 'delete-post',
          content: '删除成功'
        });

        // 无感删除：直接从列表中移除，然后获取下一条数据补充
        const deleteIndex = posts.value.findIndex(item => item.id === postId);
        if (deleteIndex !== -1) {
          posts.value.splice(deleteIndex, 1);
          total.value -= 1;

          // 如果当前页还有数据可以补充，则请求下一条
          const currentPageStart = (currentPage.value - 1) * pageSize.value;
          const hasMoreData = total.value > currentPageStart + posts.value.length;

          if (hasMoreData) {
            const params = {
              page: currentPage.value,
              size: pageSize.value,
              userId: userId.value,
              simple: true,
              option: sortBy.value
            };

            if (postStatus.value) {
              params.status = postStatus.value;
            }

            if (useSearch && searchValue.value && searchValue.value.trim()) {
              params.keyword = searchValue.value.trim();
            }

            try {
              const { data } = await api.post('/post/list', params);
              if (data.records && data.records.length > posts.value.length) {
                const newItem = data.records[data.records.length - 1];
                posts.value.push(newItem);
              }
            } catch (error) {
              console.error('获取补充数据失败:', error);
            }
          } else if (posts.value.length === 0 && currentPage.value > 1) {
            currentPage.value -= 1;
            loadPosts(currentPage.value);
          }
        }
      } catch (error) {
        console.error('删除文章失败:', error);
        Message.error({
          id: 'delete-post',
          content: '删除失败，请稍后重试'
        });
        throw error;
      }
    }
  });
};

// 处理裁剪后的图片
const handleCroppedImage = async (croppedFile) => {
  try {
    const newFormData = new FormData();
    newFormData.append('file', croppedFile);
    formData.value = newFormData;

    // 创建本地预览URL
    const localUrl = URL.createObjectURL(croppedFile);
    editForm.value.img = localUrl;

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
const handlePageSizeChange = (newPageSize) => 
{
  // 更新本地的 pageSize 值
  pageSize.value = newPageSize;

  // pageSize变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};
</script>

<style lang="less" scoped>
.user-docs {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  overflow: hidden;
  .posts-list {
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
    margin-top: 24px;
  }

  .content-area {
    min-height: 480px;
    height: calc(100vh - 400px);
  }

  // 状态筛选区域样式
  .status-filter-area {
    padding: 16px 0;
    border-bottom: 1px solid #eee;

    .status-filter-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;

      .status-and-tip {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .create-tip {
        font-size: 14px;
        color: #999;
      }
    }
  }


}

@media (max-width: 1380px) {
  :deep(.arco-page-header .arco-page-header-extra) {
    margin-top: 16px;
  }
}
</style>