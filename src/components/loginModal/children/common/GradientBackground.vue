<template>
  <div class="character-flow-background" :class="{ 'has-border-radius': hasBorderRadius }">
    <canvas ref="canvas" class="flow-canvas"></canvas>
    <div v-if="showText" class="welcome-overlay">
      <FloatingText text="欢迎来到Cainsgl的博客" class="welcome-title" />
      <FloatingText text="登录享受更多的服务" class="welcome-subtitle" />
    </div>
  </div>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import * as THREE from 'three';
import FloatingText from './FloatingText.vue';

const props = defineProps({
  showText: {
    type: Boolean,
    default: true
  },
  hasBorderRadius: {
    type: Boolean,
    default: true
  }
});

const canvas = ref(null);

let scene, camera, renderer, animationId;
let characters = [];
let particles = []; // 粒子数组
let particlePool = []; // 粒子对象池
let mouseX = 0, mouseY = 0; // 鼠标位置
let mouseRadius = 80; // 鼠标影响半径
let lastTime = 0;
const frameSkip = 2; // 跳过每隔一帧
let frameCount = 0;

// 字符配置
const CHAR_CONFIG = {
  count: 70, // 减少字符数量以提高性能
  size: 40,   // 字符大小（增大字体）
  speed:2.8, // 流动速度（稍快一些）
  colors: ['#ffffff', '#ffd1dc', '#ffb347', '#ff6b9d', '#ff8e53'] // 字符颜色（与粉红橙黄色背景协调的新配色）
};

// 粒子配置
const PARTICLE_CONFIG = {
  count: 10,    // 减少每个字符粉碎时产生的粒子数
  size: 12,     // 粒子大小 
  speed: 1.2,   // 粒子扩散速度
  lifetime: 40, // 粒子存在时间（帧数）
  maxParticles: 200 // 降低最大粒子数量限制
};

// 生成随机字符 (A-Z 和 0-9)
function getRandomChar() 
{
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

// 从对象池获取粒子
function getParticleFromPool() 
{
  if (particlePool.length > 0) 
  {
    return particlePool.pop();
  }
  return null;
}

// 将粒子返回到对象池
function returnParticleToPool(particle) 
{
  // 重置粒子状态
  particle.userData.velocity.set(
    (Math.random() - 0.5) * PARTICLE_CONFIG.speed * 2,
    Math.random() * PARTICLE_CONFIG.speed + 0.5,
    (Math.random() - 0.5) * PARTICLE_CONFIG.speed
  );
  particle.userData.life = PARTICLE_CONFIG.lifetime;
  particle.material.opacity = 0.9;
  particle.scale.set(PARTICLE_CONFIG.size, PARTICLE_CONFIG.size, 1);
  particle.visible = true;
  particlePool.push(particle);
}

// 创建粒子
function createParticle(x, y, color) 
{
  // 检查粒子数量限制
  if (particles.length >= PARTICLE_CONFIG.maxParticles) 
  {
    return null;
  }
  
  // 尝试从对象池获取粒子
  let sprite = getParticleFromPool();
  
  if (sprite) 
  {
    // 重用现有粒子
    sprite.material.color.set(color);
    sprite.position.set(x, y, Math.random() * 50);
    
    // 更新纹理
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    
    sprite.material.map.image = canvas;
    sprite.material.map.needsUpdate = true;
  }
  else 
  {
    // 创建新的粒子
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    
    sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, Math.random() * 50);
    sprite.scale.set(PARTICLE_CONFIG.size, PARTICLE_CONFIG.size, 1);
  }
  
  // 存储粒子信息，添加重力效果
  if (!sprite.userData) 
  {
    sprite.userData = {};
  }
  
  if (!sprite.userData.velocity) 
  {
    sprite.userData.velocity = new THREE.Vector3();
  }
  
  sprite.userData.velocity.set(
    (Math.random() - 0.5) * PARTICLE_CONFIG.speed * 2,
    Math.random() * PARTICLE_CONFIG.speed + 0.5,
    (Math.random() - 0.5) * PARTICLE_CONFIG.speed
  );
  
  sprite.userData.life = PARTICLE_CONFIG.lifetime;
  sprite.userData.initialSize = PARTICLE_CONFIG.size;
  sprite.userData.color = color;
  sprite.userData.gravity = 0.02;
  
  scene.add(sprite);
  particles.push(sprite);
  
  return sprite;
}

// 获取容器宽度
function getContainerWidth() 
{
  return canvas.value ? canvas.value.parentElement.clientWidth : window.innerWidth;
}

// 获取容器高度的一半（用于定位计算）
function getContainerHalfHeight() 
{
  return canvas.value ? canvas.value.parentElement.clientHeight / 2 : window.innerHeight / 2;
}

// 创建流动字符
function createFlowCharacter() 
{
  // 创建canvas用于绘制字符
  const canvas = document.createElement('canvas');
  const size = 64; // 减小canvas大小以提高性能
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const char = getRandomChar();
  const color = CHAR_CONFIG.colors[Math.floor(Math.random() * CHAR_CONFIG.colors.length)];
  
  ctx.clearRect(0, 0, size, size);
  ctx.font = 'bold 56px Arial'; // 增大字体大小
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 15; // 增加阴影模糊以增强视觉效果
  ctx.fillText(char, size / 2, size / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    opacity: 0.8
  });
  
  const sprite = new THREE.Sprite(material);
  
  // 获取容器尺寸
  const containerWidth = getContainerWidth();
  const containerHalfHeight = getContainerHalfHeight();
  
  // 随机位置（水平随机，垂直在屏幕底部附近）
  // 将字符限制在容器区域内 (0 到 containerWidth)
  const x = Math.random() * containerWidth;
  const y = -containerHalfHeight - Math.random() * 200;
  const z = Math.random() * 50; // 减小z轴范围
  
  // 调整坐标系，使(0,0)为中心点
  const adjustedX = x - containerWidth / 2;
  
  sprite.position.set(adjustedX, y, z);
  sprite.scale.set(CHAR_CONFIG.size, CHAR_CONFIG.size, 1);
  
  // 存储字符信息
  sprite.userData = {
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.1, // 减少水平移动幅度
      Math.random() * CHAR_CONFIG.speed + 0.3, // 稍微增加垂直移动速度
      0
    ),
    char: char,
    initialY: y,
    life: 1.0
  };
  
  scene.add(sprite);
  characters.push(sprite);
  
  return sprite;
}

// 初始化three.js场景
function initThreeJS() 
{
  scene = new THREE.Scene();
  
  // 获取容器尺寸
  const containerWidth = canvas.value.parentElement.clientWidth;
  const containerHeight = canvas.value.parentElement.clientHeight;
  
  camera = new THREE.PerspectiveCamera(
    75,
    containerWidth / containerHeight,
    1,
    2000
  );
  camera.position.z = 800;
  
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas.value,
    alpha: true,
    antialias: false, // 关闭抗锯齿以提高性能
    powerPreference: 'high-performance',
    stencil: false,
    depth: false,
    logarithmicDepthBuffer: false
  });
  renderer.setSize(containerWidth, containerHeight);
  renderer.setClearColor(0xff6b9d, 0); // 设置为透明背景以显示CSS渐变
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // 创建初始字符
  for (let i = 0; i < CHAR_CONFIG.count; i++) 
  {
    createFlowCharacter();
  }
  
  // 添加多种光源以增强视觉效果
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 0, 1).normalize();
  scene.add(directionalLight);
  
  const pointLight1 = new THREE.PointLight(0x00ff88, 0.4, 1000);
  pointLight1.position.set(0, 0, 300);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0x00d4ff, 0.3, 800);
  pointLight2.position.set(200, 100, 200);
  scene.add(pointLight2);
  
  const pointLight3 = new THREE.PointLight(0xc3cfe2, 0.3, 800);
  pointLight3.position.set(-200, -100, 200);
  scene.add(pointLight3);
}

// 动画循环
function animate() 
{
  animationId = requestAnimationFrame(animate);
  
  // 帧率控制优化
  frameCount++;
  if (frameCount % frameSkip !== 0) 
  {
    return;
  }
  
  const time = Date.now() * 0.001; // 获取当前时间用于动画计算
  
  // 更新字符位置
  characters.forEach((char, index) => 
  {
    // 移动字符
    char.position.y += char.userData.velocity.y;
    char.position.x += char.userData.velocity.x;
    
    // 更流畅的透明度变化效果
    const opacityPhase = Math.sin(time * 2 + index * 0.2) * 0.3 + 0.7;
    char.material.opacity = opacityPhase;
    
    // 轻微的缩放动画效果
    const scalePhase = Math.sin(time * 1.5 + index * 0.3) * 0.1 + 1;
    char.scale.set(CHAR_CONFIG.size * scalePhase, CHAR_CONFIG.size * scalePhase, 1);
    
    // 检查鼠标碰撞
    const dx = char.position.x - mouseX;
    const dy = char.position.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果鼠标靠近字符，则创建粒子粉碎效果
    if (distance < mouseRadius) 
    {
      resetCharacterAndCreateParticles(char);
    }
    // 如果字符超出屏幕顶部，则创建粒子粉碎效果
    else if (char.position.y > getContainerHalfHeight() + 100) 
    {
      resetCharacterAndCreateParticles(char);
    }
  });
  
  // 更新粒子
  for (let i = particles.length - 1; i >= 0; i--) 
  {
    const particle = particles[i];
    
    // 应用重力效果
    particle.userData.velocity.y -= particle.userData.gravity;
    
    // 更新粒子位置
    particle.position.x += particle.userData.velocity.x;
    particle.position.y += particle.userData.velocity.y;
    particle.position.z += particle.userData.velocity.z;
    
    // 减少粒子生命值
    particle.userData.life--;
    
    // 更新粒子透明度和大小
    const lifeRatio = particle.userData.life / PARTICLE_CONFIG.lifetime;
    particle.material.opacity = lifeRatio * 0.8 + 0.2; // 最小透明度为0.2
    const currentSize = particle.userData.initialSize * lifeRatio;
    particle.scale.set(currentSize, currentSize, 1);
    
    // 如果粒子生命结束，返回到对象池
    if (particle.userData.life <= 0) 
    {
      scene.remove(particle);
      particles.splice(i, 1);
      returnParticleToPool(particle);
    }
  }
  
  // 随机添加新字符（保持数量稳定）
  if (characters.length < CHAR_CONFIG.count && Math.random() < 0.05) 
  {
    createFlowCharacter();
  }
  
  renderer.render(scene, camera);
}

// 处理鼠标移动
function handleMouseMove(event) 
{
  if (!canvas.value) return;
  
  // 获取容器尺寸
  const containerWidth = getContainerWidth();
  const containerHalfHeight = getContainerHalfHeight();
  
  // 计算相对于容器的鼠标位置
  const rect = canvas.value.getBoundingClientRect();
  const relativeX = event.clientX - rect.left;
  const relativeY = event.clientY - rect.top;
  
  // 将鼠标位置转换为Three.js坐标系（限制在容器区域内）
  if (relativeX >= 0 && relativeX <= containerWidth && relativeY >= 0 && relativeY <= containerHalfHeight * 2) 
  {
    // 将相对坐标转换为-1到1的范围
    mouseX = (relativeX / (containerWidth / 2)) - 1;
    mouseY = -(relativeY / containerHalfHeight) + 1;
    
    // 转换为世界坐标（调整坐标系，使(0,0)为中心点）
    mouseX = mouseX * (containerWidth / 2);
    mouseY = mouseY * containerHalfHeight;
  }
}

// 处理窗口大小变化
function handleResize() 
{
  if (camera && renderer && canvas.value) 
  {
    const containerWidth = canvas.value.parentElement.clientWidth;
    const containerHeight = canvas.value.parentElement.clientHeight;
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
  }
}

// 重置字符并创建粒子效果
function resetCharacterAndCreateParticles(char) 
{
  // 获取字符的颜色
  const color = CHAR_CONFIG.colors[Math.floor(Math.random() * CHAR_CONFIG.colors.length)];
  
  // 创建粒子粉碎效果
  for (let i = 0; i < PARTICLE_CONFIG.count; i++) 
  {
    createParticle(char.position.x, char.position.y, color);
  }
  
  // 获取容器尺寸
  const containerWidth = getContainerWidth();
  const containerHalfHeight = getContainerHalfHeight();
  
  // 重置字符
  char.position.y = -containerHalfHeight - Math.random() * 200;
  // 将字符限制在容器区域内 (0 到 containerWidth)
  const x = Math.random() * containerWidth;
  // 调整坐标系，使(0,0)为中心点
  const adjustedX = x - containerWidth / 2;
  char.position.x = adjustedX;
  char.userData.char = getRandomChar();
  
  // 更新纹理
  const canvas = document.createElement('canvas');
  const size = 64; // 使用一致的大小
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const newColor = CHAR_CONFIG.colors[Math.floor(Math.random() * CHAR_CONFIG.colors.length)];
  ctx.clearRect(0, 0, size, size);
  ctx.font = 'bold 56px Arial'; // 使用一致的字体大小
  ctx.fillStyle = newColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = newColor;
  ctx.shadowBlur = 15; // 使用一致的阴影模糊值
  ctx.fillText(char.userData.char, size / 2, size / 2);
  
  char.material.map.dispose();
  char.material.map = new THREE.CanvasTexture(canvas);
  char.material.map.needsUpdate = true;
}

// 处理键盘按下事件
function handleKeyDown(event) 
{
  // 获取按下的键值并转换为大写
  const keyPressed = event.key.toUpperCase();
  
  // 检查是否为字母键或数字键
  if (/^[A-Z0-9]$/.test(keyPressed)) 
  {
    // 查找匹配的字符并粉碎它们
    characters.forEach(char => 
    {
      if (char.userData.char === keyPressed) 
      {
        resetCharacterAndCreateParticles(char);
      }
    });
  }
}

onMounted(() => 
{
  // 延迟初始化以确保容器已正确渲染
  const initialize = () => 
  {
    if (canvas.value && canvas.value.parentElement && canvas.value.parentElement.clientWidth > 0) 
    {
      initThreeJS();
      animate();
    }
    else 
    {
      // 如果容器还未正确渲染，稍后再试
      setTimeout(initialize, 100);
    }
  };
  
  initialize();
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => 
{
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('keydown', handleKeyDown);

  if (animationId) 
  {
    cancelAnimationFrame(animationId);
  }
  
  if (renderer) 
  {
    renderer.dispose();
  }
  
  // 清理字符
  characters.forEach(char => 
  {
    if (char.material.map) 
    {
      char.material.map.dispose();
    }
    char.material.dispose();
  });
  
  // 清理粒子
  particles.forEach(particle => 
  {
    scene.remove(particle);
  });
  
  // 清理粒子池
  [...particles, ...particlePool].forEach(particle => 
  {
    if (particle.material.map) 
    {
      particle.material.map.dispose();
    }
    particle.material.dispose();
  });
  
  particles = [];
  particlePool = [];
});
</script>

<style scoped>
.character-flow-background {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8e53 50%, #ff6b9d 100%);
  overflow: hidden;
}

.character-flow-background.has-border-radius {
  /* 添加向内边框效果，创造凸起的视觉层次 */
  box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.3),
              inset 0 0 20px rgba(0, 0, 0, 0.1);
  border-radius: 0% 5% 5% 0%;
  /* 添加裁剪效果，隐藏背景外的内容 */
  clip-path: inset(0 0 0 0 round 0% 5% 5% 0%);
}

.flow-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.welcome-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 10;
  pointer-events: none;
}

.welcome-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.2;
  text-shadow: none;
  color: white;
  /* 最简化背景效果 */
  padding: 5px 10px;
}

.welcome-subtitle {
  font-size: 20px;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
  text-shadow: none;
  color: #ffffff;
  /* 最简化背景效果 */
  padding: 5px 10px;
}



@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 100% 50%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 32px;
  }
  
  .welcome-subtitle {
    font-size: 16px;
  }
}
</style>