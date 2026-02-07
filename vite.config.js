import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath, URL} from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import {ArcoResolver} from 'unplugin-vue-components/resolvers';
import viteCompression from 'vite-plugin-compression';
import {VitePWA} from 'vite-plugin-pwa';

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
    // PWA 支持
    VitePWA({
      registerType: 'autoUpdate',
      // 开发环境也启用 PWA（用于测试）
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: true
      },
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
      manifest: {
        name: 'cainsgl的小站',
        short_name: 'cainsgl',
        description: '一个基于 Vue 3 的个人博客和知识库平台',
        theme_color: '#f7f8fa',
        background_color: '#ffffff',
        // 显示模式优先级（从高到低尝试）
        display_override: ['window-controls-overlay', 'standalone'],
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // 这会让所有同域链接在 PWA 内打开
        launch_handler: {
          client_mode: 'navigate-existing'
        },
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        // PWA 安装截图（用于增强的安装 UI）
        screenshots: [
          {
            src: '/screenshots/mobile-1.webp',
            sizes: '540x720',
            type: 'image/webp',
            form_factor: 'narrow',
            label: '首页展示'
          },
          {
            src: '/screenshots/mobile-2.webp',
            sizes: '540x720',
            type: 'image/webp',
            form_factor: 'narrow',
            label: '知识库浏览'
          },
          {
            src: '/screenshots/mobile-3.webp',
            sizes: '540x720',
            type: 'image/webp',
            form_factor: 'narrow',
            label: '文章阅读'
          },
          {
            src: '/screenshots/desktop-1.webp',
            sizes: '1280x720',
            type: 'image/webp',
            form_factor: 'wide',
            label: '桌面端首页'
          },
          {
            src: '/screenshots/desktop-2.webp',
            sizes: '1280x720',
            type: 'image/webp',
            form_factor: 'wide',
            label: '桌面端知识库'
          },
          {
            src: '/screenshots/desktop-3.webp',
            sizes: '1280x720',
            type: 'image/webp',
            form_factor: 'wide',
            label: '桌面端编辑器'
          }
        ],
        // 桌面快捷方式
        shortcuts: [
          {
            name: '首页',
            short_name: '首页',
            description: '查看最新文章和动态',
            url: '/',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: '知识库',
            short_name: '知识库',
            description: '浏览知识库内容',
            url: '/knowledge',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: '我的主页',
            short_name: '我的',
            description: '查看个人主页',
            url: '/user',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: '消息中心',
            short_name: '消息',
            description: '查看消息和通知',
            url: '/messages',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
        // 分享目标（允许其他应用分享内容到你的 PWA）
        share_target: {
          action: '/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'file',
                accept: ['image/*', 'video/*', 'audio/*']
              }
            ]
          }
        },
        // 屏幕方向
        orientation: 'any',
        // 分类
        categories: ['blog', 'education', 'social']
      },
      workbox: {
        // 增加文件大小限制到 5MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // 只预缓存关键资源，其他资源按需缓存
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // 排除超大文件，使用运行时缓存
        globIgnores: ['**/node_modules/**/*', '**/dev-dist/**/*'],
        // 缓存策略
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 小时
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 天
              }
            }
          },
          {
            urlPattern: /\.(js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 天
              }
            }
          }
        ]
      }
    }),
    // Brotli 压缩（更好的压缩率，直接替换原文件）
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240, // 只压缩大于 10KB 的文件
      deleteOriginFile: false // 保留原文件作为降级方案
    }),
    // Gzip 压缩（兼容性更好）
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
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
