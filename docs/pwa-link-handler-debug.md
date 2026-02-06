# PWA 链接拦截器调试指南

## 问题：生产环境不工作

如果你发现链接拦截器在开发环境工作，但在生产环境（已安装的 PWA）不工作，请按以下步骤排查。

## 调试步骤

### 1. 确认是否在 PWA 模式下运行

在 PWA 应用中打开开发者工具（F12），在 Console 中输入：

```javascript
window.matchMedia('(display-mode: standalone)').matches
```

**预期结果：** 应该返回 `true`

如果返回 `false`，说明应用不在 PWA 模式下运行，可能原因：
- 应用是在浏览器标签页中打开的，而不是独立的 PWA 窗口
- manifest.json 配置有问题
- 应用没有正确安装

### 2. 检查 window.open 是否被重写

在 Console 中输入：

```javascript
window.open.toString()
```

**预期结果：** 应该看到自定义的函数代码，而不是 `function open() { [native code] }`

如果看到 `[native code]`，说明 window.open 没有被重写，可能原因：
- 拦截器没有初始化
- 代码被 terser 优化掉了
- 初始化时机太晚

### 3. 使用诊断工具

在 Console 中输入：

```javascript
window.pwaDiagnostics.showDiagnostics()
```

这会显示完整的诊断信息，包括：
- PWA 状态
- 显示模式
- window.open 是否被重写
- 拦截测试结果

### 4. 手动测试拦截

在 Console 中输入：

```javascript
window.open('/p/123', '_blank')
```

**预期行为：**
- 不应该打开新的浏览器窗口
- 应该在当前 PWA 窗口内导航到 `/p/123`
- 返回一个模拟的 window 对象

**如果打开了浏览器：** 说明拦截失败

### 5. 检查构建产物

查看 `dist/assets/` 目录下的 JS 文件，搜索 `window.open` 或 `originalWindowOpen`：

```bash
# Windows
findstr /s "originalWindowOpen" dist\assets\*.js

# Linux/Mac
grep -r "originalWindowOpen" dist/assets/*.js
```

**预期结果：** 应该能找到相关代码

如果找不到，说明代码被 terser 删除了。

## 常见问题和解决方案

### 问题 1: 代码被 terser 删除

**原因：** `vite.config.js` 中的 terser 配置过于激进

**解决方案：** 修改 `vite.config.js`：

```javascript
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
    // 不要删除未使用的代码
    unused: false
  }
}
```

### 问题 2: 初始化时机太晚

**原因：** 拦截器在某些链接点击之后才初始化

**解决方案：** 确保 `initPWALinkHandler()` 在 `app.mount()` 之后立即调用

### 问题 3: Service Worker 缓存了旧版本

**原因：** PWA 使用了缓存的旧代码

**解决方案：**
1. 在 PWA 中打开开发者工具
2. Application > Service Workers > Unregister
3. Application > Storage > Clear site data
4. 关闭 PWA 窗口
5. 重新安装 PWA

### 问题 4: manifest.json 配置问题

**原因：** manifest 中缺少关键配置

**解决方案：** 确保 `vite.config.js` 中的 manifest 包含：

```javascript
manifest: {
  display: 'standalone',
  start_url: '/',
  scope: '/',
  launch_handler: {
    client_mode: 'navigate-existing'
  }
}
```

### 问题 5: 浏览器不支持

**原因：** 某些浏览器对 PWA 的支持有限

**测试浏览器：**
- ✅ Chrome/Edge (Windows, Android) - 完全支持
- ✅ Safari (iOS, macOS) - 支持，但有限制
- ⚠️ Firefox - 部分支持
- ❌ 某些国产浏览器 - 支持度不一

## 生产环境调试技巧

### 启用调试模式

临时修改 `src/main.js`：

```javascript
initPWALinkHandler({
  debug: true,  // 强制启用调试
  showNotification: false
});
```

重新构建并部署。

### 使用 alert 调试

在 `pwaLinkHandler.js` 中添加 alert：

```javascript
function overrideWindowOpen() {
  alert('window.open 已被重写');
  window.open = function(url, target, features) {
    alert('拦截到 window.open: ' + url);
    // ... 其他代码
  };
}
```

### 使用 localStorage 记录日志

```javascript
function safeLog(message, data) {
  try {
    const logs = JSON.parse(localStorage.getItem('pwa_logs') || '[]');
    logs.push({ time: Date.now(), message, data });
    localStorage.setItem('pwa_logs', JSON.stringify(logs.slice(-50)));
  } catch (e) {}
}

// 在 Console 中查看日志
JSON.parse(localStorage.getItem('pwa_logs'))
```

## 验证清单

构建并部署后，按以下清单验证：

- [ ] 在浏览器中访问，链接正常工作（不拦截）
- [ ] 安装 PWA 应用
- [ ] 在 PWA 中打开开发者工具
- [ ] 运行 `window.matchMedia('(display-mode: standalone)').matches` 返回 `true`
- [ ] 运行 `window.open.toString()` 显示自定义代码
- [ ] 运行 `window.pwaDiagnostics.showDiagnostics()` 显示正确信息
- [ ] 点击文章卡片，在 PWA 内打开（不跳转浏览器）
- [ ] 点击用户头像，在 PWA 内打开
- [ ] 点击搜索结果，在 PWA 内打开

## 最终测试

如果以上都正常，但还是跳转到浏览器，可能是以下原因：

1. **操作系统级别的限制**：某些系统会强制在浏览器中打开链接
2. **浏览器策略**：某些浏览器有安全策略限制
3. **第三方代码干扰**：检查是否有其他脚本修改了链接行为

## 联系支持

如果问题仍未解决，请提供以下信息：

1. 操作系统和版本
2. 浏览器和版本
3. `window.pwaDiagnostics.showDiagnostics()` 的输出
4. 开发者工具 Console 的截图
5. 点击链接时的具体行为
