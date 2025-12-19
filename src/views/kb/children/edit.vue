<template>
  <div class="editor-container">
    <v-md-editor
      v-model="text"
      height="100vh"
      :disabled-menus="[]"
      @upload-image="handleUploadImage"
      :include-level="[1,2,3,4,5]"
      left-toolbar="undo redo | tip emoji | todo-list | align | copied-code"
      right-toolbar="preview toc sync-scroll fullscreen"
    ></v-md-editor>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const text = ref('');

const handleUploadImage = (event, insertImage, files) => {
  // 实际项目中这里应该上传到服务器并返回真实的URL
  console.log(files[0].name);
  
  // 模拟上传成功后的URL
  const url = 'https://example.com/' + files[0].name;
  insertImage({
    url: url,
    desc: '图片描述',
    width: 'auto',
    height: 'auto',
  });
};
</script>

<style scoped lang="less">
.editor-container {
  background-color: #fff;
  border-radius: 4px;
  height: 100vh;
}
</style>