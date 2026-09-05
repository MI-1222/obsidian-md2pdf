/**
 * 全テーマ共通のベース CSS スタイル定義。
 * リセット、共通レイアウト、テーブル、ダイアグラムコンテナ、GFM アラート等を含む。
 */
export const BASE_THEME_CSS = `
/* 1. 基本レイアウト */
body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
  line-height: 1.7;
  letter-spacing: 0.05em;
  word-wrap: break-word;
}

@media (max-width: 767px) {
  body {
    padding: 15px;
  }
}

/* 2. 見出し共通 */
body h1,
body h2,
body h3,
body h4,
body h5,
body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

/* 3. テーブル共通 */
body table {
  display: table;
  width: 100%;
  overflow: auto;
  border-spacing: 0;
  border-collapse: collapse;
  margin-top: 0;
  margin-bottom: 16px;
}

body table th {
  font-weight: 600;
}

body table th,
body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

body table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

/* 4. コードブロック共通 */
body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
}

body pre {
  word-wrap: normal;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  border-radius: 3px;
}

body pre code {
  display: inline;
  max-width: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

/* 5. 段落およびリスト要素 */
body p,
body blockquote,
body ul,
body ol,
body dl,
body table,
body pre {
  margin-top: 0;
  margin-bottom: 16px;
}

body blockquote {
  padding: 0 1em;
  border-left: 0.25em solid #dfe2e5;
}

body hr {
  border: 0;
  border-top: 1px solid #eaecef;
  margin: 24px 0;
}

/* 6. チェックボックスリスト */
li:has(input[type="checkbox"]) {
  list-style-type: none !important;
}

/* 7. GFM アラート */
div.markdown-alert {
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
}

div.markdown-alert > p.markdown-alert-title {
  font-weight: 700;
}

div.markdown-alert > p.markdown-alert-title > svg {
  vertical-align: text-top;
  margin-right: 6px;
}

.markdown-alert-warning {
  background-color: rgba(255, 243, 205, 0.5);
}
.markdown-alert-warning > p.markdown-alert-title {
  color: #9a6700;
}

.markdown-alert-note {
  background-color: rgba(222, 235, 255, 0.5);
}
.markdown-alert-note > p.markdown-alert-title {
  color: #0969da;
}

.markdown-alert-tip {
  background-color: rgba(219, 247, 226, 0.5);
}
div.markdown-alert.markdown-alert-tip > p.markdown-alert-title {
  color: #1a7f37;
}

.markdown-alert-important {
  background-color: rgba(233, 222, 255, 0.5);
}
.markdown-alert-important > p.markdown-alert-title {
  color: #8250df;
}

.markdown-alert-caution {
  background-color: rgba(255, 226, 226, 0.5);
}
.markdown-alert-caution > p.markdown-alert-title {
  color: #d1242f;
}

/* 8. ダイアグラムコンテナ (TikZ / Mermaid / PlantUML) */
.md2pdf-mermaid-container,
.md2pdf-tikz-container,
.md2pdf-plantuml-container {
  text-align: center;
  margin: 1.5em auto;
  max-width: 100%;
  overflow-x: auto;
}

.md2pdf-mermaid-container svg,
.md2pdf-tikz-container svg,
.md2pdf-plantuml-container img {
  max-width: 100%;
  height: auto;
  display: inline-block;
}

.md2pdf-tikz-error,
.md2pdf-mermaid-error {
  border: 1px solid #f85149;
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
  background-color: rgba(248, 81, 73, 0.1);
  text-align: left;
}

.md2pdf-error-log {
  color: #f85149;
  font-weight: bold;
  margin-bottom: 8px;
}

/* 9. 画像 */
body img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}
`;
