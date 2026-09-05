# Markdown 拡張記法サンプル

本プラグインでサポートされている各種拡張 Markdown 記法(GitHub Alerts、タスクリスト、シンタックスハイライト、テーブル、カスタムコンテナ等)のサンプルです。

## 1. GitHub スタイル アラート

> [!NOTE]
> 通常の補足情報やコンテキストを記述します。

> [!TIP]
> 役立つヒントや効率的な方法を提示します。

> [!IMPORTANT]
> 重要な注意事項や必須要件を強調します。

> [!WARNING]
> 警告や非推奨機能について注意を促します。

> [!CAUTION]
> データ損失や危険な操作に関する強い警告を示します。

## 2. タスクリスト (チェックボックス)

- [x] 完了したタスク A
- [x] 完了したタスク B
- [ ] 未完了のタスク C
- [ ] 進行中のタスク D

## 3. テーブル (表)

| 機能名        |    デスクトップ    |  モバイル  | 備考                       |
| :------------ | :----------------: | :--------: | :------------------------- |
| TikZ 描画     | ○ (Local / Remote) | ○ (Remote) | Cloud Run サーバー連携対応 |
| Mermaid 図    |         ○          |     ○      | インプロセス SVG 変換      |
| PlantUML      |         ○          |     ○      | 外部サーバー連携           |
| MathJax3 数式 |         ○          |     ○      | TeX 構文完全サポート       |

## 4. コードブロック & シンタックスハイライト

```typescript
import { Plugin } from "obsidian";

export default class ExamplePlugin extends Plugin {
  async onload(): Promise<void> {
    console.log("Plugin loaded successfully");
  }
}
```

```python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print([fibonacci(i) for i in range(10)])
```

## 5. カスタムコンテナ (`::: info` 等)

::: info
ここに補足説明や詳細情報を記述できます。
:::

::: warning
ここに警告情報を記述できます。
:::
