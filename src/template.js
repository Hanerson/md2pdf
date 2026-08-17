/**
 * HTML 模板与主题加载
 * 模板只做一件事:把渲染好的正文包进完整 HTML——不加封面、不加目录、不加任何附加页
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

/** 组装完整 HTML 文档 */
export function buildHtml({
  title,
  lang = 'zh-CN',
  bodyHtml,
  themeCss,
  font,
}) {
  const fontCss = font ? `<style>:root{--md2pdf-font: ${font};}</style>` : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${themeCss}</style>
${fontCss}
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}
