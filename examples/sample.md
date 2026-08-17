# md2pdf 示例文档

> 本文用于演示 md2pdf 的排版效果:中文宋体、英文 Times New Roman、代码高亮、表格、脚注、任务列表等。运行 `npm run example` 即可生成 `examples/sample.pdf`。

## 关于本工具

md2pdf 是一条**干净的 Markdown → PDF 管线**:

1. **markdown-it** 将 Markdown 解析为 HTML(锚点、任务列表、脚注、语法高亮)
2. **自定义 CSS 主题** 负责排版——针对中文做了行高、对齐、标点、字体栈优化
3. **Chromium**(Playwright)以最高质量将 HTML 打印为 PDF

它的目标是:一条命令,零配置,得到一份排版专业、中文友好的 PDF。

### 特性一览

- 中文宋体、英文 Times New Roman,一一对应连续渲染
- 无封面、无目录、无页眉页脚——内容从第一页直接开始
- 代码语法高亮(30+ 常见语言,浅色配色)
- 命令极简:`md2pdf doc.md` 直接生成 `doc.pdf`
- 主题 CSS 完全可定制(`--style custom.css`)

## 中文排版演示

中文排版讲究**字距均匀、行距舒展**。本工具默认行高 1.75,正文 11pt(五号),标题分级清晰:

混合中英文段落同样自然,比如:Markdown 是轻量级标记语言,由 John Gruber 于 2004 年发布,设计目标是"易读易写的纯文本格式,并可转换为结构化的 HTML"。Chinese text flows naturally alongside English words and inline `code` snippets.

### 强调与引用

**加粗文本**用于强调重点,*斜体文本*用于术语或书名,`行内代码` 用于技术名词。引用块适合标注注意事项或来源:

> 干净的工具应该做到:开箱即用,绝不打扰。— md2pdf 设计原则

## 代码高亮

```js
// JavaScript 示例:计算斐波那契数列
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i <= n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}
console.log(fibonacci(10).join(', ')); // 0, 1, 1, 2, 3, ...
```

```python
# Python 示例:读取文件并统计行数
from pathlib import Path

def count_lines(path: Path) -> int:
    """统计文本文件行数,忽略空行"""
    return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())

print(count_lines(Path("README.md")))
```

```bash
# 终端命令示例
$ npx playwright install chromium
$ md2pdf 文档.md
```

```rust
// Rust 示例:泛型函数
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest { largest = item; }
    }
    largest
}
```

## 表格

| 功能 | CLI 参数 | 说明 |
| --- | --- | --- |
| 输出路径 | `-o` | 默认与输入同名 `.pdf` |
| 自定义主题 | `-s` | 传入你自己的 CSS 文件 |
| 自定义字体 | `-f` | 例如 `SimHei` 换成黑体 |
| 页面尺寸 | `--page-size` | A4 / Letter / A5 / A3 |
| 页边距 | `-m` | 例如 `25 20 25 20`(上 右 下 左) |

| 页面尺寸 | 宽度 (mm) | 高度 (mm) |
| --- | --- | --- |
| A4 | 210 | 297 |
| Letter | 216 | 279 |
| A5 | 148 | 210 |

## 任务列表

- [x] 搭建 Markdown 解析管线
- [x] 设计 CJK 排版主题
- [x] Chromium 打印 PDF
- [ ] 数学公式支持(KaTeX)[^1]
- [ ] PDF 书签大纲

[^1]: 数学公式计划在后续版本通过 KaTeX 渲染,无需额外运行时。

## 嵌套列表

1. 第一层有序列表
   - 嵌套无序项 A
   - 嵌套无序项 B
     1. 更深一层有序项
     2. 更深一层有序项
2. 第二层有序列表

## 分隔线

以上是分隔线上方的内容。

---

以下是分隔线下方的内容。链接示例:[GitHub 首页](https://github.com) 以及自动识别的裸链接 https://example.com 。
