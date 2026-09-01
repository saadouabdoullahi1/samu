import { describe, it, expect } from "vitest";
import { PAGES, TOOLS, toolsForPage, type PageId } from "./spec";

const PAGE_IDS = new Set(PAGES.map((p) => p.id));
const KNOWN_PARAMS = new Set(["itemId", "claimId"]);
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

describe("spec integrity", () => {
  it("has unique tool names", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every tool targets a declared page (or a planned one)", () => {
    const planned: PageId[] = ["my-items", "found"];
    for (const t of TOOLS) {
      expect(PAGE_IDS.has(t.page) || planned.includes(t.page)).toBe(true);
    }
  });

  it("every input schema is a well-formed object schema", () => {
    for (const t of TOOLS) {
      expect(t.inputSchema.type).toBe("object");
      for (const req of t.inputSchema.required ?? []) {
        expect(Object.keys(t.inputSchema.properties ?? {})).toContain(req);
      }
    }
  });

  it("tool descriptions are static, non-empty text", () => {
    for (const t of TOOLS) {
      expect(t.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("fetch tools hit /api with only known path placeholders and declared body keys", () => {
    for (const t of TOOLS) {
      if (t.transport.kind !== "fetch") continue;
      expect(t.transport.path.startsWith("/api/")).toBe(true);
      for (const p of placeholders(t.transport.path)) {
        expect(KNOWN_PARAMS.has(p)).toBe(true);
      }
      for (const key of t.transport.body ?? []) {
        expect(Object.keys(t.inputSchema.properties ?? {})).toContain(key);
      }
    }
  });

  it("navigate tools resolve their placeholder from an input field", () => {
    for (const t of TOOLS) {
      if (t.transport.kind !== "navigate") continue;
      for (const p of placeholders(t.transport.path)) {
        expect(Object.keys(t.inputSchema.properties ?? {})).toContain(p);
      }
    }
  });
});

describe("spec ↔ page contract", () => {
  it("the item page exposes the conversational verification tools", () => {
    expect(toolsForPage("item").map((t) => t.name).sort()).toEqual(
      [
        "complete_verification",
        "get_found_item",
        "get_next_verification_question",
        "request_contact",
        "start_claim",
        "submit_verification_answer",
      ].sort(),
    );
  });

  it("the lost page exposes search + open_item", () => {
    expect(toolsForPage("lost").map((t) => t.name).sort()).toEqual(
      ["open_item", "search_found_items"].sort(),
    );
  });
});
