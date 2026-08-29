// Ambient types for the WebMCP browser API (document.modelContext).
// The API is still a draft, so this shim stays permissive on purpose.
//
// Lifecycle note: there is no unregisterTool(). Registration takes an optional
// { signal }, and aborting that signal is the only way to remove a tool.
export {};

interface ModelContextToolInputSchema {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: ModelContextToolInputSchema;
  execute: (input: any) => Promise<unknown> | unknown;
}

interface ModelContextRegisterOptions {
  signal?: AbortSignal;
}

interface ModelContext {
  registerTool: (
    tool: ModelContextTool,
    options?: ModelContextRegisterOptions,
  ) => Promise<void> | void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}
