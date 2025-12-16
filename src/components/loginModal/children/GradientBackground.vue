<template>
  <div class="character-flow-background">
    <canvas ref="canvas" class="flow-canvas"></canvas>
    <div class="welcome-overlay">
      <h1 class="welcome-title">欢迎回来</h1>
      <p class="welcome-subtitle">登录您的账户以继续</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvas = ref(null);

let scene, camera, renderer, animationId;
let characters = [];
let particles = []; // 粒子数组

// 字符配置
const CHAR_CONFIG = {
  count: 80, // 字符数量（减少数量以提高性能）
  size: 30,   // 字符大小
  speed:1.25, // 流动速度（稍快一些）
  colors: ['#00ff88', '#00d4ff', '#c3cfe2', '#ffffff'] // 字符颜色
};

// 粒子配置
const PARTICLE_CONFIG = {
  count: 15,    // 每个字符粉碎时产生的粒子数
  size: 12,     // 粒子大小
  speed: 1.2,   // 粒子扩散速度
  lifetime: 50, // 粒子存在时间（帧数）
  maxParticles: 500 // 最大粒子数量限制
};

// 生成随机字符 (A-Z)
function getRandomChar() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

// 创建粒子
function createParticle(x, y, color) {
  // 检查粒子数量限制
  if (particles.length >= PARTICLE_CONFIG.maxParticles) {
    return null;
  }
  
  // 创建canvas用于绘制粒子
  const canvas = document.createElement('canvas');
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 绘制圆形粒子，添加渐变效果
  ctx.clearRect(0, 0, size, size);
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    opacity: 0.9
  });
  
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, Math.random() * 50);
  sprite.scale.set(PARTICLE_CONFIG.size, PARTICLE_CONFIG.size, 1);
  
  // 存储粒子信息，添加重力效果
  sprite.userData = {
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * PARTICLE_CONFIG.speed * 2,
      Math.random() * PARTICLE_CONFIG.speed + 0.5, // 向上的初速度
      (Math.random() - 0.5) * PARTICLE_CONFIG.speed
    ),
    life: PARTICLE_CONFIG.lifetime,
    initialSize: PARTICLE_CONFIG.size,
    color: color,
    gravity: 0.03 // 重力效果
  };
  
  scene.add(sprite);
  particles.push(sprite);
  
  return sprite;
}

// 创建流动字符
function createFlowCharacter() {
  // 创建canvas用于绘制字符
  const canvas = document.createElement('canvas');
  const size = 64; // 减小canvas大小以提高性能
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const char = getRandomChar();
  const color = CHAR_CONFIG.colors[Math.floor(Math.random() * CHAR_CONFIG.colors.length)];
  
  ctx.clearRect(0, 0, size, size);
  ctx.font = 'bold 48px Arial'; // 调整字体大小以适应较小的canvas
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10; // 稍微减小阴影模糊以提高性能
  ctx.fillText(char, size / 2, size / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    opacity: 0.8
  });
  
  const sprite = new THREE.Sprite(material);
  
  // 随机位置（水平随机，垂直在屏幕底部附近）
  const x = (Math.random() - 0.5) * window.innerWidth;
  const y = -window.innerHeight / 2 - Math.random() * 200;
  const z = Math.random() * 50; // 减小z轴范围
  
  sprite.position.set(x, y, z);
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
function initThreeJS() {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.z = 800;
  
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas.value,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a0a, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // 创建初始字符
  for (let i = 0; i < CHAR_CONFIG.count; i++) {
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
function animate() {
  animationId = requestAnimationFrame(animate);
  
  const time = Date.now() * 0.001; // 获取当前时间用于动画计算
  
  // 更新字符位置
  characters.forEach((char, index) => {
    // 移动字符
    char.position.y += char.userData.velocity.y;
    char.position.x += char.userData.velocity.x;
    
    // 更流畅的透明度变化效果
    const opacityPhase = Math.sin(time * 2 + index * 0.2) * 0.3 + 0.7;
    char.material.opacity = opacityPhase;
    
    // 轻微的缩放动画效果
    const scalePhase = Math.sin(time * 1.5 + index * 0.3) * 0.1 + 1;
    char.scale.set(CHAR_CONFIG.size * scalePhase, CHAR_CONFIG.size * scalePhase, 1);
    
    // 如果字符超出屏幕顶部，则创建粒子粉碎效果
    if (char.position.y > window.innerHeight / 2 + 100) {
      // 获取字符的颜色
      const color = CHAR_CONFIG.colors[Math.floor(Math.random() * CHAR_CONFIG.colors.length)];
      
      // 创建粒子粉碎效果
      for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
        createParticle(char.position.x, char.position.y, color);
      }
      
      // 重置字符
      char.position.y = -window.innerHeight / 2 - Math.random() * 200;
      char.position.x = (Math.random() - 0.5) * window.innerWidth;
      char.userData.char = getRandomChar();
      
      // 更新纹理
      const canvas = document.createElement('canvas');
      const size = 64; // 使用一致的大小
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      const newColor = CHAR_CONFIG.colors[Math.floor(Math.random() * CHAR_CONFIG.colors.length)];
      ctx.clearRect(0, 0, size, size);
      ctx.font = 'bold 48px Arial'; // 使用一致的字体大小
      ctx.fillStyle = newColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = newColor;
      ctx.shadowBlur = 10; // 使用一致的阴影模糊值
      ctx.fillText(char.userData.char, size / 2, size / 2);
      
      char.material.map.dispose();
      char.material.map = new THREE.CanvasTexture(canvas);
      char.material.map.needsUpdate = true;
    }
  });
  
  // 更新粒子
  for (let i = particles.length - 1; i >= 0; i--) {
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
    
    // 如果粒子生命结束，移除粒子
    if (particle.userData.life <= 0) {
      scene.remove(particle);
      if (particle.material.map) {
        particle.material.map.dispose();
      }
      particle.material.dispose();
      particles.splice(i, 1);
    }
  }
  
  // 随机添加新字符（保持数量稳定）
  if (characters.length < CHAR_CONFIG.count && Math.random() < 0.05) {
    createFlowCharacter();
  }
  
  renderer.render(scene, camera);
}

// 处理窗口大小变化
function handleResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

onMounted(() => {
  initThreeJS();
  animate();
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  if (renderer) {
    renderer.dispose();
  }
  
  // 清理字符
  characters.forEach(char => {
    if (char.material.map) {
      char.material.map.dispose();
    }
    char.material.dispose();
  });
  
  // 清理粒子
  particles.forEach(particle => {
    if (particle.material.map) {
      particle.material.map.dispose();
    }
    particle.material.dispose();
  });
  particles = [];
});
</script>

<style scoped>
.character-flow-background {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
  overflow: hidden;
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
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
  background: linear-gradient(45deg, #ffffff, #00ff88, #00d4ff, #c3cfe2);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 4s ease-in-out infinite;
}

.welcome-subtitle {
  font-size: 20px;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
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