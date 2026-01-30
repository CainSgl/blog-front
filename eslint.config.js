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
    rules: {
      // Allman style: braces on new line
      'brace-style': ['error', 'allman', { allowSingleLine: false }],

      // Additional formatting rules that complement Allman style
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },
  {
    files: ['format-allman.js', 'full-format.js'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  pluginVue.configs['flat/essential'],
]);
