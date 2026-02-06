# PWA Window Controls Overlay 正确实现

## 核心概念

**不需要自己实现标题栏！** 浏览器会提供原生的窗口控制按钮（最小化、最大化、关闭）。

我们只需要：
1. 在 manifest 中启用 `window-controls-overlay`
2. 使用 CSS 环境变量避开系统按钮区域
3. 设置 `theme_color` 让标题栏自动适配主题

## 工作原理

```
┌─────────────────────────────────────────────────────┐
│ [你的内容区域]              [_] [□] [X] ← 系统按钮  │
└─────────────────────────────────────────────────────┘
  ↑                              ↑
  titlebar-area-x                系统控制按钮
  titlebar-area-width            (浏览器提供)
```

- **系统按钮**：由浏览器/操作系统提供，自动适配暗黑模式
- **标题栏背景**：使用 manifest 中的 `theme_color`
- **你的内容**：使用 CSS 环境变量定位，避开系统按钮

## 配置步骤

### 1. Manifest 配置 (vite.config.js)

```javascript
VitePWA({
  manifest: {
    name: 'cainsgl的小站',
    short_name: 'cainsgl',
    // 标题栏背景色（浅色模式）
    theme_color: '#f7f8fa',
    background_color: '#ffffff',
    // 启用 Window Controls Overlay
    display_override: ['window-controls-overlay', 'standalone'],
    display: 'standalone',
    // ... 其他配置
  }
})
```

### 2. HTML Meta 标签 (index.html)

```html
<!-- 浅色模式 -->
<meta name="theme-color" content="#f7f8fa" media="(prefers-color-scheme: light)" />
<!-- 暗黑模式 -->
<meta name="theme-color" content="#17171a" media="(prefers-color-scheme: dark)" />
```

### 3. CSS 环境变量

```css
@media (display-mode: window-controls-overlay) {
  /* 获取标题栏区域的尺寸 */
  body {
    --titlebar-height: env(titlebar-area-height, 0px);
  }

  /* 如果有固定的顶部导航栏 */
  .app-header {
    position: fixed;
    top: 0;
    left: env(titlebar-area-x, 0);
    width: env(titlebar-area-width, 100%);
    height: env(titlebar-area-height, 40px);
  }

  /* 确保内容不被遮挡 */
  #app {
    padding-top: env(titlebar-area-height, 0px);
  }
}
```

## CSS 环境变量说明

| 变量 | 说明 |
|------|------|
| `titlebar-area-x` | 标题栏区域的 X 坐标（通常是 0） |
| `titlebar-area-y` | 标题栏区域的 Y 坐标（通常是 0） |
| `titlebar-area-width` | 标题栏区域的宽度（窗口宽度 - 系统按钮宽度） |
| `titlebar-area-height` | 标题栏区域的高度（通常是 40px） |

## JavaScript API（可选）

如果需要动态处理标题栏区域：

```javascript
// 检测是否支持
if ('windowControlsOverlay' in navigator) {
  // 获取标题栏区域尺寸
  const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();
  console.log(rect); // { x, y, width, height }

  // 监听尺寸变化（窗口调整大小时）
  navigator.windowControlsOverlay.addEventListener('geometrychange', (e) => {
    const { x, y, width, height } = e.titlebarAreaRect;
    console.log('标题栏区域变化:', { x, y, width, height });
  });

  // 检查是否可见
  if (navigator.windowControlsOverlay.visible) {
    console.log('Window Controls Overlay 已启用');
  }
}
```

## 暗黑模式适配

### 自动适配
- **系统按钮**：浏览器会根据 `theme_color` 的亮度自动选择深色或浅色图标
- **标题栏背景**：使用 HTML meta 标签的 `media` 属性自动切换

### 动态切换
如果你的应用支持手动切换主题：

```javascript
// 动态更新 theme-color
function updateThemeColor(isDark) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  metaThemeColor.setAttribute('content', isDark ? '#17171a' : '#f7f8fa');
}
```

## 平台差异

### Windows
- 系统按钮在**右侧**：[_] [□] [X]
- Chrome 菜单在系统按钮左侧

### macOS
- 系统按钮在**左侧**：[●] [●] [●]
- Chrome 菜单在右侧

### Linux
- 取决于桌面环境配置

## 兼容性处理

### 不支持的浏览器
- 会回退到 `standalone` 模式
- 显示传统的浏览器标题栏

### 检测支持
```javascript
// CSS
@media (display-mode: window-controls-overlay) {
  /* 支持 WCO 的样式 */
}

// JavaScript
if (window.matchMedia('(display-mode: window-controls-overlay)').matches) {
  console.log('Window Controls Overlay 已启用');
}
```

## 最佳实践

### ✅ 推荐
1. 使用浏览器原生的窗口控制按钮
2. 用 `theme_color` 设置标题栏背景
3. 用 CSS 环境变量定位内容
4. 支持浅色/暗黑模式自动切换

### ❌ 不推荐
1. 自己实现假的窗口控制按钮
2. 硬编码标题栏尺寸
3. 忽略系统按钮位置差异
4. 在标题栏区域放置重要的交互元素（可能被遮挡）

## 示例应用

参考 [web.dev 的示例](https://window-controls-overlay.glitch.me/)：
- 搜索框放在标题栏区域
- 使用渐变背景与 theme_color 融合
- 响应式处理窗口大小变化

## 调试技巧

### Chrome DevTools
1. **Application** → **Manifest**：检查 manifest 配置
2. **Console**：查看 `navigator.windowControlsOverlay`
3. **Elements**：检查 CSS 环境变量的值

### 测试步骤
1. 构建生产版本：`npm run build`
2. 预览：`npm run preview`
3. 安装 PWA
4. 检查标题栏是否正确显示
5. 测试窗口调整大小
6. 测试暗黑模式切换

## 相关资源

- [Web.dev: Window Controls Overlay](https://web.dev/articles/window-controls-overlay)
- [MDN: Window Controls Overlay API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API)
- [Microsoft Edge 文档](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/how-to/window-controls-overlay)

## 相关文件

- Manifest 配置：`vite.config.js`
- HTML Meta：`index.html`
- CSS 样式：`src/assets/style/pwa-titlebar.css`
- Service Worker 注册：`src/main.js`
