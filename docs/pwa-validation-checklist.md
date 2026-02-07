# PWA 配置验证清单

## ✅ 已完成的配置

### 1. 图标配置
- ✅ 分离了 `any` 和 `maskable` purpose
- ✅ 提供了 192x192 和 512x512 两种尺寸
- ✅ 使用 PNG 格式

### 2. 截图配置
- ✅ 移动端截图：3 张 (narrow)
  - mobile-1.webp (117.77 KB)
  - mobile-2.webp (134.16 KB)
  - mobile-3.webp (52.37 KB)
- ✅ 桌面端截图：3 张 (wide)
  - desktop-1.webp (99.04 KB)
  - desktop-2.webp (256.99 KB)
  - desktop-3.webp (74.89 KB)
- ✅ 使用 WebP 格式（更小的文件体积）
- ✅ 文件大小合理（都在 300KB 以内）

## 验证步骤

### 步骤 1：构建应用
```bash
npm run build
```

### 步骤 2：预览应用
```bash
npm run preview
```

### 步骤 3：检查 Manifest

1. 在 Chrome 中打开应用（通常是 http://localhost:4173）
2. 按 F12 打开开发者工具
3. 切换到 **Application** 标签
4. 左侧选择 **Manifest**

#### 检查项目：

**图标部分 (Icons)**
- [ ] 应该看到 4 个图标条目
- [ ] 2 个标记为 "any"
- [ ] 2 个标记为 "maskable"
- [ ] 没有关于 "any maskable" 的警告

**截图部分 (Screenshots)**
- [ ] 应该看到 6 张截图
- [ ] 3 张移动端截图（narrow）
- [ ] 3 张桌面端截图（wide）
- [ ] 所有截图都能正常加载（显示缩略图）
- [ ] 没有关于缺少截图的错误

### 步骤 4：测试安装 UI

#### 桌面端测试
1. 在 Chrome 地址栏右侧应该看到安装图标 ⊕
2. 点击安装图标
3. 应该看到增强的安装对话框，包含：
   - 应用名称和描述
   - 桌面端截图轮播
   - 安装按钮

#### 移动端测试（可选）
1. 在移动设备的 Chrome 中打开应用
2. 点击菜单 > "添加到主屏幕" 或 "安装应用"
3. 应该看到包含移动端截图的安装界面

### 步骤 5：检查控制台

在开发者工具的 **Console** 标签中：
- [ ] 没有关于 manifest 的错误
- [ ] 没有关于图标的警告
- [ ] 没有关于截图的警告

## 常见问题排查

### 问题 1：截图不显示
**可能原因：**
- 文件路径不正确
- 文件格式不支持
- 文件损坏

**解决方案：**
```bash
# 检查文件是否存在
dir public\screenshots

# 确认文件可以访问
# 在浏览器中访问：http://localhost:4173/screenshots/mobile-1.webp
```

### 问题 2：仍然有 "any maskable" 警告
**可能原因：**
- 浏览器缓存了旧的 manifest

**解决方案：**
1. 清除浏览器缓存
2. 在 Application > Storage > Clear site data
3. 刷新页面

### 问题 3：安装 UI 不显示截图
**可能原因：**
- 截图尺寸不符合要求
- form_factor 设置不正确

**解决方案：**
检查截图实际尺寸是否符合要求：
- 移动端：宽度 320-720px，高度 320-1440px
- 桌面端：宽度 1024-3840px，高度 593-2160px

## 性能检查

### Lighthouse PWA 审计

1. 在开发者工具中切换到 **Lighthouse** 标签
2. 选择 **Progressive Web App** 类别
3. 点击 **Analyze page load**
4. 检查 PWA 相关的评分和建议

**期望结果：**
- ✅ Installable
- ✅ PWA Optimized
- ✅ 提供了 manifest
- ✅ 提供了图标
- ✅ 提供了截图（可选，但推荐）

## WebP 格式的优势

你使用 WebP 格式是个很好的选择：

- **文件更小**：比 PNG 小 25-35%
- **质量更好**：在相同文件大小下质量更高
- **浏览器支持**：现代浏览器都支持
- **加载更快**：减少用户等待时间

## 下一步建议

1. **定期更新截图**：当 UI 有重大更新时，记得更新截图
2. **A/B 测试**：尝试不同的截图，看哪些能提高安装率
3. **多语言支持**：如果应用支持多语言，考虑为不同语言提供本地化截图
4. **监控安装率**：使用 Google Analytics 或其他工具监控 PWA 安装率

## 验证完成

如果以上所有检查项都通过，恭喜！你的 PWA 配置已经完全正确，不会再有警告了。

## 快速验证命令

```bash
# 一键构建并预览
npm run build && npm run preview
```

然后在浏览器中打开 http://localhost:4173 并检查 Application > Manifest
