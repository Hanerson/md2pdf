/**
 * 配置:默认值 ← CLI 参数
 * 保持最小——没有配置文件、没有多余选项
 */
import fs from 'node:fs';
import path from 'node:path';
import { pickDefined } from './util.js';

export const DEFAULTS = {
  output: null,       // 默认: 与输入文件同名 .pdf
  theme: 'default',   // 内置主题名或自定义 .css 路径
  font: null,         // 字体族覆盖(默认: Times New Roman + 宋体)
  pageSize: 'A4',
  margin: '18',       // mm,支持 "18" 或 "上 右 下 左"
  format: 'pdf',      // pdf | html(调试)
  lang: 'zh-CN',
};

/** 合并默认值与 CLI 参数,解析出绝对路径 */
export function resolveOptions(inputArg, cliOpts, cwd = process.cwd()) {
  const merged = { ...DEFAULTS, ...pickDefined(cliOpts || {}) };

  const input = path.resolve(cwd, inputArg);
  if (!fs.existsSync(input)) throw new Error(`输入文件不存在: ${input}`);
  if (!fs.statSync(input).isFile()) throw new Error(`输入路径不是文件: ${input}`);

  const ext = path.extname(input);
  const output = merged.output
    ? path.resolve(cwd, String(merged.output))
    : path.join(path.dirname(input), `${path.basename(input, ext)}.pdf`);

  return { ...merged, input, output };
}
