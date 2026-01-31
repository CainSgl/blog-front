<template>
  <a-spin :loading="loading" tip="正在加载文章内容..." style="display: block;">
    <div>
      <div style="padding:10px 0px;">
        <KBCardHeader :post-info="postInfo" :kb-id="kbId" :tree-data="treeData" :kb-info="kbInfo"
          :on-back="goBackFromHeader" />
      </div>
      <div style="height: 100%;padding-left:16px;">
        <MarkdownEditor :show-publish="true" v-model="textContent" :height="editorHeight" @go-back="goBack"
          @publish="publishArticle" />
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { Message, Modal } from '@arco-design/web-vue';
import MarkdownEditor from '@/components/md/MarkdownEditor.vue';
import KBCardHeader from '@/views/kb/components/KBCardHeader.vue';
import api from '@/api/index.js';
import { useKbStore } from '../kbStore.js';

const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();

// 响应式数据
const textContent = ref('');
const originalContent = ref(''); // 存储原始内容用于比较
const lastAutoSavedContent = ref(''); // 存储上次自动保存的内容
const lastAutoSavedTime = ref(0); // 存储上次自动保存的时间戳
let isAutoSave = false; // 自动保存的定时器（非响应式）
let localSaveCount = 0; // 本地保存计数器
const editorHeight = ref('calc(100vh - 194px)');
const loading = ref(false); // 控制文章加载时的旋转动画

// 从store中获取treeData
const treeData = computed(() => kbStore.treeData);
const kbId = computed(() => kbStore.kbId);
const kbInfo = computed(() => kbStore.kbInfo);

// 检查内容是否发生变化
const isContentChanged = computed(() => {
  return textContent.value !== originalContent.value;
});



// 页头返回函数 - 直接返回上一级，不询问是否发布
const goBackFromHeader = () => {
  router.push({ name: 'KBIndex', query: { kb: kbId.value } });
};
const publishArticle = () => {
  const postId = route.query.p;
  savePostContent(postId, textContent.value);
  kbStore.setCommitInfo(postInfo.value, textContent.value);
  router.push({ name: 'ArticleCommit', query: { kb: kbId.value, p: postInfo.value.postId } });
}


// 返回函数 - 从编辑器的返回按钮调用，会询问是否发布
const goBack = () => {
  if (postInfo.value.content != textContent.value) {
    const modalInstance = Modal.info({
      title: '发布文章',
      content: '是否前往发布页发布你的文章？\n注意：你当前修改的内容其他人无法访问，其他人只能看见曾经发布的版本 ',
      okText: '发布',
      footer: () => [
        h('button', {
          class: 'arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium',
          onClick: () => {
            publishArticle()
            modalInstance.close();
          }
        }, '发布'),
        h('button', {
          class: 'arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium',
          style: { marginLeft: '12px' },
          onClick: () => {
            router.push({ name: 'KBView', query: { kb: kbId.value, p: postInfo.value.postId } });
            modalInstance.close();
          }
        }, '取消')
      ]
    });
    return;
  }
  else {
    //直接不发布，反正也没修改，回到首页
    router.push({ name: 'KBIndex', query: { kb: kbId.value } });
  }
  //前往提交页面
  // router.push({ name: 'KBCommit', query: { kb: kbId.value, p: postInfo.value.postId } });
};
let saveLock = false;
// 保存文章内容
const savePostContent = async (postId, content, isAuto = false) => {
  if (saveLock) {
    return;
  }
  saveLock = true;

  try {
    Message.loading({
      id: 'saveInfo',
      content: isAuto ? '云保存中...' : '正在保存中...',
      duration: 15000
    });
    await api.put('/post', { id: postId, content, auto: isAuto });
    if (isAuto) {
      let know = localStorage.getItem('autoSave:know');
      Message.success(
        {
          id: 'saveInfo',
          content: '保存成功',
          duration: know ? 1500 : 3000,
        });
      if (!know) {
        setTimeout(() => {
          Message.info(
            {
              id: 'saveInfo',
              content: '自动保存不会生成历史版本信息哦，该信息只会提醒一次',
              duration: 15000,
              closable: true,
              onClose: () => {
                localStorage.setItem('autoSave:know', true);
              }
            });
        }, 2000);
        localStorage.setItem('autoSave:know', true);
      }
    }
    else {
      Message.success(
        {
          id: 'saveInfo',
          content: '保存成功',
          duration: 2000,
        });
    }
    postInfo.value.updatedAt = Date.now();
    lastAutoSavedTime.value = Date.now();
    // 更新上次自动保存的内容
    lastAutoSavedContent.value = textContent.value;
    // 同时更新原始内容，避免出现未保存提醒
    originalContent.value = textContent.value;
    localSaveCount = 0; // 重置计数器
    return true;
  }
  catch (error) {
    console.error('保存文章内容失败:', error);
    Message.error({
      id: 'saveInfo',
      content: '保存失败，已存放入本地缓存！',
      duration: 1500
    });
    for (let i = 0; ; i++) {
      let a = localStorage.getItem(`lastPostContentCache:${i}`);
      if (a && a.postId != postId) {
        continue;
      }
      localStorage.setItem(`lastPostContentCache:${i}`,
        {
          postId: postId,
          content: content,
          time: Date.now()
        }
      );
      break;
    }

    return false;
  }
  finally {
    saveLock = false;
  }
};

// 显示未保存提醒对话框
const showUnsavedChangesModal = (postName, postId, resolve) => {
  // 用于控制保存按钮的加载状态
  let isLoading = false;

  const modalInstance = Modal.confirm({
    content: `当前"${postName}"内容还未保存，是否保存？`,
    okText: '保存',
    cancelText: '取消',
    onCancel: () => {
      // 取消操作，不跳转
      resolve(false);
    },
    footer: () => [
      h('button', {
        class: `arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium ${isLoading ? 'arco-btn-loading' : 'arco-btn-status-normal'}`,
        onClick: async () => {
          // 防止重复点击
          if (isLoading) return;

          // 设置加载状态
          isLoading = true;
          modalInstance.update({
            footer: () => [
              h('button', {
                class: 'arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium arco-btn-loading',
                disabled: true
              }, '保存中...'),
              h('button', {
                class: ' arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal ',
                style: { marginRight: '12px' },
                disabled: true
              }, '取消'),
              h('button', {
                class: 'arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-danger',
                style: { marginRight: '12px' },
                disabled: true
              }, '放弃修改'),
            ]
          });

          // 执行保存操作
          const success = await savePostContent(postId, textContent.value);
          // if (success) {
          //   originalContent.value = textContent.value;
          // }

          // 恢复状态并关闭模态框
          isLoading = false;
          resolve(success);
          modalInstance.close();
        }
      }, isLoading ? '保存中...' : '保存'),
      h('button', {
        class: ' arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal ',
        style: { marginRight: '12px' },
        onClick: () => {
          // 取消操作，不跳转
          resolve(false);
          modalInstance.close();
        }
      }, '取消'),
      h('button', {
        class: 'arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-danger',
        style: { marginRight: '12px' },
        onClick: () => {
          // 放弃修改，直接跳转
          //   textContent.value = originalContent.value;
          resolve(true);
          modalInstance.close();
        }
      }, '放弃修改'),
    ]
  });
};

// 监听treeData的变化
watch(treeData, (newVal) => {
  if (newVal && newVal.length > 0) {
    const postId = route.query.p;
    if (postId) {
      // 面包屑现在由 KBCardHeader 组件处理
    }
  }
}, { deep: true });

// 监听文本内容变化，增加本地保存计数
watch(textContent, (newVal, oldVal) => {
  if (saveLock) {
    return;
  }
  // 每次内容变化，本地保存计数加1
  localSaveCount++;
});

// 自动保存定时器引用
let autoSaveInterval = null;

// 自动保存函数
const autoSave = async () => {
  if (isAutoSave || saveLock) {
    return;
  }

  isAutoSave = true;

  // 当本地保存次数达到10次以上时，才调用API进行云保存
  if (localSaveCount >= 10) {
    const postId = route.query.p;
    if (postId) {
      // 自动保存
      await savePostContent(postId, textContent.value, true);
    }
  }

  isAutoSave = false;
};

// 启动自动保存定时器
const startAutoSave = () => {
  // 先清理可能存在的旧定时器
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }

  // 每5秒检查一次是否需要自动保存
  autoSaveInterval = setInterval(autoSave, 1000);
};

// 停止自动保存定时器
const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
};

// 用于跟踪是否正在恢复路由，防止无限循环
let isRestoringRoute = false;

// 监听路由参数变化
watch(
  () => route.query.p,
  async (newPostId, oldPostId) => {
    // 如果正在恢复路由，则不执行检查
    if (isRestoringRoute) {
      return;
    }
    isRestoringRoute = true;
    if (newPostId && newPostId !== oldPostId) {
      // 检查是否有未保存的更改
      if (isContentChanged.value) {
        let currentPostName = postInfo.value.title || '文章';
        const shouldContinue = await new Promise((resolve) => {
          showUnsavedChangesModal(currentPostName, oldPostId, resolve);
        });
        if (shouldContinue) {
          console.log('用户放弃或已经保存了');
        }
      }
    }
    loadPostContent(newPostId);
    isRestoringRoute = false;
  }
);

// 处理键盘事件
const handleKeyDown = (event) => {
  // 检查是否按下了Ctrl+S或Cmd+S (Mac)
  if (originalContent.value !== textContent.value) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // 阻止浏览器默认的保存页面行为
      const postId = route.query.p;
      if (postId && textContent.value.trim()) {
        savePostContent(postId, textContent.value, false); // 手动保存
      }
    }
  }

};

// 组件挂载时的逻辑（如果需要）
onMounted(() => {
  const postId = route.query.p;
  console.log('Post ID from route:', postId, 'type:', typeof postId);
  if (postId) {
    // 先加载文章内容
    loadPostContent(postId);
  }

  // 初始化上次自动保存的内容和时间 
  lastAutoSavedContent.value = textContent.value;
  lastAutoSavedTime.value = Date.now();

  // 启动自动保存定时器
  startAutoSave();

  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeyDown);
});

// 组件卸载前清理定时器
onBeforeUnmount(() => {
  // 停止自动保存定时器
  stopAutoSave();

  // 移除键盘事件监听器
  document.removeEventListener('keydown', handleKeyDown);
});

// 路由离开前的守卫
onBeforeRouteLeave(async (to, from) => {
  // 检查是否有未保存的更改
  if (isContentChanged.value && !saveLock) {
    // 获取当前文章名称
    let currentPostName = postInfo.value.title || '文章';
    const postId = route.query.p;

    // 显示未保存提醒对话框
    const shouldContinue = await new Promise((resolve) => {
      showUnsavedChangesModal(currentPostName, postId, resolve);
    });

    // 如果用户选择取消，则阻止路由跳转
    if (!shouldContinue) {
      return false;
    }
  }
});

const postInfo = ref({});

const loadPostContent = async (postId) => {
  // 获取文章名称用于加载提示
  let postName = '文章';

  // 开始加载，设置loading为true
  loading.value = true;

  try {
    saveLock = true;

    // 先检查localStorage中是否有缓存
    let cachedContent = null;
    for (let i = 0; ; i++) {
      let cacheData = localStorage.getItem(`lastPostContentCache:${i}`);
      if (!cacheData) break;

      try {
        let parsed = JSON.parse(cacheData);
        if (parsed.postId == postId) {
          cachedContent = parsed;
          break;
        }
      }
      catch (e) {
        console.error('解析缓存数据失败:', e);
      }
    }

    const { data } = await api.get('/post/last', { id: postId });

    // 如果有缓存且缓存时间比服务器更新时间新，使用缓存内容
    if (cachedContent && cachedContent.time > data.updatedAt) {
      textContent.value = cachedContent.content || '';
      Message.info({
        content: '已加载本地缓存内容',
        duration: 2000
      });
    }
    else {
      textContent.value = data.content || '';
    }

    originalContent.value = data.content || ''; // 保存原始内容（服务器版本）
    lastAutoSavedContent.value = textContent.value; // 更新上次自动保存的内容
    saveLock = false;

    postInfo.value = data;
    lastAutoSavedTime.value = Date.now(); // 更新上次自动保存的时间
    localSaveCount = 0; // 重置计数器
  }
  catch (error) {
    console.error('加载文章内容失败:', error);
    Message.error(`加载${postName}失败`);
  }
  finally {
    // 加载完成，设置loading为false
    loading.value = false;
  }
};
</script>

<style scoped lang="less">
.last-item {
  font-weight: bold;
  color: #165DFF;
}

/* 未保存提醒模态框样式 */
.unsaved-changes-modal .arco-modal-footer {
  text-align: left;
}

.unsaved-changes-modal .arco-modal-footer button {
  margin-right: 10px;
}
</style>