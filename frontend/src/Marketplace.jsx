import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from './api';

// prototype doesn't support identification currently
const USER_ID = '507f1f77bcf86cd799439020';

export default function Marketplace() {
  const [selectedProdId, setSelectedProdId] = useState(null);

  return (
    <section className="stack">
      <div className="pageTitleRow">
        <h2 className="pageTitle">Marketplace</h2>
        <span className="badge">Customer view</span>
      </div>
      {selectedProdId ? (
        <OfferList selectedProdId={selectedProdId} setSelectedProdId={setSelectedProdId} />
      ) : (
        <ProductList setSelectedProdId={setSelectedProdId} />
      )}
    </section>
  );
}

function ProductList({ setSelectedProdId }) {
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
                  <button className="btn btnGhost" type="button" onClick={() => setSelectedProdId(prod.prodId)}>
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
  );
}

function OfferList({ selectedProdId, setSelectedProdId }) {
  const queryClient = useQueryClient();

  const offerListQuery = useQuery({
    queryKey: ['offers', 'list', selectedProdId],
    queryFn: async () => {
      const response = await api.post('/offers/List', { prodId: selectedProdId });
      return response.data;
    },
  });

  const placeOfferMutation = useMutation({
    mutationFn: (reqBody) => {
      const response = api.post('/orders/Place', reqBody);
      return response.data;
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ['offers', 'list', selectedProdId] });
    },
  });

  if (offerListQuery.isPending) return <p className="muted">Loading offers…</p>;
  if (offerListQuery.isError) return <p className="alert alertError">Failed to load offers.</p>;

  const { offers } = offerListQuery.data;
  const offerProps = offers?.[0] ? Object.keys(offers[0]) : [];

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <button className="btn btnGhost" type="button" onClick={() => setSelectedProdId(null)}>
            Back
          </button>
          <div className="cardTitle">
            Offers for Product
            {selectedProdId}
          </div>
          <div className="muted">Available offers for this product</div>
        </div>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              {offerProps.map((prop) => <th key={prop}>{prop}</th>)}
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.offerId}>
                {offerProps.map((prop) => <td key={`${offer.offerId}-${prop}`}>{offer[prop]}</td>)}
                <td>
                  <button
                    className="btn btnGhost"
                    type="button"
                    onClick={() => {
                      placeOfferMutation.mutate({ userId: USER_ID, offerId: offer.offerId });
                    }}
                  >
                    buy
                  </button>
                </td>
              </tr>
            ))}
            {!offers.length && (
            <tr>
              <td colSpan={offerProps.length} className="muted">No offers found.</td>
            </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
