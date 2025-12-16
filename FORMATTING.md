# 代码格式化指南

本项目使用 ESLint 来格式化代码以符合 Allman 风格。

## 可用的格式化脚本

### 1. Allman 风格格式化

```bash
npm run format:allman
```

仅格式化大括号为 Allman 风格（BSD/ANSI 风格），其中：

- 所有大括号 `{` 单独占一行，与对应的关键字（function/if/for 等）上下对齐
- 闭合括号 `}` 也单独占一行，与开头的关键字对齐

### 2. 完整格式化流程

```bash
npm run format:full
```

使用 ESLint 应用 Allman 风格格式化。

## Allman 风格示例

Allman 风格（本项目采用）：

```javascript
function example() {
  if (condition) {
    for (let i = 0; i < 10; i++) {
      // code here
    }
  } else {
    // code here
  }
}
```

对比 1TBS 风格（不采用）：

```javascript
function example() {
  if (condition) {
    for (let i = 0; i < 10; i++) {
      // code here
    }
  } else {
    // code here
  }
}
```

## 手动格式化特定文件

也可以使用以下命令格式化特定文件：

```bash
node format-allman.js <file-path>
```

例如：

```bash
node format-allman.js src/main.js
```
