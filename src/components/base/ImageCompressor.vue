<template>
  <a-modal
    v-model:visible="visible"
    title="图片压缩"
    :footer="false"
    :width="600"
    @cancel="handleCancel"
  >
    <div class="image-compressor">
      <!-- 压缩选项 -->
      <div class="compress-options">
        <div class="option-item">
          <span class="option-label">压缩质量:</span>
          <a-slider 
            v-model="quality" 
            :min="0.1" 
            :max="1" 
            :step="0.1"
            :format-tooltip="(val) => `${Math.round(val * 100)}%`"
          />
        </div>
        
        <div class="option-item">
          <span class="option-label">最大宽度:</span>
          <a-input-number 
            v-model="maxWidth" 
            :min="100" 
            :max="4096"
            :step="100"
          />
          <span class="unit">px</span>
        </div>
        
        <div class="option-item">
          <span class="option-label">最大高度:</span>
          <a-input-number 
            v-model="maxHeight" 
            :min="100" 
            :max="4096"
            :step="100"
          />
          <span class="unit">px</span>
        </div>

        <div class="option-item">
          <a-checkbox v-model="convertToJpeg">
            转换为 JPEG 格式（更小的文件）
          </a-checkbox>
        </div>
      </div>

      <!-- 图片信息对比 -->
      <div class="image-info" v-if="originalInfo">
        <div class="info-section">
          <h4>原始图片</h4>
          <p>尺寸: {{ originalInfo.width }} × {{ originalInfo.height }}</p>
          <p>大小: {{ formatSize(originalInfo.size) }}</p>
        </div>
        
        <div class="info-section" v-if="compressedInfo">
          <h4>压缩后</h4>
          <p>尺寸: {{ compressedInfo.width }} × {{ compressedInfo.height }}</p>
          <p>大小: {{ formatSize(compressedInfo.size) }}</p>
          <p class="compress-ratio">
            压缩率: {{ compressionRatio }}%
          </p>
        </div>
      </div>

      <!-- 预览 -->
      <div class="preview-container" v-if="previewUrl">
        <img :src="previewUrl" alt="预览" class="preview-image" />
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <a-button @click="handleCancel">取消</a-button>
        <a-button 
          type="primary" 
          @click="handleCompress"
          :loading="compressing"
        >
          {{ compressing ? '压缩中...' : '确认压缩' }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { compressImage, getImageInfo, formatFileSize } from '@/utils/imageCompressor';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 压缩选项
const quality = ref(0.8);
const maxWidth = ref(1920);
const maxHeight = ref(1080);
const convertToJpeg = ref(false);

// 图片信息
const originalFile = ref(null);
const originalInfo = ref(null);
const compressedInfo = ref(null);
const previewUrl = ref('');
const compressing = ref(false);

// 压缩率
const compressionRatio = computed(() => 
{
  if (!originalInfo.value || !compressedInfo.value) return 0;
  const ratio = ((originalInfo.value.size - compressedInfo.value.size) / originalInfo.value.size) * 100;
  return Math.round(ratio);
});

// 格式化文件大小
const formatSize = (bytes) => formatFileSize(bytes);

// 设置图片
const setImage = async (file) => 
{
  originalFile.value = file;
  
  try 
  {
    // 获取原始图片信息
    originalInfo.value = await getImageInfo(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => 
    {
      previewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // 自动预览压缩效果
    await previewCompress();
  }
  catch (error) 
  {
    Message.error('图片加载失败');
    console.error(error);
  }
};

// 预览压缩效果
const previewCompress = async () => 
{
  if (!originalFile.value) return;
  
  try 
  {
    const compressed = await compressImage(originalFile.value, {
      quality: quality.value,
      maxWidth: maxWidth.value,
      maxHeight: maxHeight.value,
      convertToJpeg: convertToJpeg.value
    });
    
    compressedInfo.value = await getImageInfo(compressed);
  }
  catch (error) 
  {
    console.error('预览压缩失败:', error);
  }
};

// 监听压缩选项变化，实时预览
watch([quality, maxWidth, maxHeight, convertToJpeg], () => 
{
  previewCompress();
}, { deep: true });

// 确认压缩
const handleCompress = async () => 
{
  if (!originalFile.value) 
  {
    Message.error('没有图片可压缩');
    return;
  }
  
  compressing.value = true;
  
  try 
  {
    const compressed = await compressImage(originalFile.value, {
      quality: quality.value,
      maxWidth: maxWidth.value,
      maxHeight: maxHeight.value,
      convertToJpeg: convertToJpeg.value
    });
    
    Message.success(`压缩成功！节省了 ${compressionRatio.value}% 的空间`);
    emit('confirm', compressed);
    visible.value = false;
  }
  catch (error) 
  {
    Message.error('压缩失败');
    console.error(error);
  }
  finally 
  {
    compressing.value = false;
  }
};

// 取消
const handleCancel = () => 
{
  visible.value = false;
  originalFile.value = null;
  originalInfo.value = null;
  compressedInfo.value = null;
  previewUrl.value = '';
};

defineExpose({
  setImage
});
</script>

<style scoped>
.image-compressor {
  padding: 10px 0;
}

.compress-options {
  margin-bottom: 20px;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.option-label {
  min-width: 80px;
  font-weight: 500;
}

.unit {
  margin-left: 5px;
  color: #666;
}

.image-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f7f8fa;
  border-radius: 4px;
}

.info-section {
  flex: 1;
}

.info-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
}

.info-section p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
}

.compress-ratio {
  color: #00b42a !important;
  font-weight: 600;
}

.preview-container {
  margin-bottom: 20px;
  text-align: center;
  max-height: 300px;
  overflow: auto;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 10px;
}

.preview-image {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
