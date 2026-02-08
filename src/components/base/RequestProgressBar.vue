<template>
  <Transition name="progress-fade">
    <div v-if="progressStore.isLoading" class="request-progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: `${progressStore.progress}%` }"
      />
    </div>
  </Transition>
</template>

<script setup>
import { useRequestProgressStore } from '@/store/requestProgress';

const progressStore = useRequestProgressStore();
</script>

<style scoped>
.request-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(var(--primary-1), 0.1);
  z-index: 9999;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    rgb(var(--primary-6)), 
    rgb(var(--primary-5))
  );
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(var(--primary-6), 0.5);
}

.progress-fade-enter-active,
.progress-fade-leave-active {
  transition: opacity 0.3s ease;
}

.progress-fade-enter-from,
.progress-fade-leave-to {
  opacity: 0;
}
</style>
