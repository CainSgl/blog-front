<template>
  <a-tag :color="levelColor" :size="size" style="margin-left: 2px;">LV.{{ level || 0 }}</a-tag>
</template>

<script setup>
import {computed} from 'vue';

const props = defineProps({
  level: {
    type: Number,
    required: true
  },
  showGray: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'small'
  }
});

// 根据等级计算颜色
const levelColor = computed(() => 
{
  if (props.showGray) 
  {
    return 'default'; // 灰色 - 当showGray为true时显示灰色
  }
  if(!props.level)
  {
    return 'green';
  }
  if (props.level < 5) 
  {
    return 'green'; // 绿色 - 低等级
  }
  if (props.level < 10) 
  {
    return 'arcoblue'; // 蓝色 - 中低等级
  }
  if (props.level < 20) 
  {
    return 'orange'; // 橙色 - 中等级
  }
  if (props.level < 30) 
  {
    return 'red'; // 红色 - 中高等级
  }
  if (props.level < 40) 
  {
    return 'purple'; // 紫色 - 高等级
  }
  return 'gold'; // 金色 - 超高等级

});
</script>