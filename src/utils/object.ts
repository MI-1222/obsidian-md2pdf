/**
 * 値がプレーンオブジェクト (JSON オブジェクト) かどうかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns プレーンオブジェクトの場合は true、それ以外は false。
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 2 つのオブジェクトを再帰的にディープマージする。
 * デフォルト設定に対して保存済みデータをマージし、欠落しているキーを安全に補完する。
 *
 * @template T - ターゲットオブジェクトの型。
 * @param target - ベースとなるターゲットオブジェクト (通常はデフォルト設定)。
 * @param source - 上書きするソースオブジェクト (通常は読み込んだ保存データ)。
 * @returns ディープマージされた新しいオブジェクト。
 */
export function deepMerge<T>(target: T, source: unknown): T {
  if (!isPlainObject(target)) {
    return (source !== undefined ? source : target) as T;
  }

  const result: Record<string, unknown> = { ...target };

  if (!isPlainObject(source)) {
    return result as T;
  }

  for (const [key, sourceValue] of Object.entries(source)) {
    if (sourceValue === undefined) {
      continue;
    }

    const targetValue = result[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }

  return result as T;
}
