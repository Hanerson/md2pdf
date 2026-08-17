/**
 * 转换管线:Markdown 文件 → HTML → PDF Buffer
 * CLI 与编程式 API 共用的核心逻辑
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderMarkdown } from './markdown.js';
import { loadThemeCss, buildTocHtml, buildCoverHtml, buildHtml } from './template.js';
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
  const { html: contentHtml, headings } = renderMarkdown(mdText, opts);

  const title = opts.title
    || headings.find((h) => h.level === 1)?.text
    || path.basename(inputPath, path.extname(inputPath));

  let bodyHtml = contentHtml;
  if (opts.cover) {
    // 封面已有大标题,去掉正文第一个 H1,避免重复
    bodyHtml = bodyHtml.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');
  }

  const tocHtml = opts.toc ? buildTocHtml(headings) : '';
  const coverHtml = opts.cover
    ? buildCoverHtml({ title, author: opts.author, date: opts.date })
    : '';
  const themeCss = loadThemeCss(opts.theme);

  const html = buildHtml({
    title,
    lang: opts.lang,
    bodyHtml,
    tocHtml,
    coverHtml,
    themeCss,
    bodyClass: opts.breakH1 ? 'break-h1' : '',
    overrides: { font: opts.font, lineHeight: opts.lineHeight },
  });

  if (opts.format === 'html') {
    return { html, title, headings, pdf: null };
  }

  const pdf = await renderPdf(html, { ...opts, title });
  return { html, title, headings, pdf };
}
