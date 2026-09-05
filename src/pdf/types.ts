import type { PdfLayoutSettings } from "../settings/types";

/** Electron の printToPDF に渡すマージン設定。 */
export interface ElectronMargins {
  /** マージン種別 ('default' | 'none' | 'printableArea' | 'custom')。 */
  marginType?: "default" | "none" | "printableArea" | "custom";
  /** 上部余白 (インチ単位)。 */
  top?: number;
  /** 下部余白 (インチ単位)。 */
  bottom?: number;
  /** 左部余白 (インチ単位)。 */
  left?: number;
  /** 右部余白 (インチ単位)。 */
  right?: number;
}

/** Electron の webContents.printToPDF に渡すオプション。 */
export interface ElectronPrintToPdfOptions {
  /** 用紙サイズ ('A4', 'Letter' など、または幅・高さの指定)。 */
  pageSize?: string | { width: number; height: number };
  /** 横向き印刷にするかどうか。 */
  landscape?: boolean;
  /** 背景色・背景画像を印刷するかどうか。 */
  printBackground?: boolean;
  /** マージン設定。 */
  margins?: ElectronMargins;
  /** CSS の @page で定義された用紙サイズを優先するかどうか。 */
  preferCSSPageSize?: boolean;
  /** ヘッダーおよびフッターを表示するかどうか。 */
  displayHeaderFooter?: boolean;
  /** ヘッダー HTML テンプレート。 */
  headerTemplate?: string;
  /** フッター HTML テンプレート。 */
  footerTemplate?: string;
}

/** デスクトップ版 PDF 生成オプション。 */
export interface DesktopPdfExportOptions {
  /** PDF レイアウト設定。 */
  layoutSettings?: Partial<PdfLayoutSettings>;
  /** ページのレンダリング待機タイムアウト時間 (ミリ秒)。 */
  timeoutMs?: number;
  /** レンダリング安定のための待機ディレイ時間 (ミリ秒)。 */
  renderDelayMs?: number;
}
