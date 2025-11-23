export default function HomePage() {
  return (
    <section className="hero">
      <div className="pill">Phase 0 - Scaffold ready</div>
      <h1>Agent travel planner scaffold</h1>
      <p>
        Next.js + LangGraph workspace is set up. Specs live in <code>spec/</code> and the
        upcoming phases will add mock datasets, tools, and the LangGraph agent runtime.
      </p>
      <ul>
        <li>TypeScript, ESLint, Prettier, Vitest configured</li>
        <li>LangGraph/LangChain/LangSmith client dependencies installed</li>
        <li>App Router ready for API and UI layers</li>
      </ul>
    </section>
  );
}
