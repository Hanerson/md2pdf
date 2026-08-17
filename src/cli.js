/**
 * CLI 入口:参数解析 → 配置合并 → 转换 → 写出
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { program } from 'commander';
import { resolveOptions } from './config.js';
import { convert } from './convert.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export async function main(argv = process.argv) {
  program
    .name('md2pdf')
    .description('干净的 Markdown → PDF 工具(CJK 中文排版优化)')
    .version(pkg.version)
    .argument('<input>', '输入 Markdown 文件路径')
    .option('-o, --output <path>', '输出 PDF 路径(默认: 与输入文件同名 .pdf)')
    .option('-t, --toc', '在正文前生成可点击目录')
    .option('--cover', '生成封面页')
    .option('-s, --style <path>', '自定义主题 CSS(默认: 内置 default 主题)')
    .option('-f, --font <fonts>', '正文字体族,逗号分隔,如 "Noto Serif SC, SimSun"')
    .option('--page-size <size>', '页面尺寸: A4 / Letter / A5 / A3')
    .option('-m, --margin <value>', '页边距(mm): 18 或 "25 20 25 20"(上 右 下 左)')
    .option('--header <text>', '页眉文本(默认: 文档标题;传空字符串表示隐藏)')
    .option('--footer <text>', '页脚文本(默认: 页码;支持 {page} 与 {pages} 占位符)')
    .option('--no-header', '不显示页眉')
    .option('--no-footer', '不显示页脚')
    .option('--title <text>', '文档标题(默认: 第一个 H1 或文件名)')
    .option('--author <text>', '作者(封面页显示)')
    .option('--date <date>', '封面日期(默认: 今天,格式 YYYY-MM-DD)')
    .option('--lang <code>', '文档语言(默认 zh-CN)')
    .option('--line-height <n>', '正文行高(默认 1.75)')
    .option('--break-h1', '每个一级标题另起一页')
    .option('--no-highlight', '禁用代码语法高亮')
    .option('--format <format>', '输出格式: pdf 或 html(调试用)')
    .option('-c, --config <path>', '配置文件路径(md2pdf.config.json / .md2pdfrc.json)')
    .option('--verbose', '打印详细配置')
    .showHelpAfterError()
    .parse(argv);

  const opts = program.opts();
  const inputArg = program.args[0];
  if (!inputArg) {
    program.help({ error: true });
  }

  const cfg = resolveOptions(inputArg, opts);

  if (cfg.verbose) {
    console.log('· 配置:', JSON.stringify(cfg, null, 2));
  }

  const result = await convert({ inputPath: cfg.input, options: cfg });

  if (cfg.format === 'html') {
    const outHtml = cfg.output.replace(/\.pdf$/i, '.html');
    await fs.mkdir(path.dirname(outHtml), { recursive: true });
    await fs.writeFile(outHtml, result.html, 'utf8');
    console.log(`✓ HTML 已生成: ${outHtml}`);
    return;
  }

  await fs.mkdir(path.dirname(cfg.output), { recursive: true });
  await fs.writeFile(cfg.output, result.pdf);
  const kb = (result.pdf.length / 1024).toFixed(1);
  console.log(`✓ 已生成 PDF: ${cfg.output}(${kb} KB)标题 ${result.headings.length} 个`);
}
