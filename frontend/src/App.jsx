import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from './api';
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

function Marketplace() {
  const productListQuery = useQuery({
    queryKey: ['products', 'list'],
    queryFn: async () => {
      const response = await api.post('/products/List', {});
      return response.data;
    },
  });

  if (productListQuery.isPending) return <p className="muted">Loading products…</p>;
  if (productListQuery.isError) return <p className="alert alertError">Failed to load products.</p>;

  const { products } = productListQuery.data;
  const productProps = products?.[0] ? Object.keys(products[0]) : [];

  return (
    <section className="stack">
      <div className="pageTitleRow">
        <h2 className="pageTitle">Marketplace</h2>
        <span className="badge">Customer view</span>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Product List</div>
            <div className="muted">Browse available products (demo view)</div>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                {productProps.map((prop) => <th key={prop}>{prop}</th>)}
                <th>offers</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.prodId}>
                  {productProps.map((prop) => <td key={`${prod.prodId}-${prop}`}>{prod[prop]}</td>)}
                  <td>
                    <button className="btn btnGhost" type="button" disabled>
                      view
                    </button>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr>
                  <td colSpan={productProps.length + 1} className="muted">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
