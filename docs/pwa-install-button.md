# PWA 安装按钮使用指南

## 概述

`PWAInstallPrompt` 组件已重构为一个轻量级的安装按钮，遵循浏览器原生 PWA 安装体验。

## 设计理念

### ✅ 优点
- **不干扰用户**：不会自动弹窗，让浏览器决定何时显示原生安装提示
- **符合规范**：遵循 Web 标准和浏览器最佳实践
- **用户体验好**：只在用户主动需要时提供安装入口
- **自动隐藏**：已安装或不支持 PWA 时自动隐藏

### ❌ 避免的问题
- 自动弹窗打断用户操作
- 拦截浏览器原生安装提示
- 强制推销式的安装体验

## 使用方法

### 基础用法

```vue
<template>
  <PWAInstallPrompt />
</template>

<script setup>
import PWAInstallPrompt from '@/components/base/PWAInstallPrompt.vue';
</script>
```

### 自定义样式

```vue
<template>
  <!-- 主要按钮样式 -->
  <PWAInstallPrompt type="primary" />
  
  <!-- 文本按钮样式 -->
  <PWAInstallPrompt type="text" size="small">
    安装到桌面
  </PWAInstallPrompt>
  
  <!-- 自定义内容 -->
  <PWAInstallPrompt type="outline">
    <template #icon>
      <icon-apps />
    </template>
    安装应用
  </PWAInstallPrompt>
</template>
```

### 编程式调用

```vue
<script setup>
import { ref } from 'vue';
import PWAInstallPrompt from '@/components/base/PWAInstallPrompt.vue';

const installButtonRef = ref(null);

const handleCustomInstall = () => {
  if (installButtonRef.value?.canInstall) {
    installButtonRef.value.install();
  }
};
</script>

<template>
  <PWAInstallPrompt ref="installButtonRef" />
  <a-button @click="handleCustomInstall">触发安装</a-button>
</template>
```

## 推荐放置位置

1. **用户设置页** ✅（已实现）
   - 在"高级"或"应用"标签页中
   - 不干扰主要功能

2. **用户中心侧边栏**
   - 作为一个可选功能入口
   - 图标 + 文字形式

3. **关于页面**
   - 介绍应用功能时提供安装选项

4. **首次访问引导**（可选）
   - 仅在用户完成注册后的引导流程中
   - 不要在首页自动弹出

## 浏览器原生安装体验

### Chrome/Edge (桌面)
- 地址栏右侧会显示安装图标
- 用户点击后显示原生安装对话框

### Chrome/Edge (移动端)
- 底部显示"添加到主屏幕"横幅
- 用户可以通过菜单手动安装

### Safari (iOS)
- 通过分享菜单 → "添加到主屏幕"
- 不支持 `beforeinstallprompt` 事件

## 工作原理

```javascript
// 1. 监听浏览器安装事件（不拦截）
window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e;  // 保存事件
  canInstall.value = true;  // 显示按钮
  // 不调用 e.preventDefault()，让浏览器显示原生提示
});

// 2. 用户点击按钮时触发安装
const handleInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();  // 显示安装对话框
    const { outcome } = await deferredPrompt.userChoice;
    // 处理用户选择
  }
};

// 3. 安装完成后自动隐藏
window.addEventListener('appinstalled', () => {
  canInstall.value = false;
});
```

## 检测 PWA 模式

```javascript
// 检测应用是否已安装
const isPWA = window.matchMedia('(display-mode: standalone)').matches;

if (isPWA) {
  // 应用已安装，隐藏安装按钮
}
```

## 注意事项

1. **HTTPS 要求**：PWA 只能在 HTTPS 环境下工作（localhost 除外）
2. **Service Worker**：需要注册 Service Worker
3. **Manifest 文件**：需要有效的 `manifest.json`
4. **浏览器支持**：不同浏览器的安装体验不同
5. **iOS Safari**：不支持 `beforeinstallprompt`，需要用户手动安装

## 相关文件

- 组件：`src/components/base/PWAInstallPrompt.vue`
- 使用示例：`src/views/user/children/home/components/UserSettingsModal.vue`
- 配置：`manifest.json`（项目根目录）
