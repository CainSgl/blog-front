/**
 * PWA 链接处理工具
 * 在 PWA 模式下拦截所有链接点击，使其在应用内跳转而不是打开浏览器
 */

import router from '@/router';

/**
 * 检查是否在 PWA 模式下运行
 */
export function isPWAMode() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const windowControls = window.matchMedia('(display-mode: window-controls-overlay)').matches;
  const iosStandalone = window.navigator.standalone === true;
  
  const isPWA = standalone || windowControls || iosStandalone;
  
  // 调试信息（开发环境）
  if (import.meta.env.DEV) {
    console.log('[PWA 检测]', {
      standalone,
      windowControls,
      iosStandalone,
      isPWA,
      displayMode: window.matchMedia('(display-mode: standalone)').media,
      userAgent: navigator.userAgent
    });
  }
  
  return isPWA;
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
function navigateToPath(href, config, forceRefresh = false) {
  try {
    const url = new URL(href, window.location.origin);
    const path = url.pathname + url.search + url.hash;
    
    // 检查是否为当前页面
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    if (path !== currentPath) {
      safeLog('PWA 内部导航:', path, forceRefresh ? '(强制刷新)' : '');
      showDebugNotification(`导航到: ${path}${forceRefresh ? ' (刷新)' : ''}`);
      
      if (forceRefresh) {
        // 对于需要刷新的场景（如 target="_blank"），先导航再刷新
        router.push(path).then(() => {
          // 使用 router.go(0) 或 location.reload() 刷新页面
          // 这样可以清除组件缓存并重新加载数据
          window.location.href = path;
        });
      } else {
        router.push(path);
      }
      return true;
    } else if (forceRefresh) {
      // 如果是同一页面但需要刷新
      safeLog('PWA 刷新当前页面');
      window.location.reload();
      return true;
    }
    return false;
  } catch (error) {
    safeLog('PWA 导航失败:', error);
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
  debug: false, // 生产环境默认关闭，避免被 terser 删除代码
  // 是否显示通知（用于生产环境调试）
  showNotification: false,
  // target="_blank" 链接是否强制刷新（解决缓存问题）
  refreshOnNewWindow: true
};

// 安全的日志函数，不会被 terser 删除
function safeLog(message, data) {
  if (config.debug && typeof console !== 'undefined' && console.log) {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

// 显示通知（用于生产环境调试）
function showDebugNotification(message) {
  if (config.showNotification && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('PWA 链接拦截器', { body: message });
  }
}

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
      safeLog('拦截 window.open 内部链接:', urlString);
      showDebugNotification(`拦截 window.open: ${urlString}`);
      
      // 在应用内导航，window.open 通常意味着新窗口，所以强制刷新
      navigateToPath(urlString, config, config.refreshOnNewWindow);
      
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
        safeLog('拦截 window.open 外部链接:', urlString);
        
        if (confirm(`即将打开外部链接：\n${urlString}\n\n点击"确定"在浏览器中打开\n点击"取消"留在应用内`)) {
          return originalWindowOpen.call(window, url, target, features);
        }
        return null;
      } else {
        // 允许外部链接在浏览器中打开
        safeLog('允许 window.open 外部链接:', urlString);
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
    safeLog('非 PWA 模式，链接拦截器未启动');
    return;
  }

  safeLog('PWA 模式已激活，启用链接拦截器');
  showDebugNotification('PWA 链接拦截器已启动');

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
      event.preventDefault();
      event.stopPropagation();
      
      // 如果是内部链接且有 target="_blank"，也要拦截
      if (targetAttr === '_blank') {
        safeLog('拦截 target="_blank" 内部链接:', href);
        showDebugNotification(`拦截链接: ${href}`);
        // target="_blank" 意味着新窗口，强制刷新以避免缓存问题
        navigateToPath(href, config, config.refreshOnNewWindow);
      } else {
        // 普通链接，正常导航
        navigateToPath(href, config, false);
      }
    } else if (config.interceptExternalLinks) {
      // 外部链接：拦截并提示
      event.preventDefault();
      event.stopPropagation();
      
      safeLog('拦截外部链接:', href);
      
      // 显示提示，询问用户是否要在浏览器中打开
      if (confirm(`即将打开外部链接：\n${href}\n\n点击"确定"在浏览器中打开\n点击"取消"留在应用内`)) {
        originalWindowOpen.call(window, href, '_blank');
      }
    }
    // 如果 interceptExternalLinks 为 false，外部链接会正常在浏览器中打开
  }, true); // 使用捕获阶段，确保在其他事件处理器之前执行

  safeLog('PWA 链接拦截器已启动，配置:', config);
}
