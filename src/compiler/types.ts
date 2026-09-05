/**
 * Mermaid レンダラーのオプション設定。
 */
export interface MermaidRenderOptions {
  /**
   * Mermaid のカラーテーマ。
   * @default 'default'
   */
  theme?: "default" | "dark" | "forest" | "neutral" | "base";

  /**
   * ダークモードを適用するかどうか。
   * @default false
   */
  darkMode?: boolean;
}

/**
 * MarkdownCompiler の初期化およびコンパイル時オプション。
 */
export interface MarkdownCompilerOptions {
  /**
   * Markdown 内の単一改行を <br> タグに変換するかどうか。
   * @default false
   */
  breaks?: boolean;

  /**
   * HTML タグの入力を許可するかどうか。
   * @default true
   */
  html?: boolean;

  /**
   * URL テキストを自動的にハイパーリンクに変換するかどうか。
   * @default true
   */
  linkify?: boolean;

  /**
   * 引用符やダッシュなどのタイポグラフィ整形を有効にするかどうか。
   * @default true
   */
  typographer?: boolean;

  /**
   * ファイルインクルードのルートディレクトリまたは基準パス。
   */
  currentFilePath?: string;

  /**
   * ファイルインクルード時のカスタムファイルリーダー関数。
   * Obsidian Vault やファイルシステムからの読み込みを差し替え可能にする。
   */
  fileReader?: (path: string) => string;

  /**
   * Mermaid レンダリング設定オプション。
   */
  mermaid?: MermaidRenderOptions;
}

/**
 * Markdown コンパイル結果。
 */
export interface RenderResult {
  /**
   * 変換された HTML 文字列。
   */
  html: string;
}
