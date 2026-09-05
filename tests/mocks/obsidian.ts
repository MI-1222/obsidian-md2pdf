/** Obsidian App クラスのモック。 */
export class App {
  vault = {
    adapter: {
      read: async () => "",
      write: async () => {},
    },
  };
}

/** Obsidian Plugin クラスのモック。 */
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

/** Obsidian PluginSettingTab クラスのモック。 */
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

/** Obsidian Setting クラスのモック。 */
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
    this.settingEl.className = "setting-item";
    this.infoEl = document.createElement("div");
    this.infoEl.className = "setting-item-info";
    this.nameEl = document.createElement("div");
    this.nameEl.className = "setting-item-name";
    this.descEl = document.createElement("div");
    this.descEl.className = "setting-item-description";
    this.infoEl.appendChild(this.nameEl);
    this.infoEl.appendChild(this.descEl);
    this.controlEl = document.createElement("div");
    this.controlEl.className = "setting-item-control";
    this.settingEl.appendChild(this.infoEl);
    this.settingEl.appendChild(this.controlEl);
    this.containerEl.appendChild(this.settingEl);
  }

  setName(name: string): this {
    this.nameEl.textContent = name;
    return this;
  }

  setDesc(desc: string | DocumentFragment): this {
    if (typeof desc === "string") {
      this.descEl.textContent = desc;
    } else {
      this.descEl.appendChild(desc);
    }
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

  setHeading(): this {
    this.settingEl.classList.add("setting-item-heading");
    return this;
  }

  addText(
    cb: (text: {
      inputEl: HTMLInputElement;
      setValue: (val: string) => any;
      getValue: () => string;
      setPlaceholder: (val: string) => any;
      onChange: (cb: (val: string) => any) => any;
      setDisabled: (val: boolean) => any;
    }) => any
  ): this {
    const inputEl = document.createElement("input");
    inputEl.type = "text";
    this.controlEl.appendChild(inputEl);
    let changeHandler: ((val: string) => any) | null = null;
    const comp = {
      inputEl,
      setValue: (val: string) => {
        inputEl.value = val;
        return comp;
      },
      getValue: () => inputEl.value,
      setPlaceholder: (val: string) => {
        inputEl.placeholder = val;
        return comp;
      },
      onChange: (fn: (val: string) => any) => {
        changeHandler = fn;
        return comp;
      },
      setDisabled: (disabled: boolean) => {
        inputEl.disabled = disabled;
        return comp;
      },
    };
    inputEl.addEventListener("input", () => {
      if (changeHandler) {
        changeHandler(inputEl.value);
      }
    });
    cb(comp);
    return this;
  }

  addTextArea(
    cb: (textArea: {
      inputEl: HTMLTextAreaElement;
      setValue: (val: string) => any;
      getValue: () => string;
      setPlaceholder: (val: string) => any;
      onChange: (cb: (val: string) => any) => any;
      setDisabled: (val: boolean) => any;
    }) => any
  ): this {
    const inputEl = document.createElement("textarea");
    this.controlEl.appendChild(inputEl);
    let changeHandler: ((val: string) => any) | null = null;
    const comp = {
      inputEl,
      setValue: (val: string) => {
        inputEl.value = val;
        return comp;
      },
      getValue: () => inputEl.value,
      setPlaceholder: (val: string) => {
        inputEl.placeholder = val;
        return comp;
      },
      onChange: (fn: (val: string) => any) => {
        changeHandler = fn;
        return comp;
      },
      setDisabled: (disabled: boolean) => {
        inputEl.disabled = disabled;
        return comp;
      },
    };
    inputEl.addEventListener("input", () => {
      if (changeHandler) {
        changeHandler(inputEl.value);
      }
    });
    cb(comp);
    return this;
  }

  addToggle(
    cb: (toggle: {
      toggleEl: HTMLElement;
      setValue: (val: boolean) => any;
      getValue: () => boolean;
      onChange: (cb: (val: boolean) => any) => any;
      setDisabled: (val: boolean) => any;
    }) => any
  ): this {
    const toggleEl = document.createElement("input");
    toggleEl.type = "checkbox";
    this.controlEl.appendChild(toggleEl);
    let changeHandler: ((val: boolean) => any) | null = null;
    const comp = {
      toggleEl,
      setValue: (val: boolean) => {
        toggleEl.checked = val;
        return comp;
      },
      getValue: () => toggleEl.checked,
      onChange: (fn: (val: boolean) => any) => {
        changeHandler = fn;
        return comp;
      },
      setDisabled: (disabled: boolean) => {
        toggleEl.disabled = disabled;
        return comp;
      },
    };
    toggleEl.addEventListener("change", () => {
      if (changeHandler) {
        changeHandler(toggleEl.checked);
      }
    });
    cb(comp);
    return this;
  }

  addDropdown(
    cb: (dropdown: {
      selectEl: HTMLSelectElement;
      addOption: (val: string, display: string) => any;
      addOptions: (options: Record<string, string>) => any;
      setValue: (val: string) => any;
      getValue: () => string;
      onChange: (cb: (val: string) => any) => any;
      setDisabled: (val: boolean) => any;
    }) => any
  ): this {
    const selectEl = document.createElement("select");
    this.controlEl.appendChild(selectEl);
    let changeHandler: ((val: string) => any) | null = null;
    const comp = {
      selectEl,
      addOption: (val: string, display: string) => {
        const option = document.createElement("option");
        option.value = val;
        option.text = display;
        selectEl.appendChild(option);
        return comp;
      },
      addOptions: (options: Record<string, string>) => {
        for (const [val, display] of Object.entries(options)) {
          comp.addOption(val, display);
        }
        return comp;
      },
      setValue: (val: string) => {
        selectEl.value = val;
        return comp;
      },
      getValue: () => selectEl.value,
      onChange: (fn: (val: string) => any) => {
        changeHandler = fn;
        return comp;
      },
      setDisabled: (disabled: boolean) => {
        selectEl.disabled = disabled;
        return comp;
      },
    };
    selectEl.addEventListener("change", () => {
      if (changeHandler) {
        changeHandler(selectEl.value);
      }
    });
    cb(comp);
    return this;
  }

  addButton(
    cb: (button: {
      buttonEl: HTMLButtonElement;
      setButtonText: (name: string) => any;
      setIcon: (icon: string) => any;
      setCta: () => any;
      setWarning: () => any;
      setTooltip: (tooltip: string) => any;
      setDisabled: (disabled: boolean) => any;
      onClick: (cb: (evt: MouseEvent) => any) => any;
    }) => any
  ): this {
    const buttonEl = document.createElement("button");
    this.controlEl.appendChild(buttonEl);
    let clickHandler: ((evt: MouseEvent) => any) | null = null;
    const comp = {
      buttonEl,
      setButtonText: (name: string) => {
        buttonEl.textContent = name;
        return comp;
      },
      setIcon: (_icon: string) => comp,
      setCta: () => comp,
      setWarning: () => comp,
      setTooltip: (tooltip: string) => {
        buttonEl.title = tooltip;
        return comp;
      },
      setDisabled: (disabled: boolean) => {
        buttonEl.disabled = disabled;
        return comp;
      },
      onClick: (fn: (evt: MouseEvent) => any) => {
        clickHandler = fn;
        return comp;
      },
    };
    buttonEl.addEventListener("click", (evt) => {
      if (clickHandler) {
        clickHandler(evt);
      }
    });
    cb(comp);
    return this;
  }
}

/** Obsidian Notice クラスのモック。 */
export class Notice {
  message: string;

  constructor(message: string, _timeout?: number) {
    this.message = message;
  }

  hide(): void {}
}

/** Obsidian Platform オブジェクトのモック。 */
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

/** Obsidian requestUrl API のモックレスポンス型。 */
export interface RequestUrlResponse {
  status: number;
  headers: Record<string, string>;
  arrayBuffer: ArrayBuffer;
  json: unknown;
  text: string;
}

import { vi } from "vitest";

/** Obsidian requestUrl 関数のモック。 */
export const requestUrl = vi.fn(async (_options: unknown): Promise<RequestUrlResponse> => {
  return {
    status: 200,
    headers: {},
    arrayBuffer: new ArrayBuffer(0),
    json: {},
    text: "",
  };
});
