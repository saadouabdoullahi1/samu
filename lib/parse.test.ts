import { describe, it, expect } from "vitest";
import { extractCriteria } from "./parse";

describe("extractCriteria", () => {
  it("pulls category, color and zone from a natural sentence", () => {
    expect(extractCriteria("I lost my black Samsung near Yantala")).toEqual({
      category: "Phone",
      color: "black",
      zone: "Yantala",
    });
  });

  it("recognizes a wallet at the Grand Marché", () => {
    const c = extractCriteria("a brown leather wallet at the Grand Marché");
    expect(c.category).toBe("Wallet");
    expect(c.color).toBe("brown");
    expect(c.zone).toBe("Grand Marché");
  });

  it("returns nothing for an empty or unrecognized description", () => {
    expect(extractCriteria("")).toEqual({});
    expect(extractCriteria("something undefined")).toEqual({});
  });
});
