import { describe, it, expect } from "vitest";
import { POST } from "./route";

function makeRequest(body?: unknown) {
  return new Request("http://localhost/api/ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/ping", () => {
  it("echoes the provided message", async () => {
    const res = await POST(makeRequest({ message: "salut" }));
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.echo).toBe("salut");
    expect(json.from).toBe("samu server");
    expect(typeof json.at).toBe("string");
  });

  it('falls back to "ping" when no message is given', async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();
    expect(json.echo).toBe("ping");
  });

  it("handles an empty/invalid body without throwing", async () => {
    const res = await POST(makeRequest());
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.echo).toBe("ping");
  });

  it("ignores a non-string message", async () => {
    const res = await POST(makeRequest({ message: 42 }));
    const json = await res.json();
    expect(json.echo).toBe("ping");
  });
});
