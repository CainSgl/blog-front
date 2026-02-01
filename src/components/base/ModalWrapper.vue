<template>
  <a-modal
    v-bind="modalProps"
    :fullscreen="isMobile"
    :width="isMobile ? '100%' : width"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </a-modal>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  width: {
    type: [String, Number],
    default: '520px'
  },
  mobileBreakpoint: {
    type: Number,
    default: 768
  }
});

const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < props.mobileBreakpoint);

const modalProps = computed(() => {
  const { width, mobileBreakpoint, ...rest } = props;
  return rest;
});

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>
