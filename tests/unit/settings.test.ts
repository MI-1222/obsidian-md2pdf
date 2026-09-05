import { describe, it, expect, vi } from "vitest";
import { App, type PluginManifest } from "obsidian";
import Md2PdfPlugin from "@/main";
import { DEFAULT_SETTINGS, type Md2PdfSettings } from "@/settings";
import { deepMerge } from "@/utils/object";

/**
 * プラグインマニフェストのモック。
 *
 * 本来は `manifest.json` の内容だが、テスト用の最小限の定義に留めている。
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

describe("deepMerge", () => {
  it("空のオブジェクトや undefined を渡した場合にターゲットオブジェクトをそのまま返す。", () => {
    const target = { a: 1, b: { c: "hello" } };
    expect(deepMerge(target, undefined)).toEqual(target);
    expect(deepMerge(target, {})).toEqual(target);
  });

  it("ネストされたプロパティを部分的に正しく上書きする。", () => {
    const target = {
      tikz: { serverUrl: "", timeoutMs: 30000 },
      pdf: { format: "A4", printBackground: true },
    };
    const source = {
      tikz: { serverUrl: "https://example.com" },
    };
    const result = deepMerge(target, source);

    expect(result).toEqual({
      tikz: { serverUrl: "https://example.com", timeoutMs: 30000 },
      pdf: { format: "A4", printBackground: true },
    });
  });

  it("新しいプロパティを追加し、既存の未設定プロパティにはデフォルト値を保持する。", () => {
    const target = {
      integrations: {
        plantuml: { serverUrl: "https://plantuml.com" },
        gdrive: { clientId: "", clientSecret: "", refreshToken: "" },
      },
    };
    const source = {
      integrations: {
        gdrive: { clientId: "custom-id" },
      },
    };
    const result = deepMerge(target, source);

    expect(result.integrations.gdrive.clientId).toBe("custom-id");
    expect(result.integrations.gdrive.clientSecret).toBe("");
    expect(result.integrations.plantuml.serverUrl).toBe("https://plantuml.com");
  });

  it("プリミティブ値や非オブジェクトが渡された場合も安全に処理する。", () => {
    expect(deepMerge(123 as unknown as object, 456)).toBe(456);
    expect(deepMerge("foo" as unknown as object, undefined)).toBe("foo");
    expect(deepMerge({ a: 1 }, null)).toEqual({ a: 1 });
  });
});

describe("DEFAULT_SETTINGS", () => {
  it("デフォルト値が期待通りの初期構造を持つ。", () => {
    expect(DEFAULT_SETTINGS.tikz.serverUrl).toBe("");
    expect(DEFAULT_SETTINGS.tikz.apiKey).toBe("");
    expect(DEFAULT_SETTINGS.tikz.useRemoteOnMobile).toBe(true);
    expect(DEFAULT_SETTINGS.tikz.fallbackToRemoteOnPc).toBe(true);
    expect(DEFAULT_SETTINGS.tikz.timeoutMs).toBe(30000);

    expect(DEFAULT_SETTINGS.pdf.format).toBe("A4");
    expect(DEFAULT_SETTINGS.pdf.orientation).toBe("portrait");
    expect(DEFAULT_SETTINGS.pdf.margin).toEqual({
      top: "15mm",
      right: "15mm",
      bottom: "15mm",
      left: "15mm",
    });
    expect(DEFAULT_SETTINGS.pdf.printBackground).toBe(true);
    expect(DEFAULT_SETTINGS.pdf.displayHeaderFooter).toBe(false);

    expect(DEFAULT_SETTINGS.style.theme).toBe("github-light");
    expect(DEFAULT_SETTINGS.style.highlightTheme).toBe("github");
    expect(DEFAULT_SETTINGS.style.customCss).toBe("");
    expect(DEFAULT_SETTINGS.style.breaks).toBe(false);

    expect(DEFAULT_SETTINGS.integrations.plantuml.serverUrl).toBe(
      "https://www.plantuml.com/plantuml"
    );
    expect(DEFAULT_SETTINGS.integrations.gdrive).toEqual({
      clientId: "",
      clientSecret: "",
      refreshToken: "",
    });
  });
});

describe("Md2PdfPlugin Settings Management", () => {
  it("保存データが存在しない場合はデフォルト設定が読み込まれる。", async () => {
    const app = new App();
    const plugin = new Md2PdfPlugin(app, mockManifest);

    vi.spyOn(plugin, "loadData").mockResolvedValue(null);

    await plugin.onload();

    expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("保存データが存在する場合はデフォルト設定とディープマージされる。", async () => {
    const app = new App();
    const plugin = new Md2PdfPlugin(app, mockManifest);

    const savedData: Partial<Md2PdfSettings> = {
      tikz: {
        serverUrl: "https://tikz.example.com",
        apiKey: "secret-key",
        useRemoteOnMobile: false,
        fallbackToRemoteOnPc: true,
        timeoutMs: 60000,
      },
      style: {
        theme: "tomorrow",
        highlightTheme: "tomorrow",
        customCss: "body { font-size: 14px; }",
        breaks: true,
      },
    };

    vi.spyOn(plugin, "loadData").mockResolvedValue(savedData);

    await plugin.loadSettings();

    expect(plugin.settings.tikz.serverUrl).toBe("https://tikz.example.com");
    expect(plugin.settings.tikz.apiKey).toBe("secret-key");
    expect(plugin.settings.tikz.useRemoteOnMobile).toBe(false);
    expect(plugin.settings.tikz.timeoutMs).toBe(60000);
    expect(plugin.settings.style.theme).toBe("tomorrow");
    expect(plugin.settings.style.breaks).toBe(true);
    // 未設定の項目はデフォルト値が維持されていること。
    expect(plugin.settings.pdf.format).toBe("A4");
    expect(plugin.settings.integrations.plantuml.serverUrl).toBe(
      "https://www.plantuml.com/plantuml"
    );
  });

  it("saveSettings の呼び出しで saveData が正しい引数で実行される。", async () => {
    const app = new App();
    const plugin = new Md2PdfPlugin(app, mockManifest);
    const saveDataSpy = vi.spyOn(plugin, "saveData").mockResolvedValue();

    plugin.settings.tikz.serverUrl = "https://saved.example.com";
    await plugin.saveSettings();

    expect(saveDataSpy).toHaveBeenCalledWith(plugin.settings);
  });
});
