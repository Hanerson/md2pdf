# md2pdf

干净的 **Markdown → PDF** 命令行工具,针对中文(CJK)排版优化。

一条命令,零配置,得到一份排版专业、中文友好的 PDF:

```bash
md2pdf 文档.md -o 文档.pdf
```

## 为什么是"干净"

| 方面 | 说明 |
| --- | --- |
| 职责分离 | 解析(markdown-it)→ 排版(CSS 主题)→ 打印(Chromium),各模块独立 |
| 零配置即用 | 默认 A4 + 18mm 页边距 + 中文系统字体栈,无需任何设置 |
| 输出可控 | HTML 调试输出(`--format html`)、主题完全可定制 |
| 安全 | 原始 HTML 默认转义,无注入风险 |

## 工作原理

```
Markdown ──▶ markdown-it 解析 ──▶ HTML 模板 + CJK 排版 CSS ──▶ Chromium 打印 ──▶ PDF
              │ 锚点 / 语法高亮 /           │ 字体栈 / 行高 / 标点           │ 页码 / 页眉页脚
              │ 目录收集                      │ 表格 / 代码块 / 引用            │ 内部链接 / 目录跳转
              └─────────────────────────────┴─────────────────────────────┘
```

高亮在构建期完成(highlight.js),PDF 渲染时无需网络;字体使用系统字体,不打包任何字体文件。

## 安装

```bash
# 需要 Node.js >= 20
npm install
npm install -g .           # 全局安装,获得 md2pdf 命令(可选)

# 首次使用前安装 Chromium(约 150MB,只需一次)
npx playwright install chromium
```

## 使用

```bash
# 最简用法
md2pdf 文档.md

# 常用组合
md2pdf 文档.md -o 文档.pdf --toc --cover --author "张三"

# 自定义页边距(上 右 下 左,mm)与页面尺寸
md2pdf 文档.md -m "25 20 25 20" --page-size A5

# 自定义主题与字体
md2pdf 文档.md -s my-theme.css -f "Noto Serif SC, SimSun"

# 调试:输出 HTML 而非 PDF
md2pdf 文档.md --format html
```

### 完整参数

| 参数 | 说明 | 默认 |
| --- | --- | --- |
| `<input>` | 输入 Markdown 文件 | 必填 |
| `-o, --output <path>` | 输出 PDF 路径 | 与输入同名 `.pdf` |
| `-t, --toc` | 生成可点击目录 | 关 |
| `--cover` | 生成封面页 | 关 |
| `-s, --style <path>` | 自定义主题 CSS | 内置 `default` |
| `-f, --font <fonts>` | 正文字体族(逗号分隔) | 系统中文栈 |
| `--page-size <size>` | A4 / Letter / A5 / A3 | A4 |
| `-m, --margin <value>` | 页边距 mm:`18` 或 `25 20 25 20` | 18 |
| `--header <text>` | 页眉文本 | 文档标题 |
| `--footer <text>` | 页脚文本,支持 `{page}` `{pages}` | `第 N 页 / 共 M 页` |
| `--no-header` / `--no-footer` | 隐藏页眉 / 页脚 | — |
| `--title <text>` | 文档标题 | 第一个 H1 或文件名 |
| `--author <text>` | 作者(封面显示) | — |
| `--date <date>` | 封面日期 | 今天 |
| `--lang <code>` | 文档语言 | `zh-CN` |
| `--line-height <n>` | 正文行高 | 1.75 |
| `--break-h1` | 每个一级标题另起一页 | 关 |
| `--no-highlight` | 禁用代码高亮 | 关 |
| `--format <format>` | `pdf` / `html`(调试) | pdf |
| `-c, --config <path>` | 配置文件 | 自动发现 |
| `--verbose` | 打印详细配置 | 关 |

### 配置文件

支持 `md2pdf.config.json` 或 `.md2pdfrc.json`(放在运行目录),键名与参数一致,CLI 参数优先:

```json
{
  "toc": true,
  "cover": true,
  "author": "张三",
  "pageSize": "A4",
  "margin": "25 20 25 20",
  "font": "Noto Serif SC, SimSun"
}
```

### 编程式 API

```js
import { convert } from 'md2pdf';

const { pdf, title, headings } = await convert({
  inputPath: './文档.md',
  options: { toc: true, cover: true },
});
await fs.writeFile('文档.pdf', pdf);
```

## 自定义主题

主题就是一个 CSS 文件,可完全重写排版。内置 `default` 主题的关键点:

- 正文 11pt、行高 1.75、两端对齐(`text-justify: inter-ideograph`)
- 中文字体栈:`PingFang SC`(macOS)→ `Microsoft YaHei`(Windows)→ `Noto Sans CJK SC`(Linux)
- 表格跨页重复表头、代码块防分页断裂、目录与封面独立成页
- 覆盖变量:`--md2pdf-font`、`--md2pdf-lh` 由 CLI 注入

自定义时建议从 `src/themes/default.css` 复制一份再改。

## 开发

```bash
npm test                  # 运行测试(node:test,无额外依赖)
npm run example           # 生成 examples/sample.pdf(含目录与封面)
npm run example:html      # 生成 HTML 便于调试排版
```

### 项目结构

```
md2pdf/
├── bin/md2pdf.js         CLI 入口
├── src/
│   ├── cli.js            参数解析与编排
│   ├── config.js         默认值 / 配置文件 / 合并
│   ├── markdown.js       markdown-it 解析 + 高亮 + 目录收集
│   ├── template.js       HTML 模板 / 目录 / 封面 / 主题加载
│   ├── themes/default.css 内置 CJK 排版主题
│   ├── pdf.js            Playwright 打印
│   ├── convert.js        转换管线(CLI 与 API 共用)
│   └── index.js          编程式 API
├── examples/sample.md    示例文档
└── test/run.mjs          测试
```

## 路线图

- [ ] 数学公式(KaTeX,零运行时渲染)
- [ ] PDF 书签大纲(pagedjs 或后处理)
- [ ] 更多内置主题(serif 宋体风 / 暗色)
- [ ] `--watch` 监听模式
- [ ] 目录页码(两遍渲染)

## License

MIT
