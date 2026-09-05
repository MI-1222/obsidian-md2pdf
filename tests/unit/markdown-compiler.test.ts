import { describe, it, expect } from "vitest";
import { MarkdownCompiler } from "@/compiler";

describe("MarkdownCompiler", () => {
  const compiler = new MarkdownCompiler();

  it("標準的な Markdown 構文 (見出し、段落、リスト、テーブル、リンク) を正しく HTML に変換する。", () => {
    const md = `
# タイトル見出し

これは段落です。**太字** と *斜体* を含みます。

- 項目 1
- 項目 2

| 列 1 | 列 2 |
| ---- | ---- |
| A    | B    |

https://example.com
`;

    const html = compiler.render(md);

    expect(html).toContain("<h1");
    expect(html).toContain("タイトル見出し");
    expect(html).toContain("<strong>太字</strong>");
    expect(html).toContain("<em>斜体</em>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>項目 1</li>");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>A</td>");
    expect(html).toContain('<a href="https://example.com">');
  });

  it("highlight.js によるコードブロックのシンタックスハイライトが適用される。", () => {
    const md = `
\`\`\`typescript
const greeting: string = "Hello, World!";
console.log(greeting);
\`\`\`
`;

    const html = compiler.render(md);

    expect(html).toContain("<pre>");
    expect(html).toContain("<code");
    expect(html).toContain("hljs-");
    expect(html).toContain("Hello, World!");
  });

  it("未登録言語のコードブロックも安全に HTML エスケープされて描画される。", () => {
    const md = `
\`\`\`unknownlang
<script>alert('xss');</script>
\`\`\`
`;

    const html = compiler.render(md);

    expect(html).toContain("&lt;script&gt;alert('xss');&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
  });

  it("数式プラグインによりインライン数式およびブロック数式がレンダリングされる。", () => {
    /** テスト Markdown 文字列。 */
    const md = `
インライン数式: $E = mc^2$

ブロック数式:
$$
\\frac{a}{b} = c
$$
`;

    /** レンダリング後 HTML 文字列。 */
    const html = compiler.render(md);

    expect(html).toContain('<span class="math math-inline">$E = mc^2$</span>');
    expect(html).toContain('<div class="math math-block">');
    expect(html).toContain("\\frac{a}{b} = c");
  });

  it("markdown-it-github-alerts による GitHub スタイルアラートがレンダリングされる。", () => {
    const md = `
> [!NOTE]
> これはノートの本文です。

> [!WARNING]
> これは警告の本文です。
`;

    const html = compiler.render(md);

    expect(html).toMatch(/markdown-alert|markdown-alert-note|markdown-alert-warning|alert/i);
    expect(html).toContain("これはノートの本文です。");
  });

  it("markdown-it-checkbox によるタスクリストがレンダリングされる。", () => {
    const md = `
- [ ] 未完了タスク
- [x] 完了タスク
`;

    const html = compiler.render(md);

    expect(html).toContain('type="checkbox"');
    expect(html).toContain("未完了タスク");
    expect(html).toContain("完了タスク");
  });

  it("markdown-it-container によるカスタムコンテナがレンダリングされる。", () => {
    const md = `
::: warning
警告エリアの内容です。
:::
`;

    const html = compiler.render(md);

    expect(html).toContain('<div class="warning">');
    expect(html).toContain("警告エリアの内容です。");
  });

  it("markdown-it-named-headers により見出しにアンカー ID が付与される。", () => {
    const md = `
# はじめに
## 概要
`;

    const html = compiler.render(md);

    expect(html).toContain('<h1 id="はじめに">');
    expect(html).toContain('<h2 id="概要">');
  });

  it("breaks オプションを有効にすると単一改行が <br> に変換される。", () => {
    const md = `行1
行2`;

    const noBreaksHtml = compiler.render(md, { breaks: false });
    expect(noBreaksHtml).not.toContain("<br>");

    const breaksHtml = compiler.render(md, { breaks: true });
    expect(breaksHtml).toContain("<br>");
  });

  it("fileReader を指定して markdown-it-include を利用できる。", () => {
    const customCompiler = new MarkdownCompiler({
      fileReader: (filePath: string) => {
        if (filePath.includes("sub.md")) {
          return "インクルードされたサブファイルの内容。";
        }
        return "";
      },
    });

    const md = `
メインファイル。

:[include](sub.md)
`;

    const html = customCompiler.render(md);

    expect(html).toContain("インクルードされたサブファイルの内容。");
  });
});
