/** TikZ リモートレンダリングサーバーの設定。 */
export interface TikzSettings {
  /** TikZ レンダリングサーバーのエンドポイント URL。 */
  serverUrl: string;
  /** API 認証キー (任意)。 */
  apiKey: string;
  /** モバイル環境でリモートサーバーを使用するかどうか。 */
  useRemoteOnMobile: boolean;
  /** PC 環境でローカル実行に失敗した場合にリモートサーバーへフォールバックするかどうか。 */
  fallbackToRemoteOnPc: boolean;
  /** サーバー通信のタイムアウト時間 (ミリ秒)。 */
  timeoutMs: number;
}

/** PDF のページ余白設定。 */
export interface PdfMarginSettings {
  /** 上部余白 (例: '15mm', '1in')。 */
  top: string;
  /** 右側余白 (例: '15mm', '1in')。 */
  right: string;
  /** 下部余白 (例: '15mm', '1in')。 */
  bottom: string;
  /** 左側余白 (例: '15mm', '1in')。 */
  left: string;
}

/** サポートされている用紙フォーマット。 */
export type PdfPaperFormat = "A4" | "A3" | "Letter" | "Legal" | "Tabloid";

/** サポートされているページの向き。 */
export type PdfOrientation = "portrait" | "landscape";

/** PDF レイアウトおよび印刷オプション設定。 */
export interface PdfLayoutSettings {
  /** 用紙フォーマット。 */
  format: PdfPaperFormat;
  /** ページの向き。 */
  orientation: PdfOrientation;
  /** ページの余白。 */
  margin: PdfMarginSettings;
  /** 背景色や背景画像を印刷対象に含めるかどうか。 */
  printBackground: boolean;
  /** ヘッダーおよびフッターを表示するかどうか。 */
  displayHeaderFooter: boolean;
  /** ヘッダー HTML テンプレート。 */
  headerTemplate: string;
  /** フッター HTML テンプレート。 */
  footerTemplate: string;
}

/** Markdown ドキュメントのテーマ種別。 */
export type MarkdownTheme = "github-light" | "github-dark" | "tomorrow" | "default" | "custom";

/** シンタックスハイライトのテーマ種別。 */
export type HighlightTheme = "github" | "atom-one-dark" | "tomorrow" | "default";

/** ドキュメントスタイルおよびパース設定。 */
export interface StyleSettings {
  /** 適用する Markdown スタイルテーマ。 */
  theme: MarkdownTheme;
  /** コードブロックのハイライトテーマ。 */
  highlightTheme: HighlightTheme;
  /** ユーザー定義の追加カスタム CSS。 */
  customCss: string;
  /** Markdown 内の単一改行を `<br />` タグに変換するかどうか。 */
  breaks: boolean;
}

/** PlantUML レンダリング設定。 */
export interface PlantUmlSettings {
  /** PlantUML レンダリングサーバーの URL。 */
  serverUrl: string;
}

/** Google Drive 連携設定。 */
export interface GDriveSettings {
  /** Google Drive API クライアント ID。 */
  clientId: string;
  /** Google Drive API クライアントシークレット。 */
  clientSecret: string;
  /** Google Drive API リフレッシュトークン。 */
  refreshToken: string;
}

/** 外部サービス連携設定の統合インターフェース。 */
export interface IntegrationSettings {
  /** PlantUML サーバー設定。 */
  plantuml: PlantUmlSettings;
  /** Google Drive 連携設定。 */
  gdrive: GDriveSettings;
}

/** obsidian-md2pdf プラグインの全体設定インターフェース。 */
export interface Md2PdfSettings {
  /** TikZ レンダリング設定。 */
  tikz: TikzSettings;
  /** PDF レイアウト設定。 */
  pdf: PdfLayoutSettings;
  /** スタイルおよび記法設定。 */
  style: StyleSettings;
  /** 外部サービス連携設定。 */
  integrations: IntegrationSettings;
}
