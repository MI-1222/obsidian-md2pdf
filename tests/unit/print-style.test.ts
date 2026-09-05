import { describe, it, expect } from "vitest";
import { BASE_PRINT_CSS, buildPageRule, buildPrintCss } from "../../src/styles/themes/print";
import type { PdfLayoutSettings } from "../../src/settings/types";

describe("Print Styles & @page Rules", () => {
  describe("BASE_PRINT_CSS", () => {
    it("印刷時のカラー調整 (-webkit-print-color-adjust) が設定されている。", () => {
      expect(BASE_PRINT_CSS).toContain("-webkit-print-color-adjust: exact !important;");
      expect(BASE_PRINT_CSS).toContain("print-color-adjust: exact !important;");
    });

    it("改ページ制御ルール (break-after, break-inside, page-break-after) が含まれている。", () => {
      /** 見出し直後の改ページ回避。 */
      expect(BASE_PRINT_CSS).toContain("break-after: avoid-page !important;");
      expect(BASE_PRINT_CSS).toContain("page-break-after: avoid !important;");

      /** ブロック要素の途中改ページ回避。 */
      expect(BASE_PRINT_CSS).toContain("break-inside: avoid !important;");
      expect(BASE_PRINT_CSS).toContain("page-break-inside: avoid !important;");

      /** 改ページ指定クラス。 */
      expect(BASE_PRINT_CSS).toContain(".page-break");
      expect(BASE_PRINT_CSS).toContain(".page");
      expect(BASE_PRINT_CSS).toContain(".break-after-page");
      expect(BASE_PRINT_CSS).toContain("break-after: page !important;");
    });

    it("ダイアグラムと画像の紙面はみ出し防止 (max-width: 100%) が設定されている。", () => {
      expect(BASE_PRINT_CSS).toContain(".md2pdf-mermaid-container svg");
      expect(BASE_PRINT_CSS).toContain(".md2pdf-tikz-container svg");
      expect(BASE_PRINT_CSS).toContain(".md2pdf-plantuml-container img");
      expect(BASE_PRINT_CSS).toContain("max-width: 100% !important;");
      expect(BASE_PRINT_CSS).toContain("height: auto !important;");
    });

    it("印刷時の不要要素 (.no-print, button) が非表示に設定されている。", () => {
      expect(BASE_PRINT_CSS).toContain(".no-print");
      expect(BASE_PRINT_CSS).toContain("display: none !important;");
    });
  });

  describe("buildPageRule", () => {
    it("未指定時はデフォルト (A4, portrait, 15mm 余白) の @page ルールを生成する。", () => {
      /** 生成された `@page` ルール文字列。 */
      const rule = buildPageRule();

      expect(rule).toContain("@page {");
      expect(rule).toContain("size: A4 portrait;");
      expect(rule).toContain("margin: 15mm 15mm 15mm 15mm;");
    });

    it("カスタム用紙設定 (Letter, landscape, 各種余白) が反映される。", () => {
      /** カスタムレイアウト設定。 */
      const layout: Partial<PdfLayoutSettings> = {
        format: "Letter",
        orientation: "landscape",
        margin: {
          top: "20mm",
          right: "10mm",
          bottom: "25mm",
          left: "10mm",
        },
      };

      /** 生成された `@page` ルール文字列。 */
      const rule = buildPageRule(layout);

      expect(rule).toContain("size: Letter landscape;");
      expect(rule).toContain("margin: 20mm 10mm 25mm 10mm;");
    });
  });

  describe("buildPrintCss", () => {
    it("@page ルールと BASE_PRINT_CSS が結合されて出力される。", () => {
      /** 生成された印刷用 CSS 文字列。 */
      const css = buildPrintCss({ format: "A3", orientation: "portrait" });

      expect(css).toContain("size: A3 portrait;");
      expect(css).toContain("@media print {");
      expect(css).toContain("-webkit-print-color-adjust: exact !important;");
    });
  });
});
