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
              <a-radio v-for="status in statusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </a-radio>
            </a-radio-group>
            <span class="create-tip">{{ getCreateTipText }}</span>
          </div>
        </div>
      </div>

      <ContentArea :loading="loading" :list-data="posts" :card-width="cardWidth"
        :card-height="cardHeight - 90" @page-size-change="handlePageSizeChange">
        <template #default>
          <div class="posts-list">
            <!-- 文章卡片将在这里展示 -->
            <a-dropdown alignPoint v-for="post in posts" :key="post.id" :trigger="isCurrentUser ? 'contextMenu' : []">
              <a-link :hoverable="false" :href="`/p/${post.id}`">
                <PostCard :showStatus="postStatus == ''" :height="cardHeight" :width="cardWidth"
                  :post="loading ? {} : post" />
              </a-link>
              <template #content>
                <a-doption v-for="option in getContextMenuOptions(post)" :key="option.key" v-show="option.show"
                  @click="option.handler(post)">
                  <template #icon>
                    <component :is="option.icon" />
                  </template>
                  <a-link v-if="option.href" :href="option.href(post)" :hoverable="false" target="_ablank">
                    {{ option.label }}
                  </a-link>
                  <span v-else>{{ option.label }}</span>
                </a-doption>
              </template>
            </a-dropdown>
          </div>
        </template>
        <template #empty>

        </template>
      </ContentArea>
      <div class="pagination-wrapper">
        <a-pagination size="large" :total="total" :current="currentPage" :page-size="pageSize" show-total show-jumper
          @change="handlePageChange" />
      </div>
    </div>

    <!-- 编辑文章弹窗 -->
    <EditPostModal v-model="editModalVisible" :post-data="currentEditPost" @success="handleUpdateSuccess" />

    <!-- 知识库选择弹窗 -->
    <KnowledgeBaseSelector v-model="kbSelectorVisible" :userId="userId" @confirm="handleKbSelected" />

  </div>

</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconBook, IconDelete, IconFile, IconLink, IconSend, IconSettings } from '@arco-design/web-vue/es/icon';
import { Message, Modal } from '@arco-design/web-vue';
import api from '@/api/index.js';
import PostCard from '@/components/post/PostCard.vue';
import UserPageHeader from './components/UserPageHeader.vue';
import ContentArea from './components/ContentArea.vue';
import EditPostModal from '@/components/base/EditPostModal.vue';
import { useUserStore } from '@/store/user.js';
import KnowledgeBaseSelector from '@/views/user/children/kb/components/KnowledgeBaseSelector.vue';
import { useKbStore } from '@/views/kb/kbStore.js';

// 定义排序选项
const sortOptions = [
  { label: '最近更新', value: 'updated_at' },
  { label: '最新发布', value: 'published_at' },
  { label: '最多观看', value: 'view_count' },
  { label: '最多点赞', value: 'like_count' }

];

// 状态筛选选项配置
const statusOptions = [
  { label: '全部', value: '', tip: '若需要创建文档，请先创建知识库！' },
  { label: '草稿', value: '草稿', tip: '文章若是草稿状态，将不会被公开展示。' },
  { label: '已公开', value: '已发布', tip: '互联网的所有人均可以访问。' },
  { label: '仅粉丝', value: '仅粉丝', tip: '只有粉丝才能观看该文章！' },
  { label: '回收站', value: '无知识库归属', tip: '回收站内的文档是没有知识库归属的文档。建议绑定知识库以方便管理！' },
  { label: '审核中', value: '待审核', tip: '你的文档信息将会在审核通过后公开展示。' },
  { label: '已下架', value: '已下架', tip: '已下架的文档将不再公开展示。若需要重新公开展示，请联系管理员。' }
];

const sortBy = ref('updated_at'); // 默认按最新发布排序
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const kbStore = useKbStore();

// 从路由参数获取用户ID
const userId = ref(route.params.id);
const userInfo = ref(null);
const currentUserInfo = ref({ id: -1 });

// 计算当前是否为访问自己的文章列表
const isCurrentUser = computed(() => {
  return currentUserInfo.value.id == userId.value;
});

// 获取用户信息
const fetchUserInfo = async (id) => {
  try {
    userInfo.value = await userStore.getUserInfo(id)
  }
  catch (err) {
    console.error('获取用户信息失败:', err);
  }
};

// 文章数据
const posts = ref([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);
const getCreateTipText = computed(() => {
  const status = statusOptions.find(s => s.value === postStatus.value);
  return status ? status.tip : '若需要创建文档，请先创建知识库！';
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
const loadPosts = async (page = 1) => {

  loading.value = true;
  try {
    // 构建请求参数
    Message.loading({ id: 'loadPosts', content: '加载中' })
    const params = {
      page: page,
      size: pageSize.value,
      userId: userId.value,
      simple: total.value > 0,
      option: sortBy.value // 添加排序字段
    };

    // 添加状态筛选参数
    if (postStatus.value) {
      params.status = postStatus.value;
    }

    // 如果有搜索关键词，则添加到请求参数中
    if (useSearch && searchValue.value && searchValue.value.trim()) {
      params.keyword = searchValue.value.trim();
    }

    const { data } = await api.post('/post/list', params);
    posts.value = data.records;
    if (total.value <= 0) {
      total.value = data.total;
    }
    currentPage.value = page;
    Message.success({ id: 'loadPosts', content: '加载完毕' })
  }
  catch (error) {
    console.error('加载文章列表失败:', error);
    posts.value = [];
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
  loadPosts(1);
};

const handleSearchFromHeader = (value) => {
  console.log(value)
  currentPage.value = 1;
  total.value = -1;
  searchValue.value = value;
  if (value && value.trim()) {
    useSearch = true;
    loadPosts(currentPage.value);
  }
  else {
    if (useSearch) {
      console.log('之前搜索过，现在是复原');
      useSearch = false;
      loadPosts(currentPage.value);
    }
  }

};

// 处理状态选择变化
const handleStatusChange = (value) => {
  postStatus.value = value;
  console.log(value);
  // 状态变化时重置到第一页并重新加载
  currentPage.value = 1;
  loadPosts(1);
};

// 处理分页变化
const handlePageChange = (page) => {
  loadPosts(page);
};

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

// 右键菜单功能
const openInBlog = (postId) => {
  // 在博客页面打开文章
  console.log('在博客页面打开:', postId);
};

const openInKb = (postId, kbId) => {
  // 在知识库页面打开文章
  console.log('在知识库页面打开:', postId, kbId);
};

// 右键菜单选项配置
const getContextMenuOptions = (post) => {
  return [
    {
      key: 'openInBlog',
      label: '在博客页面打开',
      icon: IconFile,
      show: true,
      href: (p) => `/p/${p.id}`,
      handler: (p) => openInBlog(p.id)
    },
    {
      key: 'openInKb',
      label: '在知识库页面打开',
      icon: IconBook,
      show: !!post.kbId,
      href: (p) => `/kb/view?kb=${p.kbId}&p=${p.id}`,
      handler: (p) => openInKb(p.id, p.kbId)
    },
    {
      key: 'publishPost',
      label: '发布',
      icon: IconSend,
      show: isCurrentUser.value && post.status === '草稿',
      handler: (p) => handlePublishPost(p)
    },
    {
      key: 'mountToKb',
      label: '挂载到知识库',
      icon: IconLink,
      show: isCurrentUser.value && post.status === '无知识库归属',
      handler: (p) => handleMountToKb(p.id)
    },
    {
      key: 'editPost',
      label: '修改信息',
      icon: IconSettings,
      show: isCurrentUser.value,
      handler: (p) => handleEditPost(p.id)
    },
    {
      key: 'deletePost',
      label: '删除',
      icon: IconDelete,
      show: isCurrentUser.value,
      handler: (p) => handleDeletePost(p.id)
    }
  ];
};

// 发布文章处理
const handlePublishPost = async (post) => {
  try {
    Message.loading({
      id: 'load-post-content',
      content: '正在加载文章内容...',
    });

    // 获取文章完整内容
    const { data } = await api.get('/post/last', { id: post.id });
    
    // 设置提交数据到 kbStore
    kbStore.setCommitInfo({
      id: post.id,
      title: post.title,
      summary: post.summary || '',
      content: data.content,
      status: post.status,
      top: post.isTop || false,
      tags: post.tags || [],
      img: post.img || '',
      viewCount: post.viewCount || 0,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      userId: post.userId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      kbId: post.kbId || ''
    }, data.content);

    Message.success({
      id: 'load-post-content',
      content: '加载成功，正在跳转...'
    });

    // 跳转到发布页面
    router.push({ name: 'ArticleCommit' });
  } catch (error) {
    console.error('加载文章内容失败:', error);
    Message.error({
      id: 'load-post-content',
      content: '加载文章内容失败，请稍后重试'
    });
  }
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
const currentEditPost = ref({});

// 打开编辑弹窗
const handleEditPost = (postId) => {
  const post = posts.value.find(item => item.id === postId);
  if (post) {
    currentEditPost.value = post;
    editModalVisible.value = true;
  }
};

// 更新成功回调
const handleUpdateSuccess = (updatedData) => {
  // 无感更新：直接更新列表中的对应项
  const updateIndex = posts.value.findIndex(item => item.id === updatedData.id);
  if (updateIndex !== -1) {
    posts.value[updateIndex] = {
      ...posts.value[updateIndex],
      title: updatedData.title,
      summary: updatedData.summary,
      isTop: updatedData.isTop,
      tags: updatedData.tags,
      img: updatedData.img || posts.value[updateIndex].img
    };
  }
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


// 处理pageSize变化事件
const handlePageSizeChange = (newPageSize) => {
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

  .status-filter-area {
    padding: 16px 0;
    border-bottom: 1px solid @color-border-1;

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
        font-size: @font-size-body-3;
        color: var(--color-neutral-10);
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .user-docs {
    padding: 0 12px;

    .posts-list {
      gap: 12px;
      padding: 12px 0;
      justify-content: center;
    }

    .pagination-wrapper {
      margin-top: 16px;
      
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

        .status-and-tip {
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          gap: 8px;
        }

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

        .create-tip {
          font-size: 12px;
          width: 100%;
        }
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