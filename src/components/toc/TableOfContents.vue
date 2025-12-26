<template>
  <div v-if="treeData.length > 0" class="table-of-contents">
    <div class="toc-controls">
      <a-tooltip :content="isVisible ? '隐藏目录' : '显示目录'">
        <a-button 
          size="small" 
          @click="toggleVisibility"
        >
          <template #icon>
            <icon-eye v-if="!isVisible" />
            <icon-eye-invisible v-else />
          </template>
          {{ isVisible ? '隐藏' : '显示' }}
        </a-button>
      </a-tooltip>
      <a-tooltip :content="isAllExpanded ? '收起全部' : '展开全部'">
        <a-button 
          size="small" 
          @click="toggleExpandAll"
        >
          <template #icon>
            <icon-shrink v-if="!isAllExpanded" />
            <icon-shrink v-else />
          </template>
          {{ isAllExpanded ? '收起全部' : '展开全部' }}
        </a-button>
      </a-tooltip>
    </div>
    <div v-show="isVisible" class="toc-content">
      <a-tree
        :data="treeData"
        :expanded-keys="expandedKeys"
        :show-line="false"
        :block-node="true"
        :selected-keys="selectedKeys"
        @select="handleNodeClick"
        @expand="handleExpand"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { parseMarkdownToTree } from '@/utils/markdownToTree.js';
import { IconEye, IconEyeInvisible, IconExpand, IconShrink } from '@arco-design/web-vue/es/icon';


// 定义组件props
const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

// 定义组件事件
const emit = defineEmits(['visibilityChange']);

// 响应式数据
const treeData = ref([]);
const selectedKeys = ref([]);
const defaultExpandedKeys = ref([]);
const expandedKeys = ref([]);
const userExpandedKeys = ref(new Set()); // 记录用户手动展开的节点
const isVisible = ref(true); // 控制目录显示/隐藏
const isAllExpanded = ref(false); // 控制是否全部展开

// 计算默认展开的节点（只展开第一级）
const computeDefaultExpandedKeys = () => {
  const keys = [];
  
  const collectLevelKeys = (nodes, maxLevel, currentLevel = 1) => {
    for (const node of nodes) {
      if (currentLevel <= maxLevel) {
        keys.push(node.key);
        if (node.children && node.children.length > 0 && currentLevel < maxLevel) {
          collectLevelKeys(node.children, maxLevel, currentLevel + 1);
        }
      }
    }
  };
  
  if (treeData.value && treeData.value.length > 0) {
    collectLevelKeys(treeData.value, 1); // 只展开到第一级
    defaultExpandedKeys.value = keys;
    // 将默认展开的节点也视为用户展开的节点
    userExpandedKeys.value = new Set(keys);
  } else {
    defaultExpandedKeys.value = [];
    userExpandedKeys.value.clear();
  }
};

// 展开所有节点
const expandAllNodes = (nodes) => {
  const keys = new Set();
  const collectKeys = (nodeList) => {
    for (const node of nodeList) {
      if (node.children && node.children.length > 0) {
        keys.add(node.key);
        collectKeys(node.children);
      }
    }
  };
  collectKeys(nodes);
  return Array.from(keys);
};

// 收起所有节点
const collapseAllNodes = () => {
  return [];
};

// 切换展开/收起全部
const toggleExpandAll = () => {
  if (isAllExpanded.value) {
    // 收起全部，只保留默认展开的节点
    expandedKeys.value = [...defaultExpandedKeys.value];
    isAllExpanded.value = false;
  } else {
    // 展开全部
    const allExpandedKeys = expandAllNodes(treeData.value);
    expandedKeys.value = [...new Set([...allExpandedKeys, ...Array.from(userExpandedKeys.value)])];
    // 将所有展开的节点都记录为用户展开的节点
    allExpandedKeys.forEach(key => userExpandedKeys.value.add(key));
    isAllExpanded.value = true;
  }
};

// 切换显示/隐藏
const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
  // 通知父组件显示/隐藏状态已改变
  emit('visibilityChange', isVisible.value);
};

// 查找节点路径的辅助函数
const findNodePath = (nodes, targetKey, path = []) => {
  for (const node of nodes) {
    const currentPath = [...path, node.key];
    if (node.key === targetKey) {
      return currentPath;
    }
    if (node.children && node.children.length > 0) {
      const result = findNodePath(node.children, targetKey, currentPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
};


// 监听hash变化的函数
const handleHashChange = () => {
  let hash = window.location.hash.substring(1); // 移除 # 符号
  try {
    hash = decodeURIComponent(hash);
  } catch (e) {
    console.warn('无法解码hash值:', hash);
  }
  if (hash) {
    // 更新选中的节点
    selectedKeys.value = [hash];
    
    // 查找节点路径并展开
    const path = findNodePath(treeData.value, hash);
    if (path) {
      // 包含路径上的所有节点（包括目标节点）
      const pathKeys = [...path];
      // 合并默认展开的节点、路径节点和用户手动展开的节点
      expandedKeys.value = [...new Set([...defaultExpandedKeys.value, ...pathKeys, ...Array.from(userExpandedKeys.value)])];
      isAllExpanded.value = false; // 如果是展开到特定节点，那么不是全部展开状态
    } else {
      // 如果找不到节点，合并默认展开的节点和用户手动展开的节点
      expandedKeys.value = [...new Set([...defaultExpandedKeys.value, ...Array.from(userExpandedKeys.value)])];
    }
  } else {
    selectedKeys.value = [];
    expandedKeys.value = [...new Set([...defaultExpandedKeys.value, ...Array.from(userExpandedKeys.value)])];
  }
};

// 监听content变化，重新解析markdown生成目录树
watch(
  () => props.content,
  (newContent) => {
    if (newContent) {
      try {
        treeData.value = parseMarkdownToTree(newContent);
        computeDefaultExpandedKeys(); // 更新默认展开的节点
      
      } catch (error) {
        console.error('解析markdown目录失败:', error);
        treeData.value = [];
        defaultExpandedKeys.value = [];
      }
    } else {
      treeData.value = [];
      defaultExpandedKeys.value = [];
    }
  },
  { immediate: true }
);

// 组件挂载时添加hashchange监听器
onMounted(() => {
  window.addEventListener('hashchange', handleHashChange);
  // 初始化时也检查一次hash
  handleHashChange();
});

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange);
  // 组件卸载时清除hash值
  if (window.location.hash) {
    const newURL = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', newURL);
  }
});

// 处理节点展开/收起事件
const handleExpand = (keys) => {
  // 计算用户新增展开的节点（在 keys 中但不在 expandedKeys 中的节点）
  const currentKeysSet = new Set(expandedKeys.value);
  const newKeysSet = new Set(keys);
  
  // 添加新展开的节点到用户展开集合
  keys.forEach(key => {
    if (!currentKeysSet.has(key)) {
      userExpandedKeys.value.add(key);
    }
  });
  
  // 从用户展开集合中移除被收起的节点
  expandedKeys.value.forEach(key => {
    if (!newKeysSet.has(key)) {
      userExpandedKeys.value.delete(key);
    }
  });
  
  expandedKeys.value = keys;
  
  // 检查是否全部展开
  const allKeys = new Set();
  const collectAllKeys = (nodes) => {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        allKeys.add(node.key);
        collectAllKeys(node.children);
      }
    }
  };
  collectAllKeys(treeData.value);
  
  isAllExpanded.value = allKeys.size === 0 || keys.length === allKeys.size;
};

// 处理节点点击事件
const handleNodeClick = (node) => {
  const id =  node[0]; 
  // 将被点击的节点添加到用户展开的节点集合中
  userExpandedKeys.value.add(id);
  // 使用replaceState来设置hash，避免产生历史记录
  const oldHash = window.location.hash;
  const newURL = window.location.pathname + window.location.search + '#' + id;
  window.history.replaceState(null, '', newURL);
  
  // 手动触发hashchange事件，以便其他组件能响应hash变化
  if (oldHash !== '#' + id) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
};
</script>

<style scoped lang="less">
.table-of-contents {
  padding: 10px 5px;
  width: 100%;
}

.toc-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 8px;
}

.toc-content {
  width: 100%;
}

.empty-toc {
  padding: 10px;
  color: var(--color-text-4);
  font-style: italic;
  text-align: center;
}

:deep(.arco-tree-node-title) {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

:deep(.arco-tree-node-title-text) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
}

:deep(.arco-tree-node-title-content) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
  font-size: 12px;
}

:deep(.arco-tree-node-title:hover) {
  background-color: var(--color-fill-2);
}

/* 选中节点的样式 */
:deep(.arco-tree-node-selected .arco-tree-node-title) {
  background-color: @primary-8!important;
  color: var(--color-text-1) !important;
  font-weight: 500;
}

:deep(.arco-tree-node-indent-unit) {
  width: 16px;
}

/* 调整不同层级的缩进 */
:deep(.arco-tree-node-children) {
  margin-left: 16px;
}
</style>