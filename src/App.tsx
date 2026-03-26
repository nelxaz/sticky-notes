import { Board } from "./components/Board.tsx";

function App() {
  return (
    <main className="app-shell">
      <section className="app-shell__intro" aria-labelledby="app-title">
        <p className="app-shell__eyebrow">Slice 1</p>
        <h1 id="app-title">Sticky Notes</h1>
        <p className="app-shell__summary">
          A desktop-first board shell ready for note rendering, drag interactions, and resize
          behavior in the next slices.
        </p>
      </section>

      <Board />
    </main>
  );
}

export default App;
