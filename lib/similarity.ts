import { normalize } from "./normalize";

/**
 * Semantic similarity in [0, 1] between a claimant answer and a stored secret.
 *
 * If OPENAI_API_KEY is set, uses text-embedding-3-small + cosine. Otherwise
 * falls back to a local character-trigram Jaccard similarity so the engine
 * stays testable offline. Same public contract either way.
 */
export async function similarity(a: string, b: string): Promise<number> {
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      return await embeddingCosine(a, b, key);
    } catch {
      // network/key failure — degrade gracefully to the local measure
    }
  }
  return trigramSimilarity(a, b);
}

async function embeddingCosine(a: string, b: string, key: string): Promise<number> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: [a, b] }),
  });
  if (!res.ok) throw new Error(`embeddings ${res.status}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  const [va, vb] = json.data.map((d) => d.embedding);
  return cosine(va, vb);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return clamp01(dot / (Math.sqrt(na) * Math.sqrt(nb)));
}

function trigrams(value: string): Set<string> {
  const s = ` ${normalize(value)} `;
  const set = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
  return set;
}

/** Character-trigram Jaccard similarity — the offline fallback. */
export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
