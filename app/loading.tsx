function Placeholder({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function Loading() {
  return <div className="loading-page" role="status" aria-label="Loading current league data">
    <span className="loading-status">Loading the latest fixtures, results and standings…</span>
    <div aria-hidden="true">
      <div className="topbar"><div className="container"><span>THE HOME OF IT FOOTBALL IN NIŠ</span></div></div>
      <header className="site-header"><div className="container header-inner loading-header">
        <div className="brand"><span>IT<span className="brand-light">LIGA</span><small>NIŠ · FOOTBALL LEAGUE</small></span></div>
        <div className="loading-nav"><Placeholder /><Placeholder /><Placeholder /></div>
      </div></header>
      <main aria-busy="true">
        <section className="hero">
          <div className="hero-image" /><div className="hero-shade" />
          <div className="container hero-content">
            <div className="hero-copy">
              <div className="hero-eyebrow"><span />12 TEAMS. ONE COMMUNITY.</div>
              <h1>BUILT IN TECH.<br />UNITED BY<br /><span>FOOTBALL.</span></h1>
              <p>Out of the office. Onto the pitch.<br />Follow every goal, every match, every moment of IT Liga Niš.</p>
              <Placeholder className="loading-button" />
            </div>
            <div className="hero-right"><div className="featured-match loading-featured">
              <Placeholder className="loading-line" />
              <div className="loading-team-pair"><Placeholder /><Placeholder /></div>
              <Placeholder className="loading-line" />
            </div></div>
          </div>
          <div className="hero-bottom container"><span><span className="hero-bottom-line" />IT LIGA NIŠ</span><span>THE GAME CONNECTS US</span></div>
        </section>
        <div className="sync-strip"><div className="container sync-inner"><span className="sync-state"><span className="green-dot" />Loading league data…</span></div></div>
        <div className="container main-content">
          <div className="season-stats loading-stats">{Array.from({ length: 4 }, (_, i) => <div key={i}><Placeholder /></div>)}</div>
          <div className="loading-heading"><Placeholder /></div>
          <div className="loading-toolbar"><Placeholder /><Placeholder /></div>
          <div className="match-grid">{Array.from({ length: 6 }, (_, i) => <div className="loading-card" key={i}>
            <Placeholder className="loading-line" /><Placeholder /><Placeholder /><Placeholder className="loading-line" />
          </div>)}</div>
          <div className="league-columns">{[0, 1].map(i => <div className="loading-panel" key={i}>
            <Placeholder className="loading-line" />{Array.from({ length: 5 }, (_, row) => <Placeholder key={row} />)}
          </div>)}</div>
        </div>
      </main>
    </div>
  </div>;
}
