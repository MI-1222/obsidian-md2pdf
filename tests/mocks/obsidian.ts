/**
 * Obsidian App クラスのモック。
 */
export class App {
  vault = {
    adapter: {
      read: async () => "",
      write: async () => {},
    },
  };
}

/**
 * Obsidian Plugin クラスのモック。
 */
export class Plugin {
  app: App;
  manifest: Record<string, unknown>;

  constructor(app: App, manifest: Record<string, unknown>) {
    this.app = app;
    this.manifest = manifest;
  }

  async loadData(): Promise<unknown> {
    return {};
  }

  async saveData(_data: unknown): Promise<void> {}

  async onload(): Promise<void> {}

  onunload(): void {}

  addSettingTab(_settingTab: PluginSettingTab): void {}

  addCommand(_command: Record<string, unknown>): void {}

  addRibbonIcon(_icon: string, _title: string, _callback: () => void): HTMLElement {
    return document.createElement("div");
  }
}

/**
 * Obsidian PluginSettingTab クラスのモック。
 */
export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement("div");
  }

  display(): void {}

  hide(): void {}
}

/**
 * Obsidian Setting クラスのモック。
 */
export class Setting {
  containerEl: HTMLElement;
  settingEl: HTMLElement;
  infoEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.settingEl = document.createElement("div");
    this.infoEl = document.createElement("div");
    this.nameEl = document.createElement("div");
    this.descEl = document.createElement("div");
    this.controlEl = document.createElement("div");
    this.containerEl.appendChild(this.settingEl);
  }

  setName(_name: string): this {
    return this;
  }

  setDesc(_desc: string | DocumentFragment): this {
    return this;
  }

  setClass(_cls: string): this {
    return this;
  }

  setTooltip(_tooltip: string): this {
    return this;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  addText(_cb: (text: unknown) => unknown): this {
    return this;
  }

  addToggle(_cb: (toggle: unknown) => unknown): this {
    return this;
  }

  addDropdown(_cb: (dropdown: unknown) => unknown): this {
    return this;
  }

  addButton(_cb: (button: unknown) => unknown): this {
    return this;
  }
}

/**
 * Obsidian Notice クラスのモック。
 */
export class Notice {
  message: string;

  constructor(message: string, _timeout?: number) {
    this.message = message;
  }

  hide(): void {}
}

/**
 * Obsidian Platform オブジェクトのモック。
 */
export const Platform = {
  isDesktop: true,
  isMobile: false,
  isMacOS: true,
  isWin: false,
  isLinux: false,
  isIosApp: false,
  isAndroidApp: false,
  isSafari: false,
};

/**
 * Obsidian requestUrl API のモックレスポンス型。
 */
export interface RequestUrlResponse {
  status: number;
  headers: Record<string, string>;
  arrayBuffer: ArrayBuffer;
  json: unknown;
  text: string;
}

/**
 * Obsidian requestUrl 関数のモック。
 */
export async function requestUrl(_options: unknown): Promise<RequestUrlResponse> {
  return {
    status: 200,
    headers: {},
    arrayBuffer: new ArrayBuffer(0),
    json: {},
    text: "",
  };
}
