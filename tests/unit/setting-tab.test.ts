import { describe, it, expect, vi, beforeEach } from "vitest";
import { App, requestUrl, type PluginManifest } from "obsidian";
import Md2PdfPlugin from "@/main";
import { Md2PdfSettingTab } from "@/settings";

/**
 * テスト用のマニフェスト。
 *
 * 実際のマニフェストに必要な項目のみを定義している。
 */
const mockManifest: PluginManifest = {
  id: "obsidian-md2pdf",
  name: "Md2Pdf",
  version: "0.0.0",
  minAppVersion: "1.4.0",
  description: "Test plugin",
  author: "MI-1222",
  isDesktopOnly: false,
};

describe("Md2PdfSettingTab", () => {
  let app: App;
  let plugin: Md2PdfPlugin;
  let settingTab: Md2PdfSettingTab;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new App();
    plugin = new Md2PdfPlugin(app, mockManifest);
    settingTab = new Md2PdfSettingTab(app, plugin);
  });

  it("display() の実行により設定画面のヘッダーおよび設定項目要素が生成される。", () => {
    settingTab.display();

    const headings = settingTab.containerEl.querySelectorAll("h2, .setting-item-heading");
    expect(headings.length).toBeGreaterThanOrEqual(4);

    const inputs = settingTab.containerEl.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThan(0);

    const selects = settingTab.containerEl.querySelectorAll("select");
    expect(selects.length).toBeGreaterThan(0);

    const textareas = settingTab.containerEl.querySelectorAll("textarea");
    expect(textareas.length).toBe(1);

    const buttons = settingTab.containerEl.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("TikZ サーバー URL の変更時に設定が更新され、saveSettings が呼び出される。", async () => {
    const saveSpy = vi.spyOn(plugin, "saveSettings").mockResolvedValue();
    settingTab.display();

    const inputs = settingTab.containerEl.querySelectorAll("input");
    const serverUrlInput = Array.from(inputs).find(
      (input) => input.type === "text" && input.placeholder.includes("tikz.example.com")
    );

    expect(serverUrlInput).toBeDefined();
    if (serverUrlInput) {
      serverUrlInput.value = "https://new-tikz.example.com";
      serverUrlInput.dispatchEvent(new Event("input"));
    }

    expect(plugin.settings.tikz.serverUrl).toBe("https://new-tikz.example.com");
    expect(saveSpy).toHaveBeenCalled();
  });

  it("API キー入力フィールドの type が password に設定されている。", () => {
    settingTab.display();

    const passwordInputs = Array.from(
      settingTab.containerEl.querySelectorAll('input[type="password"]')
    );
    expect(passwordInputs.length).toBeGreaterThanOrEqual(3);
  });

  describe("testTikzServerConnection", () => {
    it("サーバー URL が未設定の場合はエラー Notice を表示して中断する。", async () => {
      plugin.settings.tikz.serverUrl = "";
      const buttonMock = {
        setDisabled: vi.fn(),
        setButtonText: vi.fn(),
      };

      await settingTab.testTikzServerConnection(buttonMock);

      expect(buttonMock.setDisabled).not.toHaveBeenCalled();
      expect(buttonMock.setButtonText).not.toHaveBeenCalled();
    });

    it("サーバーへの接続が成功した場合はバージョン情報付きの Notice を表示する。", async () => {
      plugin.settings.tikz.serverUrl = "https://tikz.example.com/";
      plugin.settings.tikz.apiKey = "secret-token";

      const buttonMock = {
        setDisabled: vi.fn(),
        setButtonText: vi.fn(),
      };

      const requestUrlSpy = vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        json: { status: "ok", version: "0.0.2" },
        text: '{"status":"ok","version":"0.0.2"}',
      });

      await settingTab.testTikzServerConnection(buttonMock);

      expect(requestUrlSpy).toHaveBeenCalledWith({
        url: "https://tikz.example.com/health",
        method: "GET",
        headers: {
          Authorization: "Bearer secret-token",
        },
      });

      expect(buttonMock.setDisabled).toHaveBeenCalledWith(true);
      expect(buttonMock.setDisabled).toHaveBeenLastCalledWith(false);
      expect(buttonMock.setButtonText).toHaveBeenCalledWith("テスト中...");
      expect(buttonMock.setButtonText).toHaveBeenLastCalledWith("接続テストを実行");
    });

    it("サーバーがエラー応答 (500) を返した場合はエラーステータスの Notice を表示する。", async () => {
      plugin.settings.tikz.serverUrl = "https://tikz.example.com";
      plugin.settings.tikz.apiKey = "";

      const buttonMock = {
        setDisabled: vi.fn(),
        setButtonText: vi.fn(),
      };

      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 500,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        json: { status: "error" },
        text: '{"status":"error"}',
      });

      await settingTab.testTikzServerConnection(buttonMock);

      expect(buttonMock.setDisabled).toHaveBeenLastCalledWith(false);
      expect(buttonMock.setButtonText).toHaveBeenLastCalledWith("接続テストを実行");
    });

    it("通信例外 (ネットワークエラー等) が発生した場合は例外メッセージの Notice を表示する。", async () => {
      plugin.settings.tikz.serverUrl = "https://tikz.example.com";

      const buttonMock = {
        setDisabled: vi.fn(),
        setButtonText: vi.fn(),
      };

      vi.mocked(requestUrl).mockRejectedValueOnce(new Error("Connection refused"));

      await settingTab.testTikzServerConnection(buttonMock);

      expect(buttonMock.setDisabled).toHaveBeenLastCalledWith(false);
      expect(buttonMock.setButtonText).toHaveBeenLastCalledWith("接続テストを実行");
    });
  });
});
