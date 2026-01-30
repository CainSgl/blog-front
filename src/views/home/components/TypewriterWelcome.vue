<template>
  <div class="typewriter-container">
    <div class="typewriter-text" ref="typewriterRef"></div>
  </div>
</template>

<script setup>
import {nextTick, onMounted, ref} from 'vue';
import TypeIt from 'typeit';

const typewriterRef = ref(null);

onMounted(async () => 
{
  await nextTick();
  
  if (typewriterRef.value) 
  {
    new TypeIt(typewriterRef.value, {
      strings: ['欢迎来到<br><div class="font-color-bg">Cainsgl</div>的个人小站'],
      speed: 100,
      lifeLike: true,
      cursor: true,
      breakLines: false,
      waitUntilVisible: true,
      loop: false
    }).go();
  }
});
</script>

<style scoped lang="less">
.typewriter-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: @size-5 0;
  width: 100%;
}

.typewriter-text {
  font-size: 3rem;
  font-weight: @font-weight-600;
  text-align: center;
  color: @primary-1;
  line-height: 1.6; 
  text-shadow: 
    1px 1px 2px fade(#000, 50%),
    2px 2px 4px fade(#000, 40%),
    0 0 15px fade(@color-bg-white, 30%);
  position: relative;
  -webkit-text-stroke: 1px fade(#000, 20%);
}

.typewriter-text::selection {
  background: fade(#787878, 30%);
}

:deep(.ti-cursor) {
  font-size: 3rem;
  color: @primary-4;
  opacity: 0.9;
  margin-left: @size-1;
  text-shadow: 1px 1px 2px fade(#000, 70%);
}
</style>