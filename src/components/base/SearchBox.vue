<template>
  <div class="search-container">
    <div class="search-wrapper">
      <!-- 主搜索框 -->
      <div class="search-box" :class="{ 'focused': isFocused }">
        <!-- 搜索模式选择器 -->
        <div class="search-mode-dropdown" @click="toggleModeDropdown">
          <span class="mode-text">{{ getModeLabel(searchMode) }}</span>
          <icon-down class="dropdown-icon" :class="{ 'open': showModeDropdown }" />
          
          <!-- 下拉菜单 -->
          <div v-if="showModeDropdown" class="mode-dropdown-menu">
            <div 
              v-for="mode in searchModes" 
              :key="mode.value"
              class="mode-option"
              :class="{ 'active': searchMode === mode.value }"
              @click.stop="selectMode(mode.value)"
            >
              <span class="mode-label">{{ mode.label }}</span>
              <span v-if="mode.desc" class="mode-desc">{{ mode.desc }}</span>
            </div>
          </div>
        </div>

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

// 组件内部状态
const searchMode = ref('term');
const searchQuery = ref('');
const isFocused = ref(false);
const showModeDropdown = ref(false);

// 获取认证状态
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.checkLogin());

// 搜索模式配置
const searchModes = [
  { value: 'term', label: '词项搜索', desc: '快速匹配关键词' },
  { value: 'semantic', label: '语义搜索', desc: '理解搜索意图' },
  { value: 'precise', label: '精准搜索', desc: '精确语义匹配' }
];

// 过滤器配置
const filters = ref([
  { value: 'user', label: '用户', checked: true },
  { value: 'post', label: '文章', checked: true },
  { value: 'kb', label: '知识库', checked: true }
]);

// 判断是否显示过滤器（只在词项搜索时显示）
const showFilters = computed(() => searchMode.value === 'term');

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

// 切换模式下拉菜单
const toggleModeDropdown = () => {
  showModeDropdown.value = !showModeDropdown.value;
};

// 选择搜索模式
const selectMode = (value) => {
  // 如果选择精准搜索但未登录，提示登录
  if (value === 'precise' && !isLoggedIn.value) {
    Message.warning('精准搜索需要登录，请先登录');
    showModeDropdown.value = false;
    return;
  }
  
  searchMode.value = value;
  showModeDropdown.value = false;
};

// 处理失焦
const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false;
    showModeDropdown.value = false;
  }, 200);
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
};

// 切换过滤器
const toggleFilter = (filter) => {
  filter.checked = !filter.checked;
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

  console.log('搜索:', {
    mode: searchMode.value,
    query: searchQuery.value,
    filters: activeFilters
  });

  // TODO: 在这里实现搜索逻辑
};
</script>

<style scoped lang="less">
.search-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.search-wrapper {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
}

/* 主搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
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

/* 搜索模式下拉选择器 */
.search-mode-dropdown {
  position: relative;
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

    &.open {
      transform: rotate(180deg);
    }
  }
}

/* 下拉菜单 */
.mode-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  flex-shrink: 0;
  height: 40px;
  border-radius: 20px;
  font-weight: 500;
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
    padding: 6px 10px;

    .mode-text {
      font-size: 13px;
    }
  }

  .search-input {
    font-size: 15px;
  }

  .search-btn {
    height: 36px;
    
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
  }

  .search-mode-dropdown {
    .mode-text {
      font-size: 12px;
    }
  }

  .search-input {
    font-size: 14px;
    padding: 0 8px;
  }

  .search-btn {
    :deep(.arco-btn) {
      font-size: 12px;
    }
  }
}
</style>
