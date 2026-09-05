/**
 * PDF バイナリデータの整合性を検証する。
 * 先頭バイトが '%PDF-' (0x25, 0x50, 0x44, 0x46, 0x2D) で始まっているかを確認する。
 *
 * @param data - 検証対象の PDF バイナリデータ (Uint8Array または ArrayBuffer)。
 * @returns 有効な PDF データの場合は true、それ以外は false。
 */
export function validatePdfData(data: Uint8Array | ArrayBuffer | null | undefined): boolean {
  if (!data) {
    return false;
  }

  /** バイト配列。 */
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  if (bytes.length < 5) {
    return false;
  }

  /** '%PDF-' マジックバイト (ASCII: %, P, D, F, -)。 */
  const isMagicMatch =
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d;

  return isMagicMatch;
}

/**
 * PDF データの整合性を確認し、不正な場合は例外をスローする。
 *
 * @param data - 検証対象の PDF バイナリデータ。
 * @throws {Error} PDF データが不正または空の場合。
 */
export function assertValidPdfData(data: Uint8Array | ArrayBuffer | null | undefined): void {
  if (!validatePdfData(data)) {
    throw new Error("生成された PDF データが不正です (有効な %PDF- ヘッダーが見つかりません)。");
  }
}
