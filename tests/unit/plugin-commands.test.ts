import { describe, it, expect, vi, beforeEach } from "vitest";
import Md2PdfPlugin from "../../src/main";
import { App, MarkdownView, Menu, TFile } from "obsidian";
import * as compilerModule from "../../src/compiler/markdown-compiler";
import * as desktopExporterModule from "../../src/pdf/desktop-exporter";
import * as pdfSaverModule from "../../src/pdf/pdf-saver";

describe("Plugin Commands, Context Menus & Ribbon Integration", () => {
  /** 有効なダミー PDF バイト列 (%PDF-1.4...)。 */
  const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

  /** モック App インスタンス。 */
  let mockApp: App;
  /** プラグインインスタンス。 */
  let plugin: Md2PdfPlugin;
  /** モック TFile。 */
  let mockMarkdownFile: TFile;

  beforeEach(() => {
    mockApp = new App();
    mockMarkdownFile = Object.assign(new (TFile as any)(), {
      path: "notes/Guide.md",
      name: "Guide.md",
      basename: "Guide",
      extension: "md",
    });

    plugin = new Md2PdfPlugin(mockApp, {
      id: "obsidian-md2pdf",
      name: "obsidian-md2pdf",
      version: "1.0.0",
      minAppVersion: "0.15.0",
      description: "Export markdown to pdf",
      author: "masahiro",
    });
  });

  describe("初期化とコマンド・イベント登録", () => {
    it("onload で 2 つのコマンド、2 つのイベント、1 つのリボンアイコンが登録される。", async () => {
      await plugin.onload();

      /** モックプラグイン内部状態。 */
      const pluginInternal = plugin as unknown as {
        commands: { id: string }[];
        events: unknown[];
        ribbonIcons: { icon: string; title: string; callback: () => void }[];
      };

      expect(pluginInternal.commands.length).toBe(2);
      expect(pluginInternal.events.length).toBe(2);
      expect(pluginInternal.ribbonIcons.length).toBe(1);

      /** コマンド ID の確認。 */
      const commandIds = pluginInternal.commands.map((c) => c.id);
      expect(commandIds).toContain("export-active-note-to-pdf-modal");
      expect(commandIds).toContain("export-active-note-to-pdf-quick");
    });
  });

  describe("getActiveMarkdownFile", () => {
    it("MarkdownView がアクティブな場合、そのファイルを返す。", () => {
      /** モック MarkdownView。 */
      const mockView = Object.assign(new (MarkdownView as any)(), {
        file: mockMarkdownFile,
      });

      mockApp.workspace.getActiveViewOfType = vi.fn().mockReturnValue(mockView);

      expect(plugin.getActiveMarkdownFile()).toBe(mockMarkdownFile);
    });

    it("getActiveFile が Markdown ファイルの場合、そのファイルを返す。", () => {
      mockApp.workspace.getActiveViewOfType = vi.fn().mockReturnValue(null);
      mockApp.workspace.getActiveFile = vi.fn().mockReturnValue(mockMarkdownFile);

      expect(plugin.getActiveMarkdownFile()).toBe(mockMarkdownFile);
    });

    it("ファイルが開かれていない場合は null を返す。", () => {
      mockApp.workspace.getActiveViewOfType = vi.fn().mockReturnValue(null);
      mockApp.workspace.getActiveFile = vi.fn().mockReturnValue(null);

      expect(plugin.getActiveMarkdownFile()).toBeNull();
    });
  });

  describe("コマンド実行", () => {
    it("アクティブファイルが存在しない場合、checkCallback は false を返す。", async () => {
      await plugin.onload();
      mockApp.workspace.getActiveViewOfType = vi.fn().mockReturnValue(null);
      mockApp.workspace.getActiveFile = vi.fn().mockReturnValue(null);

      /** モックプラグイン内部状態。 */
      const pluginInternal = plugin as unknown as {
        commands: { id: string; checkCallback: Function }[];
      };

      /** モーダルコマンド。 */
      const modalCommand = pluginInternal.commands.find(
        (c) => c.id === "export-active-note-to-pdf-modal"
      );
      expect(modalCommand?.checkCallback(true)).toBe(false);

      /** クイックコマンド。 */
      const quickCommand = pluginInternal.commands.find(
        (c) => c.id === "export-active-note-to-pdf-quick"
      );
      expect(quickCommand?.checkCallback(true)).toBe(false);
    });

    it("アクティブファイルが存在する場合、checkCallback は true を返し実行できる。", async () => {
      await plugin.onload();
      mockApp.workspace.getActiveFile = vi.fn().mockReturnValue(mockMarkdownFile);

      const quickExportSpy = vi
        .spyOn(plugin, "exportFileQuick")
        .mockResolvedValue("notes/Guide.pdf");

      /** モックプラグイン内部状態。 */
      const pluginInternal = plugin as unknown as {
        commands: { id: string; checkCallback: Function }[];
      };

      /** クイックコマンド。 */
      const quickCommand = pluginInternal.commands.find(
        (c) => c.id === "export-active-note-to-pdf-quick"
      );

      /** チェック時。 */
      expect(quickCommand?.checkCallback(true)).toBe(true);
      /** 実行時。 */
      expect(quickCommand?.checkCallback(false)).toBe(true);
      expect(quickExportSpy).toHaveBeenCalledWith(mockMarkdownFile);
    });
  });

  describe("exportFileQuick", () => {
    it("現在の設定で即座にコンパイル・PDF 生成・Vault 保存を行う。", async () => {
      const compileSpy = vi
        .spyOn(compilerModule.MarkdownCompiler.prototype, "renderAsync")
        .mockResolvedValue("<p>Quick HTML</p>");

      const exportPdfSpy = vi
        .spyOn(desktopExporterModule, "generateDesktopPdf")
        .mockResolvedValue(validPdfBytes);

      const saveSpy = vi
        .spyOn(pdfSaverModule, "savePdfToVault")
        .mockResolvedValue("notes/Guide.pdf");

      /** 保存先パス。 */
      const resultPath = await plugin.exportFileQuick(mockMarkdownFile);

      expect(resultPath).toBe("notes/Guide.pdf");
      expect(compileSpy).toHaveBeenCalled();
      expect(exportPdfSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalledWith(
        mockApp,
        "notes/Guide.pdf",
        validPdfBytes,
        expect.objectContaining({ overwrite: false })
      );
    });
  });

  describe("コンテキストメニュー & リボンアイコン", () => {
    it("file-menu イベントリスナーが Markdown ファイルに対してメニュー項目を追加する。", async () => {
      /** 登録されたイベントリスナー。 */
      let fileMenuHandler: Function | null = null;
      mockApp.workspace.on = vi.fn((event: string, cb: Function) => {
        if (event === "file-menu") fileMenuHandler = cb;
        return {};
      }) as any;

      await plugin.onload();

      expect(fileMenuHandler).not.toBeNull();

      /** モック Menu。 */
      const menu = new Menu();
      if (fileMenuHandler) {
        (fileMenuHandler as Function)(menu, mockMarkdownFile);
      }

      /** モック Menu 内部状態。 */
      const menuInternal = menu as unknown as {
        items: { title: string; icon: string }[];
      };

      expect(menuInternal.items.length).toBe(1);
      expect(menuInternal.items[0].title).toBe("Export to PDF");
      expect(menuInternal.items[0].icon).toBe("file-output");
    });

    it("リボンアイコンクリック時にアクティブファイルがあればモーダルを開く。", async () => {
      await plugin.onload();
      mockApp.workspace.getActiveFile = vi.fn().mockReturnValue(mockMarkdownFile);

      /** モックプラグイン内部状態。 */
      const pluginInternal = plugin as unknown as {
        ribbonIcons: { icon: string; title: string; callback: () => void }[];
      };

      expect(pluginInternal.ribbonIcons.length).toBe(1);
      expect(pluginInternal.ribbonIcons[0].title).toBe("Export note to PDF");
      expect(pluginInternal.ribbonIcons[0].icon).toBe("file-output");

      /** コールバック実行。 */
      expect(() => pluginInternal.ribbonIcons[0].callback()).not.toThrow();
    });
  });
});
