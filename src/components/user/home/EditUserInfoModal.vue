<template>
  <a-modal v-model:visible="modalVisible" title="编辑个人信息" :footer="null" @cancel="handleCancel" width="auto">
    <a-space class="edit-user-info-modal" direction="vertical">
      <a-form :model="form" :rules="rules" :label-col-props="{ span: 3 }" :wrapper-col-props="{ span: 20 }"
        @submit="handleSubmit" ref="formRef" class="form-container">
        <a-form-item field="username" label="用户名">
          <a-input v-model="form.username" disabled />
        </a-form-item>
        <a-form-item field="nickname" label="昵称" required>
          <a-input v-model="form.nickname" placeholder="请输入昵称" :max-length="30" show-word-limit />
        </a-form-item>
        <a-form-item field="gender" label="性别">
          <a-radio-group v-model="form.gender">
            <a-radio value="男">男</a-radio>
            <a-radio value="女">女</a-radio>
            <a-radio value="">保密</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item field="bio" label="个人简介">
          <a-textarea v-model="form.bio" placeholder="介绍一下自己吧" :max-length="200" :rows="4" show-word-limit />
        </a-form-item>

        <div class="form-footer-wrapper">
          <a-form-item class="form-footer">
            <div class="button-group">
              <a-button @click="handleCancel">取消</a-button>
              <a-button type="primary" html-type="submit" :disabled="!hasChanges || submitting" :loading="submitting">
                {{ submitting ? '保存中...' : '保存' }}
              </a-button>
            </div>
          </a-form-item>
        </div>
      </a-form>
    </a-space>
  </a-modal>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user.js';

const userStore = useUserStore();

// 定义 emits
const emit = defineEmits(['update:modelValue', 'saved']);

// 定义 props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({})
  }
});

// 模态框显示状态
const modalVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 表单数据 - 初始值基于传入的用户信息
const form = reactive({
  nickname: '',
  username: '',
  gender: '',
  bio: '',
});

// 原始数据备份，用于检测变更
const originalData = reactive({});

// 检测是否有变更
const hasChanges = computed(() => 
{
  return Object.keys(form).some(key => form[key] !== originalData[key]);
});

// 提交状态
const submitting = ref(false);
const formRef = ref();

// 表单验证规则
const rules = {
  nickname: [
    { required: true, message: '请输入昵称' },
    { maxLength: 20, message: '昵称长度不能超过20个字符' }
  ]
};

// 重置表单数据
const resetForm = async () => 
{
  // 等待 DOM 更新后设置表单值
  await nextTick();

  // 设置表单初始值

  form.nickname = props.userInfo?.nickname || '';
  form.username = props.userInfo?.username || '';
  form.gender = props.userInfo?.gender || '';
  form.bio = props.userInfo?.bio || '';
  
  // 备份原始数据
  Object.assign(originalData, {
    nickname: props.userInfo?.nickname || '',
    username: props.userInfo?.username || '',
    gender: props.userInfo?.gender || '',
    bio: props.userInfo?.bio || '',
  });
};

// 监听用户信息变化，更新表单
watch(() => props.userInfo, resetForm, { deep: true, immediate: true });

// 监听模态框显示状态，重置表单
watch(() => props.modelValue, (visible) => 
{
  if (visible) 
  {
    resetForm();
  }
});

// 取消编辑
const handleCancel = () => 
{
  modalVisible.value = false;
};

// 提交表单
const handleSubmit = async () => 
{
  Message.loading({ id: 'saveUserInfo', content: '保存中...' });
  try 
  {
    await formRef.value.validate();
    submitting.value = true;
    // 准备更新数据，只包含有变化的字段
    const updateData = {};
    Object.keys(form).forEach(key => 
    {
      if (form[key] !== originalData[key]) 
      {
        updateData[key] = form[key];
      }
    });
    if (Object.keys(updateData).length === 0) 
    {
      Message.warning({ id: 'saveUserInfo', content: '没有检测到任何更改' });
      return;
    }
    modalVisible.value = false;
    await userStore.updateUserInfo(updateData);
    Message.success({ id: 'saveUserInfo', content: '用户信息更新成功' });

    emit('saved');
  }
  catch (error) 
  {
    modalVisible.value = true;
    console.error('更新用户信息失败:', error);
    if (error?.message) 
    {
      Message.error({ id: 'saveUserInfo', content: error.message });
    }
    else 
    {
      Message.error({ id: 'saveUserInfo', content: '更新用户信息失败，请稍后重试' });
    }
  }
  finally 
  {
    submitting.value = false;
  }
};
</script>

<style scoped lang="less">
.edit-user-info-modal {
  .form-container {
    width: calc(60vw - 40px);
    max-width: 600px;
    min-width: 500px;
    padding: 12px;
  }

  .arco-form-item {
    margin-bottom: 16px;
  }

  .arco-form-item .arco-input,
  .arco-form-item .arco-textarea,
  .arco-form-item .arco-radio-group {
    text-align: left;
  }

  .form-footer-wrapper {
    border-top: 1px solid #eee;
    padding-top: 20px;
    margin-top: 16px;
  }

  .form-footer {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0;
  }
  
  .button-group {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
}
</style>