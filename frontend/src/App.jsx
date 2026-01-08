import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import Admin from './Admin';

export default function App() {
  const [view, setView] = useState('market');

  return (
    <main style={{ padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Marketplace (Uni Projekt)</h1>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setView('market')} disabled={view === 'market'}>
            Customer view
          </button>
          <button type="button" onClick={() => setView('admin')} disabled={view === 'admin'}>
            Admin
          </button>
        </nav>
      </header>

      <hr />

      {view === 'market' && <ProductList />}
      {view === 'admin' && <Admin />}
    </main>
  );
}

function ProductList() {
  const productListQuery = useQuery({
    queryKey: ['productListQuery'],
    queryFn: async () => {
      const response = await axios.post('http://localhost:5172/products/List', {});
      return response.data;
    },
  });

  if (productListQuery.isPending) {
    return <p>fetching product list</p>;
  } if (productListQuery.isError) {
    return <p>failed to fetch product list</p>;
  }

  const { products } = productListQuery.data;
  const productProps = Object.keys(products[0]);

  return (
    <table>
      <thead>
        <tr>
          {productProps.map((prop) => <th key={prop}>{prop}</th>)}
          <th>offers</th>
        </tr>
      </thead>
      <tbody>
        {products.map((prod) => (
          <tr key={prod.prodId}>
            {
              productProps.map((prop) => <td key={`${prod.prodId}-${prop}`}>{prod[prop]}</td>)
            }
            <td>
              <button type="button">view</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
