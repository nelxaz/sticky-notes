export function Board() {
  return (
    <section className="board-frame" aria-labelledby="board-title">
      <header className="board-frame__header">
        <div>
          <p className="board-frame__label">Workspace</p>
          <h2 id="board-title">Board</h2>
        </div>
        <p className="board-frame__status">Empty board</p>
      </header>

      <div className="board-surface" aria-label="Sticky notes board" role="presentation">
        <div className="board-surface__grid" aria-hidden="true" />
        <p className="board-surface__hint">Double-clicking empty space will create notes here.</p>
      </div>
    </section>
  );
}
