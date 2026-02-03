<template>
  <div class="theme-switcher" @click.stop="handleToggle">
    <div class="theme-label" >
      <icon-moon-fill v-if="!isDark" />
      <icon-sun-fill v-else />
      <span>{{ isDark ? '深色模式' : '浅色模式' }}</span>
    </div>
    <a-switch  :model-value="isDark" size="small" @click.stop="handleToggle" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '@/store/theme';
import { useUserSettingStore } from '@/store/userSetting';
import { IconMoonFill, IconSunFill } from '@arco-design/web-vue/es/icon';

const themeStore = useThemeStore();
const userSettingStore = useUserSettingStore();
const { isDark } = storeToRefs(themeStore);

const isToggling = ref(false);

const handleToggle = async () => {
  if (isToggling.value) return;
  
  isToggling.value = true;
  
  // 切换主题
  const newTheme = isDark.value ? '' : 'dark';
  themeStore.setTheme(newTheme);
  
  // 保存到用户设置
  try {
    await userSettingStore.setSetting('theme', newTheme, false);
  } catch (error) {
    console.error('保存主题设置失败:', error);
  }
  
  setTimeout(() => {
    isToggling.value = false;
  }, 300);
};
</script>

<style scoped lang="less">
.theme-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: @font-size-body-3;

  &:hover {
    background-color: @color-fill-2;
  }

  .theme-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
