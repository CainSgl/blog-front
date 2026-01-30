<template>
  <div v-if="treeData.length > 0" class="table-of-contents" ref="containerRef">
    <a-affix :offsetTop="0" :target="affixTarget ? affixTarget : containerRef">
      <div class="toc-controls">
        <a-tooltip :content="isVisible ? '隐藏目录' : '显示目录'">
          <a-button size="small" @click="toggleVisibility">
            <template #icon>
              <icon-eye v-if="!isVisible" />
              <icon-eye-invisible v-else />
            </template>
            {{ isVisible ? '隐藏' : '显示' }}
          </a-button>
        </a-tooltip>
        <a-tooltip :content="isAllExpanded ? '收起全部' : '展开全部'">
          <a-button size="small" @click="toggleExpandAll">
            <template #icon>
              <icon-shrink v-if="!isAllExpanded" />
              <icon-shrink v-else />
            </template>
            {{ isAllExpanded ? '收起全部' : '展开全部' }}
          </a-button>
        </a-tooltip>
      </div>
    </a-affix>
    <div v-show="isVisible" class="toc-content">
      <a-tree :data="treeData" :expanded-keys="expandedKeys" :show-line="false" :block-node="true"
        :selected-keys="selectedKeys" @select="handleNodeClick" @expand="handleExpand" />
    </div>
  </div>
</template>

<script setup>
import {nextTick, onMounted, ref, watch} from 'vue';
import {parseMarkdownToTree} from '@/utils/markdownToTree.js';
import {IconEye, IconEyeInvisible, IconShrink} from '@arco-design/web-vue/es/icon';
import {useTocStore} from './toc.js';
import {storeToRefs} from 'pinia';

const containerRef = ref(null);
// 定义组件props
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  affixTarget: {
    type: [String, Element],
    default: null
  },
  noControle: {
    type: Boolean,
    default: false
  },
  tocDefaultShow:{
    type:Boolean,
    default:true
  }
});

// 定义组件事件
const emit = defineEmits(['visibilityChange', 'hasData']);

// 响应式数据
const treeData = ref([]);
const selectedKeys = ref([]);
const expandedKeys = ref([]);
const userExpandedKeys = ref(new Set()); // 记录用户手动展开的节点
const isVisible = ref(props.tocDefaultShow); // 控制目录显示/隐藏，根据 tocDefaultShow 初始化
const isAllExpanded = ref(false); // 控制是否全部展开

// 使用Pinia store
const tocStore = useTocStore();
const { currentTocItem } = storeToRefs(tocStore);

// 展开所有节点
const expandAllNodes = (nodes) => 
{
  const keys = new Set();
  const collectKeys = (nodeList) => 
  {
    for (const node of nodeList) 
    {
      if (node.children && node.children.length > 0) 
      {
        keys.add(node.key);
        collectKeys(node.children);
      }
    }
  };
  collectKeys(nodes);
  return Array.from(keys);
};


// 切换展开/收起全部
const toggleExpandAll = () => 
{
  if (isAllExpanded.value) 
  {
    // 收起全部
    expandedKeys.value = [];
    userExpandedKeys.value.clear();
    isAllExpanded.value = false;
  }
  else 
  {
    // 展开全部
    const allExpandedKeys = expandAllNodes(treeData.value);
    expandedKeys.value = allExpandedKeys;
    // 将所有展开的节点都记录为用户展开的节点
    allExpandedKeys.forEach(key => userExpandedKeys.value.add(key));
    isAllExpanded.value = true;
  }
};

// 切换显示/隐藏
const toggleVisibility = () => 
{
  isVisible.value = !isVisible.value;
  // 通知父组件显示/隐藏状态已改变
  emit('visibilityChange', isVisible.value);
};

// 查找节点路径的辅助函数
const findNodePath = (nodes, targetKey, path = []) => 
{
  for (const node of nodes) 
  {
    const currentPath = [...path, node.key];
    if (node.key === targetKey) 
    {
      return currentPath;
    }
    if (node.children && node.children.length > 0) 
    {
      const result = findNodePath(node.children, targetKey, currentPath);
      if (result) 
      {
        return result;
      }
    }
  }
  return null;
};


// 监听Pinia状态变化的函数
const handleTocItemChange = () => 
{
  const hash = currentTocItem.value;
  if (hash) 
  {
    // 更新选中的节点
    selectedKeys.value = [hash];

    // 查找节点路径并展开
    const path = findNodePath(treeData.value, hash);
    if (path) 
    {
      // 包含路径上的所有节点（包括目标节点）
      const pathKeys = [...path];
      // 合并路径节点和用户手动展开的节点
      expandedKeys.value = [...new Set([...pathKeys, ...Array.from(userExpandedKeys.value)])];
      isAllExpanded.value = false; // 如果是展开到特定节点，那么不是全部展开状态
    }
    else 
    {
      // 如果找不到节点，只保留用户手动展开的节点
      expandedKeys.value = [...Array.from(userExpandedKeys.value)];
    }

    // 在DOM更新后滚动到选中的节点
    nextTick(() => 
    {
      scrollToSelectedItem(hash);
    });
  }
  else 
  {
    selectedKeys.value = [];
    expandedKeys.value = [...Array.from(userExpandedKeys.value)];
  }
};

// 监听content变化，重新解析markdown生成目录树
watch(
  () => props.content,
  (newContent) => 
  {
    if (newContent) 
    {
      try 
      {
        treeData.value = parseMarkdownToTree(newContent);
      }
      catch (error) 
      {
        console.error('解析markdown目录失败:', error);
        treeData.value = [];
      }
    }
    else 
    {
      treeData.value = [];
    }

    // 通知父组件 treeData 是否有数据
    emit('hasData', treeData.value.length > 0);
  },
  { immediate: true }
);

// 监听Pinia状态变化
watch(
  () => currentTocItem.value,
  () => 
  {
    handleTocItemChange();
  },
  { immediate: true }
);

// 组件挂载时添加Pinia状态监听器
onMounted(() => 
{
  // 初始化toc store
  tocStore.initializeFromUrl();
  // 初始化时也检查一次状态
  handleTocItemChange();
  // 通知父组件初始的可见性状态
  emit('visibilityChange', isVisible.value);
});



// 处理节点展开/收起事件
const handleExpand = (keys) => 
{
  // 计算用户新增展开的节点（在 keys 中但不在 expandedKeys 中的节点）
  const currentKeysSet = new Set(expandedKeys.value);
  const newKeysSet = new Set(keys);

  // 添加新展开的节点到用户展开集合
  keys.forEach(key => 
  {
    if (!currentKeysSet.has(key)) 
    {
      userExpandedKeys.value.add(key);
    }
  });

  // 从用户展开集合中移除被收起的节点
  expandedKeys.value.forEach(key => 
  {
    if (!newKeysSet.has(key)) 
    {
      userExpandedKeys.value.delete(key);
    }
  });

  expandedKeys.value = keys;

  // 检查是否全部展开
  const allKeys = new Set();
  const collectAllKeys = (nodes) => 
  {
    for (const node of nodes) 
    {
      if (node.children && node.children.length > 0) 
      {
        allKeys.add(node.key);
        collectAllKeys(node.children);
      }
    }
  };
  collectAllKeys(treeData.value);

  isAllExpanded.value = allKeys.size === 0 || keys.length === allKeys.size;
};

// 滚动到选中的节点
const scrollToSelectedItem = (key) => 
{
  // 使用nextTick确保DOM完全更新后查找元素
  nextTick(() => 
  {
    // 尝试多种选择器来定位Arco Design Tree节点
    let selectedElement = document.querySelector(`.arco-tree-node[data-key="${key}"]`);

    // 如果上面的选择器没找到，尝试另一种可能的选择器
    if (!selectedElement) 
    {
      selectedElement = document.querySelector(`[data-key="${key}"] .arco-tree-node-title`);
    }

    if (!selectedElement) 
    {
      selectedElement = document.querySelector(`[data-key="${key}"]`);
    }

    if (selectedElement) 
    {
      const container = containerRef.value;
      if (container) 
      {
        // 计算元素相对于容器的滚动位置
        const elementTop = selectedElement.offsetTop;
        const elementHeight = selectedElement.offsetHeight;
        const containerHeight = container.clientHeight;
        const currentScrollTop = container.scrollTop;

        // 计算元素在容器中的位置
        const elementPositionTop = elementTop - currentScrollTop;

        // 检查元素是否在可视区域外
        const isBelowViewport = elementPositionTop + elementHeight > containerHeight;

        // 只有在元素在视窗下方时才滚动
        if (isBelowViewport) 
        {
          // 滚动到元素位置，确保元素在视窗中间偏上（约15%的位置）
          let scrollPosition = elementTop - (containerHeight * 0.15) - (elementHeight / 2);

          // 确保滚动位置不会超出容器范围
          scrollPosition = Math.max(0, Math.min(scrollPosition, container.scrollHeight - containerHeight));

          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  });
};

// 处理节点点击事件
const handleNodeClick = (node) => 
{
  const id = node[0];
  // 将被点击的节点添加到用户展开的节点集合中
  userExpandedKeys.value.add(id);
  // 调用Pinia store的方法设置当前TOC项
  tocStore.setCurrentTocItem(id);
  // 同步到URL hash
  tocStore.syncToUrl(id);
};
</script>

<style scoped lang="less">
.table-of-contents {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  padding: 10px 5px;
  width: 100%;
  overflow-x:hidden;
  overflow-y:auto;
}

.toc-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 8px;
  background-color: @color-bg-white;
  padding: 10px 0;
}

.toc-content {
  width: 100%;
  height: 100%;
}

.empty-toc {
  padding: 10px;
  color: @color-text-4;
  font-style: italic;
  text-align: center;
}

:deep(.arco-tree-node-title) {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;

  text-overflow: ellipsis;
  max-width: 100%;
}

:deep(.arco-tree-node-title-text) {
  white-space: nowrap;

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
  background-color: @color-fill-2;
}

/* 选中节点的样式 */
:deep(.arco-tree-node-selected .arco-tree-node-title) {
  background-color: @primary-8 !important;
  color: @color-text-1 !important;
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