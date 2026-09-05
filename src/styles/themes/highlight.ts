import type { HighlightTheme } from "../../settings/types";

/** highlight.js GitHub ライトテーマ CSS。 */
export const HIGHLIGHT_GITHUB_CSS = `
.hljs {
  color: #24292e;
  background: #f6f8fa;
}
.hljs-doctag,
.hljs-keyword,
.hljs-meta .hljs-keyword,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type,
.hljs-variable.language_ {
  color: #d73a49;
}
.hljs-title,
.hljs-title.class_,
.hljs-title.class_.inherited__,
.hljs-title.function_ {
  color: #6f42c1;
}
.hljs-attr,
.hljs-attribute,
.hljs-literal,
.hljs-meta,
.hljs-number,
.hljs-operator,
.hljs-selector-attr,
.hljs-selector-class,
.hljs-selector-id,
.hljs-variable {
  color: #005cc5;
}
.hljs-meta .hljs-string,
.hljs-regexp,
.hljs-string {
  color: #032f62;
}
.hljs-built_in,
.hljs-symbol {
  color: #e36209;
}
.hljs-code,
.hljs-comment,
.hljs-formula {
  color: #6a737d;
  font-style: italic;
}
.hljs-name,
.hljs-quote,
.hljs-selector-pseudo,
.hljs-selector-tag {
  color: #22863a;
}
.hljs-subst {
  color: #24292e;
}
.hljs-section {
  color: #005cc5;
  font-weight: 700;
}
.hljs-bullet {
  color: #735c0f;
}
.hljs-emphasis {
  font-style: italic;
}
.hljs-strong {
  font-weight: 700;
}
.hljs-addition {
  color: #22863a;
  background-color: #f0fff4;
}
.hljs-deletion {
  color: #b31d28;
  background-color: #ffeef0;
}
`;

/** highlight.js Atom One Dark テーマ CSS。 */
export const HIGHLIGHT_ATOM_ONE_DARK_CSS = `
.hljs {
  color: #abb2bf;
  background: #282c34;
}
.hljs-comment,
.hljs-quote {
  color: #5c6370;
  font-style: italic;
}
.hljs-doctag,
.hljs-keyword,
.hljs-formula {
  color: #c678dd;
}
.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
  color: #e06c75;
}
.hljs-literal {
  color: #56b6c2;
}
.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
  color: #98c379;
}
.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
  color: #e5c07b;
}
.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
  color: #d19a66;
}
.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
  color: #61afef;
}
.hljs-emphasis {
  font-style: italic;
}
.hljs-strong {
  font-weight: bold;
}
.hljs-link {
  text-decoration: underline;
}
`;

/** highlight.js Tomorrow テーマ CSS。 */
export const HIGHLIGHT_TOMORROW_CSS = `
.hljs {
  color: #4d4d4c;
  background: #f8f8f8;
}
.hljs-comment,
.hljs-quote {
  color: #8e908c;
  font-style: italic;
}
.hljs-variable,
.hljs-template-variable,
.hljs-tag,
.hljs-name,
.hljs-selector-id,
.hljs-selector-class,
.hljs-regexp,
.hljs-deletion {
  color: #c82829;
}
.hljs-number,
.hljs-built_in,
.hljs-literal,
.hljs-type,
.hljs-params,
.hljs-meta,
.hljs-link {
  color: #f5871f;
}
.hljs-attribute {
  color: #eab700;
}
.hljs-string,
.hljs-symbol,
.hljs-bullet,
.hljs-addition {
  color: #718c00;
}
.hljs-title,
.hljs-section {
  color: #4271ae;
}
.hljs-keyword,
.hljs-selector-tag {
  color: #8959a8;
}
.hljs-emphasis {
  font-style: italic;
}
.hljs-strong {
  font-weight: bold;
}
`;

/** シンタックスハイライトテーマ種別に応じた CSS 文字列の定義マップ。 */
export const HIGHLIGHT_THEMES: Record<HighlightTheme, string> = {
  github: HIGHLIGHT_GITHUB_CSS,
  "atom-one-dark": HIGHLIGHT_ATOM_ONE_DARK_CSS,
  tomorrow: HIGHLIGHT_TOMORROW_CSS,
  default: HIGHLIGHT_GITHUB_CSS,
};
