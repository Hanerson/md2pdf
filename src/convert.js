/**
 * 转换管线:Markdown 文件 → HTML → PDF Buffer
 * 无附加功能:内容按文档流连续渲染,标题仅写入 PDF 元数据
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderMarkdown } from './markdown.js';
import { loadThemeCss, buildHtml } from './template.js';
import { renderPdf } from './pdf.js';
import { DEFAULTS } from './config.js';

/**
 * @param {object} params
 * @param {string} params.inputPath  Markdown 文件路径
 * @param {object} [params.options]  选项(与 CLI 同名,见 DEFAULTS)
 * @returns {Promise<{html: string, title: string, headings: Array, pdf: Buffer|null}>}
 */
export async function convert({ inputPath, options = {} }) {
  const opts = { ...DEFAULTS, ...options };
  const mdText = await fs.readFile(inputPath, 'utf8');
  const { html: contentHtml, headings } = renderMarkdown(mdText);

  const title = opts.title
    || headings.find((h) => h.level === 1)?.text
    || path.basename(inputPath, path.extname(inputPath));

  const themeCss = loadThemeCss(opts.theme);
  const html = buildHtml({
    title,
    lang: opts.lang,
    bodyHtml: contentHtml,
    themeCss,
    font: opts.font,
  });

  if (opts.format === 'html') {
    return { html, title, headings, pdf: null };
  }

  const pdf = await renderPdf(html, { ...opts, title });
  return { html, title, headings, pdf };
}
