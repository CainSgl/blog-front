import VMdEditor from '@kangc/v-md-editor';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';

// Plugins
import createTipPlugin from '@kangc/v-md-editor/lib/plugins/tip/index';
import '@kangc/v-md-editor/lib/plugins/tip/tip.css';
import createEmojiPlugin from '@kangc/v-md-editor/lib/plugins/emoji/index';
import '@kangc/v-md-editor/lib/plugins/emoji/emoji.css';
import createKatexPlugin from '@kangc/v-md-editor/lib/plugins/katex/npm.js';
import createMermaidPlugin from '@kangc/v-md-editor/lib/plugins/mermaid/npm.js';
import '@kangc/v-md-editor/lib/plugins/mermaid/mermaid.css';
import createTodoListPlugin from '@kangc/v-md-editor/lib/plugins/todo-list/index';
import '@kangc/v-md-editor/lib/plugins/todo-list/todo-list.css';
import createLineNumbertPlugin from '@kangc/v-md-editor/lib/plugins/line-number/index';
import createHighlightLinesPlugin from '@kangc/v-md-editor/lib/plugins/highlight-lines/index';
import '@kangc/v-md-editor/lib/plugins/highlight-lines/highlight-lines.css';
import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index';
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css';
import createAlignPlugin from '@kangc/v-md-editor/lib/plugins/align';

// External libraries
import katex from 'katex';
import mermaid from 'mermaid';

// Prism
import Prism from 'prismjs';

// 使用主题
VMdEditor.use(vuepressTheme, {
  Prism,
  extend(md) {
    // 启用HTML标签支持
    md.set({
      html: true,
      linkify: true,
      breaks: true
    });
  }
});

// 使用插件
VMdEditor.use(createTipPlugin({ name: 'tip-plugin' }));
VMdEditor.use(createEmojiPlugin());
VMdEditor.use(createKatexPlugin({ katex }));
VMdEditor.use(createMermaidPlugin({ mermaid }));
VMdEditor.use(createTodoListPlugin());
VMdEditor.use(createLineNumbertPlugin());
VMdEditor.use(createHighlightLinesPlugin());
VMdEditor.use(createCopyCodePlugin());
VMdEditor.use(createAlignPlugin());

export default VMdEditor;