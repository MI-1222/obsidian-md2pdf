import { type App, Notice, PluginSettingTab, Setting, requestUrl } from "obsidian";
import type Md2PdfPlugin from "../main";
import type { HighlightTheme, MarkdownTheme, PdfOrientation, PdfPaperFormat } from "./types";
import type { components } from "../types/tikz-api";

type HealthResponse = components["schemas"]["HealthResponse"];

/** obsidian-md2pdf プラグインの設定画面タブ。 */
export class Md2PdfSettingTab extends PluginSettingTab {
  /** 親プラグインのインスタンス。 */
  plugin: Md2PdfPlugin;

  /**
   * 設定タブのコンストラクタ。
   *
   * @param app - Obsidian App インスタンス。
   * @param plugin - Md2PdfPlugin インスタンス。
   */
  constructor(app: App, plugin: Md2PdfPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /** 設定画面の UI を構築・表示する。 */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Markdown to PDF エクスポート設定" });

    this.renderTikzSection(containerEl);
    this.renderPdfLayoutSection(containerEl);
    this.renderStyleSection(containerEl);
    this.renderIntegrationsSection(containerEl);
  }

  /**
   * TikZ リモートレンダリングサーバー設定セクションを描画する。
   *
   * @param containerEl - 設定項目を追加する親 HTML 要素。
   */
  private renderTikzSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("TikZ サーバー設定").setHeading();

    new Setting(containerEl)
      .setName("サーバー URL")
      .setDesc("TikZ を SVG にコンパイルするリモートサーバーのエンドポイント URL。")
      .addText((text) =>
        text
          .setPlaceholder("https://tikz.example.com")
          .setValue(this.plugin.settings.tikz.serverUrl)
          .onChange(async (value) => {
            this.plugin.settings.tikz.serverUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("サーバー接続テスト")
      .setDesc(
        "設定されたサーバーの /health エンドポイントにリクエストを送信して疎通確認を行います。"
      )
      .addButton((button) =>
        button
          .setButtonText("接続テストを実行")
          .setCta()
          .onClick(async () => {
            await this.testTikzServerConnection(button);
          })
      );

    new Setting(containerEl)
      .setName("API キー")
      .setDesc("サーバー認証用の API キー (必要な場合のみ入力)。")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("API キーを入力")
          .setValue(this.plugin.settings.tikz.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.tikz.apiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("モバイル環境でリモートサーバーを使用")
      .setDesc(
        "モバイル端末ではローカルの TeX コマンドが利用できないため、リモートサーバーを使用します。"
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.tikz.useRemoteOnMobile).onChange(async (value) => {
          this.plugin.settings.tikz.useRemoteOnMobile = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("PC で失敗時にリモートへフォールバック")
      .setDesc(
        "PC 環境でローカル TeX コマンドの実行に失敗した場合、リモートサーバーへ自動的にフォールバックします。"
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.tikz.fallbackToRemoteOnPc).onChange(async (value) => {
          this.plugin.settings.tikz.fallbackToRemoteOnPc = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("リクエストタイムアウト (ミリ秒)")
      .setDesc("TikZ コンパイルリクエストのタイムアウト時間。")
      .addText((text) =>
        text
          .setPlaceholder("30000")
          .setValue(String(this.plugin.settings.tikz.timeoutMs))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
              this.plugin.settings.tikz.timeoutMs = parsed;
              await this.plugin.saveSettings();
            }
          })
      );
  }

  /**
   * PDF レイアウトおよび印刷設定セクションを描画する。
   *
   * @param containerEl - 設定項目を追加する親 HTML 要素。
   */
  private renderPdfLayoutSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("PDF レイアウト設定").setHeading();

    new Setting(containerEl)
      .setName("用紙サイズ")
      .setDesc("出力する PDF の用紙サイズを指定します。")
      .addDropdown((dropdown) => {
        const formats: Record<PdfPaperFormat, string> = {
          A4: "A4",
          A3: "A3",
          Letter: "Letter",
          Legal: "Legal",
          Tabloid: "Tabloid",
        };
        dropdown
          .addOptions(formats)
          .setValue(this.plugin.settings.pdf.format)
          .onChange(async (value) => {
            this.plugin.settings.pdf.format = value as PdfPaperFormat;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("ページの向き")
      .setDesc("用紙の縦向きまたは横向きを指定します。")
      .addDropdown((dropdown) => {
        const orientations: Record<PdfOrientation, string> = {
          portrait: "縦向き (Portrait)",
          landscape: "横向き (Landscape)",
        };
        dropdown
          .addOptions(orientations)
          .setValue(this.plugin.settings.pdf.orientation)
          .onChange(async (value) => {
            this.plugin.settings.pdf.orientation = value as PdfOrientation;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("ページ余白 (上 / 右 / 下 / 左)")
      .setDesc("余白のサイズを CSS 単位 (例: 15mm, 1in) で指定します。")
      .addText((text) =>
        text
          .setPlaceholder("上 (15mm)")
          .setValue(this.plugin.settings.pdf.margin.top)
          .onChange(async (value) => {
            this.plugin.settings.pdf.margin.top = value.trim();
            await this.plugin.saveSettings();
          })
      )
      .addText((text) =>
        text
          .setPlaceholder("右 (15mm)")
          .setValue(this.plugin.settings.pdf.margin.right)
          .onChange(async (value) => {
            this.plugin.settings.pdf.margin.right = value.trim();
            await this.plugin.saveSettings();
          })
      )
      .addText((text) =>
        text
          .setPlaceholder("下 (15mm)")
          .setValue(this.plugin.settings.pdf.margin.bottom)
          .onChange(async (value) => {
            this.plugin.settings.pdf.margin.bottom = value.trim();
            await this.plugin.saveSettings();
          })
      )
      .addText((text) =>
        text
          .setPlaceholder("左 (15mm)")
          .setValue(this.plugin.settings.pdf.margin.left)
          .onChange(async (value) => {
            this.plugin.settings.pdf.margin.left = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("背景色・画像の印刷")
      .setDesc("CSS による背景色や背景画像を PDF に含めるかどうか。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.pdf.printBackground).onChange(async (value) => {
          this.plugin.settings.pdf.printBackground = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("ヘッダー・フッターの表示")
      .setDesc("PDF の各ページにヘッダーとフッターを表示するかどうか。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.pdf.displayHeaderFooter).onChange(async (value) => {
          this.plugin.settings.pdf.displayHeaderFooter = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("ヘッダー テンプレート")
      .setDesc("ヘッダーに挿入する HTML 文字列。")
      .addText((text) =>
        text
          .setPlaceholder("<div>ヘッダー内容</div>")
          .setValue(this.plugin.settings.pdf.headerTemplate)
          .onChange(async (value) => {
            this.plugin.settings.pdf.headerTemplate = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("フッター テンプレート")
      .setDesc("フッターに挿入する HTML 文字列。")
      .addText((text) =>
        text
          .setPlaceholder("<div>フッター内容</div>")
          .setValue(this.plugin.settings.pdf.footerTemplate)
          .onChange(async (value) => {
            this.plugin.settings.pdf.footerTemplate = value;
            await this.plugin.saveSettings();
          })
      );
  }

  /**
   * ドキュメントスタイル設定セクションを描画する。
   *
   * @param containerEl - 設定項目を追加する親 HTML 要素。
   */
  private renderStyleSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("ドキュメントスタイル設定").setHeading();

    new Setting(containerEl)
      .setName("Markdown テーマ")
      .setDesc("ドキュメント本文に適用する CSS テーマを選択します。")
      .addDropdown((dropdown) => {
        const themes: Record<MarkdownTheme, string> = {
          "github-light": "GitHub Light",
          "github-dark": "GitHub Dark",
          tomorrow: "Tomorrow",
          default: "Default",
          custom: "Custom",
        };
        dropdown
          .addOptions(themes)
          .setValue(this.plugin.settings.style.theme)
          .onChange(async (value) => {
            this.plugin.settings.style.theme = value as MarkdownTheme;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("シンタックスハイライト テーマ")
      .setDesc("コードブロックのシンタックスハイライトテーマを選択します。")
      .addDropdown((dropdown) => {
        const highlightThemes: Record<HighlightTheme, string> = {
          github: "GitHub",
          "atom-one-dark": "Atom One Dark",
          tomorrow: "Tomorrow",
          default: "Default",
        };
        dropdown
          .addOptions(highlightThemes)
          .setValue(this.plugin.settings.style.highlightTheme)
          .onChange(async (value) => {
            this.plugin.settings.style.highlightTheme = value as HighlightTheme;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("改行を改行タグ (<br>) に変換")
      .setDesc("Markdown 内の単一改行を HTML の <br> タグとして扱います。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.style.breaks).onChange(async (value) => {
          this.plugin.settings.style.breaks = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("カスタム CSS")
      .setDesc("PDF 出力時に追加で適用するカスタムスタイルシートを記述します。")
      .addTextArea((textArea) =>
        textArea
          .setPlaceholder("/* ここに独自の CSS を入力 */\nbody { font-size: 11pt; }")
          .setValue(this.plugin.settings.style.customCss)
          .onChange(async (value) => {
            this.plugin.settings.style.customCss = value;
            await this.plugin.saveSettings();
          })
      );
  }

  /**
   * 外部サービス連携設定セクションを描画する。
   *
   * @param containerEl - 設定項目を追加する親 HTML 要素。
   */
  private renderIntegrationsSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("外部サービス連携").setHeading();

    new Setting(containerEl)
      .setName("PlantUML サーバー URL")
      .setDesc("PlantUML ダイアグラムをレンダリングするためのサーバー URL。")
      .addText((text) =>
        text
          .setPlaceholder("https://www.plantuml.com/plantuml")
          .setValue(this.plugin.settings.integrations.plantuml.serverUrl)
          .onChange(async (value) => {
            this.plugin.settings.integrations.plantuml.serverUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Google Drive Client ID")
      .setDesc("Google Drive 画像取得用の OAuth 2.0 クライアント ID。")
      .addText((text) =>
        text
          .setPlaceholder("クライアント ID を入力")
          .setValue(this.plugin.settings.integrations.gdrive.clientId)
          .onChange(async (value) => {
            this.plugin.settings.integrations.gdrive.clientId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Google Drive Client Secret")
      .setDesc("Google Drive 画像取得用の OAuth 2.0 クライアントシークレット。")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("クライアントシークレットを入力")
          .setValue(this.plugin.settings.integrations.gdrive.clientSecret)
          .onChange(async (value) => {
            this.plugin.settings.integrations.gdrive.clientSecret = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Google Drive Refresh Token")
      .setDesc("Google Drive 画像取得用の OAuth 2.0 リフレッシュトークン。")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("リフレッシュトークンを入力")
          .setValue(this.plugin.settings.integrations.gdrive.refreshToken)
          .onChange(async (value) => {
            this.plugin.settings.integrations.gdrive.refreshToken = value.trim();
            await this.plugin.saveSettings();
          });
      });
  }

  /**
   * TikZ サーバーへの疎通確認 (GET /health) を実行する。
   *
   * @param button - 操作元のボタンコンポーネント。
   */
  async testTikzServerConnection(button: {
    setDisabled: (disabled: boolean) => any;
    setButtonText: (name: string) => any;
  }): Promise<void> {
    const rawUrl = this.plugin.settings.tikz.serverUrl;
    if (!rawUrl) {
      new Notice("TikZ サーバーの URL を入力してください。");
      return;
    }

    const normalizedUrl = rawUrl.replace(/\/+$/, "");
    const healthUrl = `${normalizedUrl}/health`;

    button.setDisabled(true);
    button.setButtonText("テスト中...");

    try {
      const headers: Record<string, string> = {};
      if (this.plugin.settings.tikz.apiKey) {
        headers["Authorization"] = `Bearer ${this.plugin.settings.tikz.apiKey}`;
      }

      const response = await requestUrl({
        url: healthUrl,
        method: "GET",
        headers,
      });

      if (response.status === 200) {
        const body = response.json as Partial<HealthResponse> | undefined;
        const version = body?.version ? ` (v${body.version})` : "";
        new Notice(`TikZ サーバーに接続成功しました${version}。`);
      } else {
        new Notice(`TikZ サーバー接続失敗: ステータスコード ${response.status}。`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "通信エラー";
      new Notice(`TikZ サーバー接続失敗: ${message}。`);
    } finally {
      button.setDisabled(false);
      button.setButtonText("接続テストを実行");
    }
  }
}
