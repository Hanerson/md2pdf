/** md2pdf 测试:node --test test/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from '../src/markdown.js';
import { buildTocHtml, buildCoverHtml } from '../src/template.js';
import { parseMargin } from '../src/pdf.js';
import { convert } from '../src/index.js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

/** 提取 PDF 全文(用于验证中文真实嵌入) */
async function extractPdfText(pdfBuffer) {
  const loadingTask = getDocument({
    data: new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength),
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;
  try {
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join('') + '\n';
    }
    return text;
  } finally {
    await loadingTask.destroy();
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.join(__dirname, '..', 'examples', 'sample.md');

test('渲染中文标题并生成锚点', () => {
  const md = '# 第一章 中文标题\n\n正文\n\n## 二级标题\n\n### 三级标题\n';
  const { html, headings } = renderMarkdown(md, {});
  assert.match(html, /<h1/);
  assert.equal(headings.length, 3);
  assert.equal(headings[0].level, 1);
  assert.ok(headings[0].id, '应生成中文锚点 id');
});

test('代码块语法高亮', () => {
  const md = '```js\nconst x = 1;\n```\n';
  const { html } = renderMarkdown(md, {});
  assert.match(html, /<pre class="code-block">/);
  assert.match(html, /hljs-keyword/);
});

test('禁用高亮时代码被安全转义', () => {
  const md = '```js\nconst x = <1;\n```\n';
  const { html } = renderMarkdown(md, { highlight: false });
  assert.ok(!html.includes('hljs-keyword'));
  assert.ok(html.includes('&lt;'));
});

test('原始 HTML 被转义(安全)', () => {
  const { html } = renderMarkdown('<script>alert(1)</script>', {});
  assert.ok(!html.includes('<script>'));
});

test('目录 HTML 包含中文锚点链接', () => {
  const md = '# 第一章\n\n## 小节\n';
  const { headings } = renderMarkdown(md, {});
  const toc = buildTocHtml(headings);
  assert.match(toc, /第一章/);
  assert.match(toc, /href="#/);
  assert.match(toc, /toc-page/);
});

test('封面 HTML 包含标题与作者', () => {
  const cover = buildCoverHtml({ title: '测试文档', author: '张三', date: '2025-01-01' });
  assert.match(cover, /测试文档/);
  assert.match(cover, /张三/);
});

test('解析页边距', () => {
  assert.deepEqual(parseMargin('18'), {
    top: '18mm', right: '18mm', bottom: '18mm', left: '18mm',
  });
  assert.deepEqual(parseMargin('25 20 25 20'), {
    top: '25mm', right: '20mm', bottom: '25mm', left: '20mm',
  });
  assert.deepEqual(parseMargin('10 15'), {
    top: '10mm', right: '15mm', bottom: '10mm', left: '15mm',
  });
  assert.throws(() => parseMargin('abc'));
  assert.throws(() => parseMargin('1 2 3'));
});

test('封面模式:正文 H1 不重复', async () => {
  const { html } = await convert({ inputPath: samplePath, options: { format: 'html', cover: true } });
  assert.equal((html.match(/<h1\b/g) || []).length, 1, '封面标题是唯一的 H1');
});

test('端到端:生成 PDF(需已安装 Chromium)', async () => {
  const { pdf, title, headings } = await convert({
    inputPath: samplePath,
    options: { toc: true, cover: true, author: 'md2pdf 团队' },
  });
  assert.ok(pdf, '应返回 PDF Buffer');
  assert.ok(pdf.length > 20000, `PDF 应大于 20KB,实际 ${pdf.length}`);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', 'PDF 魔数正确');
  assert.ok(title.length > 0);
  assert.ok(headings.length >= 4, '示例文档应有多个标题');
});

test('端到端:PDF 中中文文本可提取(真实嵌入)', async () => {
  const { pdf } = await convert({ inputPath: samplePath, options: { toc: true } });
  const text = await extractPdfText(pdf);
  assert.ok(text.includes('中文排版'), '应能提取到中文正文');
  assert.ok(text.includes('md2pdf 示例文档'), '应能提取到标题');
  assert.ok(text.includes('目录'), '应包含目录页文字');
});
