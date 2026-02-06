/**
 * PWA 诊断工具
 * 用于在生产环境检查 PWA 链接拦截器是否正常工作
 */

/**
 * 检查 PWA 状态
 */
export function checkPWAStatus() {
  const status = {
    isPWA: false,
    displayMode: 'browser',
    userAgent: navigator.userAgent,
    standalone: window.navigator.standalone,
    windowOpenOverridden: false,
    timestamp: new Date().toISOString()
  };

  // 检查显示模式
  if (window.matchMedia('(display-mode: standalone)').matches) {
    status.isPWA = true;
    status.displayMode = 'standalone';
  } else if (window.matchMedia('(display-mode: window-controls-overlay)').matches) {
    status.isPWA = true;
    status.displayMode = 'window-controls-overlay';
  } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
    status.isPWA = true;
    status.displayMode = 'fullscreen';
  } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    status.isPWA = true;
    status.displayMode = 'minimal-ui';
  }

  // iOS Safari 特殊检查
  if (window.navigator.standalone === true) {
    status.isPWA = true;
    status.displayMode = 'standalone (iOS)';
  }

  // 检查 window.open 是否被重写
  status.windowOpenOverridden = window.open.toString().includes('originalWindowOpen') || 
                                 window.open.toString().length > 100;

  return status;
}

/**
 * 测试链接拦截
 */
export function testLinkInterception() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // 测试 1: window.open 内部链接
  try {
    const result = window.open('/test', '_blank');
    results.tests.push({
      name: 'window.open 内部链接',
      success: result !== null && typeof result === 'object',
      result: result ? 'intercepted' : 'failed',
      details: result
    });
  } catch (error) {
    results.tests.push({
      name: 'window.open 内部链接',
      success: false,
      error: error.message
    });
  }

  return results;
}

/**
 * 在页面上显示诊断信息
 */
export function showDiagnostics() {
  const status = checkPWAStatus();
  const testResults = testLinkInterception();

  const diagnosticInfo = `
=== PWA 诊断信息 ===
时间: ${status.timestamp}
是否为 PWA: ${status.isPWA ? '是' : '否'}
显示模式: ${status.displayMode}
window.open 已重写: ${status.windowOpenOverridden ? '是' : '否'}
User Agent: ${status.userAgent}

=== 拦截测试结果 ===
${testResults.tests.map(test => `
测试: ${test.name}
结果: ${test.success ? '成功' : '失败'}
${test.error ? `错误: ${test.error}` : ''}
${test.details ? `详情: ${JSON.stringify(test.details)}` : ''}
`).join('\n')}
  `.trim();

  // 在控制台输出
  if (typeof console !== 'undefined' && console.log) {
    console.log(diagnosticInfo);
  }

  // 显示弹窗
  alert(diagnosticInfo);

  return { status, testResults };
}

// 暴露到全局，方便在控制台调用
if (typeof window !== 'undefined') {
  window.pwaDiagnostics = {
    checkStatus: checkPWAStatus,
    testInterception: testLinkInterception,
    showDiagnostics: showDiagnostics
  };
}
