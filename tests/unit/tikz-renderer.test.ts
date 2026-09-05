import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestUrl } from "obsidian";
import {
  renderTikzRemote,
  renderTikzToSvg,
  processTikzPlaceholders,
  clearTikzCache,
  getTikzCacheSize,
  tikzEngine,
} from "../../src/compiler/renderers/tikz";
import { MarkdownCompiler } from "../../src/compiler/markdown-compiler";
import { AppPlatform } from "../../src/utils/platform";

vi.mock("obsidian", () => ({
  requestUrl: vi.fn(),
  Platform: {
    isDesktop: true,
    isMobile: false,
    isIosApp: false,
    isAndroidApp: false,
    isMacOS: true,
    isWin: false,
    isLinux: false,
    isSafari: false,
  },
}));

describe("TikZ Hybrid Renderer", () => {
  /** テスト用の代表的な TikZ コードブロック。 */
  const sampleTikzCode = `\\begin{tikzpicture}\n  \\draw (0,0) circle (1cm);\n\\end{tikzpicture}`;

  /** モック用ダミー SVG 文字列。 */
  const mockSvg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';

  beforeEach(() => {
    vi.clearAllMocks();
    clearTikzCache();
    // デフォルトでデスクトップ環境とする。
    (AppPlatform as unknown as { isDesktop: () => boolean }).isDesktop = () => true;
    (AppPlatform as unknown as { isMobile: () => boolean }).isMobile = () => false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("renderTikzRemote", () => {
    it("200 成功時に SVG 文字列を正しく返却する。", async () => {
      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: JSON.stringify({
          status: "success",
          format: "svg",
          svg: mockSvg,
          cached: false,
          hash: "abc123hash",
          compile_time_ms: 120,
        }),
        json: {
          status: "success",
          format: "svg",
          svg: mockSvg,
          cached: false,
          hash: "abc123hash",
          compile_time_ms: 120,
        },
      });

      /** 生成された SVG 文字列。 */
      const svg = await renderTikzRemote(sampleTikzCode, {
        serverUrl: "https://tikz.example.com",
        apiKey: "secret-key-123",
        preamble: "\\usetikzlibrary{arrows}",
        timeoutMs: 5000,
      });

      expect(svg).toBe(mockSvg);
      expect(requestUrl).toHaveBeenCalledTimes(1);
      expect(requestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://tikz.example.com/api/v1/render/tikz",
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-Key": "secret-key-123",
          }),
          body: JSON.stringify({
            code: sampleTikzCode,
            format: "svg",
            preamble: "\\usetikzlibrary{arrows}",
            timeout_ms: 5000,
          }),
        })
      );
    });

    it("422 TeX コンパイルエラー時にログ付きの例外をスローする。", async () => {
      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 422,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "error",
          error_code: "COMPILATION_FAILED",
          message: "uplatex compilation failed",
          log: "! Package pgfkeys Error: I do not know the key...",
        },
      });

      await expect(
        renderTikzRemote(sampleTikzCode, { serverUrl: "https://tikz.example.com" })
      ).rejects.toThrow(/TikZ compilation failed: uplatex compilation failed/);
    });

    it("500 / 504 / ネットワークエラー時に適切な例外をスローする。", async () => {
      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 504,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "error",
          error_code: "TIMEOUT",
          message: "Rendering timed out",
        },
      });

      await expect(
        renderTikzRemote(sampleTikzCode, { serverUrl: "https://tikz.example.com" })
      ).rejects.toThrow(/Remote TikZ rendering failed \(504\): Rendering timed out/);
    });
  });

  describe("renderTikzToSvg (統合ハイブリッド実行)", () => {
    it("キャッシュが機能し、同一コードの 2 回目の呼び出しではリクエストを行わない。", async () => {
      vi.mocked(requestUrl).mockResolvedValue({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "success",
          svg: mockSvg,
        },
      });

      /** リモート優先テスト用オプション。 */
      const options = {
        preferLocalOnDesktop: false,
        serverUrl: "https://tikz.example.com",
      };

      /** 初回レンダリング結果 HTML。 */
      const result1 = await renderTikzToSvg(sampleTikzCode, options);
      expect(result1).toContain(mockSvg);
      expect(getTikzCacheSize()).toBe(1);
      expect(requestUrl).toHaveBeenCalledTimes(1);

      /** 2回目レンダリング結果 HTML (キャッシュ取得)。 */
      const result2 = await renderTikzToSvg(sampleTikzCode, options);
      expect(result2).toBe(result1);
      expect(requestUrl).toHaveBeenCalledTimes(1); // 2回目はキャッシュから返るため呼ばれない。

      clearTikzCache();
      expect(getTikzCacheSize()).toBe(0);
    });

    it("モバイル環境ではローカルを試行せず常にリモート API を呼び出す。", async () => {
      (AppPlatform as unknown as { isDesktop: () => boolean }).isDesktop = () => false;
      (AppPlatform as unknown as { isMobile: () => boolean }).isMobile = () => true;

      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "success",
          svg: mockSvg,
        },
      });

      /** モバイル環境でのレンダリング結果 HTML。 */
      const html = await renderTikzToSvg(sampleTikzCode, {
        serverUrl: "https://mobile-tikz.example.com",
      });

      expect(html).toContain(mockSvg);
      expect(requestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://mobile-tikz.example.com/api/v1/render/tikz",
        })
      );
    });

    it("デスクトップ環境でローカル実行が可能な場合はローカルで SVG を生成する。", async () => {
      /** ローカル実行スパイモック。 */
      const localSpy = vi
        .spyOn(tikzEngine, "renderLocal")
        .mockResolvedValueOnce('<svg id="local-svg"><circle/></svg>');

      /** ローカル実行結果 HTML。 */
      const html = await renderTikzToSvg(sampleTikzCode, {
        preferLocalOnDesktop: true,
      });

      expect(html).toContain('<svg id="local-svg"><circle/></svg>');
      expect(localSpy).toHaveBeenCalledWith(sampleTikzCode, expect.anything());
      expect(requestUrl).not.toHaveBeenCalled();
    });

    it("デスクトップ環境でローカル実行に失敗した場合、fallbackToRemoteOnPc が true ならリモートへフォールバックする。", async () => {
      vi.spyOn(tikzEngine, "renderLocal").mockRejectedValueOnce(
        new Error("uplatex command not found")
      );

      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "success",
          svg: mockSvg,
        },
      });

      /** フォールバック後のレンダリング結果 HTML。 */
      const html = await renderTikzToSvg(sampleTikzCode, {
        preferLocalOnDesktop: true,
        fallbackToRemoteOnPc: true,
        serverUrl: "https://fallback.example.com",
      });

      expect(html).toContain(mockSvg);
      expect(requestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://fallback.example.com/api/v1/render/tikz",
        })
      );
    });

    it("エラー発生時は例外を投げずにエラー表示 HTML を返す。", async () => {
      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 500,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "Internal Error",
        json: {
          status: "error",
          message: "Internal TeX server error",
        },
      });

      /** エラーフォールバック HTML。 */
      const html = await renderTikzToSvg(sampleTikzCode, {
        preferLocalOnDesktop: false,
      });

      expect(html).toContain('class="md2pdf-tikz-container md2pdf-tikz-error"');
      expect(html).toContain("TikZ Render Error:");
      expect(html).toContain("Internal TeX server error");
      expect(html).toContain(sampleTikzCode);
    });
  });

  describe("processTikzPlaceholders", () => {
    it("HTML 内のプレースホルダーを正しく検出し、SVG に置換する。", async () => {
      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "success",
          svg: mockSvg,
        },
      });

      /** URL エンコードされた TikZ コード。 */
      const encoded = encodeURIComponent(sampleTikzCode);
      /** プレースホルダーを含む入力 HTML。 */
      const inputHtml = `<p>Before</p><div class="md2pdf-tikz-placeholder" data-code="${encoded}"></div><p>After</p>`;

      /** 置換完了後の HTML。 */
      const result = await processTikzPlaceholders(inputHtml, {
        preferLocalOnDesktop: false,
      });

      expect(result).toContain("<p>Before</p>");
      expect(result).toContain(mockSvg);
      expect(result).toContain("<p>After</p>");
      expect(result).not.toContain("md2pdf-tikz-placeholder");
    });
  });

  describe("MarkdownCompiler 統合テスト", () => {
    it("```tikz フェンスブロックが renderAsync で SVG に置換される。", async () => {
      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "success",
          svg: mockSvg,
        },
      });

      /** テスト用 Markdown コンパイラインスタンス。 */
      const compiler = new MarkdownCompiler({
        tikz: { preferLocalOnDesktop: false },
      });

      /** 入力 Markdown テキスト。 */
      const md = `# TikZ Diagram

\`\`\`tikz
\\begin{tikzpicture}
  \\draw (0,0) -- (1,1);
\\end{tikzpicture}
\`\`\`
`;

      /** 非同期レンダリング結果 HTML。 */
      const html = await compiler.renderAsync(md);
      expect(html).toContain("<h1");
      expect(html).toContain(mockSvg);
      expect(html).toContain('class="md2pdf-tikz-container"');
    });

    it("```latex 内に \\begin{tikzpicture} がある場合も SVG に置換される。", async () => {
      vi.mocked(requestUrl).mockResolvedValueOnce({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        text: "",
        json: {
          status: "success",
          svg: mockSvg,
        },
      });

      /** テスト用 Markdown コンパイラインスタンス。 */
      const compiler = new MarkdownCompiler({
        tikz: { preferLocalOnDesktop: false },
      });

      /** 入力 Markdown テキスト。 */
      const md = `\`\`\`latex
\\begin{tikzpicture}
  \\node {Hello};
\\end{tikzpicture}
\`\`\``;

      /** 非同期レンダリング結果 HTML。 */
      const html = await compiler.renderAsync(md);
      expect(html).toContain(mockSvg);
    });

    it("```latex 内に \\begin{tikzpicture} がない場合は通常のコードブロックとして出力される。", async () => {
      /** テスト用 Markdown コンパイラインスタンス。 */
      const compiler = new MarkdownCompiler();
      /** 入力 Markdown テキスト。 */
      const md = `\`\`\`latex
\\documentclass{article}
\\begin{document}
Plain text
\\end{document}
\`\`\``;

      /** 非同期レンダリング結果 HTML。 */
      const html = await compiler.renderAsync(md);
      expect(html).not.toContain("md2pdf-tikz-container");
      expect(html).toContain("<pre><code");
      expect(html).toContain("Plain text");
      expect(requestUrl).not.toHaveBeenCalled();
    });
  });
});
