# 用户设置功能使用指南

## 概述

用户设置功能提供了一个统一的方式来管理用户的自定义配置，支持本地缓存和手动云端同步。

## 特性

- ✅ 本地缓存优先，减少服务器请求
- ✅ 登录时自动加载本地缓存（如无缓存则从服务器拉取）
- ✅ 支持嵌套对象路径（如 `musicPlayer.volume`）
- ✅ 手动云端同步，用户完全控制
- ✅ 退出登录时自动清除本地缓存

## 使用方法

### 1. 在组件中使用

```javascript
import { useUserSettingStore } from '@/store/userSetting';

const userSettingStore = useUserSettingStore();

// 获取设置
const theme = userSettingStore.getSetting('theme', 'light');
const volume = userSettingStore.getSetting('musicPlayer.volume', 100);

// 设置值（只保存到本地，不自动同步到云端）
await userSettingStore.setSetting('theme', 'dark', false);
await userSettingStore.setSetting('musicPlayer.volume', 80, false);

// 批量更新（只保存到本地）
await userSettingStore.updateSettings({
  theme: 'dark',
  language: 'zh-CN',
  musicPlayer: {
    volume: 80,
    playbackRate: 1.5
  }
}, true, false);

// 手动同步到云端
await userSettingStore.syncToServer();

// 从云端拉取
await userSettingStore.fetchFromServer();
```

### 2. 使用 computed 实时响应

```javascript
import { computed } from 'vue';
import { useUserSettingStore } from '@/store/userSetting';

const userSettingStore = useUserSettingStore();

// 创建响应式计算属性
const volume = computed(() => {
  return userSettingStore.getSetting('musicPlayer.volume', 100);
});

// 在模板中使用
// <a-slider v-model="volume" />
```

### 3. MusicPlayer 示例

MusicPlayer 组件已经集成了用户设置功能：

- `dontAskAgain`: 是否不再提示播放确认
- `playbackRate`: 播放速度（0.5x - 2.0x）
- `volume`: 音量（0-100）

这些设置会自动保存到用户设置中，并在登录时恢复。

## API 接口

### 获取设置
```http
GET /user/setting
```

### 保存设置
```http
PUT /user/setting
Content-Type: application/json

{
  "theme": "dark",
  "musicPlayer": {
    "volume": 80,
    "playbackRate": 1.5,
    "dontAskAgain": true
  }
}
```

### 删除设置
```http
DELETE /user/setting
```

## 设置结构示例

```json
{
  "theme": "dark",
  "language": "zh-CN",
  "musicPlayer": {
    "volume": 80,
    "playbackRate": 1.5,
    "dontAskAgain": true
  },
  "notifications": {
    "email": true,
    "push": false
  },
  "privacy": {
    "showEmail": false,
    "showPhone": false
  }
}
```

## 注意事项

1. **本地缓存优先**: 设置默认保存到 localStorage，不会自动同步到云端
2. **手动云同步**: 用户需要在设置界面手动点击"同步到云端"或"从云端同步"
3. **登录时加载**: 只在用户登录时加载本地缓存（如无缓存则从服务器拉取一次）
4. **自动清除**: 退出登录时会自动清除本地缓存（不删除服务器数据）
5. **多设备使用**: 如需在多设备间共享设置，需要手动使用云同步功能

## 工作流程

```
用户登录
  ↓
检查本地缓存
  ↓
有缓存 → 使用本地缓存
无缓存 → 从服务器拉取一次
  ↓
用户修改设置
  ↓
保存到本地缓存（不自动同步云端）
  ↓
用户手动点击"同步到云端"
  ↓
上传到服务器
```

## 云同步功能

### 同步到云端
- 将当前本地设置上传到服务器
- 会覆盖云端的现有设置
- 适用场景：在主设备上配置好设置后，上传到云端

### 从云端同步
- 从服务器下载设置到本地
- 会覆盖当前本地设置
- 适用场景：在新设备上使用，或恢复之前的云端设置
