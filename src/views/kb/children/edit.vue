<template>
  <div class="editor-container">
    <v-md-editor
      v-model="text"
      height="100vh"
      :disabled-menus="[]"
      @upload-image="handleUploadImage"
    ></v-md-editor>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const text = ref('');

const handleUploadImage = (event, insertImage, files) => {
    console.log(files[0].name)
  
  const url = 'https://example.com/image.jpg';
  insertImage({
     url: files[0].name,
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