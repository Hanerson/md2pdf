/**
 * 配置解析:默认值 ← 配置文件 ← CLI 参数
 * 配置文件支持:md2pdf.config.json / .md2pdfrc.json(与 package.json 同目录)
 */
import fs from 'node:fs';
import path from 'node:path';
import { pickDefined } from './util.js';

export const DEFAULTS = {
  output: null,       // 默认: 与输入文件同名 .pdf
  toc: false,
  cover: false,
  theme: 'default',   // 内置主题名或自定义 .css 路径
  font: null,         // 正文字体族(逗号分隔)
  pageSize: 'A4',
  margin: '18',       // mm,支持 "18" 或 "上 右 下 左"
  header: null,       // null=文档标题,false=隐藏,字符串=自定义
  footer: null,       // null=默认页码,false=隐藏,字符串=自定义(支持 {page} {pages})
  title: null,
  author: null,
  date: null,         // 封面日期,默认今天
  lang: 'zh-CN',
  lineHeight: null,
  breakH1: false,     // 每个一级标题另起一页
  highlight: true,
  format: 'pdf',      // pdf | html(调试)
};

const CONFIG_NAMES = ['md2pdf.config.json', '.md2pdfrc.json', '.md2pdfrc'];

function parseConfigFile(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    throw new Error(`无法读取配置文件: ${filePath}`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`配置文件不是合法 JSON: ${filePath}(${e.message})`);
  }
}

/** 查找配置文件:显式路径优先,否则在当前目录自动发现 */
export function loadConfigFile(cwd, explicitPath) {
  if (explicitPath) {
    const p = path.resolve(cwd, explicitPath);
    if (!fs.existsSync(p)) throw new Error(`配置文件不存在: ${p}`);
    return parseConfigFile(p);
  }
  for (const name of CONFIG_NAMES) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p)) return parseConfigFile(p);
  }
  return {};
}

/** 合并配置并解析出绝对路径 */
export function resolveOptions(inputArg, cliOpts, cwd = process.cwd()) {
  const fileConfig = loadConfigFile(cwd, cliOpts?.config);
  const merged = { ...DEFAULTS, ...fileConfig, ...pickDefined(cliOpts || {}) };
  delete merged.config;

  const input = path.resolve(cwd, inputArg);
  if (!fs.existsSync(input)) throw new Error(`输入文件不存在: ${input}`);
  if (!fs.statSync(input).isFile()) throw new Error(`输入路径不是文件: ${input}`);

  const ext = path.extname(input);
  const output = merged.output
    ? path.resolve(cwd, String(merged.output))
    : path.join(path.dirname(input), `${path.basename(input, ext)}.pdf`);

  return { ...merged, input, output };
}
