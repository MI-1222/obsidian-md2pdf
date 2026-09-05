import { Plugin } from "obsidian";

/**
 * Obsidian Markdown to PDF エクスポートプラグインのエントリポイントクラス。
 */
export default class Md2PdfPlugin extends Plugin {
  /**
   * プラグインの初期化処理を実行する。
   */
  async onload(): Promise<void> {
    console.log("Loading obsidian-md2pdf plugin.");
  }

  /**
   * プラグインの終了・破棄処理を実行する。
   */
  onunload(): void {
    console.log("Unloading obsidian-md2pdf plugin.");
  }
}
