import { Platform } from "obsidian";

/** Obsidian 実行環境のプラットフォーム判定ユーティリティ。 */
export const AppPlatform = {
  /**
   * 現在の環境がモバイル端末 (iOS / Android) かどうかを判定する。
   *
   * @returns モバイル環境の場合は true、それ以外は false。
   */
  isMobile(): boolean {
    return Boolean(Platform.isMobile);
  },

  /**
   * 現在の環境がデスクトップ (macOS / Windows / Linux) かどうかを判定する。
   *
   * @returns デスクトップ環境の場合は true、それ以外は false。
   */
  isDesktop(): boolean {
    return Boolean(Platform.isDesktop);
  },

  /**
   * 現在の環境が macOS かどうかを判定する。
   *
   * @returns macOS の場合は true、それ以外は false。
   */
  isMacOS(): boolean {
    return Boolean(Platform.isMacOS);
  },

  /**
   * 現在の環境が Windows かどうかを判定する。
   *
   * @returns Windows の場合は true、それ以外は false。
   */
  isWindows(): boolean {
    return Boolean(Platform.isWin);
  },

  /**
   * 現在の環境が Linux かどうかを判定する。
   *
   * @returns Linux の場合は true、それ以外は false。
   */
  isLinux(): boolean {
    return Boolean(Platform.isLinux);
  },

  /**
   * 現在の環境が iOS アプリかどうかを判定する。
   *
   * @returns iOS の場合は true、それ以外は false。
   */
  isIOS(): boolean {
    return Boolean(Platform.isIosApp);
  },

  /**
   * 現在の環境が Android アプリかどうかを判定する。
   *
   * @returns Android の場合は true、それ以外は false。
   */
  isAndroid(): boolean {
    return Boolean(Platform.isAndroidApp);
  },

  /**
   * 現在の環境が Safari ブラウザかどうかを判定する。
   *
   * @returns Safari の場合は true、それ以外は false。
   */
  isSafari(): boolean {
    return Boolean(Platform.isSafari);
  },

  /**
   * 現在のプラットフォーム名を文字列で取得する (デバッグ・ログ用)。
   *
   * @returns プラットフォームを表す識別文字列。
   * (`iOS`, `Android`, `macOS`, `Windows`, `Linux`, `Mobile`, `Desktop`, `Unknown`)
   */
  getPlatformName(): string {
    if (this.isIOS()) return "iOS";
    if (this.isAndroid()) return "Android";
    if (this.isMacOS()) return "macOS";
    if (this.isWindows()) return "Windows";
    if (this.isLinux()) return "Linux";
    if (this.isMobile()) return "Mobile";
    if (this.isDesktop()) return "Desktop";
    return "Unknown";
  },
};
