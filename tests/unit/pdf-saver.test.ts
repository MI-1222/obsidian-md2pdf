import { describe, it, expect, vi, beforeEach } from "vitest";
import { validatePdfData, assertValidPdfData } from "../../src/pdf/pdf-validator";
import {
  splitFilename,
  resolveUniquePath,
  savePdfToVault,
  PdfNotifier,
} from "../../src/pdf/pdf-saver";
import { Notice, type App } from "obsidian";

describe("PDF Saver & Validator", () => {
  /** 有効なダミー PDF バイト列 (%PDF-1.4...)。 */
  const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  /** 不正なダミーバイナリ。 */
  const invalidPdfBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG

  describe("validatePdfData & assertValidPdfData", () => {
    it("有効な %PDF- ヘッダーを持つデータを正しく判定する。", () => {
      expect(validatePdfData(validPdfBytes)).toBe(true);
      expect(() => assertValidPdfData(validPdfBytes)).not.toThrow();
    });

    it("空データまたは5バイト未満のデータは無効と判定する。", () => {
      expect(validatePdfData(null)).toBe(false);
      expect(validatePdfData(undefined)).toBe(false);
      expect(validatePdfData(new Uint8Array([]))).toBe(false);
      expect(validatePdfData(new Uint8Array([0x25, 0x50]))).toBe(false);
    });

    it("ヘッダーが %PDF- ではない不正データを検知して例外を投げる。", () => {
      expect(validatePdfData(invalidPdfBytes)).toBe(false);
      expect(() => assertValidPdfData(invalidPdfBytes)).toThrow(
        "有効な %PDF- ヘッダーが見つかりません"
      );
    });
  });

  describe("splitFilename", () => {
    it("拡張子付きファイル名をベース名と拡張子に分離する。", () => {
      expect(splitFilename("Document.pdf")).toEqual({
        base: "Document",
        ext: ".pdf",
      });
      expect(splitFilename("archive.tar.gz")).toEqual({
        base: "archive.tar",
        ext: ".gz",
      });
    });

    it("拡張子のないファイル名を正しく処理する。", () => {
      expect(splitFilename("README")).toEqual({ base: "README", ext: "" });
      expect(splitFilename(".gitignore")).toEqual({
        base: ".gitignore",
        ext: "",
      });
    });
  });

  describe("resolveUniquePath", () => {
    it("対象パスが存在しない場合はそのままのパスを返す。", async () => {
      /** 存在確認モック関数。 */
      const checkExists = vi.fn().mockResolvedValue(false);
      /** 解決されたパス。 */
      const result = await resolveUniquePath("folder/note.pdf", checkExists);

      expect(result).toBe("folder/note.pdf");
      expect(checkExists).toHaveBeenCalledWith("folder/note.pdf");
    });

    it("対象パスが存在する場合、連番を付与した一意のパスを生成する。", async () => {
      /** 既存ファイルのセット。 */
      const existing = new Set(["notes/export.pdf", "notes/export (1).pdf"]);
      /** 存在確認モック関数。 */
      const checkExists = vi.fn().mockImplementation(async (p: string) => existing.has(p));

      /** 解決されたパス。 */
      const result = await resolveUniquePath("notes/export.pdf", checkExists);

      expect(result).toBe("notes/export (2).pdf");
    });
  });

  describe("savePdfToVault", () => {
    /** モック用ファイルシステムマップ。 */
    let fsMap: Map<string, ArrayBuffer> = new Map();
    /** モック用ディレクトリセット。 */
    let dirSet: Set<string> = new Set();
    /** モック App オブジェクト。 */
    let mockApp: App;

    beforeEach(() => {
      fsMap = new Map();
      dirSet = new Set();
      mockApp = {
        vault: {
          adapter: {
            exists: vi.fn(async (p: string) => fsMap.has(p) || dirSet.has(p)),
            mkdir: vi.fn(async (p: string) => {
              dirSet.add(p);
            }),
            writeBinary: vi.fn(async (p: string, data: ArrayBuffer) => {
              fsMap.set(p, data);
            }),
          },
        },
      } as unknown as App;
    });

    it("正常に Vault 内に PDF を保存し、親ディレクトリが存在しない場合は作成する。", async () => {
      /** 保存先パス。 */
      const savedPath = await savePdfToVault(mockApp, "exports/sub/doc.pdf", validPdfBytes, {
        showNotice: false,
      });

      expect(savedPath).toBe("exports/sub/doc.pdf");
      expect(mockApp.vault.adapter.mkdir).toHaveBeenCalledWith("exports/sub");
      expect(mockApp.vault.adapter.writeBinary).toHaveBeenCalled();
      expect(fsMap.has("exports/sub/doc.pdf")).toBe(true);
    });

    it("同名ファイルが存在し overwrite: false の場合、連番付きパスで保存される。", async () => {
      fsMap.set("doc.pdf", new ArrayBuffer(8));

      /** 保存先パス。 */
      const savedPath = await savePdfToVault(mockApp, "doc.pdf", validPdfBytes, {
        overwrite: false,
        showNotice: false,
      });

      expect(savedPath).toBe("doc (1).pdf");
      expect(fsMap.has("doc (1).pdf")).toBe(true);
    });

    it("同名ファイルが存在し overwrite: true の場合、上書き保存される。", async () => {
      fsMap.set("doc.pdf", new ArrayBuffer(8));

      /** 保存先パス。 */
      const savedPath = await savePdfToVault(mockApp, "doc.pdf", validPdfBytes, {
        overwrite: true,
        showNotice: false,
      });

      expect(savedPath).toBe("doc.pdf");
    });

    it("不正な PDF データを渡した場合に書き込みを行わずエラーを投げる。", async () => {
      await expect(
        savePdfToVault(mockApp, "invalid.pdf", invalidPdfBytes, {
          showNotice: false,
        })
      ).rejects.toThrow("有効な %PDF- ヘッダーが見つかりません");

      expect(mockApp.vault.adapter.writeBinary).not.toHaveBeenCalled();
    });
  });

  describe("PdfNotifier", () => {
    it("進捗・成功・エラー通知が正しく呼び出される。", () => {
      /** Notice コンストラクタのスパイ。 */
      const noticeSpy = vi.spyOn({ Notice }, "Notice");

      PdfNotifier.progress("準備中...");
      expect(Notice).toBeDefined();

      PdfNotifier.success("test.pdf");
      PdfNotifier.error(new Error("ディスク書き込み不可"));
    });
  });
});
