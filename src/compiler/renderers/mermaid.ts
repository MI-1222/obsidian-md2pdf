import mermaid from "mermaid";
import type { MermaidRenderOptions } from "../types";

/**
 * 一意な Mermaid 要素 ID を生成するためのカウンター。
 */
let mermaidCounter = 0;

/**
 * Mermaid 初期化済みフラグと最後に適用されたテーマ。
 */
let lastAppliedTheme: string | null = null;

/**
 * HTML 特殊文字をエスケープする。
 *
 * @param text - エスケープ対象の文字列。
 * @returns エスケープされた HTML 文字列。
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Mermaid ライブラリを設定オプションで初期化する。
 *
 * @param options - Mermaid レンダラー設定オプション。
 */
export function initializeMermaid(options: MermaidRenderOptions = {}): void {
  const theme = options.theme ?? (options.darkMode ? "dark" : "default");

  if (lastAppliedTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme,
      fontFamily: "inherit",
    });
    lastAppliedTheme = theme;
  }
}

/**
 * Mermaid コード文字列をインプロセスでレンダリングし、SVG 文字列を生成する。
 * 構文エラー等が発生した場合はクラッシュせず、エラーメッセージ付きのコードブロックを返す。
 *
 * @param code - 描画対象の Mermaid ダイアグラムコード。
 * @param options - レンダリングオプション。
 * @returns SVG 文字列またはエラー表示 HTML。
 */
export async function renderMermaidToSvg(
  code: string,
  options: MermaidRenderOptions = {}
): Promise<string> {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return "";
  }

  initializeMermaid(options);

  const containerId = `md2pdf-mermaid-${Date.now()}-${++mermaidCounter}`;

  try {
    const { svg } = await mermaid.render(containerId, trimmedCode);
    return `<div class="md2pdf-mermaid-container" align="center">${svg}</div>`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[obsidian-md2pdf] Mermaid render error: ${errorMessage}`);

    // エラー時は元のコードブロックとエラー警告を安全にフォールバック表示
    return `<div class="md2pdf-mermaid-error" style="border: 1px solid #f85149; border-radius: 6px; padding: 12px; margin: 12px 0; background-color: rgba(248, 81, 73, 0.1);">
  <div style="color: #f85149; font-weight: bold; margin-bottom: 8px;">Mermaid Syntax Error: ${escapeHtml(errorMessage)}</div>
  <pre><code class="language-mermaid">${escapeHtml(trimmedCode)}</code></pre>
</div>`;
  }
}

/**
 * HTML 内に含まれる Mermaid プレースホルダーを非同期に検出し、生成された SVG で置換する。
 *
 * @param html - プレースホルダーを含む HTML 文字列。
 * @param options - Mermaid レンダリングオプション。
 * @returns Mermaid が SVG に置換された後の HTML 文字列。
 */
export async function processMermaidPlaceholders(
  html: string,
  options: MermaidRenderOptions = {}
): Promise<string> {
  const placeholderRegex =
    /<div\s+class="md2pdf-mermaid-placeholder"\s+data-code="([^"]+)">[\s\S]*?<\/div>/g;

  const matches = Array.from(html.matchAll(placeholderRegex));
  if (matches.length === 0) {
    return html;
  }

  let resultHtml = html;

  for (const match of matches) {
    const fullTag = match[0];
    const encodedCode = match[1];
    const decodedCode = decodeURIComponent(encodedCode);

    const svgHtml = await renderMermaidToSvg(decodedCode, options);
    resultHtml = resultHtml.replace(fullTag, svgHtml);
  }

  return resultHtml;
}
