import PingTool from "./components/PingTool";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-24">
      <header className="flex flex-col gap-2">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Sa<span className="text-emerald-600 dark:text-emerald-400">mu</span>
        </h1>
        <p className="text-sm uppercase tracking-widest text-neutral-500">
          &laquo; trouver &raquo; en haoussa &middot; WebMCP Challenge
        </p>
      </header>

      <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
        Prove it without revealing it. An agent runs the verification interview
        without ever learning the answers — the page holds the proof and returns
        only a verdict.
      </p>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-neutral-500">
          Skeleton status
        </p>
        <PingTool />
      </div>
    </main>
  );
}
