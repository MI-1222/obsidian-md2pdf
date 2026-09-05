import type { PdfLayoutSettings } from "../../settings/types";

/**
 * 印刷時共通の @media print スタイル定義。
 * 改ページ制御、要素分断防止、ダイアグラム拡縮、印刷用リセットを含む。
 */
export const BASE_PRINT_CSS = `
@media print {
  /* 印刷時カラー調整および背景印刷の強制 */
  *,
  *::before,
  *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* 画面表示用余白の解除と紙面全体への展開 */
  body {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    orphans: 3;
    widows: 3;
  }

  /* 印刷時非表示要素 */
  .no-print,
  button,
  .copy-code-button {
    display: none !important;
  }

  /* 見出し直後での改ページを防止 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    break-after: avoid-page !important;
    page-break-after: avoid !important;
    orphans: 3;
    widows: 3;
  }

  /* ブロック要素・ダイアグラムの途中改ページを防止 */
  pre,
  blockquote,
  table,
  tr,
  figure,
  .callout,
  .markdown-alert,
  .md2pdf-mermaid-container,
  .md2pdf-tikz-container,
  .md2pdf-plantuml-container {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* テーブルヘッダーおよびフッターの各ページ繰り返し表示 */
  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  /* 任意改ページ指定クラス */
  .page-break,
  .page,
  .break-after-page {
    break-after: page !important;
    page-break-after: always !important;
  }

  .break-before-page {
    break-before: page !important;
    page-break-before: always !important;
  }

  /* 段落と引用のウィドウ・オーファン制御 */
  p,
  blockquote,
  li {
    orphans: 2;
    widows: 2;
  }

  /* ダイアグラムおよび画像の紙面はみ出し防止 */
  .md2pdf-mermaid-container svg,
  .md2pdf-tikz-container svg,
  .md2pdf-plantuml-container img,
  body img {
    max-width: 100% !important;
    height: auto !important;
    page-break-inside: avoid !important;
  }
}
`;

/**
 * PDF レイアウト設定に基づいて `@page` CSS ルール文字列を動的に生成する。
 *
 * @param layoutSettings - PDF レイアウト設定。
 * @returns 生成された `@page` CSS 文字列。
 */
export function buildPageRule(layoutSettings?: Partial<PdfLayoutSettings>): string {
  /** 用紙サイズ。 */
  const format = layoutSettings?.format || "A4";
  /** ページの向き。 */
  const orientation = layoutSettings?.orientation || "portrait";
  /** 余白設定。 */
  const margin = layoutSettings?.margin || {
    top: "15mm",
    right: "15mm",
    bottom: "15mm",
    left: "15mm",
  };

  /** 上部余白。 */
  const topMargin = margin.top || "15mm";
  /** 右部余白。 */
  const rightMargin = margin.right || "15mm";
  /** 下部余白。 */
  const bottomMargin = margin.bottom || "15mm";
  /** 左部余白。 */
  const leftMargin = margin.left || "15mm";

  return `@page {
  size: ${format} ${orientation};
  margin: ${topMargin} ${rightMargin} ${bottomMargin} ${leftMargin};
}`;
}

/**
 * 印刷用 CSS (静的 `@media print` スタイルおよび動的 `@page` ルール) を統合して生成する。
 *
 * @param layoutSettings - PDF レイアウト設定。
 * @returns 統合された印刷用 CSS 文字列。
 */
export function buildPrintCss(layoutSettings?: Partial<PdfLayoutSettings>): string {
  /** 動的に構築された `@page` ルール文字列。 */
  const pageRule = buildPageRule(layoutSettings);
  return `${pageRule}\n${BASE_PRINT_CSS}`.trim();
}
