// Ambient types for the WebMCP browser API (document.modelContext).
// The API is still a draft, so this shim stays permissive on purpose.
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

interface ModelContextRegistration {
  unregister?: () => void;
}

interface ModelContext {
  registerTool: (tool: ModelContextTool) => ModelContextRegistration | void;
  unregisterTool?: (name: string) => void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}
