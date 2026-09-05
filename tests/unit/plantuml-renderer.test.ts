import { describe, it, expect } from "vitest";
import { MarkdownCompiler } from "@/compiler";
import {
  encodePlantUml,
  generatePlantUmlUrl,
  renderPlantUmlToHtml,
  processPlantUmlBlocks,
} from "@/compiler/renderers/plantuml";

describe("PlantUML Renderer", () => {
  const sampleCode = `
class User {
  +String name
  +login()
}
`;

  it("PlantUML コードを Deflate + 64進数文字列にエンコードする。", () => {
    const encoded = encodePlantUml(sampleCode);

    expect(encoded).toBeDefined();
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("既に @startuml と @enduml を含むコードも正常にエンコードする。", () => {
    const fullCode = `@startuml\nBob -> Alice : Hello\n@enduml`;
    const encoded = encodePlantUml(fullCode);

    expect(encoded).toBeDefined();
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("デフォルト設定で正しい SVG 画像 URL を生成する。", () => {
    const url = generatePlantUmlUrl(sampleCode);

    expect(url).toMatch(/^https:\/\/www\.plantuml\.com\/plantuml\/svg\//);
  });

  it("カスタムサーバー URL および PNG フォーマットを指定して URL を生成できる。", () => {
    const url = generatePlantUmlUrl(sampleCode, {
      serverUrl: "https://custom-puml.example.com/plantuml/",
      format: "png",
    });

    expect(url).toMatch(/^https:\/\/custom-puml\.example\.com\/plantuml\/png\//);
  });

  it("renderPlantUmlToHtml により img タグを含む HTML 要素が生成される。", () => {
    const html = renderPlantUmlToHtml(sampleCode);

    expect(html).toContain('class="md2pdf-plantuml-container"');
    expect(html).toContain('<img src="https://www.plantuml.com/plantuml/svg/');
    expect(html).toContain('alt="PlantUML Diagram"');
  });

  it("processPlantUmlBlocks により @startuml 〜 @enduml 構文が画像要素に置換される。", () => {
    const md = `
# システム構成

@startuml
Alice -> Bob : 認証要求
Bob --> Alice : 認証成功
@enduml

ドキュメントの末尾。
`;

    const processed = processPlantUmlBlocks(md);

    expect(processed).toContain('class="md2pdf-plantuml-container"');
    expect(processed).toContain('<img src="https://www.plantuml.com/plantuml/svg/');
    expect(processed).not.toContain("@startuml");
    expect(processed).not.toContain("@enduml");
  });

  it("MarkdownCompiler で ```plantuml コードブロックが画像要素に変換される。", () => {
    const compiler = new MarkdownCompiler();
    const md = `
\`\`\`plantuml
[Component A] -> [Component B]
\`\`\`
`;

    const html = compiler.render(md);

    expect(html).toContain('class="md2pdf-plantuml-container"');
    expect(html).toContain('<img src="https://www.plantuml.com/plantuml/svg/');
  });

  it("MarkdownCompiler で ```puml コードブロックが画像要素に変換される。", () => {
    const compiler = new MarkdownCompiler();
    const md = `
\`\`\`puml
actor User
User -> (Start)
\`\`\`
`;

    const html = compiler.render(md);

    expect(html).toContain('class="md2pdf-plantuml-container"');
    expect(html).toContain('<img src="https://www.plantuml.com/plantuml/svg/');
  });

  it("MarkdownCompiler.renderAsync でも PlantUML と Mermaid が両立してレンダリングされる。", async () => {
    const compiler = new MarkdownCompiler();
    const md = `
\`\`\`plantuml
Alice -> Bob : Ping
\`\`\`

\`\`\`mermaid
graph TD
    A --> B
\`\`\`
`;

    const html = await compiler.renderAsync(md);

    expect(html).toContain('class="md2pdf-plantuml-container"');
    expect(html).toContain('class="md2pdf-mermaid-container"');
    expect(html).toContain("<svg");
  });
});
