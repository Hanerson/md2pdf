/**
 * HTML 模板与主题加载
 * 主题 CSS 决定 PDF 的"长相"——内置 default 主题针对中文排版优化
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml } from './util.js';

const THEMES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'themes');

/** 加载主题 CSS:'default' 用内置主题;否则视为自定义 .css 路径 */
export function loadThemeCss(theme) {
  const name = theme || 'default';
  const builtin = path.join(THEMES_DIR, `${name}.css`);
  if (fs.existsSync(builtin)) return fs.readFileSync(builtin, 'utf8');
  if (typeof name === 'string' && name.endsWith('.css')) {
    const p = path.resolve(name);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error(`主题不存在: ${name}(内置主题: default;或传入自定义 .css 路径)`);
}

/** 目录页 HTML(可点击跳转) */
export function buildTocHtml(headings) {
  if (!headings.length) return '';
  const items = headings.map((h) => {
    const cls = h.level === 1 ? 'toc-level-1' : h.level === 2 ? 'toc-level-2' : 'toc-level-3';
    return `<li class="toc-item ${cls}"><a href="#${encodeURIComponent(h.id)}">${escapeHtml(h.text)}</a></li>`;
  }).join('\n');
  return `<nav class="toc-page" aria-label="目录"><h2 class="toc-title">目录</h2><ul class="toc-list">${items}</ul></nav>`;
}

/** 封面页 HTML */
export function buildCoverHtml({ title, author, date }) {
  const meta = [];
  if (author) meta.push(escapeHtml(author));
  if (date) meta.push(escapeHtml(date));
  const metaHtml = meta.length
    ? `<div class="cover-meta">${meta.join(' · ')}</div>`
    : '';
  return `<div class="cover-page"><h1 class="cover-title">${escapeHtml(title)}</h1>${metaHtml}</div>`;
}

/** 组装完整 HTML 文档 */
export function buildHtml({
  title,
  lang = 'zh-CN',
  bodyHtml,
  tocHtml = '',
  coverHtml = '',
  themeCss,
  bodyClass = '',
  overrides = {},
}) {
  const vars = [];
  if (overrides.font) vars.push(`--md2pdf-font: ${overrides.font};`);
  if (overrides.lineHeight) vars.push(`--md2pdf-lh: ${overrides.lineHeight};`);
  const varCss = vars.length ? `<style>:root{${vars.join(' ')}}</style>` : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${themeCss}</style>
${varCss}
</head>
<body class="${escapeHtml(bodyClass)}">
${coverHtml}
${tocHtml}
<main class="content">
${bodyHtml}
</main>
</body>
</html>
`;
}
