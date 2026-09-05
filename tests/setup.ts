// Vitest テスト環境 (jsdom) 用の DOM / SVG ポリフィル。

export {};

declare global {
  interface SVGElement {
    /**
     * SVG 要素の境界ボックスを取得する (Mermaid レイアウト計算用)。
     */
    getBBox?(): {
      x: number;
      y: number;
      width: number;
      height: number;
      top: number;
      right: number;
      bottom: number;
      left: number;
      toJSON: () => void;
    };

    /**
     * SVG テキストの計算上の長さを取得する。
     */
    getComputedTextLength?(): number;
  }
}

if (typeof HTMLElement !== "undefined") {
  if (!HTMLElement.prototype.empty) {
    HTMLElement.prototype.empty = function (): void {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };
  }

  if (!HTMLElement.prototype.createEl) {
    HTMLElement.prototype.createEl = function (tag: any, o?: any): any {
      const el = document.createElement(tag);
      if (typeof o === "string") {
        el.className = o;
      } else if (o) {
        if (o.text) el.textContent = o.text;
        if (o.cls) el.className = o.cls;
        if (o.title) el.title = o.title;
        if (o.attr) {
          for (const [key, val] of Object.entries(o.attr)) {
            el.setAttribute(key, String(val));
          }
        }
      }
      this.appendChild(el);
      return el;
    };
  }

  if (!HTMLElement.prototype.createDiv) {
    HTMLElement.prototype.createDiv = function (o?: any): HTMLDivElement {
      return this.createEl("div", o);
    };
  }

  if (!HTMLElement.prototype.createSpan) {
    HTMLElement.prototype.createSpan = function (o?: any): HTMLSpanElement {
      return this.createEl("span", o);
    };
  }
}

// jsdom 環境における SVG 要素のポリフィル (Mermaid レイアウト計算用)。
if (typeof SVGElement !== "undefined") {
  if (!SVGElement.prototype.getBBox) {
    SVGElement.prototype.getBBox = function () {
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => {},
      };
    };
  }

  if (!SVGElement.prototype.getComputedTextLength) {
    SVGElement.prototype.getComputedTextLength = function (): number {
      return 50;
    };
  }
}
