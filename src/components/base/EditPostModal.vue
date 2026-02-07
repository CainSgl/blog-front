<template>
  <ModalWrapper v-model:visible="visible" title="编辑文章信息" @ok="handleSubmit" @cancel="handleCancel"
    :ok-loading="loading" ok-text="保存" cancel-text="取消" width="600px">
    <a-form :model="form" layout="vertical">
      <a-form-item label="文章标题" required>
        <a-input v-model="form.title" placeholder="请输入文章标题" :max-length="60" show-word-limit />
      </a-form-item>

      <a-form-item label="文章摘要">
        <a-textarea v-model="form.summary" placeholder="请输入文章摘要" :auto-size="{ minRows: 3, maxRows: 6 }"
          :max-length="255" show-word-limit />
      </a-form-item>

      <a-form-item label="是否置顶">
        <a-switch v-model="form.isTop" checked-text="置顶" unchecked-text="默认" />
      </a-form-item>

      <a-form-item label="文章标签">
        <a-select v-model="form.tags" multiple allow-create filterable placeholder="请选择或输入标签" :max-tag-count="8">
          <a-option v-for="tag in form.tags" :key="tag" :value="tag">{{ tag }}</a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="封面">
        <div>
          <div v-if="form.img" style="display: flex;align-items: center;justify-content: center;margin-top:20px;">
            <CImg :src="form.img" alt="封面预览" style="width: 300px;" />
          </div>
          <div style="display: flex;align-items: center;justify-content: center;margin-top:20px">
            <Upload :custom-request="customRequest" :show-file-list="false" :multiple="false" accept="image/*"
              @progress="uploadingImage = true">
              <a-button type="dashed" :loading="uploadingImage" style="margin-top: 12px;">
                <template #icon>
                  <IconPlus />
                </template>
                {{ form.img ? '修改封面' : '上传封面' }}
              </a-button>
            </Upload>
          </div>
        </div>
      </a-form-item>
    </a-form>

    <!-- 图片裁剪模态框 -->
    <ImageCropperModal ref="imageCropperRef" v-model="cropperModalVisible" :aspect-ratio="1.5"
      @confirm="handleCroppedImage" />
  </ModalWrapper>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';
import { Message, Upload } from '@arco-design/web-vue';
import api from '@/api/index.js';
import CImg from '@/components/base/image/cImg.vue';
import ImageCropperModal from '@/components/base/image/ImageCropperModal.vue';
import ModalWrapper from '@/components/base/ModalWrapper.vue';
import { uploadFile } from '@/utils/fileUploader.js';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  postData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue', 'success']);

const visible = ref(false);
const loading = ref(false);
const form = ref({
  id: null,
  title: '',
  summary: '',
  img: '',
  isTop: false,
  tags: []
});

// 图片上传相关
const uploadingImage = ref(false);
const cropperModalVisible = ref(false);
const imageCropperRef = ref();
const currentImageFile = ref(null);
const formData = ref(null);
let originalImg = '';

// 监听 modelValue 变化
watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.postData) {
    // 打开弹窗时初始化表单数据
    form.value = {
      id: props.postData.id,
      title: props.postData.title || '',
      summary: props.postData.summary || '',
      img: props.postData.img || '',
      isTop: props.postData.isTop || false,
      tags: props.postData.tags ? [...props.postData.tags] : []
    };
    originalImg = props.postData.img || '';
    formData.value = null;
  }
});

// 监听 visible 变化，同步到父组件
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 提交表单
const handleSubmit = async () => {
  if (!form.value.title || !form.value.title.trim()) {
    Message.warning('请输入文章标题');
    return;
  }

  loading.value = true;
  try {
    const requestData = {
      id: form.value.id,
      title: form.value.title.trim(),
      summary: form.value.summary?.trim() || '',
      isTop: form.value.isTop,
      tags: form.value.tags || []
    };
    
    const updateId = '更新文章' + form.value.id;
    Message.loading({ id: updateId, content: "推送数据中..." });
    
    // 如果有新的图片需要上传
    if (formData.value !== null) {
      if (originalImg) {
        api.get('/file/free', { f: originalImg });
      }
      requestData.img = formData.value;
      formData.value = null;
    }

    await api.put('/post', requestData);
    Message.success({ id: updateId, content: '更新成功' });
    
    // 通知父组件更新成功
    emit('success', requestData);
    visible.value = false;
  } catch (error) {
    console.error('更新文章失败:', error);
    Message.error('更新失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 取消编辑
const handleCancel = () => {
  visible.value = false;
  form.value = {
    id: null,
    title: '',
    summary: '',
    img: '',
    isTop: false,
    tags: []
  };
  formData.value = null;
  originalImg = '';
};

// 处理裁剪后的图片
const handleCroppedImage = async (croppedFile) => {
  try {
    const { fileId } = await uploadFile(croppedFile);
    formData.value = fileId;
    const localUrl = URL.createObjectURL(croppedFile);
    form.value.img = localUrl;

    Message.success({
      id: 'upload-cropped-image:' + croppedFile.name,
      content: '封面已上传',
      duration: 3000,
    });

    cropperModalVisible.value = false;
    currentImageFile.value = null;
  } catch (error) {
    console.error('处理裁剪图片失败:', error);
    Message.error({
      id: 'upload-cropped-image:' + croppedFile.name,
      content: '处理裁剪图片失败，请稍后重试',
      duration: 3000,
    });
    throw error;
  }
};

// Arco Design Upload组件的自定义上传方法
const customRequest = async (options) => {
  const { fileItem, onError, onSuccess } = options;
  const file = fileItem.file;

  if (!file.type.startsWith('image/')) {
    Message.error('请选择图片文件');
    onError();
    return;
  }

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    currentImageFile.value = file;
    cropperModalVisible.value = true;

    await nextTick();
    setTimeout(() => {
      if (imageCropperRef.value) {
        imageCropperRef.value.setImage(img);
      }
    }, 100);

    onSuccess();
  };
  img.onerror = () => {
    Message.error('图片加载失败');
    onError();
  };
};
</script>
