import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath, URL} from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import {ArcoResolver} from 'unplugin-vue-components/resolvers';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ArcoResolver()],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true,
          resolveIcons: true,
          importStyle: false
        })
      ]
    }),
    // Gzip 压缩
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 只压缩大于 10KB 的文件
      deleteOriginFile: false
    }),
    // Brotli 压缩（更好的压缩率）
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {},
        additionalData: '@import "@/assets/style/global.less";'
      },
    },
  },
  server: {
    port: 36033,
    open: true,
  },
  optimizeDeps: {
    include: ['three', 'cytoscape'],
    esbuildOptions: {
      // 确保正确处理 CommonJS 模块
      mainFields: ['module', 'main']
    }
  },
  build: {
    // 生产环境移除 console
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // 解决 CommonJS 模块兼容性问题
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto',
      esmExternals: true
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      // 解决 Cytoscape 的 CommonJS 导出问题
      external: [],
      output: {
        // 全局变量配置
        globals: {},
        // 代码分割策略 - 更细粒度的拆分
        manualChunks: (id) => {
          // Vue 核心
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return 'vue-core';
          }
          if (id.includes('node_modules/vue-router')) {
            return 'vue-router';
          }
          if (id.includes('node_modules/pinia')) {
            return 'pinia';
          }
          
          // Arco Design - 不要单独分包，让它和其他依赖一起打包到 vendor
          // 这样可以避免循环依赖初始化问题
          
          // Markdown 编辑器 - 拆分为多个 chunk
          if (id.includes('node_modules/@kangc/v-md-editor')) {
            return 'md-editor';
          }
          if (id.includes('node_modules/marked')) {
            return 'marked';
          }
          if (id.includes('node_modules/highlight.js')) {
            return 'highlight';
          }
          
          // Mermaid 图表库 - 按需加载
          if (id.includes('node_modules/mermaid')) {
            return 'mermaid';
          }
          // Cytoscape 及其插件 - 合并到一个 chunk 避免模块引用问题
          if (id.includes('node_modules/cytoscape')) {
            return 'cytoscape';
          }
          if (id.includes('node_modules/cytoscape-cose-bilkent')) {
            return 'cytoscape';
          }
          if (id.includes('node_modules/cytoscape-fcose')) {
            return 'cytoscape';
          }
          if (id.includes('node_modules/cose-base')) {
            return 'cytoscape';
          }
          if (id.includes('node_modules/layout-base')) {
            return 'cytoscape';
          }
          if (id.includes('node_modules/dagre')) {
            return 'dagre';
          }
          
          // Three.js
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          
          // 其他大型库
          if (id.includes('node_modules/katex')) {
            return 'katex';
          }
          if (id.includes('node_modules/dompurify')) {
            return 'dompurify';
          }
          
          // 其他 node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // 静态资源分类打包
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return 'img/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // 压缩配置
    reportCompressedSize: true,
    // 源码映射
    sourcemap: false
  }
});
