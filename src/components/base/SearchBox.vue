<template>
  <div class="search-container">
    <div class="search-wrapper">
      <!-- 主搜索框 -->
      <div class="search-box" :class="{ 'focused': isFocused }">
        <a-trigger
          trigger="click"
          position="bl"
          :popup-offset="8"
          :unmount-on-close="false"
        >
          <div class="search-mode-dropdown" :class="{ 'mini': mini }">
            <span class="mode-text">{{ getModeLabel(searchMode) }}</span>
            <icon-down class="dropdown-icon" />
          </div>
          
          <template #content>
            <div class="mode-dropdown-menu">
              <div 
                v-for="mode in searchModes" 
                :key="mode.value"
                class="mode-option"
                :class="{ 'active': searchMode === mode.value }"
                @click="selectMode(mode.value)"
              >
                <span class="mode-label">{{ mode.label }}</span>
                <span v-if="mode.desc" class="mode-desc">{{ mode.desc }}</span>
              </div>
            </div>
          </template>
        </a-trigger>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 搜索图标 -->
        <icon-search class="search-icon" />

        <!-- 输入框 -->
        <input 
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="inputPlaceholder"
          :disabled="isInputDisabled"
          @focus="isFocused = true"
          @blur="handleBlur"
          @keyup.enter="handleSearch"
        />

        <!-- 清除按钮 -->
        <a-button 
          v-if="searchQuery"
          class="clear-btn"
          type="text"
          shape="circle"
          size="small"
          @click="clearSearch"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>

        <!-- 搜索按钮 -->
        <a-button 
          class="search-btn" 
          type="primary"
          @click="handleSearch"
        >
          搜索
        </a-button>
      </div>

      <!-- 搜索过滤选项 - 只在词项搜索时显示 -->
      <div v-if="showFilters" class="search-filters">
        <a-button 
          v-for="filter in filters" 
          :key="filter.value"
          class="filter-tag"
          :class="{ 'child-tag': filter.isChild }"
          :type="filter.checked ? 'primary' : 'outline'"
          shape="round"
          @click="toggleFilter(filter)"
        >
          {{ filter.label }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { IconSearch, IconClose, IconDown } from '@arco-design/web-vue/es/icon';
import { useAuthStore } from '@/store/auth';
import { Message } from '@arco-design/web-vue';
import { useRouter } from 'vue-router';

// Props
const props = defineProps({
  alwaysShowFilter: {
    type: Boolean,
    default: true
  },
  mini: {
    type: Boolean,
    default: false
  }
});

// 组件内部状态
const searchMode = ref('term');
const searchQuery = ref('');
const isFocused = ref(false);

// 获取认证状态
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.checkLogin());

// 路由
const router = useRouter();

// 搜索模式配置
const searchModes = [
  { value: 'term', label: '词项搜索', desc: '快速匹配关键词' },
  { value: 'semantic', label: '语义搜索', desc: '理解搜索意图' },
  { value: 'precise', label: '精准搜索', desc: '精确语义匹配' }
];

// 过滤器配置
const filters = ref([
  { value: 'title', label: '标题', checked: true, isParent: true },
  { value: 'content', label: '内容', checked: true, isChild: true, parent: 'title' },
  { value: 'tag', label: '标签', checked: true, isChild: true, parent: 'title' },
  { value: 'user', label: '用户', checked: true },
  { value: 'kb', label: '知识库', checked: true }
]);

// 判断是否显示过滤器（只在词项搜索时显示，且 alwaysShowFilter 为 true）
const showFilters = computed(() => props.alwaysShowFilter && searchMode.value === 'term');

// 判断输入框是否禁用（精准搜索且未登录时禁用）
const isInputDisabled = computed(() => searchMode.value === 'precise' && !isLoggedIn.value);

// 获取输入框占位符
const inputPlaceholder = computed(() => {
  if (isInputDisabled.value) {
    return '请先登录后使用精准搜索...';
  }
  return '搜索内容...';
});

// 获取模式标签
const getModeLabel = (value) => {
  return searchModes.find(m => m.value === value)?.label || '词项搜索';
};

// 选择搜索模式
const selectMode = (value) => {
  // 如果选择精准搜索但未登录，提示登录
  if (value === 'precise' && !isLoggedIn.value) {
    Message.warning('精准搜索需要登录，请先登录');
    return;
  }
  
  searchMode.value = value;
};

// 处理失焦
const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false;
  }, 200);
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
};

// 切换过滤器
const toggleFilter = (filter) => {
  const newChecked = !filter.checked;
  
  // 如果是子标签（内容或标签）
  if (filter.isChild) {
    // 选中子标签时，自动选中父标签
    if (newChecked) {
      const parentFilter = filters.value.find(f => f.value === filter.parent);
      if (parentFilter && !parentFilter.checked) {
        parentFilter.checked = true;
        Message.info(`无法单独选中"${filter.label}"，已为你自动勾选"${parentFilter.label}"`);
      }
    }
    filter.checked = newChecked;
  }
  // 如果是父标签（标题）
  else if (filter.isParent) {
    filter.checked = newChecked;
    // 取消父标签时，自动取消所有子标签
    if (!newChecked) {
      filters.value.forEach(f => {
        if (f.isChild && f.parent === filter.value) {
          f.checked = false;
        }
      });
    }
  }
  // 普通标签（用户、知识库）
  else {
    filter.checked = newChecked;
  }
  
  // 检查至少选中一个主标签（标题、用户、知识库）
  const mainFilters = filters.value.filter(f => !f.isChild);
  const hasChecked = mainFilters.some(f => f.checked);
  
  if (!hasChecked) {
    filter.checked = true;
    Message.warning('至少需要选择一个搜索范围（标题、用户或知识库）');
  }
};

// 搜索处理函数
const handleSearch = () => {
  // 如果输入框被禁用，提示登录
  if (isInputDisabled.value) {
    Message.warning('精准搜索需要登录，请先登录');
    return;
  }

  if (!searchQuery.value.trim()) return;

  const activeFilters = searchMode.value === 'term' 
    ? filters.value.filter(f => f.checked).map(f => f.value)
    : [];

  // 跳转到搜索页面
  router.push({
    path: '/search',
    query: {
      mode: searchMode.value,
      query: searchQuery.value,
      filters: activeFilters.join(',')
    }
  });
};
</script>

<style scoped lang="less">
.search-container {
  width: 100%;
  max-width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  box-sizing: border-box;
}

.search-wrapper {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 主搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0; /* 允许 flex 子元素收缩 */
  height: 48px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 0 8px 0 4px;
  border: 1px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &.focused {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 1);
    border-color: #333;
  }
}

/* Mini 模式下的搜索框样式 */
.search-container:has(.search-mode-dropdown.mini) .search-box {
  
  border:1px solid rgba(0, 0, 0, 0.151);
  box-shadow: none;

  &:hover {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  &.focused {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    
  }
}

/* 搜索模式下拉选择器 */
.search-mode-dropdown {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-left: 4px;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.03);
  flex-shrink: 0; /* 防止被压缩 */

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .mode-text {
    font-size: 14px;
    color: #5f6368;
    font-weight: 500;
    white-space: nowrap;
  }

  .dropdown-icon {
    color: #5f6368;
    font-size: 12px;
    transition: transform 0.2s ease;
  }

  /* Mini 模式样式 */
  &.mini {
    padding: 6px 10px;
    gap: 4px;

    .mode-text {
      font-size: 12px;
    }

    .dropdown-icon {
      font-size: 10px;
    }
  }
}

/* 下拉菜单 */
.mode-dropdown-menu {
  min-width: 200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 8px;
}

.mode-option {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &.active {
    background: rgba(66, 133, 244, 0.1);

    .mode-label {
      color: #1a73e8;
      font-weight: 600;
    }
  }

  .mode-label {
    font-size: 14px;
    color: #202124;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .mode-desc {
    font-size: 12px;
    color: #5f6368;
  }
}

/* 分隔线 */
.divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 8px;
  flex-shrink: 0; /* 防止被压缩 */
}

/* 搜索图标 */
.search-icon {
  flex-shrink: 0;
  color: #9aa0a6;
  margin-left: 8px;
  font-size: 18px;
}

/* 输入框 */
.search-input {
  flex: 1;
  min-width: 0; /* 允许输入框收缩 */
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #202124;
  padding: 0 12px;
  font-family: inherit;

  &::placeholder {
    color: #9aa0a6;
  }

  &:disabled {
    cursor: not-allowed;
    color: #c9cdd4;
    
    &::placeholder {
      color: #c9cdd4;
    }
  }
}

/* 清除按钮 - 使用 Arco Button */
.clear-btn {
  flex-shrink: 0;
  margin-right: 4px;
  
  :deep(.arco-btn) {
    color: #5f6368;
    
    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
  }
}

/* 搜索按钮 - 使用 Arco Button */
.search-btn {
  flex-shrink: 0; /* 防止被压缩 */
  height: 40px;
  min-width: 60px; /* 确保最小宽度 */
  border-radius: 20px;
  font-weight: 500;
}

/* Mini 模式下的搜索按钮 */
.search-container:has(.search-mode-dropdown.mini) .search-btn {
  height: 28px;
  min-width: 50px;
  border-radius: 6px;
  font-size: 13px;
}

/* 搜索过滤选项 - 使用 Arco Button */
.search-filters {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.filter-tag {
  backdrop-filter: blur(10px);
  
  &:deep(.arco-btn-outline) {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.12);
    color: #5f6368;
    
    &:hover {
      background: rgba(255, 255, 255, 1);
      border-color: rgba(0, 0, 0, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }
  
  &:deep(.arco-btn-primary) {
    box-shadow: 0 2px 8px rgba(var(--primary-6), 0.3);
  }
  
  /* 子标签样式 - 稍微淡一点 */
  &.child-tag {
    &:deep(.arco-btn-outline) {
      background: rgba(255, 255, 255, 0.7);
      border-color: rgba(0, 0, 0, 0.08);
      color: #8a8f99;
      font-size: 13px;
      
      &:hover {
        background: rgba(255, 255, 255, 0.85);
        border-color: rgba(0, 0, 0, 0.15);
        color: #5f6368;
      }
    }
    
    &:deep(.arco-btn-primary) {
      opacity: 0.85;
      box-shadow: 0 2px 6px rgba(var(--primary-6), 0.2);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-wrapper {
    max-width: 100%;
    padding: 0;
  }

  .search-box {
    height: 44px;
    border-radius: 22px;
  }

  .search-mode-dropdown {
    padding: 6px 8px;

    .mode-text {
      font-size: 13px;
    }
  }

  .divider {
    margin: 0 6px;
  }

  .search-input {
    font-size: 15px;
    padding: 0 8px;
  }

  .search-btn {
    height: 36px;
    min-width: 56px;
    
    :deep(.arco-btn) {
      height: 36px;
      font-size: 13px;
    }
  }
}

@media (max-width: 480px) {
  .search-container {
    padding: 0 12px;
  }

  .search-box {
    height: 42px;
    padding: 0 6px 0 4px;
  }

  .search-mode-dropdown {
    padding: 6px 8px;
    margin-left: 2px;

    .mode-text {
      font-size: 12px;
    }
  }

  .divider {
    margin: 0 4px;
  }

  .search-icon {
    margin-left: 4px;
    font-size: 16px;
  }

  .search-input {
    font-size: 14px;
    padding: 0 6px;
  }

  .clear-btn {
    margin-right: 2px;
  }

  .search-btn {
    height: 34px;
    min-width: 50px;
    
    :deep(.arco-btn) {
      height: 34px;
      font-size: 12px;
      padding: 0 12px;
    }
  }
}
</style>
