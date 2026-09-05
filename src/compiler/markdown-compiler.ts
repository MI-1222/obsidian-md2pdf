import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import markdownItMathjax3 from "markdown-it-mathjax3";
import markdownItGithubAlerts from "markdown-it-github-alerts";
import markdownItCheckbox from "markdown-it-checkbox";
import markdownItContainer from "markdown-it-container";
import markdownItNamedHeaders from "markdown-it-named-headers";

import type { MarkdownCompilerOptions } from "./types";

type MarkdownItInstance = ReturnType<typeof MarkdownIt>;

/**
 * highlight.js を使用してコード文字列を安全に HTML ハイライト文字列へ変換する。
 * 未登録言語や解析エラー時は HTML エスケープして安全な文字列を返す。
 *
 * @param code - ハイライト対象のソースコード。
 * @param language - 指定された言語識別子。
 * @returns ハイライトされた HTML 文字列。
 */
function highlightCode(code: string, language: string): string {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    } catch {
      // ハイライト失敗時はフォールバック。
    }
  }
  return "";
}

/**
 * 見出し文字列からアンカー ID (スラグ) を生成する。
 * 日本語・全角文字およびハイフンを保持し、英字を小文字化する。
 *
 * @param text - 見出しテキスト。
 * @returns 生成されたスラグ文字列。
 */
export function defaultSlugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(
      /[^\w\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+/g,
      ""
    );
}

/**
 * ファイルインクルード構文 (`!!!include(...)!!!` および `:[...](...)`) を再帰的に解決する。
 * モバイル環境など Node.js の fs が利用できない環境でも Vault アダプタ経由で安全に動作する。
 *
 * @param markdown - 入力 Markdown テキスト。
 * @param fileReader - ファイル読み込み関数。
 * @param processed - 循環インクルード検出用の処理済みパス一覧。
 * @returns インクルード解決後の Markdown テキスト。
 */
export function resolveIncludes(
  markdown: string,
  fileReader: (filePath: string) => string,
  processed: Set<string> = new Set()
): string {
  // 1. !!!include(path)!!! 構文の正規表現。
  const includeRe1 = /!{3}\s*include\s*\(([^)]+)\)\s*!{3}/gi;
  // 2. :[alt](path) 構文の正規表現。
  const includeRe2 = /:\[(?:[^\]]*)\]\(([^)]+)\)/g;

  const replaceHandler = (_match: string, filePath: string): string => {
    const trimmedPath = filePath.trim();
    if (processed.has(trimmedPath)) {
      return `<!-- Circular include detected: ${trimmedPath} -->`;
    }

    try {
      const content = fileReader(trimmedPath);
      const nextProcessed = new Set(processed);
      nextProcessed.add(trimmedPath);
      return resolveIncludes(content, fileReader, nextProcessed);
    } catch {
      return `<!-- Failed to include: ${trimmedPath} -->`;
    }
  };

  let result = markdown.replace(includeRe1, replaceHandler);
  result = result.replace(includeRe2, replaceHandler);
  return result;
}

/**　markdown-it コアエンジンおよび各種拡張プラグインを統合した Markdown コンパイラクラス。　*/
export class MarkdownCompiler {
  /** 内部で保持する markdown-it インスタンス。*/
  private md: MarkdownItInstance;

  /** 現在の設定オプション。*/
  private options: MarkdownCompilerOptions;

  /**
   * MarkdownCompiler のコンストラクタ。
   *
   * @param options - コンパイラ設定オプション。
   */
  constructor(options: MarkdownCompilerOptions = {}) {
    this.options = {
      html: true,
      linkify: true,
      typographer: true,
      breaks: false,
      ...options,
    };

    this.md = this.createMarkdownItInstance(this.options);
  }

  /**
   * 指定されたオプションに基づいて markdown-it インスタンスを生成・設定する。
   *
   * @param options - コンパイラオプション。
   * @returns 初期化された MarkdownIt インスタンス。
   */
  private createMarkdownItInstance(options: MarkdownCompilerOptions): MarkdownItInstance {
    const md = new MarkdownIt({
      html: options.html ?? true,
      linkify: options.linkify ?? true,
      typographer: options.typographer ?? true,
      breaks: options.breaks ?? false,
      highlight: highlightCode,
    });

    // 1. 数式レンダリングプラグイン (MathJax3)
    if (markdownItMathjax3) {
      md.use(markdownItMathjax3);
    }

    // 2. GitHub スタイルアラート (> [!NOTE] 等)
    if (markdownItGithubAlerts) {
      md.use(markdownItGithubAlerts);
    }

    // 3. タスクリスト / チェックボックス (- [ ] / - [x])
    if (markdownItCheckbox) {
      md.use(markdownItCheckbox);
    }

    // 4. 見出しアンカー ID (Named Headers)
    if (markdownItNamedHeaders) {
      md.use(markdownItNamedHeaders, {
        slugify: defaultSlugify,
      });
    }

    // 5. カスタムコンテナ (::: warning 等)
    if (markdownItContainer) {
      md.use(markdownItContainer, "warning");
      md.use(markdownItContainer, "info");
      md.use(markdownItContainer, "tip");
      md.use(markdownItContainer, "details");
    }

    return md;
  }

  /**
   * Markdown 文字列を HTML 文字列にレンダリングする。
   *
   * @param markdown - 入力 Markdown テキスト。
   * @param overrideOptions - レンダリング時の一時的な上書きオプション (任意)。
   * @returns レンダリングされた HTML 文字列。
   */
  render(markdown: string, overrideOptions?: MarkdownCompilerOptions): string {
    const activeOptions = overrideOptions ? { ...this.options, ...overrideOptions } : this.options;

    let processedMd = markdown;
    if (activeOptions.fileReader) {
      processedMd = resolveIncludes(processedMd, activeOptions.fileReader);
    }

    if (overrideOptions) {
      const tempMd = this.createMarkdownItInstance(activeOptions);
      return tempMd.render(processedMd);
    }
    return this.md.render(processedMd);
  }

  /**
   * 内部の markdown-it インスタンスへの直接参照を取得する (高度なカスタマイズ用)。
   *
   * @returns MarkdownIt インスタンス。
   */
  getMarkdownItInstance(): MarkdownItInstance {
    return this.md;
  }
}
