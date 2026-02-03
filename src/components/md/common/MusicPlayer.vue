<template>
  <div class="cainsgl-music-player">
    <div class="music-card">
      <div class="music-icon">
        <icon-music :size="32" />
      </div>
      <div class="music-info">
        <div class="music-title">{{ displayTitle }}</div>
        <div class="music-meta">
          <span class="music-id">ID: {{ musicId }}</span>
        </div>
      </div>
      <div class="music-controls">
        <a-button 
          type="text" 
          :class="['play-button', { playing: isPlaying }]"
          @click="togglePlay"
        >
          <icon-play-arrow v-if="!isPlaying" :size="24" />
          <icon-pause v-else :size="24" />
        </a-button>
      </div>
    </div>
    
    <!-- 音频进度条 -->
    <div v-if="isPlaying || currentTime > 0" class="music-progress-container">
      <span class="time-label">{{ formatTime(currentTime) }}</span>
      <a-slider 
        v-model="progress"
        :min="0"
        :max="100"
        @change="handleProgressChange"
        class="music-progress"
      />
      <span class="time-label">{{ formatTime(duration) }}</span>
    </div>
    
    <!-- 播放控制面板 -->
    <div v-if="isPlaying || currentTime > 0" class="music-controls-panel">
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
    
    <!-- 隐藏的音频元素 -->
    <audio 
      ref="audioRef" 
      :src="audioUrl"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    ></audio>
    
    <!-- 播放确认弹窗 -->
    <a-modal
      v-model:visible="showConfirmModal"
      title="音乐播放确认"
      :mask-closable="false"
      :esc-to-close="false"
      @ok="handleConfirmPlay"
      @cancel="handleCancelPlay"
      ok-text="是"
      cancel-text="否"
    >
      <div class="confirm-content">
        <p>该博客包含音乐《{{ displayTitle }}》，是否播放？</p>
        <a-checkbox v-model="dontAskAgainChecked">
          以后不再提示
        </a-checkbox>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { IconMusic, IconPlayArrow, IconPause, IconSound } from '@arco-design/web-vue/es/icon';
import { API_BASE_URL } from '@/config';
import { useMusicPlayerStore } from '@/store/musicPlayer';

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

const musicPlayerStore = useMusicPlayerStore();

// 解析 fileId，格式可能是 "id 自定义描述"
const parsedData = computed(() => {
  const parts = props.fileId.trim().split(/\s+/);
  return {
    id: parts[0] || '',
    customDesc: parts.slice(1).join(' ') || props.description
  };
});

const musicId = computed(() => parsedData.value.id);
const displayTitle = computed(() => {
  return parsedData.value.customDesc || `音乐 ${parsedData.value.id}`;
});

const audioUrl = computed(() => {
  return `${API_BASE_URL}/file?f=${parsedData.value.id}`;
});

// 播放状态
const audioRef = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progress = ref(0);

// 确认弹窗状态
const showConfirmModal = ref(false);
const dontAskAgainChecked = ref(false);
const autoPlayPending = ref(false);

// 进度条拖动状态
const isDragging = ref(false);
const wasPlayingBeforeDrag = ref(false);
const dragEndTimer = ref(null);

// 播放速度和音量
const playbackRate = ref(musicPlayerStore.playbackRate);
const volume = ref(musicPlayerStore.volume);

// 播放速度选项
const speedOptions = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2.0 }
];

// 切换播放/暂停
const togglePlay = () => {
  if (!audioRef.value) return;
  
  if (isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  } else {
    audioRef.value.play();
    isPlaying.value = true;
  }
};

// 显示确认弹窗
const showPlayConfirmation = () => {
  // 如果用户已经选择不再提示，直接播放
  if (musicPlayerStore.dontAskAgain) {
    return;
  }
  
  // 显示确认弹窗
  showConfirmModal.value = true;
  autoPlayPending.value = true;
};

// 确认播放
const handleConfirmPlay = () => {
  // 如果勾选了不再提示，保存设置
  if (dontAskAgainChecked.value) {
    musicPlayerStore.setDontAskAgain(true);
  }
  
  // 自动播放
  if (audioRef.value && autoPlayPending.value) {
    audioRef.value.play();
    isPlaying.value = true;
    autoPlayPending.value = false;
  }
  
  showConfirmModal.value = false;
};

// 取消播放
const handleCancelPlay = () => {
  // 如果勾选了不再提示，保存设置
  if (dontAskAgainChecked.value) {
    musicPlayerStore.setDontAskAgain(true);
  }
  
  autoPlayPending.value = false;
  showConfirmModal.value = false;
};

// 时间更新
const handleTimeUpdate = () => {
  if (!audioRef.value || isDragging.value) return;
  currentTime.value = audioRef.value.currentTime;
  if (duration.value > 0) {
    progress.value = (currentTime.value / duration.value) * 100;
  }
};

// 加载元数据
const handleLoadedMetadata = () => {
  if (!audioRef.value) return;
  duration.value = audioRef.value.duration;
  
  // 设置初始播放速度和音量
  audioRef.value.playbackRate = playbackRate.value;
  audioRef.value.volume = volume.value / 100;
};

// 播放结束
const handleEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  progress.value = 0;
};

// 进度条改变（拖动中和拖动结束都会触发）
const handleProgressChange = (value) => {
  if (!audioRef.value || duration.value === 0) return;
  
  // 如果不在拖动状态，说明是拖动结束
  if (!isDragging.value) {
    // 记录拖动前的播放状态
    wasPlayingBeforeDrag.value = isPlaying.value;
    
    // 如果正在播放，暂停
    if (isPlaying.value) {
      audioRef.value.pause();
      isPlaying.value = false;
    }
    
    isDragging.value = true;
  }
  
  const newTime = (value / 100) * duration.value;
  audioRef.value.currentTime = newTime;
  currentTime.value = newTime;
  
  // 使用 setTimeout 来检测拖动结束
  clearTimeout(dragEndTimer.value);
  dragEndTimer.value = setTimeout(() => {
    isDragging.value = false;
    
    // 如果拖动前正在播放，恢复播放
    if (wasPlayingBeforeDrag.value) {
      audioRef.value.play();
      isPlaying.value = true;
    }
  }, 100);
};

// 改变播放速度
const handleSpeedChange = (value) => {
  playbackRate.value = value;
  if (audioRef.value) {
    audioRef.value.playbackRate = value;
  }
  // 保存到用户设置
  musicPlayerStore.setPlaybackRate(value);
};

// 改变音量
const handleVolumeChange = (value) => {
  volume.value = value;
  if (audioRef.value) {
    audioRef.value.volume = value / 100;
  }
  // 保存到用户设置
  musicPlayerStore.setVolume(value);
};

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 组件挂载时显示确认弹窗
onMounted(() => {
  // 添加到待确认队列
  musicPlayerStore.addPendingConfirmation(musicId.value, displayTitle.value);
  
  // 显示确认弹窗
  showPlayConfirmation();
});

// 组件卸载时停止播放
onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause();
  }
  
  // 清除定时器
  if (dragEndTimer.value) {
    clearTimeout(dragEndTimer.value);
  }
  
  // 从待确认队列移除
  musicPlayerStore.removePendingConfirmation(musicId.value);
});
</script>

<style lang="less" scoped>
.cainsgl-music-player {
  margin: 16px 0;

  .music-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, rgba(22, 93, 255, 0.05) 0%, rgba(22, 93, 255, 0.08) 100%);
    border: 1px solid var(--color-border-2);
    border-radius: 12px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);

    &:hover {
      box-shadow: 0 4px 16px rgba(22, 93, 255, 0.12);
      border-color: @primary-5;
      transform: translateY(-2px);
    }

    .music-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, @primary-5 0%, @primary-6 100%);
      border-radius: 50%;
      color: white;
      margin-right: 16px;
      box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
      transition: all 0.3s ease;

      &:hover {
        transform: rotate(15deg) scale(1.05);
      }
    }

    .music-info {
      flex: 1;
      min-width: 0;

      .music-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-1);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .music-meta {
        font-size: 12px;
        color: var(--color-text-3);

        .music-id {
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          padding: 2px 6px;
          background-color: var(--color-fill-2);
          border-radius: 4px;
        }
      }
    }

    .music-controls {
      display: flex;
      align-items: center;
      margin-left: 12px;

      .play-button {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: @primary-6;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);

        &:hover {
          background-color: @primary-5;
          box-shadow: 0 4px 16px rgba(22, 93, 255, 0.5);
        }

        &:active {
          transform: scale(0.95);
        }

        &.playing {
          background-color: #f53f3f;
          box-shadow: 0 2px 8px rgba(245, 63, 63, 0.3);

          &:hover {
            background-color: #f76560;
            box-shadow: 0 4px 16px rgba(245, 63, 63, 0.5);
          }
        }
      }
    }
  }

  .music-progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px 8px;
    background-color: var(--color-fill-1);
    border: 1px solid var(--color-border-2);
    border-top: none;
    margin-top: -8px;
    transition: all 0.3s ease;

    .time-label {
      font-size: 12px;
      color: var(--color-text-3);
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      min-width: 40px;
      text-align: center;
      font-weight: 500;
    }

    .music-progress {
      flex: 1;
    }
  }

  .music-controls-panel {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 8px 16px 12px;
    background-color: var(--color-fill-1);
    border: 1px solid var(--color-border-2);
    border-top: none;
    border-radius: 0 0 12px 12px;
    margin-top: -1px;

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

  .confirm-content {
    p {
      margin-bottom: 16px;
      font-size: 14px;
      color: var(--color-text-1);
    }
  }

  // 暗黑模式适配
  body[arco-theme='dark'] & {
    .music-card {
      background: linear-gradient(135deg, rgba(22, 93, 255, 0.1) 0%, rgba(22, 93, 255, 0.15) 100%);
      border-color: var(--color-border-3);

      &:hover {
        box-shadow: 0 4px 20px rgba(22, 93, 255, 0.25);
        border-color: @primary-6;
      }

      .music-icon {
        box-shadow: 0 4px 16px rgba(22, 93, 255, 0.5);
      }

      .music-info {
        .music-title {
          color: var(--color-text-1);
        }

        .music-meta {
          color: var(--color-text-3);

          .music-id {
            background-color: var(--color-fill-3);
          }
        }
      }

      .music-controls {
        .play-button {
          box-shadow: 0 2px 12px rgba(22, 93, 255, 0.4);

          &:hover {
            box-shadow: 0 4px 20px rgba(22, 93, 255, 0.6);
          }

          &.playing {
            box-shadow: 0 2px 12px rgba(245, 63, 63, 0.4);

            &:hover {
              box-shadow: 0 4px 20px rgba(245, 63, 63, 0.6);
            }
          }
        }
      }
    }

    .music-progress-container {
      background-color: var(--color-fill-2);
      border-color: var(--color-border-3);

      .time-label {
        color: var(--color-text-2);
      }
    }

    .music-controls-panel {
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
