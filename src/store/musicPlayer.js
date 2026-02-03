import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useUserSettingStore } from './userSetting';

export const useMusicPlayerStore = defineStore('musicPlayer', () => {
  const userSettingStore = useUserSettingStore();
  
  // 当前待确认的音乐队列
  const pendingConfirmations = ref(new Map());
  
  // 是否不再提示（从用户设置中读取）
  const dontAskAgain = computed(() => {
    return userSettingStore.getSetting('musicPlayer.dontAskAgain', false);
  });
  
  // 播放速度（从用户设置中读取）
  const playbackRate = computed(() => {
    return userSettingStore.getSetting('musicPlayer.playbackRate', 1.0);
  });
  
  // 音量（从用户设置中读取）
  const volume = computed(() => {
    return userSettingStore.getSetting('musicPlayer.volume', 100);
  });
  
  // 设置不再提示
  const setDontAskAgain = async (value) => {
    await userSettingStore.setSetting('musicPlayer.dontAskAgain', value, false);
  };
  
  // 设置播放速度
  const setPlaybackRate = async (value) => {
    await userSettingStore.setSetting('musicPlayer.playbackRate', value, false);
  };
  
  // 设置音量
  const setVolume = async (value) => {
    await userSettingStore.setSetting('musicPlayer.volume', value, false);
  };
  
  // 添加待确认的音乐
  const addPendingConfirmation = (musicId, title) => {
    if (!pendingConfirmations.value.has(musicId)) {
      pendingConfirmations.value.set(musicId, {
        id: musicId,
        title,
        timestamp: Date.now()
      });
    }
  };
  
  // 移除待确认的音乐
  const removePendingConfirmation = (musicId) => {
    pendingConfirmations.value.delete(musicId);
  };
  
  // 清空所有待确认
  const clearPendingConfirmations = () => {
    pendingConfirmations.value.clear();
  };
  
  return {
    dontAskAgain,
    playbackRate,
    volume,
    pendingConfirmations,
    setDontAskAgain,
    setPlaybackRate,
    setVolume,
    addPendingConfirmation,
    removePendingConfirmation,
    clearPendingConfirmations
  };
});
