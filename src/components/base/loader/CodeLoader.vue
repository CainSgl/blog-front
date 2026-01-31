<template>
  <div class="code-loader">
    <div class="terminal">
      <div class="terminal-header">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="title">加载数据中...</span>
      </div>
      <div class="terminal-content">
        <div class="function-calls-container">
          <transition-group
            tag="div"
            name="function-call"
            :css="false"
            @before-enter="beforeEnter"
            @enter="enter"
            @leave="leave"
          >
            <div
              v-for="(func, index) in stack"
              :key="func.id"
              class="function-call-wrapper"
              :style="{ top: 20 + (stack.length - index - 1) * 40 + 'px' }"
            >
              <div class="function-call">
                <span class="keyword" v-if="func.async">async </span>
                <span class="function-keyword"> function </span>
                <span class="function-name"> {{ func.func }}</span>
                <span class="comment"> {{ func.code }}</span>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';

const FUNCTIONS = [
  { func: ' unloadPage()', code: '{卸载当前页面}' },
  { async: true, func: ' clearStorage()', code: '{清理存储}' },
  {  fun:' destroyComponents()', code: '{销毁组件}' },
  { func: ' hideLoadingIndicator()', code: '{隐藏加载指示器}' },
  { async: true, func: ' init()', code: '{初始化全局变量和配置}' },
  {  func: ' initPage()', code: '{初始化页面结构}' },
  { async: true, func: ' loadDependencies()', code: '{加载外部依赖}' },
  { func: ' checkCompatibility()', code: '{检查浏览器兼容性}' },
  { func: ' setInitialState()', code: '{设置初始状态}' },
  { func: ' initializeData()', code: '{初始化数据}' },
  { async: true,func: ' loadComponents()', code: '{加载组件}' },
  { func: ' setupListeners()', code: '{设置事件监听器}' },
  { func: ' renderContent()', code: '{渲染页面内容}' },
  { func: ' renderHeader()', code: '{渲染页面头部}' },
  { async: true, func: ' renderFooter()', code: '{渲染页面底部}' },
  { func: ' showLoadingIndicator()', code: '{显示加载指示器}' },
  { async: true, func: ' fetchData()', code: '{获取数据}' },
  { func: ' processData()', code: '{处理数据}' },
  { async: true,func: ' validateData()', code: '{验证数据}' },
  { func: ' updateUI()', code: '{更新UI}' },
  { async: true,func: ' bindEvents()', code: '{绑定事件}' },
  { func: ' handleUserInput()', code: '{处理用户输入}' },
  { func: ' complete()', code: '{页面加载完成}' },
  { async: true,func: ' handleError()', code: '{处理错误}' },
];

const stack = ref([]);
const iteration = ref(0);
let intervalId = null;

const startAnimation = () => 
{
  let currentIndex = 0;
  intervalId = setInterval(() => 
  {
    if (currentIndex < FUNCTIONS.length) 
    {
      const newStack = [
        ...stack.value,
        {
          ...FUNCTIONS[currentIndex],
          id: Date.now(), // 确保唯一ID
        },
      ];
      // 只保留最后4个元素
      stack.value = newStack.slice(-4);
      currentIndex++;
    }
    else 
    {
      currentIndex = 0;
      iteration.value++;
      stack.value = [];
    }
  }, 600);
};

onMounted(() => 
{
  startAnimation();
});

onUnmounted(() => 
{
  if (intervalId) 
  {
    clearInterval(intervalId);
  }
});

// 动画钩子函数
const beforeEnter = (el) => 
{
  el.style.opacity = '0';
  el.style.transform = 'translateX(300px) translateY(-40px)';
};

const enter = (el, done) => 
{
  // 使用 setTimeout 确保样式改变被正确应用
  setTimeout(() => 
  {
    el.style.transition = 'all 0.5s ease-out';
    el.style.opacity = '1';
    el.style.transform = 'translateX(0px) translateY(0px)';
    
    // 动画结束后调用 done 回调
    setTimeout(done, 500);
  }, 10);
};

const leave = (el, done) => 
{
  el.style.transition = 'all 0.3s ease-in-out';
  el.style.opacity = '0';
  el.style.transform = 'translateX(-300px)';
  
  // 动画结束后调用 done 回调
  setTimeout(done, 300);
};
</script>

<style scoped lang="less">

.code-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.terminal {
  width: 600px;
  height: 300px;
  background-color: @terminal-bg;
  border-radius: @border-radius-medium;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  position: relative;
  font-family: 'Courier New', monospace;
}

.terminal-header {
  background-color: @terminal-header-bg;
  padding: @size-3 @size-4;
  display: flex;
  align-items: center;
  border-bottom: @border-1 solid @terminal-border;

  .dot {
    display: inline-block;
    width: @size-3;
    height: @size-3;
    border-radius: @border-radius-circle;
    margin-right: @size-2;
  }

  .red {
    background-color: @danger-6;
  }

  .yellow {
    background-color: @warning-6;
  }

  .green {
    background-color: @success-6;
  }

  .title {
    color: var(--color-neutral-4);
    font-size: @font-size-body-3;
    margin-left: auto;
    font-weight: @font-weight-700;
  }
}

.terminal-content {
  padding: @size-5;
  height: calc(100% - 50px);
  overflow: hidden;
  position: relative;
}

.function-calls-container {
  position: relative;
  height: 100%;
}

.function-call-wrapper {
  position: absolute;
  left: @size-5;
  right: @size-5;
  height: 40px;
  display: flex;
  align-items: center;
}

.function-call {
  display: flex;
  align-items: center;
  font-size: @font-size-body-3;
  line-height: 1.5;
  color: @terminal-text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;

  .keyword {
    color: @code-keyword;
    margin-right: @size-1;
  }

  .function-keyword {
    color: @code-function;
    margin: 0 @size-1;
  }

  .function-name {
    color: @code-function-name;
    margin: 0 @size-1;
  }

  .comment {
    color: @code-comment;
    margin-left: @size-2;
  }
}
</style>