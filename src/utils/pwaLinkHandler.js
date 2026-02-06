/**
 * PWA 链接处理工具
 * 在 PWA 模式下拦截所有链接点击，使其在应用内跳转而不是打开浏览器
 */

import router from '@/router';

/**
 * 检查是否在 PWA 模式下运行
 */
export function isPWAMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: window-controls-overlay)').matches ||
         window.navigator.standalone === true;
}

/**
 * 检查链接是否为内部链接
 */
function isInternalLink(url) {
  try {
    const link = new URL(url, window.location.origin);
    return link.origin === window.location.origin;
  } catch {
    // 相对路径也算内部链接
    return !url.startsWith('http://') && !url.startsWith('https://');
  }
}

/**
 * 导航到指定路径
 */
function navigateToPath(href, config) {
  try {
    const url = new URL(href, window.location.origin);
    const path = url.pathname + url.search + url.hash;
    
    // 检查是否为当前页面
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    if (path !== currentPath) {
      if (config.debug) {
        console.log('PWA 内部导航:', path);
      }
      router.push(path);
      return true;
    }
    return false;
  } catch (error) {
    console.error('PWA 导航失败:', error);
    return false;
  }
}

/**
 * 配置选项
 */
const config = {
  // 是否拦截外部链接（true: 拦截并提示, false: 允许在浏览器打开）
  interceptExternalLinks: false,
  // 是否在控制台输出调试信息
  debug: true
};

// 保存原始的 window.open 方法
const originalWindowOpen = window.open;

/**
 * 重写 window.open 方法以拦截内部链接
 */
function overrideWindowOpen() {
  window.open = function(url, target, features) {
    // 如果不在 PWA 模式，使用原始方法
    if (!isPWAMode()) {
      return originalWindowOpen.call(window, url, target, features);
    }

    // 如果没有 URL，使用原始方法
    if (!url) {
      return originalWindowOpen.call(window, url, target, features);
    }

    const urlString = String(url);

    // 检查是否为内部链接
    if (isInternalLink(urlString)) {
      if (config.debug) {
        console.log('拦截 window.open 内部链接:', urlString);
      }
      
      // 在应用内导航
      navigateToPath(urlString, config);
      
      // 返回一个模拟的 window 对象，避免代码报错
      return {
        focus: () => {},
        close: () => {},
        closed: false,
        location: { href: urlString }
      };
    } else {
      // 外部链接
      if (config.interceptExternalLinks) {
        if (config.debug) {
          console.log('拦截 window.open 外部链接:', urlString);
        }
        
        if (confirm(`即将打开外部链接：\n${urlString}\n\n点击"确定"在浏览器中打开\n点击"取消"留在应用内`)) {
          return originalWindowOpen.call(window, url, target, features);
        }
        return null;
      } else {
        // 允许外部链接在浏览器中打开
        if (config.debug) {
          console.log('允许 window.open 外部链接:', urlString);
        }
        return originalWindowOpen.call(window, url, target, features);
      }
    }
  };
}

/**
 * 初始化 PWA 链接拦截器
 */
export function initPWALinkHandler(options = {}) {
  // 合并配置
  Object.assign(config, options);

  if (!isPWAMode()) {
    if (config.debug) {
      console.log('非 PWA 模式，链接拦截器未启动');
    }
    return;
  }

  if (config.debug) {
    console.log('PWA 模式已激活，启用链接拦截器');
  }

  // 1. 重写 window.open 方法
  overrideWindowOpen();

  // 2. 拦截所有点击事件
  document.addEventListener('click', (event) => {
    // 查找最近的 <a> 标签
    let target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }

    if (!target || target.tagName !== 'A') {
      return;
    }

    const href = target.getAttribute('href');
    const targetAttr = target.getAttribute('target');
    
    if (!href || href.startsWith('#') || href === 'javascript:void(0)') {
      return;
    }

    // 检查是否为内部链接
    if (isInternalLink(href)) {
      // 如果是内部链接且有 target="_blank"，也要拦截
      if (targetAttr === '_blank') {
        event.preventDefault();
        event.stopPropagation();
        
        if (config.debug) {
          console.log('拦截 target="_blank" 内部链接:', href);
        }
      } else {
        event.preventDefault();
        event.stopPropagation();
      }

      // 使用 router 进行导航
      navigateToPath(href, config);
    } else if (config.interceptExternalLinks) {
      // 外部链接：拦截并提示
      event.preventDefault();
      event.stopPropagation();
      
      if (config.debug) {
        console.log('拦截外部链接:', href);
      }
      
      // 显示提示，询问用户是否要在浏览器中打开
      if (confirm(`即将打开外部链接：\n${href}\n\n点击"确定"在浏览器中打开\n点击"取消"留在应用内`)) {
        originalWindowOpen.call(window, href, '_blank');
      }
    }
    // 如果 interceptExternalLinks 为 false，外部链接会正常在浏览器中打开
  }, true); // 使用捕获阶段，确保在其他事件处理器之前执行

  if (config.debug) {
    console.log('PWA 链接拦截器已启动，配置:', config);
  }
}
