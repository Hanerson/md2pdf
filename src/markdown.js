/**
 * Markdown 解析管线:markdown-it + 插件
 *  - markdown-it-anchor: 标题锚点(中文友好 slug)
 *  - markdown-it-task-lists: 任务列表
 *  - markdown-it-footnote: 脚注
 *  - highlight.js: 代码语法高亮(构建期完成,PDF 内无需网络)
 * 不做任何页面级改造——内容一一对应渲染
 */
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import hljs from 'highlight.js/lib/core';
import { escapeHtml } from './util.js';

// 注册常用语言(控制体积,避免全量自动检测)
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import go from 'highlight.js/lib/languages/go';
import graphql from 'highlight.js/lib/languages/graphql';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import less from 'highlight.js/lib/languages/less';
import lua from 'highlight.js/lib/languages/lua';
import makefile from 'highlight.js/lib/languages/makefile';
import markdown from 'highlight.js/lib/languages/markdown';
import objectivec from 'highlight.js/lib/languages/objectivec';
import perl from 'highlight.js/lib/languages/perl';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

const LANGUAGES = {
  bash, c, cpp, csharp, css, diff, go, graphql, ini, java, javascript, json,
  kotlin, less, lua, makefile, markdown, objectivec, perl, php, plaintext,
  python, ruby, rust, scss, shell, sql, swift, typescript, xml, yaml,
};

for (const [name, lang] of Object.entries(LANGUAGES)) {
  hljs.registerLanguage(name, lang);
}

/** 中文友好的 slug:保留汉字/字母/数字,空格转连字符 */
export function slugify(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_\-\u00b7]/gu, '') || 'sec';
}

/** 自定义代码块渲染:语法高亮 */
function renderFence(tokens, idx, options, env, self) {
  const token = tokens[idx];
  const info = token.info.trim();
  const lang = info.split(/\s+/)[0] || '';
  let code;
  if (lang && hljs.getLanguage(lang)) {
    try {
      code = hljs.highlight(token.content, { language: lang, ignoreIllegals: true }).value;
    } catch {
      code = escapeHtml(token.content);
    }
  } else {
    code = escapeHtml(token.content);
  }
  const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
  return `<pre class="code-block"><code class="language-${escapeHtml(lang)}"${langAttr}>${code}</code></pre>`;
}

/**
 * 渲染 Markdown,返回 { html, headings }
 * headings 仅用于提取文档标题(写入 PDF 元数据),不参与排版
 */
export function renderMarkdown(mdText) {
  const md = new MarkdownIt({
    html: false,        // 忽略原始 HTML,防止注入
    linkify: true,      // 裸 URL 自动转链接
    typographer: true,  // 智能标点
  });

  md.use(anchor, { slugify });
  md.use(taskLists, { enabled: true, label: true });
  md.use(footnote);
  md.renderer.rules.fence = renderFence;

  const headings = [];
  const defaultHeadingOpen = md.renderer.rules.heading_open
    || ((tokens, idx, o, e, self) => self.renderToken(tokens, idx, o));

  md.renderer.rules.heading_open = (tokens, idx, o, e, self) => {
    const token = tokens[idx];
    const level = Number(token.tag.slice(1));
    if (level === 1) {
      headings.push({
        level,
        text: tokens[idx + 1].content,
        id: token.attrGet('id'),
      });
    }
    return defaultHeadingOpen(tokens, idx, o, e, self);
  };

  const html = md.render(mdText);
  return { html, headings };
}
