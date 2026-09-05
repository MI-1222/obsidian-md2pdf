import { describe, it, expect } from "vitest";
import { MarkdownCompiler } from "@/compiler";
import { renderMermaidToSvg } from "@/compiler/renderers/mermaid";

describe("Mermaid Renderer", () => {
  it("Flowchart (graph TD) をインプロセスで SVG 文字列に変換する。", async () => {
    const code = `
graph TD
    A[開始] --> B{判定}
    B -->|Yes| C[処理 1]
    B -->|No| D[処理 2]
    C --> E[終了]
    D --> E
`;

    const result = await renderMermaidToSvg(code);

    expect(result).toContain('class="md2pdf-mermaid-container"');
    expect(result).toContain("<svg");
    expect(result).toContain("開始");
    expect(result).toContain("終了");
  });

  it("Sequence Diagram (sequenceDiagram) を SVG 文字列に変換する。", async () => {
    const code = `
sequenceDiagram
    autonumber
    Alice->>Bob: メッセージ送信
    Bob-->>Alice: 応答メッセージ
`;

    const result = await renderMermaidToSvg(code);

    expect(result).toContain("<svg");
    expect(result).toContain("メッセージ送信");
    expect(result).toContain("応答メッセージ");
  });

  it("Class Diagram (classDiagram) を SVG 文字列に変換する。", async () => {
    const code = `
classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    class Dog {
        +fetch()
    }
    Animal <|-- Dog
`;

    const result = await renderMermaidToSvg(code);

    expect(result).toContain("<svg");
    expect(result).toContain("Animal");
    expect(result).toContain("Dog");
  });

  it("構文エラーが発生した場合は例外を投げずエラー表示 HTML へフォールバックする。", async () => {
    const invalidCode = `
graph INVALID_SYNTAX_ERROR???
    A ===>>> B
`;

    const result = await renderMermaidToSvg(invalidCode);

    expect(result).toContain('class="md2pdf-mermaid-error"');
    expect(result).toContain("Mermaid Syntax Error");
    expect(result).toContain("INVALID_SYNTAX_ERROR");
  });

  it("MarkdownCompiler.renderAsync により Markdown 内の mermaid コードブロックが SVG に置換される。", async () => {
    const compiler = new MarkdownCompiler();
    const md = `
# Mermaid テストドキュメント

以下の図を参照してください。

\`\`\`mermaid
flowchart LR
    NodeA[ステップ A] --> NodeB[ステップ B]
\`\`\`

ドキュメントの末尾です。
`;

    const html = await compiler.renderAsync(md);

    expect(html).toContain("<h1");
    expect(html).toContain("Mermaid テストドキュメント");
    expect(html).toContain('class="md2pdf-mermaid-container"');
    expect(html).toContain("<svg");
    expect(html).toContain("ステップ A");
    expect(html).toContain("ステップ B");
    expect(html).not.toContain('class="md2pdf-mermaid-placeholder"');
  });

  it("Mermaid テーマ設定 (dark) を指定してレンダリングできる。", async () => {
    const compiler = new MarkdownCompiler();
    const md = `
\`\`\`mermaid
graph TD
    X --> Y
\`\`\`
`;

    const html = await compiler.renderAsync(md, {
      mermaid: {
        theme: "dark",
        darkMode: true,
      },
    });

    expect(html).toContain("<svg");
  });
});
