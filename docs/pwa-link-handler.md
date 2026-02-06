# PWA 链接拦截器使用指南

## 功能说明

PWA 链接拦截器用于解决在 PWA 应用中点击链接时自动打开浏览器的问题。启用后，所有内部链接都会在 PWA 应用内跳转，而不是打开新的浏览器标签页。

## 工作原理

1. **自动检测 PWA 模式**：通过 `display-mode` 媒体查询检测应用是否在 PWA 模式下运行
2. **重写 window.open 方法**：拦截所有通过 JavaScript 调用的 `window.open()`
3. **拦截点击事件**：在捕获阶段拦截所有 `<a>` 标签的点击事件（包括 `target="_blank"`）
4. **区分内部/外部链接**：
   - 内部链接：使用 Vue Router 进行应用内导航
   - 外部链接：根据配置决定是否拦截

## 拦截范围

### 会被拦截的情况

✅ `<a href="/p/123">` - 普通内部链接  
✅ `<a href="/p/123" target="_blank">` - 带 target 的内部链接  
✅ `<router-link to="/p/123" target="_blank">` - Vue Router 链接  
✅ `window.open('/p/123', '_blank')` - JavaScript 打开的内部链接  
✅ `window.open(router.resolve(...).href, '_blank')` - 通过 router.resolve 生成的链接

### 不会被拦截的情况

❌ 外部链接（默认配置下会在浏览器中打开）  
❌ `window.location.href = '...'` - 直接修改 location（这种情况应该用 router.push）  
❌ `window.location.reload()` - 页面刷新

## 使用方法

### 基本使用

在 `src/main.js` 中已经自动启用：

```javascript
import { initPWALinkHandler } from './utils/pwaLinkHandler';

// 应用挂载后初始化
app.mount('#app');
initPWALinkHandler();
```

### 配置选项

可以传入配置对象来自定义行为：

```javascript
initPWALinkHandler({
  // 是否拦截外部链接（默认: false）
  interceptExternalLinks: false,
  
  // 是否在控制台输出调试信息（默认: true）
  debug: true
});
```

### 配置说明

#### interceptExternalLinks

- `false`（默认）：外部链接正常在浏览器中打开
- `true`：拦截外部链接并弹出确认对话框

#### debug

- `true`（默认）：在控制台输出调试信息
- `false`：静默模式

## 效果

### 启用前

- 点击内部链接（如 `/p/123`）→ 打开新的浏览器标签页
- 点击带 `target="_blank"` 的链接 → 打开新的浏览器标签页

### 启用后

- 点击内部链接（如 `/p/123`）→ 在 PWA 应用内跳转 ✅
- 点击带 `target="_blank"` 的内部链接 → 在 PWA 应用内跳转 ✅
- `window.open('/p/123', '_blank')` → 在 PWA 应用内跳转 ✅
- 点击外部链接 → 根据配置决定行为

## 测试方法

### 1. 在浏览器中测试（应该不拦截）

打开浏览器控制台，应该看到：
```
非 PWA 模式，链接拦截器未启动
```

点击任何链接应该正常工作。

### 2. 在 PWA 中测试（应该拦截）

安装 PWA 应用后，打开控制台，应该看到：
```
PWA 模式已激活，启用链接拦截器
PWA 链接拦截器已启动，配置: {interceptExternalLinks: false, debug: true}
```

点击内部链接时，应该看到：
```
拦截 window.open 内部链接: /p/123
PWA 内部导航: /p/123
```

或者：
```
拦截 target="_blank" 内部链接: /p/123
PWA 内部导航: /p/123
```

### 3. 验证是否生效

- 点击文章卡片 → 应该在应用内打开，不会跳转到浏览器
- 点击用户头像 → 应该在应用内打开用户主页
- 点击搜索结果 → 应该在应用内打开
- 点击知识库链接 → 应该在应用内打开

## 兼容性

- 仅在 PWA 模式下生效
- 在普通浏览器模式下不会影响正常行为
- 支持所有现代浏览器

## 注意事项

1. **外部链接处理**：默认情况下外部链接仍会在浏览器中打开，这是为了保持用户体验
2. **Router-link 组件**：Vue Router 的 `<router-link>` 组件不受影响，会继续正常工作
3. **动态链接**：对于动态添加的链接也会自动拦截
4. **性能影响**：使用事件捕获，性能影响极小

## 调试

在浏览器控制台中可以看到以下日志：

```
PWA 模式已激活，启用链接拦截器
PWA 链接拦截器已启动，配置: {interceptExternalLinks: false, debug: true}
PWA 内部导航: /p/123
```

## 常见问题

### Q: 为什么有些链接还是打开了浏览器？

A: 可能是以下原因：
1. **链接是外部链接**（不同域名）- 默认配置下会在浏览器中打开
2. **使用了 `window.location.href`** - 这种方式无法拦截，建议改用 `router.push()`
3. **应用不在 PWA 模式下运行** - 在普通浏览器中不会拦截
4. **Service Worker 缓存问题** - 清除缓存或卸载重装 PWA

### Q: 如何验证是否在 PWA 模式下？

A: 打开浏览器控制台，输入：
```javascript
window.matchMedia('(display-mode: standalone)').matches
```
如果返回 `true`，说明在 PWA 模式下。

### Q: 如何调试拦截器？

A: 
1. 打开 PWA 应用的开发者工具（通常是 F12）
2. 查看 Console 标签页
3. 点击链接时会看到拦截日志
4. 如果没有日志，说明拦截器未启动或不在 PWA 模式

### Q: 如何禁用链接拦截器？

A: 在 `src/main.js` 中注释掉 `initPWALinkHandler()` 调用即可。

### Q: 可以针对特定链接禁用拦截吗？

A: 可以给链接添加特殊属性，然后修改 `pwaLinkHandler.js` 中的逻辑来跳过这些链接。例如：

```javascript
// 在拦截器中添加检查（在 click 事件处理器中）
if (target.hasAttribute('data-no-intercept')) {
  return; // 不拦截
}
```

```html
<!-- 在 HTML 中使用 -->
<a href="/external" data-no-intercept>在浏览器中打开</a>
```

### Q: window.open 返回值有问题怎么办？

A: 拦截器返回一个模拟的 window 对象，包含基本方法：
```javascript
{
  focus: () => {},
  close: () => {},
  closed: false,
  location: { href: urlString }
}
```

如果你的代码需要更多方法，可以在 `overrideWindowOpen` 函数中添加。

### Q: 如何处理需要在浏览器中打开的内部链接？

A: 有两种方法：
1. 添加 `data-no-intercept` 属性（需要修改拦截器代码）
2. 使用原始的 window.open：
```javascript
// 保存原始方法的引用
const originalOpen = window.open;
// 使用时
originalOpen.call(window, url, '_blank');
```
