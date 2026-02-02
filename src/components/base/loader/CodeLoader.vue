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

<style scoped>
.code-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-mask-bg);
  z-index: 9999;
  backdrop-filter: blur(5px);
  padding: 16px;
  box-sizing: border-box;
}

.terminal {
  width: 100%;
  max-width: 600px;
  height: 300px;
  background-color: var(--color-bg-3);
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  font-family: 'Courier New', monospace;
  border: 1px solid var(--color-border-2);
}

.terminal-header {
  background-color: var(--color-bg-4);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border-2);
}

.terminal-header .dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.terminal-header .red {
  background-color: rgb(var(--danger-6));
}

.terminal-header .yellow {
  background-color: rgb(var(--warning-6));
}

.terminal-header .green {
  background-color: rgb(var(--success-6));
}

.terminal-header .title {
  color: var(--color-text-2);
  font-size: 14px;
  margin-left: auto;
  font-weight: 600;
}

.terminal-content {
  padding: 20px;
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
  left: 0;
  right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
}

.function-call {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  max-width: 100%;
  flex-shrink: 1;
}

.function-call .keyword {
  color: color-mix(in srgb, #4277a3 90%, var(--color-neutral-10));
  margin-right: 4px;
  flex-shrink: 0;
}

.function-call .function-keyword {
  color: color-mix(in srgb, #c586c0 90%, var(--color-neutral-10));
  margin: 0 4px;
  flex-shrink: 0;
}

.function-call .function-name {
  color: color-mix(in srgb, #bebe93 90%, var(--color-neutral-10));
  margin: 0 4px;
  flex-shrink: 0;
}

.function-call .comment {
  color: color-mix(in srgb, #507440 90%, var(--color-neutral-10));
  margin-left: 8px;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 手机端适配 */
@media (max-width: 768px) {
  .code-loader {
    padding: 12px;
  }

  .terminal {
    height: 250px;
    max-width: 100%;
  }

  .terminal-header {
    padding: 10px 12px;
  }

  .terminal-header .dot {
    width: 10px;
    height: 10px;
    margin-right: 6px;
  }

  .terminal-header .title {
    font-size: 12px;
  }

  .terminal-content {
    padding: 12px;
  }

  .function-call-wrapper {
    padding: 0 12px;
    height: 35px;
  }

  .function-call {
    font-size: 12px;
  }

  .function-call .keyword,
  .function-call .function-keyword,
  .function-call .function-name {
    margin: 0 2px;
  }

  .function-call .comment {
    margin-left: 4px;
  }
}

@media (max-width: 480px) {
  .terminal {
    height: 220px;
  }

  .terminal-header .title {
    font-size: 11px;
  }

  .function-call {
    font-size: 11px;
  }
}
</style>