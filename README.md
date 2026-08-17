# md2pdf

> 极简的 **Markdown → PDF** 命令行工具 — 中文宋体、英文 Times New Roman，一一对应渲染，无封面、无目录、无页眉页脚。
>
> Minimal **Markdown → PDF** CLI — SimSun for Chinese, Times New Roman for English, one-to-one rendering, no cover, no TOC, no headers/footers.

<div align="center">

[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-blueviolet)](package.json)

</div>

---

```bash
md2pdf doc.md        # → 生成 doc.pdf
```

## 目录 · Contents

- [设计原则 · Design Principles](#设计原则--design-principles)
- [工作原理 · How It Works](#工作原理--how-it-works)
- [安装 · Installation](#安装--installation)
- [使用 · Usage](#使用--usage)
  - [CLI 命令](#cli-命令)
  - [全部参数](#全部参数)
  - [编程式 API](#编程式-api)
- [自定义主题 · Custom Themes](#自定义主题--custom-themes)
- [开发 · Development](#开发--development)
  - [项目结构](#项目结构)
- [License](#license)

---

## 设计原则 · Design Principles

| 原则 | 说明 |
| --- | --- |
| **一一对应** | 内容按文档流连续渲染，不插入任何附加页 |
| **无附加物** | 没有封面、目录、页眉、页脚、页码 |
| **极简命令** | `md2pdf doc.md` 一条命令搞定，输出与输入同名 |
| **经典字体** | 中文 → 宋体 (SimSun)，英文 → Times New Roman |
| **最小参数** | 只有输出路径、主题、字体、页面尺寸、页边距 5 个可选参数 |

## 工作原理 · How It Works

```
 Markdown ──▶ markdown-it 解析 ──▶ HTML + 排版 CSS ──▶ Chromium 打印 ──▶ PDF
               (中文锚点/高亮)       (宋体/Times 栈)      (无页眉页脚)
```

- **代码高亮**在构建期完成 (highlight.js)，PDF 渲染时无需网络
- **字体**使用系统字体，不打包任何字体文件
- **渲染引擎**基于 Playwright (Chromium)，确保精确的 CSS 打印排版

## 安装 · Installation

### 前置要求 · Prerequisites

- [Node.js](https://nodejs.org) >= 20

### 步骤

```bash
# 1. 克隆或进入项目目录
cd md2pdf

# 2. 安装依赖
npm install

# 3. （可选）全局安装，获得 md2pdf 命令
npm install -g .

# 4. 首次使用前安装 Chromium（约 150MB，只需一次）
npx playwright install chromium
```

> **提示：** 如果在中国大陆，`playwright install` 下载较慢，可设置环境变量使用镜像：
> ```bash
> PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright npx playwright install chromium
> ```

## 使用 · Usage

### CLI 命令

```bash
# 最简用法：生成与输入同名的 PDF
md2pdf doc.md

# 指定输出路径
md2pdf doc.md -o out.pdf

# 自定义页边距（上 右 下 左，mm）与页面尺寸
md2pdf doc.md -m "25 20 25 20" --page-size A4

# 自定义主题或字体
md2pdf doc.md -s my-theme.css
md2pdf doc.md -f "SimHei"           # 换成黑体

# 调试：输出 HTML 而非 PDF
md2pdf doc.md --format html
```

### 全部参数

| 参数 | 说明 | 默认 |
| --- | --- | --- |
| `<input>` | 输入 Markdown 文件（必填） | — |
| `-o, --output <path>` | 输出 PDF 路径 | 与输入同名 `.pdf` |
| `-s, --style <path>` | 自定义主题 CSS | 内置 `default` |
| `-f, --font <fonts>` | 字体族（逗号分隔） | `Times New Roman, SimSun` |
| `--page-size <size>` | 页面尺寸：`A4` / `Letter` / `A5` / `A3` | `A4` |
| `-m, --margin <value>` | 页边距 `mm`：`18` 或 `"25 20 25 20"` | `18` |
| `--format <format>` | 输出格式：`pdf` 或 `html`（调试用） | `pdf` |

### 编程式 API

也可在 Node.js 代码中直接调用：

```js
import { convert } from 'md2pdf';

// 基本用法
const { pdf, title } = await convert({ inputPath: './doc.md' });
await fs.writeFile('doc.pdf', pdf);

// 传入选项
const result = await convert({
  inputPath: './doc.md',
  options: {
    pageSize: 'A4',
    margin: '25 20 25 20',
    font: 'SimHei, SimSun',
  },
});

// 仅获取 HTML 预览
const { html } = await convert({
  inputPath: './doc.md',
  options: { format: 'html' },
});
```

#### 导出模块

| 模块 | 导出 |
| --- | --- |
| `md2pdf` | `convert` |
| `md2pdf/markdown` | `renderMarkdown`, `slugify` |
| `md2pdf/template` | `buildHtml`, `loadThemeCss` |
| `md2pdf/pdf` | `renderPdf`, `parseMargin` |
| `md2pdf/config` | `resolveOptions`, `DEFAULTS` |

## 自定义主题 · Custom Themes

主题就是一个 CSS 文件，可完全重写排版。内置 `default` 主题的关键点：

- **字体栈**: `"Times New Roman", SimSun, "Songti SC", "Noto Serif CJK SC", serif`
  （拉丁字符走 Times，中文字符自动回退宋体）
- **正文** 11pt、行高 1.75、两端对齐 (`text-justify: inter-ideograph`)
- **表格** 跨页重复表头、代码块防分页断裂
- **字体** 可通过 CSS 变量 `--md2pdf-font` 或 CLI `-f` 覆盖

```bash
# 使用自定义主题
md2pdf doc.md -s path/to/your-theme.css
```

自定义时建议从 `src/themes/default.css` 复制一份再改。

## 开发 · Development

```bash
# 运行测试（node:test，无额外依赖）
npm test

# 生成示例 PDF
npm run example

# 生成示例 HTML（便于调试排版）
npm run example:html
```

测试覆盖：
- 中文锚点、语法高亮、安全转义
- 端到端 PDF 生成
- 一一对应渲染（无封面/目录/页脚）
- 字体嵌入（宋体 + Times）

### 项目结构

```
md2pdf/
├── bin/md2pdf.js         CLI 入口
├── src/
│   ├── cli.js            参数解析与编排
│   ├── config.js         默认值与合并
│   ├── markdown.js       markdown-it 解析 + 高亮
│   ├── template.js       HTML 模板 / 主题加载
│   ├── themes/default.css 内置主题（宋体 + Times）
│   ├── pdf.js            Playwright 打印
│   ├── convert.js        转换管线（CLI 与 API 共用）
│   └── index.js          编程式 API
├── examples/sample.md    示例文档
└── test/run.mjs          测试
```

## License

[MIT](LICENSE) © 2025 md2pdf contributors