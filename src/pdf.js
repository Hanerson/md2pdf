/**
 * PDF 打印:Playwright Chromium 渲染
 * 无页眉、无页脚、无附加页——HTML 内容按文档流一一对应排布
 */
import { chromium } from 'playwright';

/** 解析页边距:"18" 或 "上 右 下 左"(mm) */
export function parseMargin(value) {
  const parts = String(value).trim().split(/\s+/).map(Number);
  if (parts.length === 0 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`无效的页边距: "${value}"(示例: 18 或 "25 20 25 20")`);
  }
  let top, right, bottom, left;
  if (parts.length === 1) [top, right, bottom, left] = [parts[0], parts[0], parts[0], parts[0]];
  else if (parts.length === 2) [top, right, bottom, left] = [parts[0], parts[1], parts[0], parts[1]];
  else if (parts.length === 4) [top, right, bottom, left] = parts;
  else throw new Error(`页边距需要 1、2 或 4 个值,收到 ${parts.length} 个: "${value}"`);
  return { top: `${top}mm`, right: `${right}mm`, bottom: `${bottom}mm`, left: `${left}mm` };
}

/** 渲染 HTML 为 PDF Buffer */
export async function renderPdf(html, options = {}) {
  const margin = options.marginObj || parseMargin(options.margin ?? '18');

  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    throw new Error(
      `无法启动 Chromium: ${e.message}\n请先安装浏览器: npx playwright install chromium`
    );
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({
      format: options.pageSize || 'A4',
      margin,
      printBackground: true,
      displayHeaderFooter: false,
    });
  } finally {
    await browser.close();
  }
}
