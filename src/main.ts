import {
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Menu,
  Notice,
  Plugin,
  TAbstractFile,
  TFile,
} from "obsidian";
import { DEFAULT_SETTINGS, Md2PdfSettingTab, type Md2PdfSettings } from "./settings";
import { deepMerge } from "./utils/object";
import { PdfExportModal } from "./ui/export-modal";
import { MarkdownCompiler } from "./compiler/markdown-compiler";
import { generateHtmlDocument } from "./styles/css-builder";
import { generateDesktopPdf } from "./pdf/desktop-exporter";
import { printMobileDocument } from "./pdf/mobile-exporter";
import { savePdfToVault, PdfNotifier } from "./pdf/pdf-saver";
import { AppPlatform } from "./utils/platform";

/** Obsidian Markdown to PDF エクスポートプラグインのエントリポイントクラス。 */
export default class Md2PdfPlugin extends Plugin {
  /** プラグインの設定データ。 */
  settings: Md2PdfSettings = DEFAULT_SETTINGS;

  /** プラグインの初期化処理を実行する。 */
  async onload(): Promise<void> {
    console.log("Loading obsidian-md2pdf plugin.");
    await this.loadSettings();

    this.addSettingTab(new Md2PdfSettingTab(this.app, this));
    this.registerCommands();
    this.registerEvents();
    this.registerRibbon();
  }

  /** プラグインの終了・破棄処理を実行する。 */
  onunload(): void {
    console.log("Unloading obsidian-md2pdf plugin.");
  }

  /** 保存済み設定を読み込み、デフォルト設定とディープマージして保持する。 */
  async loadSettings(): Promise<void> {
    /** ロードされた設定データ。 */
    const loadedData = (await this.loadData()) as unknown;
    this.settings = deepMerge(DEFAULT_SETTINGS, loadedData);
  }

  /** 現在の設定を永続ストレージに保存する。 */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /**
   * 現在アクティブな Markdown ファイルを取得する。
   *
   * @returns アクティブな TFile。見つからない場合は null。
   */
  getActiveMarkdownFile(): TFile | null {
    /** アクティブビュー。 */
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view?.file && view.file.extension === "md") {
      return view.file;
    }
    /** アクティブファイル。 */
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && activeFile.extension === "md") {
      return activeFile;
    }
    return null;
  }

  /**
   * コマンドパレットへのコマンド登録を実行する。
   */
  private registerCommands(): void {
    /** 1. モーダル表示付きエクスポートコマンド */
    this.addCommand({
      id: "export-active-note-to-pdf-modal",
      name: "Export active note to PDF (With Modal)",
      checkCallback: (checking: boolean) => {
        const file = this.getActiveMarkdownFile();
        if (!file) {
          return false;
        }
        if (checking) {
          return true;
        }
        new PdfExportModal(this, file).open();
        return true;
      },
    });

    /** 2. クイック即時エクスポートコマンド */
    this.addCommand({
      id: "export-active-note-to-pdf-quick",
      name: "Export active note to PDF (Quick)",
      checkCallback: (checking: boolean) => {
        const file = this.getActiveMarkdownFile();
        if (!file) {
          return false;
        }
        if (checking) {
          return true;
        }
        this.exportFileQuick(file);
        return true;
      },
    });
  }

  /**
   * ファイルツリーおよびエディタのコンテキストメニューイベントを登録する。
   */
  private registerEvents(): void {
    /** ファイルツリー・タブのコンテキストメニュー */
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
        if (file instanceof TFile && file.extension === "md") {
          menu.addItem((item) => {
            item
              .setTitle("Export to PDF")
              .setIcon("file-output")
              .setSection("action")
              .onClick(() => {
                new PdfExportModal(this, file).open();
              });
          });
        }
      })
    );

    /** エディタ本文のコンテキストメニュー */
    this.registerEvent(
      this.app.workspace.on(
        "editor-menu",
        (menu: Menu, _editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
          const file = info?.file;
          if (file instanceof TFile && file.extension === "md") {
            menu.addItem((item) => {
              item
                .setTitle("Export to PDF")
                .setIcon("file-output")
                .setSection("action")
                .onClick(() => {
                  new PdfExportModal(this, file).open();
                });
            });
          }
        }
      )
    );
  }

  /**
   * サイドバーのリボンアイコンを登録する。
   */
  private registerRibbon(): void {
    this.addRibbonIcon("file-output", "Export note to PDF", () => {
      /** アクティブファイル。 */
      const file = this.getActiveMarkdownFile();
      if (!file) {
        new Notice("PDF エクスポート対象のアクティブな Markdown ノートが見つかりません。");
        return;
      }
      new PdfExportModal(this, file).open();
    });
  }

  /**
   * モーダルを開かず、現在の設定値で即座に PDF エクスポートを実行する。
   *
   * @param file - エクスポート対象の TFile。
   * @returns 保存された Vault 内相対パス。
   */
  async exportFileQuick(file: TFile): Promise<string> {
    /** 進捗 Notice 表示。 */
    const progressNotice = PdfNotifier.progress(`「${file.basename}」を PDF エクスポート中...`);

    try {
      /** 1. Markdown 読み込み */
      const markdownContent = await this.app.vault.read(file);

      /** 2. HTML コンパイル */
      const compiler = new MarkdownCompiler({
        breaks: this.settings.style.breaks,
        tikz: {
          serverUrl: this.settings.tikz.serverUrl,
          apiKey: this.settings.tikz.apiKey,
          timeoutMs: this.settings.tikz.timeoutMs,
          useRemoteOnMobile: this.settings.tikz.useRemoteOnMobile,
          fallbackToRemoteOnPc: this.settings.tikz.fallbackToRemoteOnPc,
        },
        plantuml: {
          serverUrl: this.settings.integrations.plantuml.serverUrl,
        },
      });
      const bodyHtml = await compiler.renderAsync(markdownContent);

      /** 3. HTML ドキュメント構築 */
      const fullHtml = generateHtmlDocument(bodyHtml, {
        title: file.basename,
        styleSettings: this.settings.style,
        layoutSettings: this.settings.pdf,
      });

      /** 4. 出力先パスの決定 (同階層の .pdf) */
      const dir =
        file.path.lastIndexOf("/") >= 0 ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
      const defaultOutputPath = dir ? `${dir}/${file.basename}.pdf` : `${file.basename}.pdf`;

      /** 保存先パスまたは結果。 */
      let savedPath = defaultOutputPath;

      if (AppPlatform.isDesktop()) {
        /** 5. デスクトップ PDF 生成 */
        const pdfBytes = await generateDesktopPdf(fullHtml, {
          layoutSettings: this.settings.pdf,
        });

        /** 6. Vault 内保存 */
        savedPath = await savePdfToVault(this.app, defaultOutputPath, pdfBytes, {
          overwrite: false,
          showNotice: true,
        });
      } else {
        /** 5. モバイル印刷ダイアログの起動 */
        await printMobileDocument(fullHtml);
      }

      return savedPath;
    } catch (error) {
      PdfNotifier.error(error);
      throw error;
    } finally {
      progressNotice.hide();
    }
  }
}
