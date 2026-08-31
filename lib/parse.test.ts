import { describe, it, expect } from "vitest";
import { extractCriteria } from "./parse";

describe("extractCriteria", () => {
  it("pulls category, color and zone from a natural sentence", () => {
    expect(extractCriteria("j'ai perdu mon Samsung noir hier près de Yantala")).toEqual({
      category: "Téléphone",
      color: "noir",
      zone: "Yantala",
    });
  });

  it("recognizes a wallet at the Grand Marché", () => {
    const c = extractCriteria("un portefeuille en cuir marron au Grand Marché");
    expect(c.category).toBe("Portefeuille");
    expect(c.color).toBe("marron");
    expect(c.zone).toBe("Grand Marché");
  });

  it("returns nothing for an empty or unrecognized description", () => {
    expect(extractCriteria("")).toEqual({});
    expect(extractCriteria("quelque chose d'indéfini")).toEqual({});
  });
});
