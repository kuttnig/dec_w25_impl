import { useState } from 'react';

import Marketplace from './Marketplace';
import Admin from './Admin';

export default function App() {
  const [view, setView] = useState('market');

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <div className="logo">mv25</div>
            <div className="brandText">
              <div className="brandName">marktverbund25.at</div>
              <div className="brandSub">Third‑party Marketplace Demo</div>
            </div>
          </div>

          <nav className="topnav">
            <button
              type="button"
              className={`btn btnTab ${view === 'market' ? 'btnTabActive' : ''}`}
              onClick={() => setView('market')}
            >
              Marketplace
            </button>
            <button
              type="button"
              className={`btn btnTab ${view === 'admin' ? 'btnTabActive' : ''}`}
              onClick={() => setView('admin')}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {view === 'market' && <Marketplace />}
        {view === 'admin' && <Admin />}
      </main>

      <footer className="footer">
        <div className="container footerInner">
          <span>marktverbund25.at · Uni Projekt (WS2025/26)</span>
          <span className="muted">HTTPS via NGINX Reverse Proxy</span>
        </div>
      </footer>
    </div>
  );
}
