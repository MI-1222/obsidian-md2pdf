import type { MarkdownTheme } from "../../settings/types";

/** GitHub Light テーマ CSS。 */
export const GITHUB_LIGHT_THEME_CSS = `
body {
  color: #24292e;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "BIZ UDPGothic", Meiryo, sans-serif;
}

body h1, body h2 {
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

body h1 { font-size: 2em; }
body h2 { font-size: 1.5em; }
body h3 { font-size: 1.25em; }
body h4 { font-size: 1em; }
body h5 { font-size: 0.875em; }
body h6 { font-size: 0.85em; color: #6a737d; }

body code {
  background-color: rgba(27, 31, 35, 0.05);
  color: #24292e;
}

body pre {
  background-color: #f6f8fa;
}

body blockquote {
  color: #6a737d;
  border-left-color: #dfe2e5;
}

body a {
  color: #0366d6;
  text-decoration: none;
}
body a:hover {
  text-decoration: underline;
}
`;

/** GitHub Dark テーマ CSS。 */
export const GITHUB_DARK_THEME_CSS = `
body {
  color: #c9d1d9;
  background-color: #0d1117;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "BIZ UDPGothic", Meiryo, sans-serif;
}

body h1, body h2 {
  padding-bottom: 0.3em;
  border-bottom: 1px solid #21262d;
}

body h1 { font-size: 2em; }
body h2 { font-size: 1.5em; }
body h3 { font-size: 1.25em; }
body h4 { font-size: 1em; }
body h5 { font-size: 0.875em; }
body h6 { font-size: 0.85em; color: #8b949e; }

body table th, body table td {
  border-color: #30363d;
}

body table tr {
  background-color: #0d1117;
  border-top-color: #21262d;
}

body table tr:nth-child(2n) {
  background-color: #161b22;
}

body code {
  background-color: rgba(110, 118, 129, 0.4);
  color: #c9d1d9;
}

body pre {
  background-color: #161b22;
}

body blockquote {
  color: #8b949e;
  border-left-color: #30363d;
}

body a {
  color: #58a6ff;
  text-decoration: none;
}
body a:hover {
  text-decoration: underline;
}
`;

/** Tomorrow テーマ CSS。 */
export const TOMORROW_THEME_CSS = `
body {
  color: #4d4d4c;
  background-color: #ffffff;
  font-family: "Helvetica Neue", Helvetica, Arial, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif;
}

body h1, body h2, body h3, body h4, body h5, body h6 {
  color: #1d1f21;
}

body h1 {
  font-size: 2em;
  border-bottom: 1px solid #efefef;
  padding-bottom: 0.3em;
}

body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #efefef;
  padding-bottom: 0.3em;
}

body code {
  background-color: #f5f5f5;
  color: #c82829;
}

body pre {
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
}

body blockquote {
  color: #8e908c;
  border-left-color: #d6d6d6;
}

body a {
  color: #4271ae;
}
`;

/** Markdown テーマ種別に応じた CSS 文字列の定義マップ。 */
export const MARKDOWN_THEMES: Record<MarkdownTheme, string> = {
  "github-light": GITHUB_LIGHT_THEME_CSS,
  "github-dark": GITHUB_DARK_THEME_CSS,
  tomorrow: TOMORROW_THEME_CSS,
  default: GITHUB_LIGHT_THEME_CSS,
  custom: "",
};
