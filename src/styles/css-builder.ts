import { BASE_THEME_CSS } from "./themes/base";
import { MARKDOWN_THEMES } from "./themes/markdown";
import { HIGHLIGHT_THEMES } from "./themes/highlight";
import { buildPrintCss } from "./themes/print";
import type { PdfLayoutSettings, StyleSettings } from "../settings/types";

/** HTML ドキュメント構築オプション。 */
export interface HtmlDocumentOptions {
  /** ドキュメントのタイトル (<title> に反映)。 */
  title?: string;
  /** ドキュメントスタイル設定。 */
  styleSettings?: Partial<StyleSettings>;
  /** PDF レイアウトおよび用紙・余白設定。 */
  layoutSettings?: Partial<PdfLayoutSettings>;
  /** 追加で直接注入するカスタム CSS 文字列。 */
  additionalCss?: string;
  /** <head> タグ内に直接追加挿入する HTML 文字列。 */
  customHead?: string;
}

/**
 * CSS 文字列内の </style> タグをエスケープする。
 *
 * @param css - エスケープ対象の CSS 文字列。
 * @returns エスケープされた CSS 文字列。
 */
export function escapeCssForStyle(css: string): string {
  return css.replace(/<\/style/gi, "<\\/style");
}

/**
 * HTML 特殊文字をエスケープする。
 *
 * @param text - エスケープ対象の文字列。
 * @returns エスケープされた文字列。
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
 * スタイル設定および PDF レイアウト設定に基づいて統合された CSS 文字列を生成する。
 * ベース CSS、Markdown テーマ、ハイライトテーマ、ユーザーカスタム CSS、印刷スタイル (`@page`, `@media print`) を順にマージする。
 *
 * @param settings - スタイル設定オブジェクト。
 * @param layoutSettings - PDF レイアウト設定オブジェクト。
 * @returns 統合された CSS 文字列。
 */
export function buildThemeCss(
  settings: Partial<StyleSettings> = {},
  layoutSettings?: Partial<PdfLayoutSettings>
): string {
  /** 適用する Markdown テーマ種別。 */
  const themeName = settings.theme || "github-light";
  /** 適用するハイライトテーマ種別。 */
  const highlightThemeName = settings.highlightTheme || "github";

  /** Markdown テーマ CSS。 */
  const markdownThemeCss = MARKDOWN_THEMES[themeName] ?? MARKDOWN_THEMES["github-light"];
  /** シンタックスハイライト CSS。 */
  const highlightThemeCss = HIGHLIGHT_THEMES[highlightThemeName] ?? HIGHLIGHT_THEMES["github"];
  /** ユーザー定義カスタム CSS。 */
  const customCss = settings.customCss
    ? `\n/* --- User Custom CSS --- */\n${settings.customCss}\n`
    : "";
  /** 印刷用 CSS (`@page` ルールおよび `@media print` スタイル)。 */
  const printCss = buildPrintCss(layoutSettings);

  /** 結合済み CSS。 */
  const combinedCss =
    `${BASE_THEME_CSS}\n${markdownThemeCss}\n${highlightThemeCss}\n${customCss}\n${printCss}`.trim();
  return combinedCss;
}

/**
 * レンダリング済み HTML 本文とスタイルを統合し、完全なスタンドアロン HTML ドキュメントを構築する。
 *
 * @param bodyContent - レンダリング済みの HTML 本文文字列。
 * @param options - HTML ドキュメント構築オプション。
 * @returns 完全な HTML ドキュメント文字列。
 */
export function generateHtmlDocument(
  bodyContent: string,
  options: HtmlDocumentOptions = {}
): string {
  /** ドキュメントタイトル。 */
  const title = options.title ? escapeHtml(options.title) : "Document";
  /** 統合 CSS 文字列。 */
  const themeCss = buildThemeCss(options.styleSettings, options.layoutSettings);
  /** 追加 CSS 文字列。 */
  const additionalCss = options.additionalCss ? `\n${options.additionalCss}` : "";
  /** 安全にエスケープされたスタイル定義。 */
  const fullStyle = escapeCssForStyle(`${themeCss}${additionalCss}`);
  /** 追加の <head> 要素。 */
  const customHead = options.customHead ? `\n    ${options.customHead}` : "";

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
${fullStyle}
    </style>${customHead}
  </head>
  <body>
${bodyContent}
  </body>
</html>`;
}
