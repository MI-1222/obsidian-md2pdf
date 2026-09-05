import type { Md2PdfSettings } from "./types";

/**
 * obsidian-md2pdf プラグインのデフォルト設定値。
 */
export const DEFAULT_SETTINGS: Readonly<Md2PdfSettings> = {
  tikz: {
    serverUrl: "",
    apiKey: "",
    useRemoteOnMobile: true,
    fallbackToRemoteOnPc: true,
    timeoutMs: 30000,
  },
  pdf: {
    format: "A4",
    orientation: "portrait",
    margin: {
      top: "15mm",
      right: "15mm",
      bottom: "15mm",
      left: "15mm",
    },
    printBackground: true,
    displayHeaderFooter: false,
    headerTemplate: "",
    footerTemplate: "",
  },
  style: {
    theme: "github-light",
    highlightTheme: "github",
    customCss: "",
    breaks: false,
  },
  integrations: {
    plantuml: {
      serverUrl: "https://www.plantuml.com/plantuml",
    },
    gdrive: {
      clientId: "",
      clientSecret: "",
      refreshToken: "",
    },
  },
};
