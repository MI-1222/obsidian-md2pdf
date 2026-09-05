import { describe, it, expect } from "vitest";
import {
  buildThemeCss,
  generateHtmlDocument,
  escapeCssForStyle,
} from "../../src/styles/css-builder";

describe("CSS Builder & HTML Document Generator", () => {
  describe("buildThemeCss", () => {
    it("未指定時はデフォルトのベース CSS、GitHub Light、GitHub ハイライトが結合される。", () => {
      /** 生成された CSS 文字列。 */
      const css = buildThemeCss();

      expect(css).toContain("md2pdf-mermaid-container");
      expect(css).toContain("md2pdf-tikz-container");
      expect(css).toContain("markdown-alert-warning");
      expect(css).toContain(".hljs");
    });

    it("theme: 'github-dark' 指定時にダークモードスタイルが適用される。", () => {
      /** 生成された CSS 文字列。 */
      const css = buildThemeCss({ theme: "github-dark" });

      expect(css).toContain("#0d1117");
      expect(css).toContain("#c9d1d9");
    });

    it("theme: 'tomorrow' 指定時に Tomorrow スタイルが適用される。", () => {
      /** 生成された CSS 文字列。 */
      const css = buildThemeCss({ theme: "tomorrow" });

      expect(css).toContain("#4d4d4c");
      expect(css).toContain("#c82829");
    });

    it("highlightTheme: 'atom-one-dark' 指定時に Atom One Dark スタイルが適用される。", () => {
      /** 生成された CSS 文字列。 */
      const css = buildThemeCss({ highlightTheme: "atom-one-dark" });

      expect(css).toContain("#abb2bf");
      expect(css).toContain("#282c34");
    });

    it("ユーザー定義の customCss が末尾に正しく追加される。", () => {
      /** 追加カスタム CSS。 */
      const customCss = ".my-custom-class { font-size: 20px; }";
      /** 生成された CSS 文字列。 */
      const css = buildThemeCss({ customCss });

      expect(css).toContain("User Custom CSS");
      expect(css).toContain(".my-custom-class { font-size: 20px; }");
    });
  });

  describe("escapeCssForStyle", () => {
    it("</style> タグが安全にエスケープされる。", () => {
      /** 入力 CSS 文字列。 */
      const input = "body { color: red; } </style><script>alert(1)</script>";
      /** エスケープ後 CSS 文字列。 */
      const escaped = escapeCssForStyle(input);

      expect(escaped).toContain("<\\/style>");
      expect(escaped).not.toContain("</style>");
    });
  });

  describe("generateHtmlDocument", () => {
    it("完全な HTML ドキュメント構造を生成し、指定したタイトルと本文を含む。", () => {
      /** 本文 HTML。 */
      const bodyContent = "<h1>Test Document</h1><p>Hello World</p>";
      /** 生成された HTML ドキュメント。 */
      const html = generateHtmlDocument(bodyContent, {
        title: "My PDF Export",
        styleSettings: { theme: "github-light" },
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<html lang="ja">');
      expect(html).toContain("<title>My PDF Export</title>");
      expect(html).toContain("<style>");
      expect(html).toContain("<h1>Test Document</h1>");
      expect(html).toContain("</body>");
    });

    it("タイトル内の特殊文字が安全にエスケープされる。", () => {
      /** 生成された HTML ドキュメント。 */
      const html = generateHtmlDocument("<p>content</p>", {
        title: "<Script> & 'Title'",
      });

      expect(html).toContain("<title>&lt;Script&gt; &amp; &#039;Title&#039;</title>");
    });

    it("customHead が <head> タグ内に挿入される。", () => {
      /** 生成された HTML ドキュメント。 */
      const html = generateHtmlDocument("<p>content</p>", {
        customHead: '<link rel="stylesheet" href="custom.css" />',
      });

      expect(html).toContain('<link rel="stylesheet" href="custom.css" />');
    });

    it("layoutSettings が渡された場合に @page ルールが HTML 内のスタイルに反映される。", () => {
      /** 生成された HTML ドキュメント。 */
      const html = generateHtmlDocument("<p>content</p>", {
        layoutSettings: {
          format: "A3",
          orientation: "landscape",
          margin: { top: "30mm", right: "20mm", bottom: "30mm", left: "20mm" },
        },
      });

      expect(html).toContain("size: A3 landscape;");
      expect(html).toContain("margin: 30mm 20mm 30mm 20mm;");
      expect(html).toContain("@media print");
    });
  });
});
