<template>
  <div class="kb-create-container">
    <a-affix :offset-top="0">
      <div class="header">
        <a-button type="text" @click="goBack">
          <template #icon>
            <IconArrowLeft />
          </template>
          返回
        </a-button>
        <h2 style="color: var(--color-neutral-10);">创建知识库</h2>
        <a-button type="primary" @click="createKb" :loading="creating">
          <template #icon>
            <IconSave />
          </template>
          创建
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
              <div class="kb-card-preview" style="width: 180px;">
                <KbCard :kbInfo="kbInfo" :skeleton="false" />
              </div>
            </div>

            <a-divider></a-divider>

            <a-form layout="vertical" :model="kbInfo">
              <!-- 标题输入框 -->
              <a-form-item label="标题" required>
                <a-input v-model="title" placeholder="请输入知识库标题" :max-length="100" show-word-limit />
              </a-form-item>

              <!-- 公开开关 -->
              <a-form-item label="是否公开">
                <a-switch v-model="status" checked-value="已发布" unchecked-value="草稿" />
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
            <template #title>首页内容编辑</template>
            <a-carousel v-if="!hideEditorTips" :auto-play="true" :animation-name="'fade'" indicator-type="never" 
              show-arrow="never" :autoplay-speed="5000" style="margin-bottom: 12px;">
              <a-carousel-item>
                <a-alert type="warning" closable @close="handleCloseTips">
                  <template #icon>
                    <icon-exclamation-circle />
                  </template>
                  编辑时请注意多换行，否则可能出现不必要的显示错误。
                </a-alert>
              </a-carousel-item>
              <a-carousel-item>
                <a-alert type="warning" closable @close="handleCloseTips">
                  <template #icon>
                    <icon-exclamation-circle />
                  </template>
                  预览与实际最终显示效果可能不一致，这是正常现象。
                </a-alert>
              </a-carousel-item>
            </a-carousel>
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
import {computed, nextTick, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Message, Upload} from '@arco-design/web-vue';
import {IconArrowLeft, IconExclamationCircle, IconPlus, IconSave} from '@arco-design/web-vue/lib/icon';
import api from '@/api/index.js';
import MarkdownEditor from '@/components/md/MarkdownEditor.vue';
import ImageCropperModal from '@/components/base/image/ImageCropperModal.vue';
import KbCard from '@/components/kb/KbCard.vue';
import {uploadFile} from '@/utils/fileUploader.js';
import { useUserSettingStore } from '@/store/userSetting.js';

const router = useRouter();
const route = useRoute(); // 添加获取路由参数
const userSettingStore = useUserSettingStore();
const content = ref('');
const creating = ref(false);
const editorHeight = ref('800px');

// 编辑器提示相关
const hideEditorTips = computed(() => {
  return userSettingStore.getSetting('editor.hideEditTips', false);
});

// 处理关闭提示
const handleCloseTips = async () => {
  await userSettingStore.setSetting('editor.hideEditTips', true, false);
};

// 知识库信息状态
const kbInfo = ref({
  title: '',
  name: '',
  coverUrl: '',
  likeCount: 0,
  status: '创建中',
  postCount: 0,
  createdAt: new Date().toISOString(),
});

const status=ref('');

// 封面上传相关状态
const formData = ref(null); // 用于存储裁剪后的图片文件，如果为null则表示没有新的图片需要上传

// 在组件挂载后根据路由参数设置初始状态
onMounted(() => 
{
  const type = route.query.type;
  // 如果路由参数type为'public'，则设置为已发布（公开），否则为草稿（私有）
  status.value = type === 'public' ? '已发布' : '草稿';
});

// 使用计算属性来管理标题
const title = computed({
  get: () => kbInfo.value.title || kbInfo.value.name || '',
  set: (value) => 
  {
    kbInfo.value.title = value;
    kbInfo.value.name = value; // 同时更新name字段
  }
});

// 封面上传相关状态
const uploadingImage = ref(false);
const cropperModalVisible = ref(false);
const imageCropperRef = ref();
const currentImageFile = ref(null);

// 创建知识库
const createKb = async () => 
{
  if (!title.value.trim()) 
  {
    Message.error('请输入知识库标题');
    return;
  }

  creating.value = true;
  try 
  {

    // 构建请求数据
    const requestData = {
      name: title.value,
      status: status.value,
      index: content.value
    };

    // 如果有新的图片需要上传
    if (formData.value !== null) 
    {
      // 直接使用已上传的fileId
      requestData.coverUrl = formData.value;
      // 清空formData
      formData.value = null;
    }
    else 
    {
      // 如果没有新的封面上传，使用现有的封面URL
      requestData.coverUrl = kbInfo.value.coverUrl;
    }
    Message.loading({
      id: 'create-kb',
      content: '正在创建...',
      duration: 15000
    });

    // 创建知识库
    const { data } = await api.post('/post/kb', requestData);

    Message.success({
      id: 'create-kb',
      content: '创建成功',
    });

    // 创建成功后跳转到新创建的知识库首页
    router.push({
      name: 'KB',
      query: { kb: data.id }
    });
  }
  catch (error) 
  {
    console.error('创建知识库失败:', error);
    Message.error({
      id: 'create-kb',
      content: '创建失败，请稍后重试',
    });
  }
  finally 
  {
    creating.value = false;
  }
};

const goBack = () => 
{
  // 如果有历史记录则返回上一页，否则返回首页
  if (window.history.length > 1) 
  {
    router.go(-1);
  }
  else 
  {
    router.push({ name: 'Home' });
  }
};

// 处理裁剪后的图片
const handleCroppedImage = async (croppedFile) => 
{
  try 
  {
    // 使用文件上传工具类上传
    const { fileId } = await uploadFile(croppedFile);

    // 存储fileId，等待创建时使用
    formData.value = fileId;

    // 创建本地预览URL
    const localUrl = URL.createObjectURL(croppedFile);

    // 更新store中的封面URL为本地预览URL
    kbInfo.value.coverUrl = localUrl;

    // 显示成功信息
    Message.success({
      id: 'upload-cropped-image:' + croppedFile.name,
      content: '封面已上传',
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
</script>

<style scoped lang="less">
.kb-create-container {
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color:var(--color-bg-1) ;
  .header {
    background: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border);
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