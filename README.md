# md2pdf

极简的 **Markdown → PDF** 命令行工具:**中文宋体、英文 Times New Roman**,一一对应渲染,无封面、无目录、无页眉页脚。

```bash
md2pdf doc.md        # → 生成 doc.pdf
```

## 设计原则

| 原则 | 说明 |
| --- | --- |
| 一一对应 | 内容按文档流连续渲染,不插入任何附加页 |
| 无附加物 | 没有封面、目录、页眉、页脚、页码 |
| 极简命令 | `md2pdf doc.md` 一条命令搞定,输出与输入同名 |
| 经典字体 | 中文 → 宋体(SimSun),英文 → Times New Roman |
| 最小参数 | 只有输出路径、主题、字体、页面尺寸、页边距 5 个可选参数 |

## 工作原理

```
Markdown ──▶ markdown-it 解析 ──▶ HTML + 排版 CSS ──▶ Chromium 打印 ──▶ PDF
              (中文锚点/高亮)       (宋体/Times 栈)      (无页眉页脚)
```

代码高亮在构建期完成(highlight.js),PDF 渲染时无需网络;字体使用系统字体,不打包任何字体文件。

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
# 最简用法:生成与输入同名的 PDF
md2pdf doc.md

# 指定输出路径
md2pdf doc.md -o out.pdf

# 自定义页边距(上 右 下 左,mm)与页面尺寸
md2pdf doc.md -m "25 20 25 20" --page-size A4

# 自定义主题或字体
md2pdf doc.md -s my-theme.css
md2pdf doc.md -f "SimHei"           # 换成黑体

# 调试:输出 HTML 而非 PDF
md2pdf doc.md --format html
```

### 全部参数

| 参数 | 说明 | 默认 |
| --- | --- | --- |
| `<input>` | 输入 Markdown 文件 | 必填 |
| `-o, --output <path>` | 输出 PDF 路径 | 与输入同名 `.pdf` |
| `-s, --style <path>` | 自定义主题 CSS | 内置 `default` |
| `-f, --font <fonts>` | 字体族(逗号分隔) | Times New Roman + 宋体 |
| `--page-size <size>` | A4 / Letter / A5 / A3 | A4 |
| `-m, --margin <value>` | 页边距 mm:`18` 或 `25 20 25 20` | 18 |

### 编程式 API

```js
import { convert } from 'md2pdf';

const { pdf, title } = await convert({ inputPath: './doc.md' });
await fs.writeFile('doc.pdf', pdf);
```

## 自定义主题

主题就是一个 CSS 文件,可完全重写排版。内置 `default` 主题的关键点:

- 字体栈:`"Times New Roman", SimSun, "Songti SC", "Noto Serif CJK SC", serif`
  (拉丁字符走 Times,中文字符自动回退宋体)
- 正文 11pt、行高 1.75、两端对齐(`text-justify: inter-ideograph`)
- 表格跨页重复表头、代码块防分页断裂
- 字体可通过 CSS 变量 `--md2pdf-font` 或 CLI `-f` 覆盖

自定义时建议从 `src/themes/default.css` 复制一份再改。

## 开发

```bash
npm test                  # 运行测试(node:test,无额外依赖)
npm run example           # 生成 examples/sample.pdf
npm run example:html      # 生成 HTML 便于调试排版
```

测试覆盖:中文锚点、语法高亮、安全转义、端到端 PDF 生成、一一对应渲染(无封面/目录/页脚)、字体嵌入(宋体 + Times)。

### 项目结构

```
md2pdf/
├── bin/md2pdf.js         CLI 入口
├── src/
│   ├── cli.js            参数解析与编排
│   ├── config.js         默认值与合并
│   ├── markdown.js       markdown-it 解析 + 高亮
│   ├── template.js       HTML 模板 / 主题加载
│   ├── themes/default.css 内置主题(宋体 + Times)
│   ├── pdf.js            Playwright 打印
│   ├── convert.js        转换管线(CLI 与 API 共用)
│   └── index.js          编程式 API
├── examples/sample.md    示例文档
└── test/run.mjs          测试
```

## License

MIT
