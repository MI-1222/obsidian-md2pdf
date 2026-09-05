import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printMobileDocument, saveMobileHtmlToVault } from "../../src/pdf/mobile-exporter";
import type { App } from "obsidian";

describe("mobile-exporter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("printMobileDocument", () => {
    it("iframe を生成して HTML を書き込み、print() を呼び出すこと。", async () => {
      /** print 呼び出しフラグ。 */
      let printCalled = false;
      /** focus 呼び出しフラグ。 */
      let focusCalled = false;
      /** write 呼び出し引数。 */
      let writtenHtml = "";

      /** モック createElement。 */
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === "iframe") {
          const iframe = element as HTMLIFrameElement;
          const mockDoc = {
            open: vi.fn(),
            write: (content: string) => {
              writtenHtml = content;
            },
            close: vi.fn(),
            fonts: {
              ready: Promise.resolve(),
            },
          };
          Object.defineProperty(iframe, "contentDocument", {
            get: () => mockDoc,
            configurable: true,
          });
          Object.defineProperty(iframe, "contentWindow", {
            value: {
              document: mockDoc,
              focus: () => {
                focusCalled = true;
              },
              print: () => {
                printCalled = true;
                if (iframe.contentWindow && iframe.contentWindow.onafterprint) {
                  (iframe.contentWindow.onafterprint as Function)();
                }
              },
              onafterprint: null,
            },
            writable: true,
            configurable: true,
          });
        }
        return element;
      });

      await printMobileDocument("<html><body><h1>Mobile Test</h1></body></html>", {
        renderDelayMs: 10,
        cleanupDelayMs: 10,
      });

      expect(writtenHtml).toContain("Mobile Test");
      expect(focusCalled).toBe(true);
      expect(printCalled).toBe(true);
      expect(document.querySelector("iframe")).toBeNull();
    });

    it("エラー発生時でも iframe をクリーンアップすること。", async () => {
      vi.spyOn(document, "createElement").mockImplementationOnce(() => {
        /** ダミー iframe 要素。 */
        const iframe = document.createElement("div") as unknown as HTMLIFrameElement;
        Object.defineProperty(iframe, "contentDocument", {
          get: () => null,
          configurable: true,
        });
        Object.defineProperty(iframe, "contentWindow", {
          get: () => null,
          configurable: true,
        });
        return iframe;
      });

      await expect(
        printMobileDocument("<html><body>Error Test</body></html>", {
          renderDelayMs: 0,
        })
      ).rejects.toThrow("印刷用 iframe の document にアクセスできませんでした。");

      expect(document.querySelector("iframe")).toBeNull();
    });
  });

  describe("saveMobileHtmlToVault", () => {
    it("HTML ファイルを Vault に保存し、通知を表示すること。", async () => {
      /** 保存済みファイルマップ。 */
      const files: Record<string, string> = {};
      /** ディレクトリセット。 */
      const directories = new Set<string>();

      /** モック App インスタンス。 */
      const mockApp = {
        vault: {
          adapter: {
            exists: vi.fn(async (path: string) => {
              return !!files[path] || directories.has(path);
            }),
            write: vi.fn(async (path: string, data: string) => {
              files[path] = data;
            }),
            mkdir: vi.fn(async (path: string) => {
              directories.add(path);
            }),
          },
        },
      } as unknown as App;

      /** 保存先パス。 */
      const resultPath = await saveMobileHtmlToVault(
        mockApp,
        "exports/report.html",
        "<html><body>Vault Report</body></html>",
        { overwrite: false, showNotice: true }
      );

      expect(resultPath).toBe("exports/report.html");
      expect(files["exports/report.html"]).toBe("<html><body>Vault Report</body></html>");
      expect(mockApp.vault.adapter.mkdir).toHaveBeenCalledWith("exports");
    });

    it("重複ファイルが存在する場合に連番を付与して保存すること。", async () => {
      /** 保存済みファイルマップ。 */
      const files: Record<string, string> = {
        "report.html": "old content",
      };

      /** モック App インスタンス。 */
      const mockApp = {
        vault: {
          adapter: {
            exists: vi.fn(async (path: string) => {
              return !!files[path];
            }),
            write: vi.fn(async (path: string, data: string) => {
              files[path] = data;
            }),
            mkdir: vi.fn(async () => {}),
          },
        },
      } as unknown as App;

      /** 保存先パス。 */
      const resultPath = await saveMobileHtmlToVault(mockApp, "report.html", "new content", {
        overwrite: false,
        showNotice: false,
      });

      expect(resultPath).toBe("report (1).html");
      expect(files["report (1).html"]).toBe("new content");
    });
  });
});
