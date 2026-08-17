/**
 * md2pdf Web 服务器
 * 直接复用 src/ 核心模块，提供 Web API 和静态文件服务
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from '../src/markdown.js';
import { loadThemeCss, buildHtml } from '../src/template.js';
import { renderPdf, parseMargin } from '../src/pdf.js';
import { DEFAULTS } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3222;

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

/** 解析选项，合并默认值 */
function resolveOptions(body) {
  const opts = { ...DEFAULTS };
  if (body.options) {
    if (body.options.pageSize) opts.pageSize = body.options.pageSize;
    if (body.options.margin) opts.margin = body.options.margin;
    if (body.options.font) opts.font = body.options.font;
    if (body.options.theme) opts.theme = body.options.theme;
  }
  return opts;
}

/** 从 markdown 渲染完整 HTML */
function renderHtml(markdown, opts) {
  const { html: contentHtml, headings } = renderMarkdown(markdown);
  const title = opts.title
    || headings.find(h => h.level === 1)?.text
    || 'Untitled';
  const themeCss = loadThemeCss(opts.theme);
  const html = buildHtml({
    title,
    lang: opts.lang,
    bodyHtml: contentHtml,
    themeCss,
    font: opts.font,
  });
  return { html, title, headings };
}

// POST /api/render — 渲染 Markdown 为 HTML
app.post('/api/render', (req, res) => {
  try {
    const { markdown } = req.body;
    if (typeof markdown !== 'string') {
      return res.status(400).json({ error: '缺少 markdown 字段' });
    }
    const opts = resolveOptions(req.body);
    const { html, title } = renderHtml(markdown, opts);
    res.json({ html, title });
  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pdf — 渲染 Markdown 为 PDF 下载
app.post('/api/pdf', async (req, res) => {
  try {
    const { markdown } = req.body;
    if (typeof markdown !== 'string') {
      return res.status(400).json({ error: '缺少 markdown 字段' });
    }
    const opts = resolveOptions(req.body);
    const { html, title } = renderHtml(markdown, opts);

    const marginObj = parseMargin(opts.margin);
    const pdfBuffer = await renderPdf(html, {
      pageSize: opts.pageSize,
      marginObj,
      title,
    });

    const filename = encodeURIComponent(title.replace(/[^a-zA-Z0-9一-鿿_-]/g, '_') || 'output');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/theme — 返回内置主题 CSS
app.get('/api/theme', (req, res) => {
  try {
    const css = loadThemeCss('default');
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.send(css);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/config — 返回默认配置
app.get('/api/config', (req, res) => {
  res.json({
    defaults: {
      pageSize: DEFAULTS.pageSize,
      margin: DEFAULTS.margin,
      font: DEFAULTS.font,
      theme: DEFAULTS.theme,
      lang: DEFAULTS.lang,
    },
    pageSizes: ['A4', 'Letter', 'A5', 'A3'],
  });
});

app.listen(PORT, () => {
  console.log(`✓ md2pdf Web 服务已启动: http://localhost:${PORT}`);
  console.log(`  编辑器: http://localhost:${PORT}/`);
});