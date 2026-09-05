declare module "markdown-it-checkbox" {
  import type MarkdownIt from "markdown-it";
  const plugin: (md: ReturnType<typeof MarkdownIt>, options?: any) => void;
  export default plugin;
}

declare module "markdown-it-named-headers" {
  import type MarkdownIt from "markdown-it";
  const plugin: (md: ReturnType<typeof MarkdownIt>, options?: any) => void;
  export default plugin;
}
