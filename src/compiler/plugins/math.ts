import MarkdownIt from "markdown-it";

type MarkdownItInstance = ReturnType<typeof MarkdownIt>;

/** Token の最小型インターフェース。 */
interface TokenLike {
  type: string;
  tag: string;
  markup: string;
  content: string;
  block?: boolean;
  map?: [number, number] | null;
}

/** StateInline の最小型インターフェース。 */
interface StateInlineLike {
  src: string;
  pos: number;
  posMax: number;
  pending: string;
  push: (type: string, tag: string, nesting: number) => TokenLike;
}

/** StateBlock の最小型インターフェース。 */
interface StateBlockLike {
  src: string;
  bMarks: number[];
  eMarks: number[];
  tShift: number[];
  blkIndent: number;
  line: number;
  posMax: number;
  push: (type: string, tag: string, nesting: number) => TokenLike;
  getLines: (begin: number, end: number, indent: number, keepLastLF: boolean) => string;
}

/**
 * 区切り文字の位置が数式の開始・終了として有効かどうかを判定する。
 *
 * @param state - インラインパース状態。
 * @param pos - 対象文字の位置。
 * @returns 開き・閉じの可否。
 */
function isValidDelim(
  state: StateInlineLike,
  pos: number
): { canOpen: boolean; canClose: boolean } {
  /** 最大文字位置。 */
  const max = state.posMax;
  /** 開き可能フラグ。 */
  let canOpen = true;
  /** 閉じ可能フラグ。 */
  let canClose = true;

  /** 直前文字コード。 */
  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
  /** 直後文字コード。 */
  const nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1;

  if (prevChar === 0x20 || prevChar === 0x09 || (nextChar >= 0x30 && nextChar <= 0x39)) {
    canClose = false;
  }
  if (nextChar === 0x20 || nextChar === 0x09) {
    canOpen = false;
  }

  return { canOpen, canClose };
}

/**
 * インライン数式構文 ($...$) のパースルール関数。
 *
 * @param state - インライン状態。
 * @param silent - 検証のみを行うかどうか。
 * @returns マッチした場合は true。
 */
function mathInline(state: StateInlineLike, silent: boolean): boolean {
  if (state.src[state.pos] !== "$") {
    return false;
  }

  /** 区切り判定。 */
  const res = isValidDelim(state, state.pos);
  if (!res.canOpen) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos += 1;
    return true;
  }

  /** 開始位置。 */
  const start = state.pos + 1;
  /** 探索位置。 */
  let match = start;

  while ((match = state.src.indexOf("$", match)) !== -1) {
    /** エスケープ確認位置。 */
    let pos = match - 1;
    while (state.src[pos] === "\\") {
      pos -= 1;
    }
    if ((match - pos) % 2 === 1) {
      break;
    }
    match += 1;
  }

  if (match === -1) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos = start;
    return true;
  }

  if (match - start === 0) {
    if (!silent) {
      state.pending += "$$";
    }
    state.pos = start + 1;
    return true;
  }

  /** 閉じ区切り判定。 */
  const closeRes = isValidDelim(state, match);
  if (!closeRes.canClose) {
    if (!silent) {
      state.pending += "$";
    }
    state.pos = start;
    return true;
  }

  if (!silent) {
    /** トークン生成。 */
    const token = state.push("math_inline", "math", 0);
    token.markup = "$";
    token.content = state.src.slice(start, match);
  }

  state.pos = match + 1;
  return true;
}

/**
 * ブロック数式構文 ($$...$$) のパースルール関数。
 *
 * @param state - ブロック状態。
 * @param start - 開始行インデックス。
 * @param end - 終了行インデックス。
 * @param silent - 検証のみを行うかどうか。
 * @returns マッチした場合は true。
 */
function mathBlock(state: StateBlockLike, start: number, end: number, silent: boolean): boolean {
  /** 開始行のオフセット。 */
  let pos = state.bMarks[start] + state.tShift[start];
  /** 開始行の末尾。 */
  let max = state.eMarks[start];

  if (pos + 2 > max || state.src.slice(pos, pos + 2) !== "$$") {
    return false;
  }

  pos += 2;
  /** 1行目の内容。 */
  let firstLine = state.src.slice(pos, max);

  if (silent) {
    return true;
  }

  /** 終了検出フラグ。 */
  let found = false;
  /** 最終行内容。 */
  let lastLine = "";
  /** 次の行。 */
  let next = start;

  if (firstLine.trim().slice(-2) === "$$") {
    firstLine = firstLine.trim().slice(0, -2);
    found = true;
  }

  while (!found) {
    next++;
    if (next >= end) {
      break;
    }

    pos = state.bMarks[next] + state.tShift[next];
    max = state.eMarks[next];

    if (pos < max && state.tShift[next] < state.blkIndent) {
      break;
    }

    if (state.src.slice(pos, max).trim().slice(-2) === "$$") {
      /** 閉じ位置。 */
      const lastPos = state.src.slice(0, max).lastIndexOf("$$");
      lastLine = state.src.slice(pos, lastPos);
      found = true;
    }
  }

  state.line = next + 1;

  /** トークン生成。 */
  const token = state.push("math_block", "math", 0);
  token.block = true;
  token.content =
    (firstLine && firstLine.trim() ? `${firstLine}\n` : "") +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (lastLine && lastLine.trim() ? lastLine : "");
  token.map = [start, state.line];
  token.markup = "$$";

  return true;
}

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
 * markdown-it 用の数式 ($...$ / $$...$$) パースプラグイン。
 *
 * @param md - markdown-it インスタンス。
 */
export function mathPlugin(md: MarkdownItInstance): void {
  md.inline.ruler.after("escape", "math_inline", mathInline as any);
  md.block.ruler.after("blockquote", "math_block", mathBlock as any, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules.math_inline = (tokens: TokenLike[], idx: number) => {
    /** 数式テキスト。 */
    const content = escapeHtml(tokens[idx].content);
    return `<span class="math math-inline">$${content}$</span>`;
  };

  md.renderer.rules.math_block = (tokens: TokenLike[], idx: number) => {
    /** 数式テキスト。 */
    const content = escapeHtml(tokens[idx].content);
    return `<div class="math math-block">$$\n${content}\n$$</div>\n`;
  };
}
