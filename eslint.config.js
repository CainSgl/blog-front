import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'public/**/*', '*.min.js'],
    files: ['**/*.{js,mjs,cjs,vue}'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {},
  },
  pluginVue.configs['flat/essential'],
]);
