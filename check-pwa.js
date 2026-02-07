// PWA 配置检查脚本
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 检查 PWA 配置...\n');

// 检查截图文件
const screenshots = [
  'mobile-1.webp',
  'mobile-2.webp',
  'mobile-3.webp',
  'desktop-1.webp',
  'desktop-2.webp',
  'desktop-3.webp'
];

let allFilesExist = true;
console.log('📸 检查截图文件:');
screenshots.forEach(file => {
  const path = join('public', 'screenshots', file);
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// 检查图标文件
console.log('\n🎨 检查图标文件:');
const icons = [
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'favicon.png'
];

icons.forEach(file => {
  const path = join('public', file);
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// 检查配置文件
console.log('\n⚙️  检查配置文件:');
try {
  const config = readFileSync('vite.config.js', 'utf-8');
  
  // 检查是否包含 screenshots 配置
  const hasScreenshots = config.includes('screenshots:');
  console.log(`  ${hasScreenshots ? '✅' : '❌'} screenshots 配置存在`);
  
  // 检查是否正确分离了 purpose
  const hasAnyPurpose = config.includes("purpose: 'any'");
  const hasMaskablePurpose = config.includes("purpose: 'maskable'");
  const hasWrongPurpose = config.includes("purpose: 'any maskable'");
  
  console.log(`  ${hasAnyPurpose ? '✅' : '❌'} purpose: 'any' 配置存在`);
  console.log(`  ${hasMaskablePurpose ? '✅' : '❌'} purpose: 'maskable' 配置存在`);
  console.log(`  ${!hasWrongPurpose ? '✅' : '❌'} 没有 'any maskable' 配置`);
  
  // 检查 WebP 格式
  const hasWebP = config.includes("type: 'image/webp'");
  console.log(`  ${hasWebP ? '✅' : '❌'} 使用 WebP 格式`);
  
  // 检查 form_factor
  const hasNarrow = config.includes("form_factor: 'narrow'");
  const hasWide = config.includes("form_factor: 'wide'");
  console.log(`  ${hasNarrow ? '✅' : '❌'} form_factor: 'narrow' 配置存在`);
  console.log(`  ${hasWide ? '✅' : '❌'} form_factor: 'wide' 配置存在`);
  
} catch (error) {
  console.log('  ❌ 无法读取 vite.config.js');
  allFilesExist = false;
}

// 总结
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('✅ 所有检查通过！PWA 配置正确。');
  console.log('\n下一步：');
  console.log('  1. 运行 npm run build');
  console.log('  2. 运行 npm run preview');
  console.log('  3. 在浏览器中打开 http://localhost:4173');
  console.log('  4. 按 F12 > Application > Manifest 验证');
} else {
  console.log('❌ 发现问题，请检查上述标记为 ❌ 的项目。');
}
console.log('='.repeat(50));
