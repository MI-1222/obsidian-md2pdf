import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createElectronPrintOptions,
  generateDesktopPdf,
  type ElectronBrowserWindowLike,
} from "../../src/pdf/desktop-exporter";
import type { PdfLayoutSettings } from "../../src/settings/types";

describe("Desktop PDF Exporter (Electron printToPDF)", () => {
  describe("createElectronPrintOptions", () => {
    it("未指定時はデフォルト (A4, 縦向き, 背景印刷有効, marginType: 'none') のオプションを生成する。", () => {
      /** 生成された印刷オプション。 */
      const options = createElectronPrintOptions();

      expect(options.pageSize).toBe("A4");
      expect(options.landscape).toBe(false);
      expect(options.preferCSSPageSize).toBe(true);
      expect(options.printBackground).toBe(true);
      expect(options.margins?.marginType).toBe("none");
      expect(options.displayHeaderFooter).toBe(false);
    });

    it("カスタムレイアウト設定 (Letter, landscape, header/footer) が正しく反映される。", () => {
      /** カスタムレイアウト設定。 */
      const layout: Partial<PdfLayoutSettings> = {
        format: "Letter",
        orientation: "landscape",
        printBackground: false,
        displayHeaderFooter: true,
        headerTemplate: "<div>Header</div>",
        footerTemplate: "<div>Footer</div>",
      };

      /** 生成された印刷オプション。 */
      const options = createElectronPrintOptions(layout);

      expect(options.pageSize).toBe("Letter");
      expect(options.landscape).toBe(true);
      expect(options.printBackground).toBe(false);
      expect(options.displayHeaderFooter).toBe(true);
      expect(options.headerTemplate).toBe("<div>Header</div>");
      expect(options.footerTemplate).toBe("<div>Footer</div>");
    });
  });

  describe("generateDesktopPdf", () => {
    /** モック用コールバック格納オブジェクト。 */
    let listeners: Record<string, Function> = {};
    /** モック destroy 呼び出しスパイ。 */
    let destroySpy = vi.fn();
    /** モック loadURL 呼び出しスパイ。 */
    let loadUrlSpy = vi.fn();
    /** モック executeJavaScript 呼び出しスパイ。 */
    let executeJsSpy = vi.fn();
    /** モック printToPDF 呼び出しスパイ。 */
    let printToPdfSpy = vi.fn();

    /** モック用ダミー PDF バイナリ。 */
    const dummyPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"

    /** モック BrowserWindow クラス。 */
    class MockBrowserWindow implements ElectronBrowserWindowLike {
      webContents = {
        once: vi.fn((event: string, listener: Function) => {
          listeners[event] = listener;
        }),
        executeJavaScript: executeJsSpy.mockResolvedValue(true),
        printToPDF: printToPdfSpy.mockResolvedValue(dummyPdfBytes),
      };

      loadURL = loadUrlSpy.mockImplementation(async () => {
        /** did-finish-load を非同期にトリガー。 */
        setTimeout(() => {
          if (listeners["did-finish-load"]) {
            listeners["did-finish-load"]();
          }
        }, 10);
      });

      close = vi.fn();
      destroy = destroySpy;
    }

    beforeEach(() => {
      listeners = {};
      destroySpy = vi.fn();
      loadUrlSpy = vi.fn();
      executeJsSpy = vi.fn().mockResolvedValue(true);
      printToPdfSpy = vi.fn().mockResolvedValue(dummyPdfBytes);
    });

    it("HTML をロードし、フォント待機を経て PDF バイナリを正常に生成する。", () => {
      /** テスト対象 HTML 文字列。 */
      const html = "<!DOCTYPE html><html><body><h1>Test</h1></body></html>";

      return generateDesktopPdf(html, { renderDelayMs: 10 }, MockBrowserWindow).then((pdfData) => {
        expect(pdfData).toBeInstanceOf(Uint8Array);
        expect(pdfData.length).toBe(5);
        expect(loadUrlSpy).toHaveBeenCalled();
        expect(executeJsSpy).toHaveBeenCalledWith("document.fonts.ready.then(() => true)");
        expect(printToPdfSpy).toHaveBeenCalled();
        expect(destroySpy).toHaveBeenCalled();
      });
    });

    it("did-fail-load イベント発生時にエラーを投げ、リソースを破棄する。", async () => {
      /** 失敗をエミュレートするモック BrowserWindow クラス。 */
      class FailMockBrowserWindow extends MockBrowserWindow {
        loadURL = vi.fn().mockImplementation(async () => {
          setTimeout(() => {
            if (listeners["did-fail-load"]) {
              listeners["did-fail-load"]({}, -105, "ERR_NAME_NOT_RESOLVED");
            }
          }, 10);
        });
      }

      await expect(
        generateDesktopPdf("<p>fail</p>", { renderDelayMs: 10 }, FailMockBrowserWindow)
      ).rejects.toThrow("HTML のロードに失敗しました");

      expect(destroySpy).toHaveBeenCalled();
    });

    it("タイムアウト発生時にエラーを投げ、リソースを破棄する。", async () => {
      /** イベントを発火しないモック BrowserWindow クラス。 */
      class TimeoutMockBrowserWindow extends MockBrowserWindow {
        loadURL = vi.fn().mockResolvedValue(undefined);
      }

      await expect(
        generateDesktopPdf(
          "<p>timeout</p>",
          { timeoutMs: 30, renderDelayMs: 10 },
          TimeoutMockBrowserWindow
        )
      ).rejects.toThrow("タイムアウトしました");

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
