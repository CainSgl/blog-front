<template>
  <a-dropdown trigger="hover">
    <div class="theme-switcher">
        <component :is="currentThemeIcon" :size="20" />
    </div>
    <template #content>
      <a-doption @click="changeTheme('light')">
        <template #icon>
          <icon-sun-fill />
        </template>
        浅色模式
      </a-doption>
      <a-doption @click="changeTheme('dark')">
        <template #icon>
          <icon-moon-fill />
        </template>
        深色模式
      </a-doption>
      <a-doption @click="changeTheme('auto')">
        <template #icon>
          <icon-desktop />
        </template>
        跟随系统
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { IconSunFill, IconMoonFill, IconDesktop } from '@arco-design/web-vue/es/icon';

// 主题切换相关
const currentTheme = ref(localStorage.getItem('theme') || 'auto');

const currentThemeIcon = computed(() => {
  if (currentTheme.value === 'light') return IconSunFill;
  if (currentTheme.value === 'dark') return IconMoonFill;
  return IconDesktop;
});

// 应用主题
const applyTheme = (theme) => {
  if (theme === 'auto') {
    // 跟随系统
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('arco-theme', isDark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('arco-theme', theme);
  }
};

// 切换主题
const changeTheme = (theme) => {
  currentTheme.value = theme;
  localStorage.setItem('theme', theme);
  applyTheme(theme);
};

// 监听系统主题变化
const handleSystemThemeChange = (e) => {
  if (currentTheme.value === 'auto') {
    document.body.setAttribute('arco-theme', e.matches ? 'dark' : 'light');
  }
};

onMounted(() => {
  // 初始化主题
  applyTheme(currentTheme.value);
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleSystemThemeChange);
});

onUnmounted(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.removeEventListener('change', handleSystemThemeChange);
});
</script>

<style scoped lang="less">
.theme-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: @color-text-2;

  &:hover {
    color: @color-text-1;
    background-color: @color-fill-2;
  }
}
</style>
