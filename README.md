# Markdown to PDF Export (`obsidian-md2pdf`)

ObsidianのMarkdownノートを、TikZ図・Mermaid図・PlantUML・MathJax数式・GitHubアラートなどを忠実に反映した高精度なPDFとしてエクスポートするObsidianプラグインです。

デスクトップ版(macOS / Windows / Linux)だけでなく、モバイル版(iOS / Android)からのエクスポートにも対応しています。

---

## 主な特徴

- **TikZ ハイブリッドレンダリング**:
  - デスクトップ環境ではローカルTeX環境(`uplatex` + `dvisvgm`)を利用して高速にSVG変換。
  - モバイル環境やローカルTeX未導入環境では、[MI-1222/tex-tikz-server](https://github.com/MI-1222/tex-tikz-server) のTikZレンダリングAPI(Cloud Run等)へ自動フォールバック。
- **Mermaid.js インプロセス描画**: 外部ツール不要でフローチャートやシーケンス図をSVG化。
- **PlantUML レンダリング**: PlantUMLサーバー連携によるダイアグラム出力。
- **MathJax3 数式サポート**: TeXスタイルのインライン数式・ディスプレイ数式に対応。
- **リッチなMarkdown拡張構文**:
  - GitHub スタイルアラート(`> [!NOTE]`, `> [!WARNING]` 等)
  - タスクリスト(チェックボックス)
  - シンタックスハイライト(`highlight.js`)
  - カスタムコンテナ(`::: info` 等)
  - ファイルインクルード構文
- **柔軟なPDFレイアウト設定**: 用紙サイズ(A4/Letter等)、マージン、向き、テーマCSSのカスタマイズが可能。

---

## インストール方法

### 手動インストール

1. 本リポジトリの [Releases](../../releases) から最新の `main.js`, `manifest.json`, `styles.css` をダウンロードする。
2. ObsidianのVault内にある `.obsidian/plugins/obsidian-md2pdf/` フォルダを作成し、ダウンロードしたファイルを配置する。
3. Obsidianの設定 >「コミュニティプラグイン」を開き、「Markdown to PDF Export」を有効化する。

---

## 使い方

### 1. クイックエクスポート

- コマンドパレット(`Ctrl/Cmd + P`)を開き、`md2pdf: Export active note to PDF (Quick)` を実行する。
- 現在開いているノートがデフォルト設定でPDF化され、同一ディレクトリに出力される。

### 2. 設定モーダル付きエクスポート

- コマンドパレットで `md2pdf: Export active note to PDF (With Modal)` を実行、またはリボンアイコンをクリックする。
- 用紙サイズ、マージン、向き、テーマ、出力ファイル名を指定してエクスポートできる。

---

## 記法サンプル

各機能の具体的な記法については、[examples/](examples/) ディレクトリ配下のサンプルファイルを参照してください。

- [TikZ 描画サンプル](examples/tikz.md)
- [Mermaid 描画サンプル](examples/mermaid.md)
- [MathJax3 数式サンプル](examples/math.md)
- [PlantUML 描画サンプル](examples/plantuml.md)
- [Markdown 拡張記法サンプル](examples/markdown-syntax.md)

---

## 主な設定項目

Obsidianの設定画面「Markdown to PDF Export」タブから以下の項目をカスタマイズできます。

| カテゴリ           | 設定項目                     | 説明                                                                               | デフォルト値                        |
| :----------------- | :--------------------------- | :--------------------------------------------------------------------------------- | :---------------------------------- |
| **TikZ 連携**      | リモートサーバー URL         | [tex-tikz-server](https://github.com/MI-1222/tex-tikz-server) のエンドポイント URL | `https://tex-tikz-server-...`       |
|                    | API キー                     | サーバー認証用 API キー                                                            | 空                                  |
|                    | モバイルでリモートを利用     | モバイル実行時にリモートAPIを使用するか                                            | `true`                              |
|                    | PCでリモートへフォールバック | ローカルTeX未検出時にリモートAPIを使用するか                                       | `true`                              |
| **PDF レイアウト** | 用紙サイズ                   | A4, Letter, Legal, A3, A5 など                                                     | `A4`                                |
|                    | 向き                         | 縦向き (`portrait`) / 横向き (`landscape`)                                         | `portrait`                          |
|                    | マージン                     | 上下左右のマージン指定                                                             | `15mm`                              |
|                    | 背景グラフィックを印刷       | 背景色や背景画像の印刷有無                                                         | `true`                              |
| **スタイル**       | テーマ                       | Default, Tomorrow, GitHub, Custom CSS                                              | `Default`                           |
|                    | カスタム CSS                 | 追加で適用する独自の CSS スタイル                                                  | 空                                  |
| **外部連携**       | PlantUML サーバー URL        | PlantUML レンダリングサーバー                                                      | `https://www.plantuml.com/plantuml` |

---

## 開発者向けガイド

### 必要要件

- Node.js 18+
- npm

### セットアップ & ビルド

```bash
# 依存関係のインストール
npm install

# 開発用ビルド (ウォッチモード)
npm run dev

# プロダクションビルド (main.js 出力)
npm run build
```

### テスト & 型チェック

```bash
# 単体テストの実行 (Vitest)
npm test

# 型チェック
npm run check

# コードフォーマット
npm run format
```

### Obsidian Vault への配置例

ビルド生成物を手元の Obsidian Vault にコピーして動作確認を行う場合の例。

```bash
cp main.js manifest.json styles.css "/path/to/your/vault/.obsidian/plugins/obsidian-md2pdf/"
```
