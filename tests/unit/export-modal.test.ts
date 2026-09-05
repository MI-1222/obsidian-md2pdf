import { describe, it, expect, vi, beforeEach } from "vitest";
import { PdfExportModal, type Md2PdfPluginLike } from "../../src/ui/export-modal";
import { DEFAULT_SETTINGS } from "../../src/settings/defaults";
import { App, TFile } from "obsidian";
import * as compilerModule from "../../src/compiler/markdown-compiler";
import * as desktopExporterModule from "../../src/pdf/desktop-exporter";
import * as pdfSaverModule from "../../src/pdf/pdf-saver";

describe("PdfExportModal", () => {
  /** 有効なダミー PDF バイト列 (%PDF-1.4...)。 */
  const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

  /** モック App。 */
  let mockApp: App;
  /** モック TFile。 */
  let mockFile: TFile;
  /** モック Plugin。 */
  let mockPlugin: Md2PdfPluginLike;

  beforeEach(() => {
    mockApp = new App();
    /** モック TFile インスタンス。 */
    mockFile = Object.assign(new (TFile as any)(), {
      path: "documents/MyNote.md",
      name: "MyNote.md",
      basename: "MyNote",
      extension: "md",
    });
    mockPlugin = {
      app: mockApp,
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      saveSettings: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe("初期化と UI 構築", () => {
    it("初期化時にデフォルト設定と対象ファイルのパスが読み込まれる。", () => {
      /** モーダルインスタンス。 */
      const modal = new PdfExportModal(mockPlugin, mockFile);

      expect(modal.outputPath).toBe("documents/MyNote.pdf");
      expect(modal.format).toBe("A4");
      expect(modal.orientation).toBe("portrait");
      expect(modal.theme).toBe("github-light");
      expect(modal.highlightTheme).toBe("github");
      expect(modal.overwrite).toBe(false);
    });

    it("onOpen 呼び出しで UI コンポーネントが containerEl に生成される。", () => {
      /** モーダルインスタンス。 */
      const modal = new PdfExportModal(mockPlugin, mockFile);
      modal.onOpen();

      expect(modal.titleEl.textContent).toBe("PDF Export: MyNote");
      expect(modal.contentEl.children.length).toBeGreaterThan(0);
    });
  });

  describe("executeExport", () => {
    it("Markdown コンパイルから PDF 生成、Vault 保存、設定更新までのパイプラインが実行される。", async () => {
      /** レンダリング関数のモックスパイ。 */
      const compileSpy = vi
        .spyOn(compilerModule.MarkdownCompiler.prototype, "renderAsync")
        .mockResolvedValue("<p>Compiled HTML</p>");

      /** デスクトップ PDF 生成のモックスパイ。 */
      const exportPdfSpy = vi
        .spyOn(desktopExporterModule, "generateDesktopPdf")
        .mockResolvedValue(validPdfBytes);

      /** 保存関数のモックスパイ。 */
      const saveSpy = vi
        .spyOn(pdfSaverModule, "savePdfToVault")
        .mockResolvedValue("documents/MyNote.pdf");

      /** モーダルインスタンス。 */
      const modal = new PdfExportModal(mockPlugin, mockFile);
      modal.format = "A3";
      modal.theme = "github-dark";

      /** 保存先パス。 */
      const resultPath = await modal.executeExport();

      expect(resultPath).toBe("documents/MyNote.pdf");
      expect(compileSpy).toHaveBeenCalled();
      expect(exportPdfSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(mockPlugin.settings.pdf.format).toBe("A3");
      expect(mockPlugin.settings.style.theme).toBe("github-dark");
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });

    it("エクスポート中にエラーが発生した場合は例外を投げる。", async () => {
      vi.spyOn(compilerModule.MarkdownCompiler.prototype, "renderAsync").mockRejectedValue(
        new Error("Compilation Error")
      );

      /** モーダルインスタンス。 */
      const modal = new PdfExportModal(mockPlugin, mockFile);

      await expect(modal.executeExport()).rejects.toThrow("Compilation Error");
    });
  });
});
