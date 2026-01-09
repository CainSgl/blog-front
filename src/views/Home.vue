<template>
  <Header />
  <CImg :src="'/welcome/background'" ></CImg>
</template>

<script setup>
import Header from '@/components/layout/Header.vue'
import CImg from '@/components/base/cImg.vue'
import { onMounted } from 'vue'
import api from '@/api/index'


</script>

<style scoped lang="less">

</style>
