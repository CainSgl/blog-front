<template>
  <div class="cainsgl-video-player">
    <!-- 视频播放器 -->
    <div class="video-player-container">
      <video 
        ref="videoRef" 
        :src="videoUrl"
        :controls="!isAnimation"
        :loop="isAnimation"
        :autoplay="isAnimation"
        :muted="isAnimation"
        class="video-element"
        @loadedmetadata="handleLoadedMetadata"
      >
        您的浏览器不支持视频播放
      </video>
      
      <!-- 视频控制面板（仅视频显示） -->
      <div v-if="!isAnimation && showControls" class="video-controls-panel">
        <div class="control-item">
          <span class="control-label">倍速</span>
          <a-select 
            v-model="playbackRate" 
            :style="{ width: '90px' }"
            size="small"
            @change="handleSpeedChange"
          >
            <a-option 
              v-for="option in speedOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </a-option>
          </a-select>
        </div>
        
        <div class="control-item volume-control">
          <span class="control-label">
            <icon-sound :size="16" />
          </span>
          <a-slider 
            v-model="volume"
            :min="0"
            :max="100"
            :style="{ width: '100px' }"
            @change="handleVolumeChange"
          />
          <span class="volume-value">{{ volume }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted } from 'vue';
import { IconSound } from '@arco-design/web-vue/es/icon';
import { API_BASE_URL } from '@/config';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});

// 解析 fileId，格式可能是 "id 自定义描述"
const parsedData = computed(() => {
  const parts = props.fileId.trim().split(/\s+/);
  return {
    id: parts[0] || '',
    customDesc: parts.slice(1).join(' ') || props.description
  };
});

// 判断是否为动图（根据文件后缀）
const isAnimation = computed(() => {
  const desc = parsedData.value.customDesc.toLowerCase();
  // 动图格式：gif, webm（短视频）
  return desc.endsWith('.gif') || desc.endsWith('.webm');
});

const videoUrl = computed(() => {
  return `${API_BASE_URL}/file?f=${parsedData.value.id}`;
});

// 播放状态
const videoRef = ref(null);
const showControls = ref(true);

// 播放速度和音量
const playbackRate = ref(1.0);
const volume = ref(80);

// 播放速度选项
const speedOptions = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2.0 }
];

// 加载元数据
const handleLoadedMetadata = () => {
  if (!videoRef.value || isAnimation.value) return;
  
  // 仅视频设置初始播放速度和音量
  videoRef.value.playbackRate = playbackRate.value;
  videoRef.value.volume = volume.value / 100;
};

// 改变播放速度
const handleSpeedChange = (value) => {
  playbackRate.value = value;
  if (videoRef.value) {
    videoRef.value.playbackRate = value;
  }
};

// 改变音量
const handleVolumeChange = (value) => {
  volume.value = value;
  if (videoRef.value) {
    videoRef.value.volume = value / 100;
  }
};

// 组件卸载时停止播放
onUnmounted(() => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
});
</script>

<style lang="less" scoped>
.cainsgl-video-player {
  margin: 16px 0;

  .video-player-container {
    border-radius: 8px;
    overflow: hidden;
    background-color: #000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .video-element {
      width: 100%;
      max-height: 600px;
      display: block;
      background-color: #000;
    }
  }

  .video-controls-panel {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px 16px;
    background-color: var(--color-fill-1);
    border: 1px solid var(--color-border-2);
    border-top: none;
    border-radius: 0 0 8px 8px;

    .control-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .control-label {
        font-size: 12px;
        color: var(--color-text-2);
        font-weight: 500;
        white-space: nowrap;
        display: flex;
        align-items: center;
      }

      &.volume-control {
        flex: 1;
        justify-content: flex-end;

        .volume-value {
          font-size: 12px;
          color: var(--color-text-3);
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          min-width: 40px;
          text-align: right;
        }
      }
    }
  }

  // 暗黑模式适配
  body[arco-theme='dark'] & {
    .video-controls-panel {
      background-color: var(--color-fill-2);
      border-color: var(--color-border-3);

      .control-item {
        .control-label {
          color: var(--color-text-1);
        }

        &.volume-control {
          .volume-value {
            color: var(--color-text-2);
          }
        }
      }
    }
  }
}
</style>
