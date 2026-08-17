/**
 * CLI 入口:md2pdf doc.md → doc.pdf
 * 刻意精简——只有输出路径、主题、字体、页面尺寸、页边距这几个必要参数
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
    .description('Markdown → PDF:中文宋体 + Times New Roman,一一对应渲染')
    .version(pkg.version)
    .argument('<input>', '输入 Markdown 文件')
    .option('-o, --output <path>', '输出 PDF 路径(默认: 与输入文件同名 .pdf)')
    .option('-s, --style <path>', '自定义主题 CSS(默认: 内置 default 主题)')
    .option('-f, --font <fonts>', '字体族,逗号分隔(默认: Times New Roman + 宋体)')
    .option('--page-size <size>', '页面尺寸: A4 / Letter / A5 / A3(默认 A4)')
    .option('-m, --margin <value>', '页边距 mm: 18 或 "25 20 25 20"(默认 18)')
    .option('--format <format>', '输出格式: pdf 或 html(调试)')
    .showHelpAfterError()
    .parse(argv);

  const opts = program.opts();
  const inputArg = program.args[0];
  if (!inputArg) {
    program.help({ error: true });
  }

  const cfg = resolveOptions(inputArg, opts);
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
  console.log(`✓ 已生成 PDF: ${cfg.output}(${kb} KB)`);
}
