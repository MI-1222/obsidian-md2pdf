import { describe, it, expect, vi } from "vitest";
import Md2PdfPlugin from "@/main";
import { App } from "obsidian";

/**
 * プラグイン初期化およびライフサイクルのテストスイート。
 */
describe("Md2PdfPlugin", () => {
  it("プラグインインスタンスが正常に生成され、onload および onunload が呼び出し可能であること。", async () => {
    const mockApp = new App();
    const mockManifest = {
      id: "obsidian-md2pdf",
      name: "Markdown to PDF Export",
      version: "0.1.0",
      minAppVersion: "1.4.0",
      description: "Test plugin",
      author: "MI-1222",
      isDesktopOnly: false,
    };

    const plugin = new Md2PdfPlugin(mockApp, mockManifest);
    expect(plugin).toBeDefined();

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await plugin.onload();
    expect(consoleSpy).toHaveBeenCalledWith("Loading obsidian-md2pdf plugin.");

    plugin.onunload();
    expect(consoleSpy).toHaveBeenCalledWith("Unloading obsidian-md2pdf plugin.");

    consoleSpy.mockRestore();
  });
});
