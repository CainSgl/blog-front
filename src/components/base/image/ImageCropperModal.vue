<template>
  <ModalWrapper
    v-model:visible="visible"
    title="图片裁剪"
    :footer="false"
    :mask-closable="false"
    :closable="true"
    :width="modalWidth"
    @cancel="handleCancel"
  >
    <div class="image-cropper-container">
      <div class="cropper-content">
        <!-- 左侧：裁剪区域 -->
        <div class="cropper-left">
          <div class="canvas-container">
            <canvas ref="canvasRef" class="cropper-canvas"></canvas>
            <div 
              class="crop-area" 
              :style="cropAreaStyle"
              @mousedown="startCrop"
              @touchstart.passive="startCrop"
            >
              <!-- 在裁剪区域内部显示裁剪预览 -->
              <canvas 
                ref="cropPreviewCanvasRef" 
                class="crop-preview-canvas"
                :style="{ width: '100%', height: '100%', display: 'block', 'box-sizing': 'border-box' }"
              ></canvas>
              <div class="crop-controls">
                <div class="resize-handle resize-top-left" @mousedown.stop="startResize('top-left')" @touchstart.stop.passive="startResize('top-left')"></div>
                <div class="resize-handle resize-top" @mousedown.stop="startResize('top')" @touchstart.stop.passive="startResize('top')"></div>
                <div class="resize-handle resize-top-right" @mousedown.stop="startResize('top-right')" @touchstart.stop.passive="startResize('top-right')"></div>
                <div class="resize-handle resize-left" @mousedown.stop="startResize('left')" @touchstart.stop.passive="startResize('left')"></div>
                <div class="resize-handle resize-right" @mousedown.stop="startResize('right')" @touchstart.stop.passive="startResize('right')"></div>
                <div class="resize-handle resize-bottom-left" @mousedown.stop="startResize('bottom-left')" @touchstart.stop.passive="startResize('bottom-left')"></div>
                <div class="resize-handle resize-bottom" @mousedown.stop="startResize('bottom')" @touchstart.stop.passive="startResize('bottom')"></div>
                <div class="resize-handle resize-bottom-right" @mousedown.stop="startResize('bottom-right')" @touchstart.stop.passive="startResize('bottom-right')"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧：预览区域 -->
        <div class="cropper-right">
          <div class="preview-title">预览</div>
          <div class="preview-container">
            <canvas ref="previewCanvasRef" class="preview-canvas"></canvas>
          </div>
          <div class="preview-size" v-if="!auto">
            <span>尺寸: 1 × {{ aspectRatio }}</span>
          </div>
          <a-input  
            v-if="editFileName"
            v-model="fileName" 
            placeholder="输入文件名" 
            class="file-name-input"
            @press-enter="confirmCrop"
          />
          <a-button type="primary" @click="confirmCrop" class="confirm-btn">确定裁剪</a-button>
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {Message} from '@arco-design/web-vue';
import ModalWrapper from '@/components/base/ModalWrapper.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  aspectRatio: {
    type: Number,
    default: 1 // 默认1:1比例
  },
  auto:{
    type:Boolean,
    default:false
  },
  originalFileName: {
    type: String,
    default: ''
  },
  editFileName:{
    type:Boolean,
    default:true
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 跟踪canvas的实际宽度
const canvasActualWidth = ref(0);
const canvesWidth=ref(500);
// 计算模态框宽度
const modalWidth = computed(() => 
{
  // 左侧画布区域宽度加上一些边距（预留空间给控件）
  const canvasWidth = canvesWidth.value+ 100; // 默认值500
  // 右侧预览区域宽度，考虑aspectRatio
  const previewWidth = previewSize.value.width + 40; // 加上一些边距
  // 总宽度 = 左侧画布宽度 + 右侧宽度 + 一些边距
  const totalWidth = canvasWidth + previewWidth + 40; // 40是左右间距
  
  // 确保不超过屏幕宽度
  return Math.min(totalWidth, window.innerWidth - 40);
});



const image = ref(null);
const canvasRef = ref(null);
const previewCanvasRef = ref(null);
const cropPreviewCanvasRef = ref(null);
const originalImage = ref(null);
const fileName = ref('');

// 裁剪区域相关
const cropStart = ref({ x: 0, y: 0 });
const cropArea = ref({ x: 50, y: 50, width: 200, height: 200 });
const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref('');

// 预览尺寸，根据aspectRatio调整
const previewSize = computed(() => 
{
  const baseWidth = 150; // 基础显示宽度
  // 始终根据当前裁剪区域的实际比例计算预览尺寸
  const currentAspectRatio = cropArea.value.width > 0 ? cropArea.value.height / cropArea.value.width : 1;
  return {
    width: baseWidth,
    height: baseWidth * currentAspectRatio
  };
});

// 预览canvas的实际分辨率（用于高清渲染）
const previewCanvasSize = computed(() => 
{
  // 使用2倍或更高的分辨率来避免马赛克
  const scale = 2; // 可以根据需要调整，2倍通常足够
  return {
    width: previewSize.value.width * scale,
    height: previewSize.value.height * scale
  };
});

// 裁剪区域样式
const cropAreaStyle = computed(() => 
{
  return {
    left: `${cropArea.value.x}px`,
    top: `${cropArea.value.y}px`,
    width: `${cropArea.value.width}px`,
    height: `${cropArea.value.height}px`,
    cursor: isDragging.value ? 'grabbing' : 'move'
  };
});

// 设置图片
const setImage = (img) => 
{
  console.log(img);
  originalImage.value = img;
  image.value = new Image();
  image.value.src = img.src;
  // 使用 props 中的原始文件名，如果未提供则尝试从图片源中提取
  if (props.originalFileName) 
  {
    fileName.value = props.originalFileName;
  }
  else 
  {
    // 从图片的src中提取文件名
    const src = img.src;
    if (src) 
    {
      const pathParts = src.split('/');
      const fileNameWithExtension = pathParts[pathParts.length - 1];
      const fileNameWithoutExtension = fileNameWithExtension;
      fileName.value = fileNameWithoutExtension || 'cropped_image';
    }
    else 
    {
      fileName.value = 'cropped_image';
    }
  }
  image.value.onload = () => 
  {
    nextTick(() => 
    {
      initCanvas();
      drawImage();
      updatePreview();
    });
  };
};

// 初始化canvas
const initCanvas = () => 
{
  if (!image.value || !canvasRef.value) return;
  
  const canvas = canvasRef.value;
  // 计算左侧画布区域最大宽度为屏幕的75%
  const maxWidth = window.innerWidth * 0.75 - 40; // 减去边距
  const maxHeight = window.innerHeight * 0.7; // 设置最大高度避免超出屏幕
  
  // 计算合适的canvas尺寸，保持图片比例
  const imageRatio = image.value.width / image.value.height;
  
  let canvasWidth, canvasHeight;
  if (imageRatio > 1) 
  {
    // 图片更宽，以宽度为准
    canvasWidth = Math.min(maxWidth, image.value.width);
    canvasHeight = canvasWidth / imageRatio;
    // 检查高度是否超出
    if (canvasHeight > maxHeight) 
    {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * imageRatio;
    }
  }
  else 
  {
    // 图片更高或正方形，以高度为准
    canvasHeight = Math.min(maxHeight, image.value.height);
    canvasWidth = canvasHeight * imageRatio;
    // 检查宽度是否超出
    if (canvasWidth > maxWidth) 
    {
      canvasWidth = maxWidth;
      canvasHeight = canvasWidth / imageRatio;
    }
  }
  
  // 设置canvas尺寸
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvesWidth.value = canvasWidth;
  let defaultWidth, defaultHeight;
  if (props.auto) 
  {
    // 在auto模式下，裁剪框初始大小与canvas一致，代表可以选择整个图片
    defaultWidth = canvasWidth;
    defaultHeight = canvasHeight;
  }
  else 
  {
    // 非auto模式下，优先将选择区域高度设置成跟canvas一样，再通过aspectRatio计算宽度
    defaultHeight = canvasHeight;
    defaultWidth = defaultHeight * props.aspectRatio;
    
    // 如果计算出的宽度超出了canvas宽度，则将宽度设置成canvas宽度，再计算高度
    if (defaultWidth > canvasWidth) 
    {
      defaultWidth = canvasWidth;
      defaultHeight = defaultWidth / props.aspectRatio;
    }
    
    // 确保裁剪区域不超出canvas范围（兜底方案）
    defaultWidth = Math.min(defaultWidth, canvasWidth);
    defaultHeight = Math.min(defaultHeight, canvasHeight);
    
    // 如果计算出的尺寸仍然不合理（如过小），则使用默认尺寸作为最终兜底方案
    if (defaultWidth < 20 || defaultHeight < 20) 
    {
      defaultWidth = Math.min(200, canvasWidth * 0.5, canvasHeight * 0.5);
      if (props.aspectRatio > 0) 
      {
        defaultHeight = defaultWidth / props.aspectRatio;
      }
      else 
      {
        defaultHeight = defaultWidth;
      }
    }
  }
  // 更新裁剪区域位置，使其居中
  cropArea.value = {
    x: (canvasWidth - defaultWidth) / 2,
    y: (canvasHeight - defaultHeight) / 2,
    width: defaultWidth,
    height: defaultHeight
  };
};

// 绘制图片到canvas
const drawImage = () => 
{
  if (!image.value || !canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制图片
  ctx.drawImage(image.value, 0, 0, canvas.width, canvas.height);
  
  // 绘制裁剪区域预览
  updateCropPreview();
  
  // 绘制半透明遮罩
  drawMask();
};

// 更新裁剪区域预览
const updateCropPreview = () => 
{
  if (!originalImage.value || !cropPreviewCanvasRef.value) return;
  
  const cropPreviewCanvas = cropPreviewCanvasRef.value;
  const cropPreviewCtx = cropPreviewCanvas.getContext('2d');
  
  // 设置裁剪预览canvas尺寸
  cropPreviewCanvas.width = cropArea.value.width;
  cropPreviewCanvas.height = cropArea.value.height;
  
  // 启用高质量图像平滑
  cropPreviewCtx.imageSmoothingEnabled = true;
  cropPreviewCtx.imageSmoothingQuality = 'high';
  
  // 计算实际裁剪区域在原图上的坐标
  const scaleX = originalImage.value.width / canvasRef.value.width;
  const scaleY = originalImage.value.height / canvasRef.value.height;
  
  const cropX = cropArea.value.x * scaleX;
  const cropY = cropArea.value.y * scaleY;
  const cropWidth = cropArea.value.width * scaleX;
  const cropHeight = cropArea.value.height * scaleY;
  
  // 清空裁剪预览画布
  cropPreviewCtx.clearRect(0, 0, cropPreviewCanvas.width, cropPreviewCanvas.height);
  
  // 绘制裁剪区域内容
  if (originalImage.value.complete) 
  {
    cropPreviewCtx.drawImage(
      originalImage.value,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropPreviewCanvas.width, cropPreviewCanvas.height
    );
  }
};

// 绘制半透明遮罩
const drawMask = () => 
{
  if (!canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  
  // 绘制半透明遮罩，覆盖整个画布
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 设置合成操作，挖空裁剪区域
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'white'; // 用白色挖空
  ctx.fillRect(
    cropArea.value.x,
    cropArea.value.y,
    cropArea.value.width,
    cropArea.value.height
  );
  
  // 恢复默认合成操作
  ctx.globalCompositeOperation = 'source-over';
  
  // 绘制裁剪区域边框
  ctx.strokeStyle = '#165dfe';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // 虚线边框
  ctx.strokeRect(
    cropArea.value.x,
    cropArea.value.y,
    cropArea.value.width,
    cropArea.value.height
  );
  ctx.setLineDash([]); // 重置线型
};

// 更新预览
const updatePreview = () => 
{
  if (!image.value || !previewCanvasRef.value) return;
  
  const previewCanvas = previewCanvasRef.value;
  const previewCtx = previewCanvas.getContext('2d');
  
  // 计算实际裁剪区域在原图上的坐标
  const scaleX = originalImage.value.width / canvasRef.value.width;
  const scaleY = originalImage.value.height / canvasRef.value.height;
  
  const cropX = cropArea.value.x * scaleX;
  const cropY = cropArea.value.y * scaleY;
  const cropWidth = cropArea.value.width * scaleX;
  const cropHeight = cropArea.value.height * scaleY;
  
  // 设置预览canvas的实际分辨率（高于显示尺寸以获得更清晰的效果）
  previewCanvas.width = previewCanvasSize.value.width;
  previewCanvas.height = previewCanvasSize.value.height;
  
  // 启用高质量图像平滑
  previewCtx.imageSmoothingEnabled = true;
  previewCtx.imageSmoothingQuality = 'high';
  
  // 清空预览画布
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  
  // 绘制裁剪区域到高分辨率canvas
  if (originalImage.value.complete) 
  {
    previewCtx.drawImage(
      originalImage.value,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, previewCanvas.width, previewCanvas.height
    );
  }
};

// 开始拖拽裁剪区域
const startCrop = (e) => 
{
  if (isResizing.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 检查是否点击在裁剪区域内
  if (
    x >= cropArea.value.x &&
    x <= cropArea.value.x + cropArea.value.width &&
    y >= cropArea.value.y &&
    y <= cropArea.value.y + cropArea.value.height
  ) 
  {
    isDragging.value = true;
    cropStart.value = { x: x - cropArea.value.x, y: y - cropArea.value.y };
    
    document.addEventListener('mousemove', dragCrop);
    document.addEventListener('mouseup', endCrop);
    document.addEventListener('touchmove', dragCrop, { passive: false });
    document.addEventListener('touchend', endCrop, { passive: true });
  }
};

// 拖拽裁剪区域
const dragCrop = (e) => 
{
  if (!isDragging.value) return;
  
  e.preventDefault();
  
  const rect = canvasRef.value.getBoundingClientRect();
  let x, y;
  
  if (e.type === 'touchmove') 
  {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  }
  else 
  {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  
  let newX = x - cropStart.value.x;
  let newY = y - cropStart.value.y;
  
  // 限制裁剪区域在canvas范围内
  newX = Math.max(0, Math.min(newX, canvasRef.value.width - cropArea.value.width));
  newY = Math.max(0, Math.min(newY, canvasRef.value.height - cropArea.value.height));
  
  cropArea.value.x = newX;
  cropArea.value.y = newY;
  
  updatePreview();
  drawImage(); // 重新绘制遮罩和裁剪预览
};

// 结束拖拽
const endCrop = () => 
{
  isDragging.value = false;
  document.removeEventListener('mousemove', dragCrop);
  document.removeEventListener('mouseup', endCrop);
  document.removeEventListener('touchmove', dragCrop);
  document.removeEventListener('touchend', endCrop);
};

// 开始调整裁剪区域大小
const startResize = (direction) => 
{
  isResizing.value = true;
  resizeDirection.value = direction;
  
  document.addEventListener('mousemove', resizeCrop);
  document.addEventListener('mouseup', endResize);
  document.addEventListener('touchmove', resizeCrop, { passive: false });
  document.addEventListener('touchend', endResize);
};

// 调整裁剪区域大小
const resizeCrop = (e) => 
{
  if (!isResizing.value) return;
  
  e.preventDefault();
  
  const rect = canvasRef.value.getBoundingClientRect();
  let x, y;
  
  if (e.type === 'touchmove') 
  {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  }
  else 
  {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  
  const deltaX = x - cropArea.value.x;
  const deltaY = y - cropArea.value.y;
  
  switch (resizeDirection.value) 
  {
  case 'right':
    cropArea.value.width = Math.min(
      canvasRef.value.width - cropArea.value.x,
      Math.max(20, deltaX)
    );
    if (!props.auto && props.aspectRatio > 0) 
    {
      cropArea.value.height = cropArea.value.width / props.aspectRatio;
    }
    break;
  case 'bottom':
    cropArea.value.height = Math.min(
      canvasRef.value.height - cropArea.value.y,
      Math.max(20, deltaY)
    );
    if (!props.auto && props.aspectRatio > 0) 
    {
      cropArea.value.width = cropArea.value.height * props.aspectRatio;
    }
    break;
  case 'bottom-right':
    cropArea.value.width = Math.min(
      canvasRef.value.width - cropArea.value.x,
      Math.max(20, deltaX)
    );
    if (!props.auto && props.aspectRatio > 0) 
    {
      cropArea.value.height = cropArea.value.width / props.aspectRatio;
    }
    else 
    {
      cropArea.value.height = Math.min(
        canvasRef.value.height - cropArea.value.y,
        Math.max(20, deltaY)
      );
    }
    break;
  case 'left':
    const newWidthLeft = cropArea.value.x + cropArea.value.width - x;
    if (newWidthLeft >= 20 && x >= 0) 
    {
      cropArea.value.width = newWidthLeft;
      cropArea.value.x = x;
      if (!props.auto && props.aspectRatio > 0) 
      {
        cropArea.value.height = cropArea.value.width / props.aspectRatio;
      }
    }
    break;
  case 'top':
    const newHeightTop = cropArea.value.y + cropArea.value.height - y;
    if (newHeightTop >= 20 && y >= 0) 
    {
      cropArea.value.height = newHeightTop;
      cropArea.value.y = y;
      if (!props.auto && props.aspectRatio > 0) 
      {
        cropArea.value.width = cropArea.value.height * props.aspectRatio;
      }
    }
    break;
  case 'top-left':
    const newWidthTopLeft = cropArea.value.x + cropArea.value.width - x;
    const newHeightTopLeft = cropArea.value.y + cropArea.value.height - y;
    if (newWidthTopLeft >= 20 && newHeightTopLeft >= 20 && x >= 0 && y >= 0) 
    {
      cropArea.value.width = newWidthTopLeft;
      cropArea.value.height = newHeightTopLeft;
      cropArea.value.x = x;
      cropArea.value.y = y;
      if (!props.auto && props.aspectRatio > 0) 
      {
        cropArea.value.height = cropArea.value.width / props.aspectRatio;
        cropArea.value.x = cropArea.value.x + cropArea.value.width - (cropArea.value.height * props.aspectRatio);
      }
    }
    break;
  case 'top-right':
    const newHeightTopRight = cropArea.value.y + cropArea.value.height - y;
    const newWidthTopRight = deltaX;
    if (newHeightTopRight >= 20 && newWidthTopRight >= 20 && y >= 0) 
    {
      cropArea.value.height = newHeightTopRight;
      cropArea.value.y = y;
      cropArea.value.width = Math.min(
        canvasRef.value.width - cropArea.value.x,
        Math.max(20, newWidthTopRight)
      );
      if (!props.auto && props.aspectRatio > 0) 
      {
        cropArea.value.height = cropArea.value.width / props.aspectRatio;
        cropArea.value.y = cropArea.value.y + cropArea.value.height - (cropArea.value.width / props.aspectRatio);
      }
    }
    break;
  case 'bottom-left':
    const newWidthBottomLeft = cropArea.value.x + cropArea.value.width - x;
    const newHeightBottomLeft = deltaY;
    if (newWidthBottomLeft >= 20 && newHeightBottomLeft >= 20 && x >= 0) 
    {
      cropArea.value.width = newWidthBottomLeft;
      cropArea.value.x = x;
      cropArea.value.height = Math.min(
        canvasRef.value.height - cropArea.value.y,
        Math.max(20, newHeightBottomLeft)
      );
      if (!props.auto && props.aspectRatio > 0) 
      {
        cropArea.value.height = cropArea.value.width / props.aspectRatio;
        cropArea.value.x = cropArea.value.x + cropArea.value.width - (cropArea.value.height * props.aspectRatio);
      }
    }
    break;
  }
  
  // 限制裁剪区域不能超出canvas边界
  if (cropArea.value.x < 0) 
  {
    cropArea.value.x = 0;
    if (!props.auto && props.aspectRatio > 0) 
    {
      cropArea.value.width = cropArea.value.height * props.aspectRatio;
    }
  }
  if (cropArea.value.y < 0) 
  {
    cropArea.value.y = 0;
    if (!props.auto && props.aspectRatio > 0) 
    {
      cropArea.value.height = cropArea.value.width / props.aspectRatio;
    }
  }
  if (cropArea.value.x + cropArea.value.width > canvasRef.value.width) 
  {
    cropArea.value.width = canvasRef.value.width - cropArea.value.x;
    if (!props.auto && props.aspectRatio > 0) 
    {
      cropArea.value.height = cropArea.value.width / props.aspectRatio;
    }
  }
  if (cropArea.value.y + cropArea.value.height > canvasRef.value.height) 
  {
    cropArea.value.height = canvasRef.value.height - cropArea.value.y;
    if (!props.auto && props.aspectRatio > 0) 
    {
      cropArea.value.width = cropArea.value.height * props.aspectRatio;
    }
  }
  
  updatePreview();
  drawImage(); // 重新绘制遮罩和裁剪预览
};

// 结束调整大小
const endResize = () => 
{
  isResizing.value = false;
  document.removeEventListener('mousemove', resizeCrop);
  document.removeEventListener('mouseup', endResize);
  document.removeEventListener('touchmove', resizeCrop);
  document.removeEventListener('touchend', endResize);
};



// 确认裁剪
const confirmCrop = async () => 
{
  if (!image.value) 
  {
    Message.error('没有图片可裁剪');
    return;
  }
  
  try 
  {
    // 创建临时canvas用于导出裁剪后的图片
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // 计算实际裁剪区域在原图上的坐标
    const scaleX = originalImage.value.width / canvasRef.value.width;
    const scaleY = originalImage.value.height / canvasRef.value.height;
    
    const cropX = cropArea.value.x * scaleX;
    const cropY = cropArea.value.y * scaleY;
    const cropWidth = cropArea.value.width * scaleX;
    const cropHeight = cropArea.value.height * scaleY;
    
    // 设置临时canvas尺寸
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    
    // 绘制裁剪区域到临时canvas
    tempCtx.drawImage(
      originalImage.value,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    // 导出为Blob
    tempCanvas.toBlob((blob) => 
    {
      if (blob) 
      {
        // 转换为File对象，使用用户输入的文件名
        const finalFileName = fileName.value || 'cropped_image';
        const file = new File([blob], `${finalFileName}_${Date.now()}.png`, { type: 'image/png' });
        emit('confirm', file);
        visible.value = false;
      }
      else 
      {
        Message.error('裁剪失败');
      }
    }, 'image/png');
  }
  catch (error) 
  {
    Message.error('裁剪过程中出现错误');
    console.error('裁剪错误:', error);
  }
};

// 取消裁剪
const handleCancel = () => 
{
  visible.value = false;
  emit('update:modelValue', false);
};

// 监听图片变化
watch(() => props.modelValue, async (newVal) => 
{
  if (newVal && originalImage.value) 
  {
    await nextTick();
    drawImage();
    updatePreview();
  }
});

// 初始化时设置默认裁剪区域大小
const initCropArea = () => 
{
  if (canvasRef.value) 
  {
    let defaultWidth, defaultHeight;
    if (props.auto) 
    {
      // 在auto模式下，裁剪框初始大小与canvas一致，代表可以选择整个图片
      defaultWidth = canvasRef.value.width;
      defaultHeight = canvasRef.value.height;
    }
    else 
    {
      // 非auto模式下，使用固定尺寸并根据aspectRatio计算
      defaultWidth = Math.min(200, canvasRef.value.width * 0.5, canvasRef.value.height * 0.5);
      if (props.aspectRatio > 0) 
      {
        defaultHeight = defaultWidth / props.aspectRatio;
      }
      else 
      {
        defaultHeight = defaultWidth;
      }
    }
    cropArea.value = {
      x: (canvasRef.value.width - defaultWidth) / 2,
      y: (canvasRef.value.height - defaultHeight) / 2,
      width: defaultWidth,
      height: defaultHeight
    };
  }
};

// 监听窗口大小变化，以便重新计算模态框宽度
const handleResize = () => 
{
  // 重新计算canvasActualWidth，如果canvas存在的话
  if (canvasRef.value && canvasRef.value.width) 
  {
    canvasActualWidth.value = canvasRef.value.width;
  }
};

// 组件挂载后添加事件监听器
onMounted(() => 
{
  window.addEventListener('resize', handleResize);
});

// 组件卸载前移除事件监听器
onUnmounted(() => 
{
  window.removeEventListener('resize', handleResize);
});

defineExpose({
  setImage,
  initCropArea
});
</script>

<style scoped lang="less">


.image-cropper-container {
  display: flex;
  flex-direction: column;
  user-select: none;
}

.cropper-content {
  display: flex;
  gap: @size-5;
}

.cropper-left, .cropper-right {
  width: auto;
}

.cropper-left {
  max-width: calc(75vw - 40px);
  flex: 0 1 auto;
}

.cropper-right {
  flex: 0 1 auto;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.canvas-container {
  position: relative;
  display: inline-block;
  border: @border-1 solid @color-border-2;
  border-radius: @border-radius-small;
  overflow: hidden;
  margin-bottom: @size-2;
  max-width: 100%;
}

.cropper-canvas {
  background-color: @color-bg-white;
  display: block;
}

.crop-area {
  position: absolute;
  outline: @border-2 dashed @primary-6;
  background-color: fade(@primary-6, 10%);
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.crop-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: @size-2;
  height: @size-2;
  background: @primary-6;
  border: @border-1 solid @color-bg-white;
  border-radius: @border-radius-circle;
  pointer-events: all;
}

.resize-top-left {
  top: -@size-1;
  left: -@size-1;
  cursor: nw-resize;
}

.resize-top {
  top: -@size-1;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-top-right {
  top: -@size-1;
  right: -@size-1;
  cursor: ne-resize;
}

.resize-left {
  top: 50%;
  left: -@size-1;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-right {
  top: 50%;
  right: -@size-1;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-bottom-left {
  bottom: -@size-1;
  left: -@size-1;
  cursor: sw-resize;
}

.resize-bottom {
  bottom: -@size-1;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-bottom-right {
  bottom: -@size-1;
  right: -@size-1;
  cursor: se-resize;
}

.preview-title {
  font-size: @font-size-title-1;
  font-weight: @font-weight-700;
  margin-bottom: @size-2;
}

.preview-container {
  border: @border-1 solid @color-border-2;
  border-radius: @border-radius-small;
  padding: @size-1;
  margin-bottom: @size-2;
}

.preview-canvas {
  display: block;
  width: v-bind('previewSize.width + "px"');
  height: v-bind('previewSize.height + "px"');
  object-fit: contain;
}

.preview-size {
  margin-bottom: 15px;
  font-size: @font-size-body-3;
  color: var(--color-neutral-6);
}

.file-name-input {
  width: 100%;
  margin-bottom: @size-2;
}

.confirm-btn {
  width: 100%;
}
</style>