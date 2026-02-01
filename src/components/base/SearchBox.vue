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
import {computed, onMounted, ref} from 'vue';
import {IconClose, IconDown, IconSearch} from '@arco-design/web-vue/es/icon';
import {useAuthStore} from '@/store/auth';
import {Message} from '@arco-design/web-vue';
import {useRoute, useRouter} from 'vue-router';

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
const route = useRoute();

// 从 URL 初始化搜索参数
onMounted(() => {
  if (route.query.query) {
    searchQuery.value = route.query.query;
  }
  if (route.query.mode) {
    searchMode.value = route.query.mode;
  }
  if (route.query.filters) {
    const urlFilters = route.query.filters.split(',');
    filters.value.forEach(filter => {
      filter.checked = urlFilters.includes(filter.value);
    });
  }
});

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

  // 构建搜索 URL
  const searchUrl = router.resolve({
    path: '/search',
    query: {
      mode: searchMode.value,
      query: searchQuery.value,
      filters: activeFilters.join(',')
    }
  });

  // 在新窗口打开搜索结果
  window.open(searchUrl.href, '_blank');
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
  background: color-mix(in srgb, var(--color-bg-2) 95%, transparent);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 0 8px 0 4px;
  border: 1px solid transparent;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-neutral-10) 8%, transparent);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 4px 16px color-mix(in srgb, var(--color-neutral-10) 15%, transparent);
  }

  &.focused {
    background: var(--color-bg-2);
  }
}

/* Mini 模式下的搜索框样式 */
.search-container:has(.search-mode-dropdown.mini) .search-box {
  height: 36px;
  border-radius: var(--border-radius-medium);
  border: 1px solid color-mix(in srgb, var(--color-neutral-10) 12%, transparent);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-neutral-10) 5%, transparent);
  background: color-mix(in srgb, var(--color-bg-2) 98%, transparent);

  &:hover {
    box-shadow: 0 2px 6px color-mix(in srgb, var(--color-neutral-10) 10%, transparent);
    border-color: color-mix(in srgb, var(--color-neutral-10) 18%, transparent);
  }

  &.focused {
    border-color: color-mix(in srgb, var(--color-neutral-10) 18%, transparent);
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
  background: color-mix(in srgb, var(--color-neutral-10) 3%, transparent);
  flex-shrink: 0; /* 防止被压缩 */

  &:hover {
    background: color-mix(in srgb, var(--color-neutral-10) 6%, transparent);
  }

  .mode-text {
    font-size: var(--font-size-body-3);
    color: var(--color-neutral-6);
    font-weight: 500;
    white-space: nowrap;
  }

  .dropdown-icon {
    color: var(--color-neutral-6);
    font-size: 12px;
    transition: transform 0.2s ease;
  }

  /* Mini 模式样式 */
  &.mini {
    padding: 4px 8px;
    gap: 3px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--color-neutral-10) 2%, transparent);

    &:hover {
      background: color-mix(in srgb, var(--color-neutral-10) 5%, transparent);
    }

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
  background: var(--color-bg-2);
  border-radius: 12px;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-neutral-10) 15%, transparent);
  padding: 8px;
}

.mode-option {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--color-neutral-10) 4%, transparent);
  }

  &.active {
    background: color-mix(in srgb, rgb(var(--primary-6)) 10%, transparent);

    .mode-label {
      color: rgb(var(--primary-6));
      font-weight: 600;
    }
  }

  .mode-label {
    font-size: var(--font-size-body-3);
    color: var(--color-neutral-10);
    font-weight: 500;
    margin-bottom: 2px;
  }

  .mode-desc {
    font-size: 12px;
    color: var(--color-neutral-6);
  }
}

/* 分隔线 */
.divider {
  width: 1px;
  height: 28px;
  background: color-mix(in srgb, var(--color-neutral-10) 10%, transparent);
  margin: 0 8px;
  flex-shrink: 0; /* 防止被压缩 */
}

/* 搜索图标 */
.search-icon {
  flex-shrink: 0;
  color: var(--color-neutral-4);
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
  color: var(--color-text-1);
  padding: 0 12px;
  font-family: inherit;

  &::placeholder {
    color: var(--color-text-4);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--color-fill-4);
    
    &::placeholder {
      color: var(--color-fill-4);
    }
  }
}

/* 清除按钮 - 使用 Arco Button */
.clear-btn {
  flex-shrink: 0;
  margin-right: 4px;
  
  :deep(.arco-btn) {
    color: var(--color-neutral-6);
    
    &:hover {
      background: color-mix(in srgb, var(--color-neutral-10) 6%, transparent);
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
  height: 30px;
  min-width: 56px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 0 14px;
}

/* Mini 模式下的分隔线 */
.search-container:has(.search-mode-dropdown.mini) .divider {
  height: 20px;
  margin: 0 6px;
}

/* Mini 模式下的搜索图标 */
.search-container:has(.search-mode-dropdown.mini) .search-icon {
  font-size: 16px;
  margin-left: 6px;
}

/* Mini 模式下的输入框 */
.search-container:has(.search-mode-dropdown.mini) .search-input {
  font-size: var(--font-size-body-3);
  padding: 0 10px;
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
    background: color-mix(in srgb, var(--color-bg-2) 90%, transparent);
    border-color: color-mix(in srgb, var(--color-neutral-10) 12%, transparent);
    color: var(--color-neutral-6);
    
    &:hover {
      background: var(--color-bg-2);
      border-color: color-mix(in srgb, var(--color-neutral-10) 20%, transparent);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-neutral-10) 8%, transparent);
    }
  }
  
  &:deep(.arco-btn-primary) {
    box-shadow: 0 2px 8px color-mix(in srgb, rgb(var(--primary-6)) 30%, transparent);
  }
  
  /* 子标签样式 - 稍微淡一点 */
  &.child-tag {
    &:deep(.arco-btn-outline) {
      background: color-mix(in srgb, var(--color-bg-2) 70%, transparent);
      border-color: color-mix(in srgb, var(--color-neutral-10) 8%, transparent);
      color: var(--color-neutral-4);
      font-size: 13px;
      
      &:hover {
        background: color-mix(in srgb, var(--color-bg-2) 85%, transparent);
        border-color: color-mix(in srgb, var(--color-neutral-10) 15%, transparent);
        color: var(--color-neutral-6);
      }
    }
    
    &:deep(.arco-btn-primary) {
      opacity: 0.85;
      box-shadow: 0 2px 6px color-mix(in srgb, rgb(var(--primary-6)) 20%, transparent);
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
    font-size: var(--font-size-body-3);
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
