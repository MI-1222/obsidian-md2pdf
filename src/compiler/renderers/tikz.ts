import { requestUrl } from "obsidian";
import { AppPlatform } from "../../utils/platform";
import type { TikzRenderOptions } from "../types";
import type { components } from "../../types/tikz-api";

/** デフォルトの TikZ レンダリングサーバー URL。 */
export const DEFAULT_TIKZ_SERVER = "http://localhost:8080";

/** TikZ レンダリング結果のインメモリキャッシュ (Key: コードと設定の複合文字列, Value: SVG 文字列)。 */
const tikzCache = new Map<string, string>();

/**
 * HTML 特殊文字をエスケープする。
 *
 * @param text - エスケープ対象の文字列。
 * @returns エスケープされた文字列。
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * キャッシュキーを生成する。
 *
 * @param code - TikZ コード。
 * @param preamble - LaTeX プリアンブル。
 * @returns キャッシュキー。
 */
function createCacheKey(code: string, preamble?: string): string {
  return `${preamble || ""}:::${code.trim()}`;
}

/**
 * TikZ キャッシュをクリアする。
 */
export function clearTikzCache(): void {
  tikzCache.clear();
}

/**
 * 現在保持している TikZ キャッシュの件数を取得する。
 *
 * @returns キャッシュ件数。
 */
export function getTikzCacheSize(): number {
  return tikzCache.size;
}

/**
 * リモートの tex-tikz-server API を呼び出して TikZ を SVG に変換する。
 *
 * @param code - TikZ コード。
 * @param options - レンダラー設定オプション。
 * @returns 生成された SVG 文字列。
 */
export async function renderTikzRemote(
  code: string,
  options: TikzRenderOptions = {}
): Promise<string> {
  /** サーバーベース URL。 */
  const serverUrl = (options.serverUrl || DEFAULT_TIKZ_SERVER).replace(/\/+$/, "");
  /** レンダリング API エンドポイント。 */
  const endpoint = `${serverUrl}/api/v1/render/tikz`;
  /** リクエストタイムアウト時間 (ms)。 */
  const timeoutMs = options.timeoutMs ?? 10000;

  /** HTTP リクエストヘッダー。 */
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.apiKey && options.apiKey.trim() !== "") {
    headers["X-API-Key"] = options.apiKey.trim();
  }

  /** API リクエストボディ。 */
  const requestBody: components["schemas"]["RenderTikzRequest"] = {
    code,
    format: "svg",
    preamble: options.preamble,
    timeout_ms: timeoutMs,
  };

  /** HTTP レスポンス。 */
  const response = await requestUrl({
    url: endpoint,
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
    throw: false,
  });

  if (response.status === 200) {
    const data = response.json as components["schemas"]["RenderTikzResponse"];
    if (data && data.svg) {
      return data.svg;
    }
    throw new Error("Invalid response format: missing SVG content.");
  }

  if (response.status === 422) {
    const data = response.json as components["schemas"]["CompileErrorResponse"];
    const logDetails = data?.log ? `\nLog:\n${data.log}` : "";
    throw new Error(
      `TikZ compilation failed: ${data?.message || "Unknown compile error"}${logDetails}`
    );
  }

  const errorData = response.json as components["schemas"]["ErrorResponse"];
  const errorMessage =
    errorData?.message || `HTTP ${response.status}: ${response.text || "Request failed"}`;
  throw new Error(`Remote TikZ rendering failed (${response.status}): ${errorMessage}`);
}

/**
 * デスクトップ環境でローカルの TeX コマンド (uplatex -> dvisvgm) を実行して SVG を生成する。
 *
 * @param code - TikZ コード。
 * @param options - レンダラー設定オプション。
 * @returns 生成された SVG 文字列。
 */
export async function renderTikzLocal(
  code: string,
  options: TikzRenderOptions = {}
): Promise<string> {
  // Node.js 環境でなければ実行不可
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new Error("Local TeX compilation is only supported in desktop Node.js environment.");
  }

  /* eslint-disable @typescript-eslint/no-require-imports */
  const fs = require("fs");
  const path = require("path");
  const os = require("os");
  const { execFile } = require("child_process");
  /* eslint-enable @typescript-eslint/no-require-imports */

  /** 作業用一時ディレクトリパス。 */
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "md2pdf-tikz-"));
  /** 一時 TeX ファイルパス。 */
  const texFile = path.join(tempDir, "document.tex");
  /** 一時 DVI ファイルパス。 */
  const dviFile = path.join(tempDir, "document.dvi");
  /** 出力 SVG ファイルパス。 */
  const svgFile = path.join(tempDir, "document.svg");

  /** 追加プリアンブル定義。 */
  const preamble = options.preamble ? `${options.preamble}\n` : "";
  /** コンパイル対象の完全な LaTeX ドキュメントソース。 */
  const texSource = `\\documentclass[dvisvgm]{standalone}
\\usepackage{tikz}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
${preamble}\\begin{document}
${code}
\\end{document}
`;

  try {
    fs.writeFileSync(texFile, texSource, "utf-8");

    /** 外部コマンドを Promise 化して実行するヘルパー関数。 */
    const execPromise = (cmd: string, args: string[], cwd: string, timeout: number) => {
      return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        execFile(
          cmd,
          args,
          { cwd, timeout },
          (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
              reject(error);
            } else {
              resolve({ stdout, stderr });
            }
          }
        );
      });
    };

    /** タイムアウト設定値 (ms)。 */
    const timeout = options.timeoutMs ?? 10000;

    // 1. uplatex による DVI コンパイル。
    await execPromise(
      "uplatex",
      ["-interaction=nonstopmode", "-halt-on-error", "document.tex"],
      tempDir,
      timeout
    );

    // 2. dvisvgm による SVG 変換。
    await execPromise(
      "dvisvgm",
      ["--no-fonts", "--exact", "document.dvi", "-o", "document.svg"],
      tempDir,
      timeout
    );

    if (fs.existsSync(svgFile)) {
      const svgContent = fs.readFileSync(svgFile, "utf-8");
      return svgContent;
    }

    throw new Error("SVG output file was not generated.");
  } finally {
    // 一時ファイルのクリーンアップ。
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // クリーンアップエラーは無視する。
    }
  }
}

/** TikZ レンダリング実行ハンドラ群 (テスト時のモック注入・スパイ対応)。 */
export const tikzEngine = {
  renderLocal: renderTikzLocal,
  renderRemote: renderTikzRemote,
};

/**
 * TikZ コードを SVG に変換する（キャッシュ・プラットフォーム判定・ハイブリッドフォールバック対応）。
 *
 * @param code - TikZ コード。
 * @param options - レンダラー設定オプション。
 * @returns レンダリングされた SVG またはエラー表示コンテナ HTML。
 */
export async function renderTikzToSvg(
  code: string,
  options: TikzRenderOptions = {}
): Promise<string> {
  /** キャッシュ参照キー。 */
  const cacheKey = createCacheKey(code, options.preamble);
  /** キャッシュ済み SVG。 */
  const cachedSvg = tikzCache.get(cacheKey);
  if (cachedSvg) {
    return cachedSvg;
  }

  /** デスクトップ環境フラグ。 */
  const isDesktop = AppPlatform.isDesktop();
  /** デスクトップでローカル実行を優先するかどうかのフラグ。 */
  const preferLocal = options.preferLocalOnDesktop ?? true;
  /** ローカル失敗時にリモートへフォールバックするかどうかのフラグ。 */
  const fallbackToRemote = options.fallbackToRemoteOnPc ?? true;

  try {
    let svg: string;

    if (isDesktop && preferLocal) {
      try {
        svg = await tikzEngine.renderLocal(code, options);
      } catch (localError) {
        if (fallbackToRemote) {
          console.warn(
            "[obsidian-md2pdf] Local TikZ rendering failed, falling back to remote server:",
            localError
          );
          svg = await tikzEngine.renderRemote(code, options);
        } else {
          throw localError;
        }
      }
    } else {
      svg = await tikzEngine.renderRemote(code, options);
    }

    /** コンテナでラップされた SVG HTML。 */
    const wrappedHtml = `<div class="md2pdf-tikz-container" align="center">${svg}</div>`;
    tikzCache.set(cacheKey, wrappedHtml);
    return wrappedHtml;
  } catch (error) {
    console.error("[obsidian-md2pdf] TikZ render error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `<div class="md2pdf-tikz-container md2pdf-tikz-error" align="center"><pre class="md2pdf-error-log">TikZ Render Error: ${escapeHtml(
      errorMessage
    )}</pre><pre><code class="language-tikz">${escapeHtml(code)}</code></pre></div>`;
  }
}

/**
 * HTML 内の TikZ プレースホルダーを非同期に検出し、実際の SVG またはエラー HTML に一括置換する。
 *
 * @param html - 置換対象の HTML 文字列。
 * @param options - TikZ レンダラー設定オプション。
 * @returns プレースホルダーが置換された HTML 文字列。
 */
export async function processTikzPlaceholders(
  html: string,
  options: TikzRenderOptions = {}
): Promise<string> {
  /** プレースホルダー検出用正規表現。 */
  const placeholderRegex =
    /<div\s+class="md2pdf-tikz-placeholder"\s+data-code="([^"]*)"\s*><\/div>/g;

  /** マッチしたプレースホルダー情報の配列。 */
  const matches: Array<{ fullMatch: string; code: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(html)) !== null) {
    const encodedCode = match[1];
    const code = decodeURIComponent(encodedCode);
    matches.push({
      fullMatch: match[0],
      code,
    });
  }

  if (matches.length === 0) {
    return html;
  }

  /** 置換後の HTML 文字列。 */
  let resultHtml = html;
  for (const item of matches) {
    const rendered = await renderTikzToSvg(item.code, options);
    resultHtml = resultHtml.replace(item.fullMatch, rendered);
  }

  return resultHtml;
}
