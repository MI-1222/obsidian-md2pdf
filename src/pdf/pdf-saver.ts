import { Notice, normalizePath, type App } from "obsidian";
import { assertValidPdfData } from "./pdf-validator";

/** PDF 保存オプション。 */
export interface SavePdfOptions {
  /** 既存ファイルが存在する場合に上書きするかどうか (false の場合は連番を付与)。 */
  overwrite?: boolean;
  /** 保存完了・エラー通知を表示するかどうか。 */
  showNotice?: boolean;
}

/**
 * ファイル名と拡張子を分離する。
 *
 * @param filename - 対象のファイル名 (例: 'MyNote.pdf')。
 * @returns ベース名と拡張子のタプル。
 */
export function splitFilename(filename: string): { base: string; ext: string } {
  /** 最後のドット位置。 */
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return { base: filename, ext: "" };
  }
  return {
    base: filename.slice(0, lastDotIndex),
    ext: filename.slice(lastDotIndex),
  };
}

/**
 * 重複しないユニークなファイルパスを生成する。
 *
 * @param basePath - 対象のパス (例: 'folder/MyNote.pdf')。
 * @param checkExists - パスが存在するかどうかを確認する非同期関数。
 * @returns 重複しないパス。
 */
export async function resolveUniquePath(
  basePath: string,
  checkExists: (path: string) => Promise<boolean>
): Promise<string> {
  /** 正規化されたベースパス。 */
  const normalized = normalizePath(basePath);

  if (!(await checkExists(normalized))) {
    return normalized;
  }

  /** パスの親ディレクトリとファイル名。 */
  const lastSlashIndex = normalized.lastIndexOf("/");
  /** ディレクトリパス。 */
  const dir = lastSlashIndex >= 0 ? normalized.slice(0, lastSlashIndex) : "";
  /** ファイル名。 */
  const filename = lastSlashIndex >= 0 ? normalized.slice(lastSlashIndex + 1) : normalized;

  /** ファイル名と拡張子の分割。 */
  const { base, ext } = splitFilename(filename);

  /** 連番カウンタ。 */
  let counter = 1;
  while (true) {
    /** 新しいファイル名。 */
    const candidateName = `${base} (${counter})${ext}`;
    /** 新しいフルパス。 */
    const candidatePath = dir ? `${dir}/${candidateName}` : candidateName;
    const normalizedCandidate = normalizePath(candidatePath);

    if (!(await checkExists(normalizedCandidate))) {
      return normalizedCandidate;
    }
    counter++;
  }
}

/**
 * PDF 通知管理ユーティリティ。
 */
export const PdfNotifier = {
  /**
   * PDF エクスポート開始・進捗中の Notice を表示する。
   *
   * @param message - 通知メッセージ。
   * @returns 生成された Notice インスタンス。
   */
  progress(message: string = "PDF を生成中..."): Notice {
    return new Notice(`⏳ ${message}`, 0);
  },

  /**
   * PDF エクスポート完了の Notice を表示する。
   *
   * @param filePath - 保存されたファイルパス。
   * @param durationMs - 表示時間 (ミリ秒)。
   */
  success(filePath: string, durationMs: number = 5000): void {
    new Notice(`✓ PDF を保存しました:\n${filePath}`, durationMs);
  },

  /**
   * PDF エクスポートエラーの Notice を表示する。
   *
   * @param error - エラーオブジェクトまたはエラーメッセージ。
   * @param durationMs - 表示時間 (ミリ秒)。
   */
  error(error: unknown, durationMs: number = 8000): void {
    /** エラーメッセージ文字列。 */
    const message = error instanceof Error ? error.message : String(error);
    new Notice(`✕ PDF の出力に失敗しました:\n${message}`, durationMs);
  },
};

/**
 * Obsidian Vault 内に PDF データを保存する。
 * 親ディレクトリが存在しない場合は自動作成する。
 *
 * @param app - Obsidian App インスタンス。
 * @param vaultRelativePath - Vault 内の保存先相対パス (例: 'exports/note.pdf')。
 * @param data - PDF バイナリデータ。
 * @param options - 保存オプション。
 * @returns 実際に保存された Vault 内相対パス。
 */
export async function savePdfToVault(
  app: App,
  vaultRelativePath: string,
  data: Uint8Array | ArrayBuffer,
  options: SavePdfOptions = {}
): Promise<string> {
  assertValidPdfData(data);

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

  /** 書き込み対象の ArrayBuffer。 */
  const buffer =
    data instanceof ArrayBuffer
      ? data
      : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

  try {
    await adapter.writeBinary(targetPath, buffer as ArrayBuffer);
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
