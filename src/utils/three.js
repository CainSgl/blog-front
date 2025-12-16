import * as THREE from 'three';

/**
 * Three.js 工具函数集合
 */

// 创建基础场景
export function createScene() 
{
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  return scene;
}

// 创建相机
export function createCamera(container, fov = 75, near = 0.1, far = 1000) 
{
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 5);
  return camera;
}

// 创建渲染器
export function createRenderer(container, antialias = true) 
{
  const renderer = new THREE.WebGLRenderer({ antialias });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  return renderer;
}

// 创建立方体
export function createBox(width = 1, height = 1, depth = 1, color = 0x00ff00) 
{
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshBasicMaterial({ color });
  const cube = new THREE.Mesh(geometry, material);
  return cube;
}

// 创建球体
export function createSphere(radius = 1, color = 0xff0000, widthSegments = 32, heightSegments = 16) 
{
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

// 创建平面
export function createPlane(width = 1, height = 1, color = 0x0000ff) 
{
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({ color });
  const plane = new THREE.Mesh(geometry, material);
  return plane;
}

// 创建材质
export function createMaterial(type = 'basic', color = 0xffffff, options = {}) 
{
  switch (type) 
  {
  case 'basic':
    return new THREE.MeshBasicMaterial({ color, ...options });
  case 'lambert':
    return new THREE.MeshLambertMaterial({ color, ...options });
  case 'phong':
    return new THREE.MeshPhongMaterial({ color, ...options });
  case 'standard':
    return new THREE.MeshStandardMaterial({ color, ...options });
  default:
    return new THREE.MeshBasicMaterial({ color, ...options });
  }
}

// 创建光源
export function createLight(type = 'ambient', color = 0xffffff, intensity = 1, position = [10, 10, 10]) 
{
  switch (type) 
  {
  case 'ambient':
    return new THREE.AmbientLight(color, intensity);
  case 'directional':
    return new THREE.DirectionalLight(color, intensity);
  case 'point':
    const light = new THREE.PointLight(color, intensity);
    light.position.set(...position);
    return light;
  default:
    return new THREE.AmbientLight(color, intensity);
  }
}

// 动画循环
export function startAnimation(renderer, scene, camera, animateCallback = null) 
{
  function animate() 
  {
    requestAnimationFrame(animate);
    
    if (animateCallback) 
    {
      animateCallback();
    }
    
    renderer.render(scene, camera);
  }
  animate();
}

// 窗口尺寸调整
export function handleResize(renderer, camera, container) 
{
  function onWindowResize() 
  {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
  }
  
  window.addEventListener('resize', onWindowResize);
  return onWindowResize;
}

// 销毁场景
export function disposeScene(scene, renderer) 
{
  scene.traverse((object) => 
  {
    if (object.geometry) 
    {
      object.geometry.dispose();
    }
    
    if (object.material) 
    {
      if (Array.isArray(object.material)) 
      {
        object.material.forEach(material => material.dispose());
      }
      else 
      {
        object.material.dispose();
      }
    }
  });
  
  if (renderer.domElement && renderer.domElement.parentNode) 
  {
    renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  
  renderer.dispose();
}

// 创建粒子系统
export function createParticles(count = 1000, color = 0xffffff) 
{
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count * 3; i++) 
  {
    positions[i] = (Math.random() - 0.5) * 20;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color,
    size: 0.1
  });
  
  const particles = new THREE.Points(geometry, material);
  return particles;
}