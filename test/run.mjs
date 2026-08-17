/** md2pdf 测试:node --test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from '../src/markdown.js';
import { parseMargin } from '../src/pdf.js';
import { convert } from '../src/index.js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.join(__dirname, '..', 'examples', 'sample.md');

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

test('渲染中文标题并生成锚点', () => {
  const md = '# 第一章 中文标题\n\n正文\n\n## 二级标题\n';
  const { html, headings } = renderMarkdown(md);
  assert.match(html, /<h1/);
  assert.equal(headings.length, 1, '只收集一级标题用于文档元数据');
  assert.ok(headings[0].id, '应生成中文锚点 id');
});

test('代码块语法高亮', () => {
  const md = '```js\nconst x = 1;\n```\n';
  const { html } = renderMarkdown(md);
  assert.match(html, /<pre class="code-block">/);
  assert.match(html, /hljs-keyword/);
});

test('原始 HTML 被转义(安全)', () => {
  const { html } = renderMarkdown('<script>alert(1)</script>');
  assert.ok(!html.includes('<script>'));
});

test('解析页边距', () => {
  assert.deepEqual(parseMargin('18'), {
    top: '18mm', right: '18mm', bottom: '18mm', left: '18mm',
  });
  assert.deepEqual(parseMargin('25 20 25 20'), {
    top: '25mm', right: '20mm', bottom: '25mm', left: '20mm',
  });
  assert.throws(() => parseMargin('abc'));
  assert.throws(() => parseMargin('1 2 3'));
});

test('默认 HTML:无封面、无目录、无页眉页脚', async () => {
  const { html } = await convert({ inputPath: samplePath, options: { format: 'html' } });
  assert.ok(!html.includes('toc-page'), '不应包含目录');
  assert.ok(!html.includes('cover-page'), '不应包含封面');
  assert.match(html, /<body>\n<h1/, '正文直接开始,无附加页');
});

test('端到端:md2pdf doc.md 直接生成 PDF(需已安装 Chromium)', async () => {
  const { pdf, title } = await convert({ inputPath: samplePath });
  assert.ok(pdf, '应返回 PDF Buffer');
  assert.ok(pdf.length > 20000, `PDF 应大于 20KB,实际 ${pdf.length}`);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', 'PDF 魔数正确');
  assert.equal(title, 'md2pdf 示例文档', '标题取自第一个 H1');
});

test('一一对应渲染:无封面页、无目录页、无页码页脚', async () => {
  const { pdf } = await convert({ inputPath: samplePath });
  const text = await extractPdfText(pdf);

  // 第一页就是正文(标题 + 引言),而不是独立封面
  const page1 = text.split('\n')[0];
  assert.ok(page1.includes('md2pdf 示例文档'), '第一页直接是正文标题');
  assert.ok(text.includes('本文用于演示'), '引言紧随标题');

  // 无页码页脚("第 N 页 / 共 M 页"是页脚模板的特征)
  assert.ok(!/第\s*\d+\s*页\s*\/\s*共/.test(text), '不应有页码页脚');
});

test('字体:中文宋体 + 英文 Times New Roman 嵌入 PDF', async () => {
  const { pdf } = await convert({ inputPath: samplePath });
  const raw = pdf.toString('latin1').toLowerCase();
  assert.ok(raw.includes('timesnewroman'), '应嵌入 Times New Roman');
  assert.ok(raw.includes('simsun'), '应嵌入宋体(SimSun)');
});
