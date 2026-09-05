import plantumlEncoder from "plantuml-encoder";
import type { PlantUmlRenderOptions } from "../types";

/**
 * デフォルトの PlantUML サーバー URL。
 */
const DEFAULT_PLANTUML_SERVER = "https://www.plantuml.com/plantuml";

/**
 * PlantUML ソースコードをサーバー連携用の URL エンコード文字列 (Deflate + 64進数) に変換する。
 * `@startuml` / `@enduml` タグが含まれていない場合は自動的に付与する。
 *
 * @param code - 変換対象の PlantUML ソースコード。
 * @returns エンコードされた文字列。
 */
export function encodePlantUml(code: string): string {
  let trimmed = code.trim();
  if (!trimmed.startsWith("@startuml")) {
    trimmed = `@startuml\n${trimmed}`;
  }
  if (!trimmed.endsWith("@enduml")) {
    trimmed = `${trimmed}\n@enduml`;
  }
  return plantumlEncoder.encode(trimmed);
}

/**
 * PlantUML ソースコードおよび設定からレンダリング用画像 URL を生成する。
 *
 * @param code - 描画対象の PlantUML ソースコード。
 * @param options - PlantUML レンダラー設定オプション。
 * @returns 生成された画像 URL (SVG または PNG)。
 */
export function generatePlantUmlUrl(code: string, options: PlantUmlRenderOptions = {}): string {
  const serverUrl = (options.serverUrl || DEFAULT_PLANTUML_SERVER).replace(/\/+$/, "");
  const format = options.format || "svg";
  const encoded = encodePlantUml(code);

  return `${serverUrl}/${format}/${encoded}`;
}

/**
 * PlantUML コードから HTML 画像要素文字列を生成する。
 *
 * @param code - 描画対象の PlantUML ソースコード。
 * @param options - PlantUML レンダラー設定オプション。
 * @returns レンダリング用 HTML 文字列。
 */
export function renderPlantUmlToHtml(code: string, options: PlantUmlRenderOptions = {}): string {
  const imageUrl = generatePlantUmlUrl(code, options);
  return `<div class="md2pdf-plantuml-container" align="center"><img src="${imageUrl}" alt="PlantUML Diagram" /></div>`;
}

/**
 * Markdown 文字列内に含まれる `@startuml` 〜 `@enduml` ブロックを検出し、HTML 画像要素に置換する。
 *
 * @param markdown - 入力 Markdown 文字列。
 * @param options - PlantUML レンダラー設定オプション。
 * @returns 置換後の Markdown 文字列。
 */
export function processPlantUmlBlocks(
  markdown: string,
  options: PlantUmlRenderOptions = {}
): string {
  const plantumlRegex = /@startuml([\s\S]*?)@enduml/gi;

  return markdown.replace(plantumlRegex, (match) => {
    return `\n${renderPlantUmlToHtml(match, options)}\n`;
  });
}
