// Client-safe constants (no Node imports) — shared by the scoring engine,
// the API routes, and the declarative WebMCP spec.
export const BUDGET = 5;
export const SCORE_THRESHOLD = 80;
/** Cosine/Jaccard floor above which a `text` answer counts. */
export const TEXT_MATCH_THRESHOLD = 0.72;
