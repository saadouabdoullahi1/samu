/**
 * Normalize a free-text answer for exact/choice comparison:
 * lowercase, strip accents, collapse whitespace, trim.
 * Same normalization is applied at seed time and at compare time.
 */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
