<template>
  <div class="kb-edit-index-container">
    <a-affix :offset-top="0">
      <div class="header">
        <a-button type="text" @click="goBack">
          <template #icon>
            <IconArrowLeft />
          </template>
          返回
        </a-button>
        <h2>编辑知识库</h2>
        <a-button type="primary" @click="saveContent" :loading="saving">
          <template #icon>
            <IconSave />
          </template>
          保存
        </a-button>
      </div>
    </a-affix>

    <div class="content">
      <div class="layout-container">
        <!-- 上方：知识库信息 -->
        <div class="top-panel">
          <a-card>
            <template #title>知识库信息</template>
            <!-- 预览 -->
            <div class="preview-section">
              <h3>预览</h3>
              <div class="kb-card-preview">
                <KbCard :kbInfo="kbInfo" />
              </div>
            </div>

            <a-divider></a-divider>

            <a-form layout="vertical" :model="kbInfo">
              <!-- 标题输入框 -->
              <a-form-item label="标题" required>
                <a-input v-model="title" placeholder="请输入知识库首页标题" :max-length="100" show-word-limit />
              </a-form-item>

              <!-- 公开开关 -->
              <a-form-item label="是否公开">
                <a-switch v-model="kbInfo.status" checked-value="已发布" unchecked-value="草稿" />
              </a-form-item>

              <!-- 封面上传 -->
              <a-form-item label="封面">
                <div class="image-upload-section">
                  <!-- 上传/修改按钮 -->
                  <div class="cover-actions">
                    <Upload :custom-request="customRequest" :show-file-list="false" :multiple="false" accept="image/*"
                      @progress="uploadingImage = true">
                      <a-button type="dashed" :loading="uploadingImage">
                        <template #icon>
                          <IconPlus />
                        </template>
                        {{ kbInfo.coverUrl ? '修改封面' : '上传封面' }}
                      </a-button>
                    </Upload>
                  </div>
                </div>
              </a-form-item>
            </a-form>
          </a-card>
        </div>

        <!-- 下方：编辑器 -->
        <div class="bottom-panel">
          <a-card>
            <template #title>内容编辑</template>
            <div class="editor-container">
              <MarkdownEditor :hasToc="false" :hashGoBack="false" v-model="content" :height="editorHeight" />
            </div>
          </a-card>
        </div>
      </div>
    </div>

    <!-- 图片裁剪模态框 -->
    <ImageCropperModal ref="imageCropperRef" v-model="cropperModalVisible" :aspect-ratio="1"
      @confirm="handleCroppedImage" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, toRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message, Upload } from '@arco-design/web-vue';
import {
  IconPlus,
  IconDelete,
  IconArrowLeft,
  IconSave
} from '@arco-design/web-vue/lib/icon';
import api from '@/api/index.js';
import MarkdownEditor from '@/components/md/MarkdownEditor.vue';
import ImageCropperModal from '@/components/base/ImageCropperModal.vue';
import CImg from '../../../../components/base/cImg.vue';
import KbCard from '../../../../components/kb/KbCard.vue';
import { useKbStore } from '../../kbStore.js';

const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();
const content = ref('');
const originalContent = ref(''); // 用于比较内容是否变化
const loading = ref(false);
const saving = ref(false);
const editorHeight = ref('800px');

// 从store中获取响应式引用
const kbInfo = toRef(kbStore, 'kbInfo');

// 使用计算属性来管理标题和封面URL
const title = computed({
  get: () => kbInfo.value.title || kbInfo.value.name || '',
  set: (value) => 
  {
    kbInfo.value.title = value;
  }
});




// 封面上传相关状态
const uploadingImage = ref(false);
const cropperModalVisible = ref(false);
const imageCropperRef = ref();
const currentImageFile = ref(null);
const formData = ref(null); // 用于存储裁剪后的图片文件，如果为null则表示没有新的图片需要上传

// 获取知识库ID
const kbId = route.query.kb;

// 获取当前首页内容
const loadCurrentContent = async () => 
{
  if (!kbId) 
  {
    Message.error('缺少知识库ID');
    return;
  }
  loading.value = true;
  try 
  {
    const { data } = await api.get('/kb/index', { id: kbId });
    content.value = data.index || '';
    originalContent.value = data.index || ''; // 保存原始内容用于比较
  }
  catch (error) 
  {
    console.error('加载首页内容失败:', error);
    Message.error('加载首页内容失败');
  }
  finally 
  {
    loading.value = false;
  }
};

// 保存首页内容
const saveContent = async () => 
{
  if (!kbId) 
  {
    Message.error('缺少知识库ID');
    return;
  }

  saving.value = true;
  try 
  {


    // 构建请求数据
    const requestData = {
      id: kbId,
      name: title.value,
      status: kbStore.kbInfo.status
    };
    // 如果有新的图片需要上传
    if (formData.value !== null) 
    {
      Message.loading({
        id: 'upload-cover',
        content: '正在上传封面...',
        duration: 15000
      });

      if (orginCoverUrl) 
      {
        api.get('/file/free', { f: orginCoverUrl });
      }
      // 上传图片
      const { data } = await api.post('/file/upload', formData.value, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // 更新封面URL为上传后的URL
      const coverUrl = data.shortUrl;
      // 清空formData
      formData.value = null;
      Message.success({
        id: 'upload-cover',
        content: '封面上传成功',
      });
      requestData.coverUrl = coverUrl;
    }
    // 检查内容是否发生变化，如果变化了才添加content字段
    if (content.value !== originalContent.value) 
    {
      requestData.content = content.value;
    }
    Message.loading({
      id: 'save-index',
      content: '正在保存...',
      duration: 15000
    });
    // 保存知识库信息（标题、封面、状态等，以及可能的内容）
    await api.put('/kb', requestData);
    Message.success({
      id: 'save-index',
      content: '保存成功',
    });
    // 保存成功后替换当前路由，确保返回时不会回到编辑页面
    router.replace({
      name: 'KBIndex',
      query: { kb: kbId }
    });
  }
  catch (error) 
  {
    console.error('保存首页内容失败:', error);
    Message.error({
      id: 'save-index',
      content: '保存失败，请稍后重试',
    });
  }
  finally 
  {
    saving.value = false;
  }
};

const goBack = () => 
{
  router.go(-1);
};
let orginCoverUrl;
// 处理裁剪后的图片
const handleCroppedImage = async (croppedFile) => 
{
  try 
  {
    // 创建FormData对象 
    const newFormData = new FormData();
    newFormData.append('file', croppedFile);

    // 存储formData，等待保存时上传
    formData.value = newFormData;

    // 创建本地预览URL
    const localUrl = URL.createObjectURL(croppedFile);
    orginCoverUrl = kbStore.kbInfo.coverUrl;

    // 更新store中的封面URL为本地预览URL
    kbStore.kbInfo.coverUrl = localUrl;

    // 显示成功信息
    Message.success({
      id: 'upload-cropped-image:' + croppedFile.name,
      content: '封面已更新，将在保存时上传',
      duration: 3000,
    });

    cropperModalVisible.value = false;
    currentImageFile.value = null;
  }
  catch (error) 
  {
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
const customRequest = async (options) => 
{
  const { fileItem, onError, onSuccess } = options;
  const file = fileItem.file;

  // 检查是否为图片
  if (!file.type.startsWith('image/')) 
  {
    console.error('请选择图片文件');
    Message.error('请选择图片文件');
    onError();
    return;
  }

  // 创建图片对象用于裁剪组件
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => 
  {
    // 将原始文件保存到currentImageFile，用于裁剪
    currentImageFile.value = file;

    // 显示裁剪模态框
    cropperModalVisible.value = true;

    // 等待模态框打开后设置图片
    await nextTick();
    setTimeout(() => 
    {
      if (imageCropperRef.value) 
      {
        imageCropperRef.value.setImage(img);
      }
    }, 100);

    onSuccess();
  };
  img.onerror = () => 
  {
    console.error('图片加载失败');
    Message.error('图片加载失败');
    onError();
  };
};



// 初始化加载内容
onMounted(() => 
{
  loadCurrentContent();
});
</script>

<style scoped lang="less">
.kb-edit-index-container {
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;

  .header {
    background: #fff;
    border-bottom: 1px solid #e5e6eb;
    padding: 5px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 100;
    flex-shrink: 0;
  }

  .content {
    padding: 24px;
    margin-top: 20px;
    position: relative;
    z-index: 1;
    flex: 1;
    overflow: auto;
    min-height: 0;
  }

  // 响应式设计
  @media (max-width: 1200px) {
    .content {
      min-height: auto;
    }
  }

  .layout-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 0;
    height: auto;
  }

  .top-panel {
    flex: none;
    min-width: 0;

    .arco-card {
      display: flex;
      flex-direction: column;

      .arco-card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .arco-form {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    }

    .arco-form-item-label>label {
      font-weight: 500;
    }

    .image-upload-section {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
    }

    .image-upload-section .cover-actions {
      flex: 1;
      width: 100% !important;
    }

    .image-upload-section .cover-actions .arco-btn {
      width: 100% !important;
    }

    .image-upload-section .auto-generate-btn {
      flex-shrink: 0;
      white-space: nowrap;
    }

    .image-upload-section>* {
      margin-top: 0 !important;
    }



    .preview-section {
      margin-top: 20px;

      h3 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  .bottom-panel {
    flex: 1;
    min-height: 400px;

    .arco-card {
      height: 100%;
      display: flex;
      flex-direction: column;

      .arco-card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: auto;
      }
    }
  }

  .editor-container {
    width: 100%;
    height: 100%;
    min-height: 300px;
  }

  // 响应式设计
  @media (max-width: 1200px) {
    .layout-container {
      flex-direction: column;
      gap: 16px;
    }

    .top-panel {
      .arco-card {
        height: auto;
        display: block;

        .arco-card-body {
          height: auto;
          display: block;
        }

        .arco-form {
          height: auto;
          display: block;
        }

        .image-upload-section {
          flex-direction: column;
          gap: 12px;
        }

        .image-upload-section .auto-generate-btn {
          width: 100%;
          align-self: stretch;
        }
      }
    }

    .bottom-panel {
      .arco-card {
        height: auto;
        display: block;

        .arco-card-body {
          height: auto;
          display: block;
        }
      }
    }
  }
}
</style>