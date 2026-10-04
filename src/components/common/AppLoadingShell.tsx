/** Plain HTML keeps the first streamed frame independent of the UI bundle. */
export default function AppLoadingShell() {
  return (
    <div className="app-loading-shell" role="status" aria-label="Loading Kwonnet">
      <header className="app-loading-header"><img src="/logo.png" alt="Kwonnet" width="120" height="30" /></header>
      <div className="app-loading-columns">
        <aside aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div className="loading-placeholder" key={i} />)}</aside>
        <main aria-hidden="true">{Array.from({ length: 3 }, (_, i) => (
          <article className="app-loading-card" key={i}>
            <div className="loading-placeholder loading-avatar" />
            <div className="loading-placeholder" /><div className="loading-placeholder" />
            <div className="loading-placeholder loading-media" />
          </article>
        ))}</main>
      </div>
    </div>
  );
}
