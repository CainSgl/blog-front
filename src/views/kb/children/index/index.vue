<template>
  <div class="kb-index-container">
    <div style="padding:10px 0px;">
      <div class="kb-header">
        <div class="kb-title">
          <div class="svg-placeholder">
            <svg t="1766759905178" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
              p-id="5022" xmlns:xlink="http://www.w3.org/1999/xlink" width="128" height="128">
              <path
                d="M554.666667 221.866667h-174.250667v580.266666H716.8a85.333333 85.333333 0 0 0 85.333333-85.333333V307.2c0-38.229333-25.122133-70.5536-59.733333-81.442133V409.6a25.6 25.6 0 0 1-43.690667 18.090667L648.533333 377.514667l-50.176 50.176a25.6 25.6 0 0 1-43.690666-18.090667V221.866667z m-225.450667 0H307.2A85.333333 85.333333 0 0 0 221.866667 307.2v409.6A85.333333 85.333333 0 0 0 307.2 802.133333h22.016v-580.266666zM307.2 170.666667h409.6a136.533333 136.533333 0 0 1 136.533333 136.533333v409.6a136.533333 136.533333 0 0 1-136.533333 136.533333H307.2a136.533333 136.533333 0 0 1-136.533333-136.533333V307.2a136.533333 136.533333 0 0 1 136.533333-136.533333z m298.666667 59.733333v117.418667l24.576-24.576a25.6 25.6 0 0 1 36.181333 0l24.576 24.576V230.4h-85.333333z"
                fill="#1a7cc7" p-id="5023"></path>
            </svg>
          </div>
          <div v-if="renaming" class="rename-input-container">
            <a-input v-model="newName" ref="renameInputRef" @press-enter="confirmRename" @blur="confirmRename"
              size="large" style="width: 300px;" />
          </div>
          <span v-else class="title-text">{{ kbInfo.name }}</span>
          <div class="kb-actions">
            <a-popover v-model:visible="shareVisible" position="br" trigger="click">
              <a-button>
                <template #icon>
                  <IconShareInternal />
                </template>
                分享
              </a-button>
              <template #content>
                <div class="share-content">
                  <div class="share-header">分享链接</div>
                  <div class="link-container">
                    <a-input :model-value="shareLink" readonly ref="linkInputRef" size="small" style="flex: 1;" />
                    <a-button size="small" @click="copyLink" class="copy-btn">
                      <template #icon>
                        <IconCopy />
                      </template>
                      复制
                    </a-button>
                  </div>
                </div>
              </template>
            </a-popover>

            <a-dropdown v-if="edit" trigger="click" @select="handleMoreAction">
              <a-button>
                <template #icon>
                  <IconMore />
                </template>
              </a-button>
              <template #content>
                <a-doption key="rename" :value="{ action: 'rename' }">
                  <IconEdit style="margin-right: 8px;" /> 重命名
                </a-doption>
                <a-doption key="editIndex" :value="{ action: 'editIndex' }">
                  <IconEdit style="margin-right: 8px;" /> 编辑首页
                </a-doption>
                <a-doption key="settings" :value="{ action: 'editIndex' }">
                  <IconSettings style="margin-right: 8px;" /> 更多设置
                </a-doption>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
    </div>

    <a-spin :loading="loading" tip="正在加载知识库首页内容..." style="display: block;">
      <div class="user-info">
        <div class="user-info-content">
          <avatarWithInfo :user="masterUser" :size="40" />
          <div v-if="masterUser" class="user-name">{{ masterUser.nickname }}</div>
        </div>
        <FollowButton :userId="masterUser?.id" @followChanged="handleFollowChanged" />
      </div>
      <div v-if="content" class="content-container">
        <MarkdownPreview :showComment="false" :content="content" :height="height" />
      </div>
      <div v-else-if="!loading" class="empty-container">
        <a-empty description="该用户未设置首页内容" />
      </div>
    </a-spin>


  </div>
</template>

<script setup>
import {computed, nextTick, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Message} from '@arco-design/web-vue';
import api from '@/api/index.js';
import {useKbStore} from '../../kbStore.js';
import {useUserStore} from '@/store/user.js';
import MarkdownPreview from '@/components/md/MarkdownPreview.vue';
import {IconCopy, IconEdit, IconMore, IconSettings, IconShareInternal} from '@arco-design/web-vue/es/icon';
import AvatarWithInfo from '@/components/base/avatar/AvatarWithInfo.vue';
import FollowButton from '@/components/base/follow/FollowButton.vue';

const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();
const userStore = useUserStore();
const content = ref('');
const loading = ref(false);
const height = ref('calc(100vh - 120px)'); // 设置合适的高度
const renaming = ref(false); // 添加重命名状态
const newName = ref('');
const renameInputRef = ref(); // 添加重命名输入框引用
const shareVisible = ref(false);
const masterUser = ref(null);
const shareLink = computed(() => 
{
  if (kbInfo.value && kbInfo.value.id) 
  {
    return `${window.location.origin}/kb?kb=${kbInfo.value.id}`;
  }
  return '';
});
// 从store中获取kbInfo
const kbInfo = computed(() => 
{
  checkEditPermission(kbStore.kbInfo);
  console.log(kbStore.kbInfo.userId);
  return kbStore.kbInfo;
});

// 监听kbInfo变化，当kbInfo更新时获取用户信息
watch(() => kbInfo.value.userId, async (newUserId) => 
{
  if (newUserId) 
  {
    masterUser.value = await userStore.getUserInfo(newUserId);
  }
}, { immediate: true });
async function checkEditPermission(info) 
{
  const userInfo = await userStore.getUserInfo();
  if (userInfo.id == info.userId) 
  {
    edit.value = true;
  }
}

const edit = ref(false);
// 获取知识库首页内容
const loadKbIndexContent = async () => 
{
  const kbParam = route.query.kb;
  if (kbParam) 
  {
    const kbIdreq = kbParam;
    loading.value = true;
    try 
    {
      const { data } = await api.get('/post/kb/index', { id: kbIdreq });
      content.value = data.index || '';
    }
    catch (error) 
    {
      content.value = '加载内容失败，请稍后重试。';
    }
    finally 
    {
      loading.value = false;
    }
  }
};

// 检查编辑权限
onMounted(async () => 
{
  //loadKbIndexContent()
  userStore.getUserInfo();
  //获取用户信息
});

// 监听路由参数变化
watch(() => route.query, async (newQuery) => 
{
  // 处理用户信息加载
  const returnUrl = newQuery.returnUrl;
  if (returnUrl && newQuery.userId) 
  {
    masterUser.value = await userStore.getUserInfo(newQuery.userId);
  }
  
  // 处理知识库内容加载
  if (newQuery.kb) 
  {
    loadKbIndexContent();
  }
}, { immediate: true });



// 复制分享链接
const copyLink = async () => 
{
  if (!shareLink.value) 
  {
    Message.warning('复制的链接不能为空！');
    return;
  }
  try 
  {
    await navigator.clipboard.writeText(shareLink.value);
    Message.success('链接复制成功！');
  }
  catch (err) 
  {
    console.error('链接复制失败：', err);
    Message.error('链接复制失败，请手动复制！');
  }
};
// 开始重命名
const startRename = () => 
{
  renaming.value = true;
  newName.value = kbInfo.value.name || '';
  // 等待DOM更新后聚焦输入框
  nextTick(() => 
  {
    if (renameInputRef.value) 
    {
      renameInputRef.value.focus();
    }
  });
};

// 确认重命名
const confirmRename = async () => 
{
  if (!newName.value.trim()) 
  {
    Message.warning('知识库名称不能为空');
    return;
  }
  newName.value = newName.value.trim();
  if (newName.value === kbInfo.value.name) 
  {
    // 名称未改变，取消编辑状态
    renaming.value = false;
    return;
  }
  try 
  {
    Message.loading({
      id: 'rename',
      content: '正在重命名...',
      duration: 15000
    });
    // 调用API更新知识库名称
    await api.put('/post/kb', {
      id: kbInfo.value.id,
      name: newName.value
    });
    kbInfo.value.name = newName.value;
    Message.success({
      id: 'rename',
      content: '重命名成功',
    });

  }
  catch (error) 
  {
    console.error('重命名失败:', error);
    Message.error({
      id: 'rename',
      content: '重命名失败，请稍后重试',
    });
  }
  finally 
  {
    renaming.value = false;
  }
};

// 处理更多操作
const handleMoreAction = (value) => 
{
  const action = value.action;
  switch (action) 
  {
  case 'rename':
    startRename();
    break;
  case 'editIndex':
    // 跳转到编辑首页页面
    router.push({
      name: 'KBIndexEdit',
      query: { kb: kbInfo.value.id }
    });
    break;
  case 'settings':
    // 跳转到知识库设置页面
    router.push({
      name: 'KBIndexEdit',
      query: { kb: kbInfo.value.id }
    });
    break;
  default:
    console.warn('未知的操作:', action);
  }
};


// 处理关注状态变化
const handleFollowChanged = (isFollowing) => 
{
  // 可以在这里添加关注状态变化后的逻辑
  // 例如刷新页面或更新UI状态
  console.log('关注状态变化:', isFollowing);
  Message.success(isFollowing ? '关注成功' : '已取消关注');

  // 检查是否有returnUrl参数，如果有则重定向
  const returnUrl = route.query.returnUrl;
  if (returnUrl) 
  {
    // 解码URL并重定向
    window.location.href = decodeURIComponent(returnUrl);
  }
};

</script>

<style scoped lang="less">
.kb-index-container {
  padding: 10px;
  height: 100%;

  .kb-header {
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 10px;

    .kb-title {
      display: flex;
      align-items: center;
      gap: 10px;

      .title-text {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-1);
      }

      .svg-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
      }
    }

    .kb-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .rename-input-container {
      display: flex;
      align-items: center;
      height: 32px;

      :deep(.arco-input) {
        font-size: 18px;
        font-weight: 600;
        height: 32px;
        line-height: 32px;
      }
    }

    .rename-actions {
      display: flex;
      gap: 4px;
    }
  }

  .user-info {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
    margin-bottom: 20px;
    padding-left: 20px; /* 添加左边距以更好地控制位置 */
  }

  .user-info-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

 

  .content-container {
    height: 100%;
  }

  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 20px;
  }
}

.share-content {
  min-width: 320px;
  padding: 16px;

  .share-header {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-1);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .link-container {
    display: flex;
    gap: 8px;
    align-items: center;
    /* 垂直居中对齐 */

    .copy-btn {
      flex-shrink: 0;
    }
  }
  .user-name{
    color: var(--color-neutral-10);
  }
}
</style>