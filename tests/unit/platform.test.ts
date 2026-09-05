import { describe, it, expect, beforeEach } from "vitest";
import { Platform } from "obsidian";
import { AppPlatform } from "@/utils/platform";

describe("AppPlatform", () => {
  beforeEach(() => {
    Platform.isDesktop = true;
    Platform.isMobile = false;
    Platform.isMacOS = false;
    Platform.isWin = false;
    Platform.isLinux = false;
    Platform.isIosApp = false;
    Platform.isAndroidApp = false;
    Platform.isSafari = false;
  });

  it("macOS デスクトップ環境を正しく判定する。", () => {
    Platform.isDesktop = true;
    Platform.isMobile = false;
    Platform.isMacOS = true;

    expect(AppPlatform.isDesktop()).toBe(true);
    expect(AppPlatform.isMobile()).toBe(false);
    expect(AppPlatform.isMacOS()).toBe(true);
    expect(AppPlatform.isWindows()).toBe(false);
    expect(AppPlatform.isLinux()).toBe(false);
    expect(AppPlatform.getPlatformName()).toBe("macOS");
  });

  it("Windows デスクトップ環境を正しく判定する。", () => {
    Platform.isDesktop = true;
    Platform.isMobile = false;
    Platform.isWin = true;

    expect(AppPlatform.isDesktop()).toBe(true);
    expect(AppPlatform.isWindows()).toBe(true);
    expect(AppPlatform.isMacOS()).toBe(false);
    expect(AppPlatform.getPlatformName()).toBe("Windows");
  });

  it("Linux デスクトップ環境を正しく判定する。", () => {
    Platform.isDesktop = true;
    Platform.isMobile = false;
    Platform.isLinux = true;

    expect(AppPlatform.isDesktop()).toBe(true);
    expect(AppPlatform.isLinux()).toBe(true);
    expect(AppPlatform.getPlatformName()).toBe("Linux");
  });

  it("iOS モバイル環境を正しく判定する。", () => {
    Platform.isDesktop = false;
    Platform.isMobile = true;
    Platform.isIosApp = true;

    expect(AppPlatform.isDesktop()).toBe(false);
    expect(AppPlatform.isMobile()).toBe(true);
    expect(AppPlatform.isIOS()).toBe(true);
    expect(AppPlatform.isAndroid()).toBe(false);
    expect(AppPlatform.getPlatformName()).toBe("iOS");
  });

  it("Android モバイル環境を正しく判定する。", () => {
    Platform.isDesktop = false;
    Platform.isMobile = true;
    Platform.isAndroidApp = true;

    expect(AppPlatform.isDesktop()).toBe(false);
    expect(AppPlatform.isMobile()).toBe(true);
    expect(AppPlatform.isIOS()).toBe(false);
    expect(AppPlatform.isAndroid()).toBe(true);
    expect(AppPlatform.getPlatformName()).toBe("Android");
  });

  it("Safari ブラウザ環境を正しく判定する。", () => {
    Platform.isSafari = true;

    expect(AppPlatform.isSafari()).toBe(true);
  });
});
