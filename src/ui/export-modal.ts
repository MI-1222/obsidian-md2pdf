import { Modal, Setting, type App, type TFile } from "obsidian";
import type {
  HighlightTheme,
  MarkdownTheme,
  PdfMarginSettings,
  PdfOrientation,
  PdfPaperFormat,
  Md2PdfSettings,
} from "../settings/types";
import { MarkdownCompiler } from "../compiler/markdown-compiler";
import { generateHtmlDocument } from "../styles/css-builder";
import { generateDesktopPdf } from "../pdf/desktop-exporter";
import { printMobileDocument } from "../pdf/mobile-exporter";
import { savePdfToVault, PdfNotifier } from "../pdf/pdf-saver";
import { AppPlatform } from "../utils/platform";

/** Md2PdfPlugin の最小限のインターフェース。 */
export interface Md2PdfPluginLike {
  /** Obsidian App インスタンス。 */
  app: App;
  /** プラグインの全体設定。 */
  settings: Md2PdfSettings;
  /** 設定の保存メソッド。 */
  saveSettings(): Promise<void>;
}

/**
 * PDF エクスポート設定および実行モーダル。
 * 用紙設定、テーマ、余白、出力先パスの調整とエクスポート処理を提供する。
 */
export class PdfExportModal extends Modal {
  /** プラグインインスタンス。 */
  private plugin: Md2PdfPluginLike;
  /** エクスポート対象の Markdown ファイル。 */
  private file: TFile;

  /** 出力先パス。 */
  outputPath: string;
  /** 上書きフラグ。 */
  overwrite: boolean = false;
  /** 用紙サイズ。 */
  format: PdfPaperFormat;
  /** ページの向き。 */
  orientation: PdfOrientation;
  /** ページ余白。 */
  margin: PdfMarginSettings;
  /** Markdown テーマ。 */
  theme: MarkdownTheme;
  /** シンタックスハイライトテーマ。 */
  highlightTheme: HighlightTheme;
  /** 背景色印刷フラグ。 */
  printBackground: boolean;
  /** ヘッダー・フッター表示フラグ。 */
  displayHeaderFooter: boolean;
  /** エクスポート実行中フラグ。 */
  isExporting: boolean = false;

  /**
   * コンストラクタ。
   *
   * @param plugin - プラグインインスタンス。
   * @param file - エクスポート対象の TFile。
   */
  constructor(plugin: Md2PdfPluginLike, file: TFile) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;

    /** 現在のプラグイン設定からの初期値読み込み。 */
    const pdfSettings = plugin.settings.pdf;
    const styleSettings = plugin.settings.style;

    this.format = pdfSettings.format;
    this.orientation = pdfSettings.orientation;
    this.margin = { ...pdfSettings.margin };
    this.printBackground = pdfSettings.printBackground;
    this.displayHeaderFooter = pdfSettings.displayHeaderFooter;
    this.theme = styleSettings.theme;
    this.highlightTheme = styleSettings.highlightTheme;

    /** デフォルトの出力パス (ファイルと同階層の .pdf)。 */
    const dir =
      file.path.lastIndexOf("/") >= 0 ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
    this.outputPath = dir ? `${dir}/${file.basename}.pdf` : `${file.basename}.pdf`;
  }

  /**
   * モーダル UI を構築・表示する。
   */
  onOpen(): void {
    const { contentEl, titleEl } = this;
    contentEl.empty();
    titleEl.setText(`PDF Export: ${this.file.basename}`);

    /** 1. 出力ファイル設定 */
    new Setting(contentEl).setName("Output Settings").setHeading();

    new Setting(contentEl)
      .setName("Output path")
      .setDesc("Vault-relative path for the exported PDF.")
      .addText((text) =>
        text.setValue(this.outputPath).onChange((value) => {
          this.outputPath = value.trim() || `${this.file.basename}.pdf`;
        })
      );

    new Setting(contentEl)
      .setName("Overwrite existing file")
      .setDesc("If disabled, appends (1), (2), etc. to avoid overwriting.")
      .addToggle((toggle) =>
        toggle.setValue(this.overwrite).onChange((value) => {
          this.overwrite = value;
        })
      );

    /** 2. ページレイアウト設定 */
    new Setting(contentEl).setName("Page Layout").setHeading();

    new Setting(contentEl)
      .setName("Paper format")
      .setDesc("Select standard paper size.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            A4: "A4",
            A3: "A3",
            Letter: "Letter",
            Legal: "Legal",
            Tabloid: "Tabloid",
          })
          .setValue(this.format)
          .onChange((value) => {
            this.format = value as PdfPaperFormat;
          })
      );

    new Setting(contentEl)
      .setName("Orientation")
      .setDesc("Page orientation.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            portrait: "Portrait (縦向き)",
            landscape: "Landscape (横向き)",
          })
          .setValue(this.orientation)
          .onChange((value) => {
            this.orientation = value as PdfOrientation;
          })
      );

    new Setting(contentEl)
      .setName("Page margins (Top / Right / Bottom / Left)")
      .setDesc("Margin values with units (e.g., '15mm', '1in').")
      .addText((text) =>
        text
          .setPlaceholder("Top")
          .setValue(this.margin.top)
          .onChange((val) => {
            this.margin.top = val;
          })
      )
      .addText((text) =>
        text
          .setPlaceholder("Right")
          .setValue(this.margin.right)
          .onChange((val) => {
            this.margin.right = val;
          })
      )
      .addText((text) =>
        text
          .setPlaceholder("Bottom")
          .setValue(this.margin.bottom)
          .onChange((val) => {
            this.margin.bottom = val;
          })
      )
      .addText((text) =>
        text
          .setPlaceholder("Left")
          .setValue(this.margin.left)
          .onChange((val) => {
            this.margin.left = val;
          })
      );

    /** 3. スタイル & テーマ設定 */
    new Setting(contentEl).setName("Styles & Themes").setHeading();

    new Setting(contentEl)
      .setName("Markdown theme")
      .setDesc("Base document theme.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            "github-light": "GitHub Light",
            "github-dark": "GitHub Dark",
            tomorrow: "Tomorrow",
            default: "Default",
          })
          .setValue(this.theme)
          .onChange((value) => {
            this.theme = value as MarkdownTheme;
          })
      );

    new Setting(contentEl)
      .setName("Code highlight theme")
      .setDesc("Syntax highlighting theme for code blocks.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            github: "GitHub",
            "atom-one-dark": "Atom One Dark",
            tomorrow: "Tomorrow",
            default: "Default",
          })
          .setValue(this.highlightTheme)
          .onChange((value) => {
            this.highlightTheme = value as HighlightTheme;
          })
      );

    new Setting(contentEl)
      .setName("Print background")
      .setDesc("Include background colors and images in PDF.")
      .addToggle((toggle) =>
        toggle.setValue(this.printBackground).onChange((value) => {
          this.printBackground = value;
        })
      );

    new Setting(contentEl)
      .setName("Display header & footer")
      .setDesc("Show header and footer in PDF.")
      .addToggle((toggle) =>
        toggle.setValue(this.displayHeaderFooter).onChange((value) => {
          this.displayHeaderFooter = value;
        })
      );

    /** 4. アクションボタン */
    const actionSetting = new Setting(contentEl);

    actionSetting.addButton((button) =>
      button
        .setButtonText("Export to PDF")
        .setCta()
        .onClick(async () => {
          if (this.isExporting) return;
          this.isExporting = true;
          button.setDisabled(true);
          button.setButtonText("Exporting...");

          try {
            await this.executeExport();
            this.close();
          } catch {
            button.setDisabled(false);
            button.setButtonText("Export to PDF");
            this.isExporting = false;
          }
        })
    );

    actionSetting.addButton((button) =>
      button.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    );
  }

  /**
   * PDF エクスポート処理を実行する。
   */
  async executeExport(): Promise<string> {
    /** 進捗 Notice 表示。 */
    const progressNotice = PdfNotifier.progress("PDF をエクスポート中...");

    try {
      /** 1. Markdown 本文の読み込み。 */
      const markdownContent = await this.plugin.app.vault.read(this.file);

      /** 2. Markdown から HTML へのコンパイル。 */
      const compiler = new MarkdownCompiler({
        breaks: this.plugin.settings.style.breaks,
        tikz: {
          serverUrl: this.plugin.settings.tikz.serverUrl,
          apiKey: this.plugin.settings.tikz.apiKey,
          timeoutMs: this.plugin.settings.tikz.timeoutMs,
          useRemoteOnMobile: this.plugin.settings.tikz.useRemoteOnMobile,
          fallbackToRemoteOnPc: this.plugin.settings.tikz.fallbackToRemoteOnPc,
        },
        plantuml: {
          serverUrl: this.plugin.settings.integrations.plantuml.serverUrl,
        },
      });
      const bodyHtml = await compiler.renderAsync(markdownContent);

      /** 3. スタイル設定およびレイアウト設定の準備。 */
      const currentStyleSettings = {
        ...this.plugin.settings.style,
        theme: this.theme,
        highlightTheme: this.highlightTheme,
      };

      const currentLayoutSettings = {
        ...this.plugin.settings.pdf,
        format: this.format,
        orientation: this.orientation,
        margin: { ...this.margin },
        printBackground: this.printBackground,
        displayHeaderFooter: this.displayHeaderFooter,
      };

      /** 4. 完全な HTML ドキュメントの構築。 */
      const fullHtml = generateHtmlDocument(bodyHtml, {
        title: this.file.basename,
        styleSettings: currentStyleSettings,
        layoutSettings: currentLayoutSettings,
      });

      /** 保存先パスまたは結果。 */
      let savedPath = this.outputPath;

      if (AppPlatform.isDesktop()) {
        /** 5. デスクトップ PDF 生成 (Electron printToPDF)。 */
        const pdfBytes = await generateDesktopPdf(fullHtml, {
          layoutSettings: currentLayoutSettings,
        });

        /** 6. Vault 内への PDF 保存。 */
        savedPath = await savePdfToVault(this.plugin.app, this.outputPath, pdfBytes, {
          overwrite: this.overwrite,
          showNotice: true,
        });
      } else {
        /** 5. モバイル印刷ダイアログの起動。 */
        await printMobileDocument(fullHtml);
      }

      /** 7. 設定値の記憶・永続化。 */
      this.plugin.settings.pdf = currentLayoutSettings;
      this.plugin.settings.style = currentStyleSettings;
      await this.plugin.saveSettings();

      return savedPath;
    } catch (error) {
      PdfNotifier.error(error);
      throw error;
    } finally {
      progressNotice.hide();
    }
  }

  /**
   * モーダルクローズ時の処理。
   */
  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
