import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PingTool from "./PingTool";

type RegisterArgs = Parameters<NonNullable<Document["modelContext"]>["registerTool"]>;
type ToolArg = RegisterArgs[0];
type OptionsArg = NonNullable<RegisterArgs[1]>;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (document as Partial<Document>).modelContext;
});

describe("PingTool", () => {
  it("registers a `ping` tool with an AbortSignal when WebMCP is available", async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    document.modelContext = { registerTool };

    render(<PingTool />);

    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(1));
    const tool = registerTool.mock.calls[0][0] as ToolArg;
    const options = registerTool.mock.calls[0][1] as OptionsArg;
    expect(tool.name).toBe("ping");
    expect(typeof tool.execute).toBe("function");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(await screen.findByText(/WebMCP detected/i)).toBeInTheDocument();
  });

  it("aborts the tool's signal on unmount (unregisters the tool)", async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    document.modelContext = { registerTool };

    const { unmount } = render(<PingTool />);
    await waitFor(() => expect(registerTool).toHaveBeenCalled());
    const options = registerTool.mock.calls[0][1] as OptionsArg;
    expect(options.signal!.aborted).toBe(false);

    unmount();
    expect(options.signal!.aborted).toBe(true);
  });

  it("shows a fallback message when WebMCP is missing", async () => {
    render(<PingTool />);
    expect(await screen.findByText(/WebMCP not detected/i)).toBeInTheDocument();
  });

  it("execute() calls /api/ping and returns the server payload", async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    document.modelContext = { registerTool };
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true, echo: "hi" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PingTool />);
    await waitFor(() => expect(registerTool).toHaveBeenCalled());
    const tool = registerTool.mock.calls[0][0] as ToolArg;
    const result = await tool.execute({ message: "hi" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ping",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ ok: true, echo: "hi" });
  });
});
