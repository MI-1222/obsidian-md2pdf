import { normalizePath, type App } from "obsidian";
import { resolveUniquePath, PdfNotifier, type SavePdfOptions } from "./pdf-saver";

/** モバイル印刷オプション。 */
export interface MobilePrintOptions {
  /** 印刷前の待機時間 (ミリ秒)。 */
  renderDelayMs?: number;
  /** 印刷完了後の iframe クリーンアップ遅延時間 (ミリ秒)。 */
  cleanupDelayMs?: number;
}

/**
 * モバイル環境において、非表示の iframe を用いて HTML を読み込み、OS の印刷ダイアログ (AirPrint / PDF 印刷) を起動する。
 *
 * @param htmlContent - レンダリング対象の完全な HTML 文字列。
 * @param options - モバイル印刷オプション。
 * @returns 印刷ダイアログの呼び出し完了プロミス。
 */
export async function printMobileDocument(
  htmlContent: string,
  options: MobilePrintOptions = {}
): Promise<void> {
  /** レンダリング待機ミリ秒。 */
  const renderDelayMs = options.renderDelayMs ?? 300;
  /** クリーンアップ待機ミリ秒。 */
  const cleanupDelayMs = options.cleanupDelayMs ?? 1000;

  /** 一時 iframe 要素。 */
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  /** クリーンアップ関数。 */
  const cleanup = (): void => {
    try {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    } catch {
      /** すでに削除済みの場合は無視。 */
    }
  };

  try {
    /** iframe の document オブジェクト。 */
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error("印刷用 iframe の document にアクセスできませんでした。");
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    /** フォント読み込み完了の待機。 */
    if (iframe.contentWindow?.document?.fonts?.ready) {
      await iframe.contentWindow.document.fonts.ready.catch(() => true);
    }

    if (renderDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, renderDelayMs));
    }

    /** 印刷イベントリスナーの設定。 */
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = () => {
        cleanup();
      };
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }

    /** 念のためのフォールバッククリーンアップタイマー。 */
    setTimeout(cleanup, cleanupDelayMs + 5000);
  } catch (error) {
    cleanup();
    throw error;
  }
}

/**
 * モバイル環境用に完全なスタンドアロン HTML ファイルを Vault 内へ保存する。
 *
 * @param app - Obsidian App インスタンス。
 * @param vaultRelativePath - Vault 内の保存先パス (拡張子 .html)。
 * @param htmlContent - 保存する HTML 文字列。
 * @param options - 保存オプション。
 * @returns 実際に保存された Vault 内相対パス。
 */
export async function saveMobileHtmlToVault(
  app: App,
  vaultRelativePath: string,
  htmlContent: string,
  options: SavePdfOptions = {}
): Promise<string> {
  /** DataAdapter インスタンス。 */
  const adapter = app.vault.adapter;
  /** 上書きフラグ。 */
  const overwrite = options.overwrite ?? false;
  /** 通知表示フラグ。 */
  const showNotice = options.showNotice ?? true;

  /** 解決後の保存先パス。 */
  let targetPath = normalizePath(vaultRelativePath);

  if (!overwrite) {
    targetPath = await resolveUniquePath(targetPath, async (p) => adapter.exists(p));
  }

  /** 親ディレクトリパス。 */
  const lastSlashIndex = targetPath.lastIndexOf("/");
  if (lastSlashIndex > 0) {
    /** ディレクトリパス。 */
    const parentDir = targetPath.slice(0, lastSlashIndex);
    /** ディレクトリ存在確認。 */
    const dirExists = await adapter.exists(parentDir);
    if (!dirExists) {
      await adapter.mkdir(parentDir);
    }
  }

  try {
    await adapter.write(targetPath, htmlContent);
    if (showNotice) {
      PdfNotifier.success(targetPath);
    }
    return targetPath;
  } catch (error) {
    if (showNotice) {
      PdfNotifier.error(error);
    }
    throw error;
  }
}
