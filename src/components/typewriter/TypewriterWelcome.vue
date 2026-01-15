<template>
  <div class="typewriter-container">
    <div class="typewriter-text" ref="typewriterRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
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
  padding: 20px 0;
  width: 100%;
}

.typewriter-text {
  font-size: 3rem;
  font-weight: 600;
  text-align: center;
  color: @primary-1; /* 使用项目中定义的颜色 */
  line-height: 1.6; 
  text-shadow: 
    1px 1px 2px rgba(0, 0, 0, 0.5),
    2px 2px 4px rgba(0, 0, 0, 0.4),
    0 0 15px rgba(255, 255, 255, 0.3);
  position: relative;
  /* 添加文字描边效果 */
  -webkit-text-stroke: 1px rgba(0, 0, 0, 0.2);
}



/* 添加文字描边效果 */
.typewriter-text::selection {
  background: rgba(120, 120, 120, 0.3);
}

:deep(.ti-cursor)
{
  font-size: 3rem; /* 使光标大小与文字大小一致 */
  color: @primary-4; /* 保持与文字相同的颜色 */
  opacity: 0.9;
  margin-left: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7); /* 为光标也添加更明显的阴影 */
}
</style>