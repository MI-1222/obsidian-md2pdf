import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, type Md2PdfSettings } from "./settings";
import { deepMerge } from "./utils/object";

/** Obsidian Markdown to PDF エクスポートプラグインのエントリポイントクラス。 */
export default class Md2PdfPlugin extends Plugin {
  /** プラグインの設定データ。 */
  settings: Md2PdfSettings = DEFAULT_SETTINGS;

  /** プラグインの初期化処理を実行する。 */
  async onload(): Promise<void> {
    console.log("Loading obsidian-md2pdf plugin.");
    await this.loadSettings();
  }

  /** プラグインの終了・破棄処理を実行する。 */
  onunload(): void {
    console.log("Unloading obsidian-md2pdf plugin.");
  }

  /** 保存済み設定を読み込み、デフォルト設定とディープマージして保持する。 */
  async loadSettings(): Promise<void> {
    const loadedData = (await this.loadData()) as unknown;
    this.settings = deepMerge(DEFAULT_SETTINGS, loadedData);
  }

  /** 現在の設定を永続ストレージに保存する。 */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
