# PWA 自定义配置说明

## 标题栏配置

### Display Override

在 `vite.config.js` 中配置了 `display_override` 优先级：

```javascript
display_override: ['window-controls-overlay', 'standalone']
```

**优先级说明：**
1. `window-controls-overlay` - 最优先，自定义标题栏
2. `standalone` - 备选，标准独立窗口

浏览器会按顺序尝试，使用第一个支持的模式。

### Window Controls Overlay

这是最现代的 PWA 标题栏模式，特点：

- 标题栏与应用内容融合
- 可以自定义标题栏内容
- 使用 CSS 环境变量控制布局
- 支持拖拽区域

**CSS 环境变量：**
```css
env(titlebar-area-x)       /* 标题栏 X 坐标 */
env(titlebar-area-y)       /* 标题栏 Y 坐标 */
env(titlebar-area-width)   /* 标题栏宽度 */
env(titlebar-area-height)  /* 标题栏高度 */
```

**拖拽区域：**
```css
-webkit-app-region: drag;      /* 可拖拽 */
-webkit-app-region: no-drag;   /* 不可拖拽（按钮等） */
```

### 浏览器支持

| 浏览器 | Window Controls Overlay | Standalone |
|--------|------------------------|------------|
| Chrome 93+ | ✅ | ✅ |
| Edge 93+ | ✅ | ✅ |
| Safari | ❌ | ✅ |
| Firefox | ❌ | ✅ |

## 主题色配置

### Theme Color

```javascript
theme_color: '#165dff'  // Arco Design 主色
```

影响范围：
- Android 状态栏颜色
- Windows 标题栏颜色
- iOS Safari 状态栏（部分支持）

### 动态主题色

可以通过 meta 标签动态修改：

```javascript
// 切换到暗色主题
document.querySelector('meta[name="theme-color"]')
  .setAttribute('content', '#1d2129');

// 切换到亮色主题
document.querySelector('meta[name="theme-color"]')
  .setAttribute('content', '#165dff');
```

## 图标配置

### Purpose 属性

```javascript
purpose: 'any maskable'
```

- `any`: 标准图标，适用于所有场景
- `maskable`: 可遮罩图标，适配不同形状（圆形、方形等）

### Maskable Icon 设计要求

1. 安全区域：中心 80% 区域放置重要内容
2. 出血区域：外围 20% 可能被裁剪
3. 推荐尺寸：512x512px
4. 格式：PNG、WebP、SVG

**在线工具：**
- https://maskable.app/ - 测试和生成 maskable 图标

## 快捷方式配置

### Shortcuts 结构

```javascript
shortcuts: [
  {
    name: '首页',              // 完整名称
    short_name: '首页',        // 短名称
    description: '查看最新文章', // 描述
    url: '/',                  // 目标 URL
    icons: [...]               // 图标
  }
]
```

### 限制

- 最多 4-10 个快捷方式（因浏览器而异）
- 名称长度建议 < 20 字符
- URL 必须在 scope 范围内

## 分享目标配置

### Share Target

```javascript
share_target: {
  action: '/share',
  method: 'POST',
  enctype: 'multipart/form-data',
  params: {
    title: 'title',
    text: 'text',
    url: 'url',
    files: [
      {
        name: 'file',
        accept: ['image/*', 'video/*', 'audio/*']
      }
    ]
  }
}
```

### 处理分享

需要在 `/share` 路由处理分享数据：

```javascript
// router/index.js
{
  path: '/share',
  component: ShareHandler,
  meta: { title: '分享' }
}
```

```javascript
// ShareHandler.vue
onMounted(() => {
  const formData = new FormData(document.querySelector('form'));
  const title = formData.get('title');
  const text = formData.get('text');
  const url = formData.get('url');
  const file = formData.get('file');
  
  // 处理分享内容
});
```

## 缓存策略配置

### Workbox 配置

```javascript
workbox: {
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
  runtimeCaching: [...]
}
```

### 缓存策略类型

1. **NetworkFirst** - 优先网络
   - 适用：API 请求
   - 网络失败时使用缓存

2. **CacheFirst** - 优先缓存
   - 适用：图片、字体等静态资源
   - 缓存存在时直接使用

3. **StaleWhileRevalidate** - 缓存优先，后台更新
   - 适用：JS、CSS 等
   - 使用缓存同时后台更新

4. **NetworkOnly** - 仅网络
   - 适用：实时数据
   - 不使用缓存

5. **CacheOnly** - 仅缓存
   - 适用：离线页面
   - 不请求网络

## 调试技巧

### Chrome DevTools

1. **Application > Manifest**
   - 查看 manifest 配置
   - 测试图标显示

2. **Application > Service Workers**
   - 查看 SW 状态
   - 手动更新/卸载

3. **Application > Cache Storage**
   - 查看缓存内容
   - 清除缓存

4. **Lighthouse**
   - PWA 评分
   - 优化建议

### 测试安装提示

```javascript
// 手动触发安装提示（开发测试用）
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // 保存事件，稍后触发
  window.deferredPrompt = e;
});

// 手动触发
window.deferredPrompt.prompt();
```

### 模拟 PWA 模式

Chrome DevTools:
1. F12 打开开发者工具
2. 右上角 ⋮ > More tools > Sensors
3. 勾选 "Emulate PWA"

## 常见问题

### Q: 为什么本地开发看不到安装提示？

A: PWA 需要满足以下条件：
- HTTPS（localhost 除外）
- 有效的 manifest.json
- 注册了 Service Worker
- 至少访问过两次（间隔 5 分钟）

### Q: 如何强制更新 Service Worker？

A: 
```javascript
// 在 main.js 中
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update();
    });
  });
}
```

### Q: 如何清除所有缓存？

A:
```javascript
// 清除所有缓存
caches.keys().then(names => {
  names.forEach(name => {
    caches.delete(name);
  });
});

// 卸载 Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
  });
});
```

## 参考资源

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Window Controls Overlay](https://developer.chrome.com/blog/window-controls-overlay/)
