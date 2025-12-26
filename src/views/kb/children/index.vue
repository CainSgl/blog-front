<template>
  <div class="kb-index-container">
    <div style="padding:10px 0px;">
      <div class="kb-header">
        <div class="kb-title">
          <div class="svg-placeholder">
           <svg t="1766759905178" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5022" xmlns:xlink="http://www.w3.org/1999/xlink" width="128" height="128"><path d="M554.666667 221.866667h-174.250667v580.266666H716.8a85.333333 85.333333 0 0 0 85.333333-85.333333V307.2c0-38.229333-25.122133-70.5536-59.733333-81.442133V409.6a25.6 25.6 0 0 1-43.690667 18.090667L648.533333 377.514667l-50.176 50.176a25.6 25.6 0 0 1-43.690666-18.090667V221.866667z m-225.450667 0H307.2A85.333333 85.333333 0 0 0 221.866667 307.2v409.6A85.333333 85.333333 0 0 0 307.2 802.133333h22.016v-580.266666zM307.2 170.666667h409.6a136.533333 136.533333 0 0 1 136.533333 136.533333v409.6a136.533333 136.533333 0 0 1-136.533333 136.533333H307.2a136.533333 136.533333 0 0 1-136.533333-136.533333V307.2a136.533333 136.533333 0 0 1 136.533333-136.533333z m298.666667 59.733333v117.418667l24.576-24.576a25.6 25.6 0 0 1 36.181333 0l24.576 24.576V230.4h-85.333333z" fill="#1a7cc7" p-id="5023"></path></svg>
          </div>
          <span class="title-text">{{ kbInfo.name }}</span>
          <div class="kb-actions">
            <a-popover
              v-model:visible="shareVisible"
              position="bottom"
              :content-style="{ padding: '0', maxWidth: '400px' }"
            >
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
                    <a-input 
                      :model-value="shareLink" 
                      readonly 
                      ref="linkInputRef" 
                      size="small"
                      style="flex: 1;"
                    />
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
                <a-doption key="settings" :value="{ action: 'settings' }">
                  <IconSettings style="margin-right: 8px;" /> 更多设置
                </a-doption>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
    </div>

    <a-spin :loading="loading" tip="正在加载知识库首页内容..." style="display: block;">
      <div v-if="content" class="content-container">
        <MarkdownPreview :content="content" :height="height" />
      </div>
      <div v-else-if="!loading" class="empty-container">
        <a-empty description="该用户未设置首页内容" />
      </div>
    </a-spin>


  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import api from '@/api/index.js';
import { useKbStore } from '../kbStore.js';
import { useUserStore } from '@/store/user';
import MarkdownPreview from '@/components/md/MarkdownPreview.vue';
import { IconShareInternal, IconMore, IconEdit, IconSettings, IconCopy } from '@arco-design/web-vue/es/icon';
import { Input } from '@arco-design/web-vue';

const route = useRoute();
const kbStore = useKbStore();
const userStore = useUserStore();
const content = ref('');
const loading = ref(false);
const height = ref('calc(100vh - 20px)'); // 设置合适的高度
const edit = ref(false)
const shareVisible = ref(false);
const linkInputRef = ref();
const shareLink = computed(() => {
  if (kbInfo.value && kbInfo.value.id) {
    return `${window.location.origin}/kb?kb=${kbInfo.value.id}`;
  }
  return '';
});
// 从store中获取kbInfo
const kbInfo = computed(() => {
  return kbStore.kbInfo;
});

// 检查编辑权限
onMounted(async () => {
  await loadKbIndexContent();
  const userInfo = await userStore.getUserInfo();
  if (kbStore.kbInfo && kbStore.kbInfo.userId == userInfo.id) {
    edit.value = true;
  }
});


// 获取知识库首页内容
const loadKbIndexContent = async () => {
  const kbParam = route.query.kb;
  if (kbParam) {
    const kbIdreq = kbParam;
    loading.value = true;
    Message.loading('加载知识库首页内容中...');
    try {
      const { data } = await api.get('/kb/index', { id: kbIdreq })
      content.value = data.index || '';
    } catch (error) {
      content.value = '加载内容失败，请稍后重试。';
    } finally {
      loading.value = false;
    }
    Message.clear();
  }
};

// 复制分享链接
const copyLink = async () => {
  try {
    if (navigator.clipboard && shareLink.value) {
      await navigator.clipboard.writeText(shareLink.value);
      Message.success('链接复制成功！');
    } else {
      // 降级方案：使用document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = shareLink.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      Message.success('链接复制成功！');
    }
  } catch (err) {
    console.error('复制链接失败:', err);
    Message.error('链接复制失败，请手动复制');
  }
};

// 处理更多操作
const handleMoreAction = (value) => {
  const action = value.action;
  switch (action) {
    case 'rename':
      Message.info('重命名功能待实现');
      // 这里可以触发重命名的逻辑
      break;
    case 'editIndex':
      Message.info('编辑首页功能待实现');
      // 这里可以触发编辑首页的逻辑
      break;
    case 'settings':
      Message.info('更多设置功能待实现');
      // 这里可以触发更多设置的逻辑
      break;
    default:
      console.warn('未知的操作:', action);
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
    align-items: center; /* 垂直居中对齐 */

    .copy-btn {
      flex-shrink: 0;
    }
  }
}
</style>