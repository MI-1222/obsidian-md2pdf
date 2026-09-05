import { AppPlatform } from "../utils/platform";
import type { DesktopPdfExportOptions, ElectronPrintToPdfOptions } from "./types";
import type { PdfLayoutSettings } from "../settings/types";

/** Electron の BrowserWindow インスタンスの最小限のインターフェース定義。 */
export interface ElectronBrowserWindowLike {
  /** ページの WebContents。 */
  webContents: {
    /** URL ロード完了イベントリスナーの登録。 */
    once(event: "did-finish-load", listener: () => void): void;
    /** ロード失敗イベントリスナーの登録。 */
    once(
      event: "did-fail-load",
      listener: (event: unknown, errorCode: number, errorDescription: string) => void
    ): void;
    /** JavaScript スクリプトの実行。 */
    executeJavaScript(code: string): Promise<unknown>;
    /** PDF 出力処理の実行。 */
    printToPDF(options: ElectronPrintToPdfOptions): Promise<Buffer | Uint8Array>;
  };
  /** 指定された URL をロードする。 */
  loadURL(url: string): Promise<void>;
  /** ウィンドウを閉じる。 */
  close(): void;
  /** ウィンドウを破棄する。 */
  destroy(): void;
}

/** Electron の BrowserWindow コンストラクタ型定義。 */
export type ElectronBrowserWindowConstructor = new (options: {
  show?: boolean;
  webPreferences?: {
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
  };
}) => ElectronBrowserWindowLike;

/**
 * Obsidian 実行環境から Electron の BrowserWindow コンストラクタを安全に取得する。
 *
 * @returns BrowserWindow コンストラクタ。取得できない場合は null。
 */
export function getElectronBrowserWindow(): ElectronBrowserWindowConstructor | null {
  /** グローバル window オブジェクト。 */
  const globalWindow = window as unknown as {
    require?: (moduleName: string) => {
      BrowserWindow?: ElectronBrowserWindowConstructor;
      remote?: { BrowserWindow?: ElectronBrowserWindowConstructor };
    };
  };

  if (typeof globalWindow.require !== "function") {
    return null;
  }

  try {
    /** @electron/remote モジュール。 */
    const remoteModule = globalWindow.require("@electron/remote");
    if (remoteModule?.BrowserWindow) {
      return remoteModule.BrowserWindow;
    }
  } catch {
    /** @electron/remote が存在しない場合のフォールバックへ進む。 */
  }

  try {
    /** electron モジュール。 */
    const electronModule = globalWindow.require("electron");
    if (electronModule?.BrowserWindow) {
      return electronModule.BrowserWindow;
    }
    if (electronModule?.remote?.BrowserWindow) {
      return electronModule.remote.BrowserWindow;
    }
  } catch {
    /** electron モジュールがロードできない場合は null を返却。 */
  }

  return null;
}

/**
 * PDF レイアウト設定に基づいて Electron の printToPDF 用オプションオブジェクトを生成する。
 *
 * @param layoutSettings - PDF レイアウト設定。
 * @returns Electron 用 printToPDF オプション。
 */
export function createElectronPrintOptions(
  layoutSettings?: Partial<PdfLayoutSettings>
): ElectronPrintToPdfOptions {
  /** 用紙フォーマット。 */
  const format = layoutSettings?.format || "A4";
  /** 横向きフラグ。 */
  const isLandscape = layoutSettings?.orientation === "landscape";
  /** 背景色印刷フラグ。 */
  const printBackground = layoutSettings?.printBackground ?? true;
  /** ヘッダー・フッター表示フラグ。 */
  const displayHeaderFooter = layoutSettings?.displayHeaderFooter ?? false;
  /** ヘッダーテンプレート。 */
  const headerTemplate = layoutSettings?.headerTemplate || "";
  /** フッターテンプレート。 */
  const footerTemplate = layoutSettings?.footerTemplate || "";

  return {
    pageSize: format,
    landscape: isLandscape,
    preferCSSPageSize: true,
    printBackground,
    margins: { marginType: "none" },
    displayHeaderFooter,
    headerTemplate,
    footerTemplate,
  };
}

/**
 * 指定ミリ秒待機するプロミスを生成する。
 *
 * @param ms - 待機ミリ秒数。
 * @returns 完了プロミス。
 */
function waitDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * デスクトップ環境 (Electron) で完全な HTML 文字列から PDF バイナリデータを生成する。
 *
 * @param htmlContent - レンダリング対象の完全な HTML ドキュメント文字列。
 * @param options - PDF エクスポートオプション。
 * @param customBrowserWindow - テスト用またはカスタムの BrowserWindow コンストラクタ (任意)。
 * @returns 生成された PDF データの Uint8Array。
 */
export async function generateDesktopPdf(
  htmlContent: string,
  options: DesktopPdfExportOptions = {},
  customBrowserWindow?: ElectronBrowserWindowConstructor
): Promise<Uint8Array> {
  if (!AppPlatform.isDesktop() && !customBrowserWindow) {
    throw new Error("デスクトップ版 PDF 生成は Obsidian デスクトップアプリでのみ実行可能です。");
  }

  /** BrowserWindow コンストラクタ。 */
  const BrowserWindowClass = customBrowserWindow || getElectronBrowserWindow();
  if (!BrowserWindowClass) {
    throw new Error(
      "Electron BrowserWindow を取得できませんでした。デスクトップ環境を確認してください。"
    );
  }

  /** 一時ロード用 URL 文字列。 */
  let loadUrl: string;
  /** Blob URL 解放が必要かどうかのフラグ。 */
  let shouldRevokeUrl = false;

  if (typeof URL.createObjectURL === "function") {
    /** HTML ドキュメントの Blob オブジェクト。 */
    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    loadUrl = URL.createObjectURL(htmlBlob);
    shouldRevokeUrl = true;
  } else {
    loadUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  }

  /** 非表示の一時 BrowserWindow インスタンス。 */
  const win = new BrowserWindowClass({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  /** タイムアウト設定ミリ秒。 */
  const timeoutMs = options.timeoutMs ?? 30000;
  /** レンダリング安定待機ミリ秒。 */
  const renderDelayMs = options.renderDelayMs ?? 200;

  try {
    /** ページロード処理の完了待機プロミス。 */
    const loadPromise = new Promise<void>((resolve, reject) => {
      /** ロード成否フラグ。 */
      let isSettled = false;

      /** タイムアウトタイマー。 */
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          reject(
            new Error(`PDF レンダリング用の HTML ロードがタイムアウトしました (${timeoutMs}ms)。`)
          );
        }
      }, timeoutMs);

      win.webContents.once("did-finish-load", () => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          resolve();
        }
      });

      win.webContents.once("did-fail-load", (_event, errorCode, errorDescription) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          reject(
            new Error(
              `HTML のロードに失敗しました (エラーコード: ${errorCode}, 説明: ${errorDescription})。`
            )
          );
        }
      });
    });

    await win.loadURL(loadUrl);
    await loadPromise;

    /** フォント読み込み完了の待機。 */
    await win.webContents
      .executeJavaScript("document.fonts.ready.then(() => true)")
      .catch(() => true);

    if (renderDelayMs > 0) {
      await waitDelay(renderDelayMs);
    }

    /** 印刷オプション。 */
    const printOptions = createElectronPrintOptions(options.layoutSettings);

    /** 出力された PDF データ。 */
    const pdfData = await win.webContents.printToPDF(printOptions);
    return new Uint8Array(pdfData);
  } finally {
    if (shouldRevokeUrl && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(loadUrl);
    }
    try {
      win.destroy();
    } catch {
      // すでに破棄済みの場合は無視。
    }
  }
}
