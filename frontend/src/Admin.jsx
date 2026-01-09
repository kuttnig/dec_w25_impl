import { useMemo, useState } from 'react';
import {
  useMutation, useQuery, useQueryClient,
} from '@tanstack/react-query';

import { createAdminApi } from './api';

const ADMIN_KEY_STORAGE = 'adminKey';

function getStoredAdminKey() {
  return localStorage.getItem(ADMIN_KEY_STORAGE) || '';
}
function setStoredAdminKey(key) {
  localStorage.setItem(ADMIN_KEY_STORAGE, key);
}
function clearStoredAdminKey() {
  localStorage.removeItem(ADMIN_KEY_STORAGE);
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(getStoredAdminKey());
  const [tab, setTab] = useState('overview');
  const [flash, setFlash] = useState(null);

  const api = useMemo(() => createAdminApi(adminKey), [adminKey]);

  const onUnauthorized = () => {
    clearStoredAdminKey();
    setAdminKey('');
    setTab('overview');
    setFlash({ type: 'error', text: 'Session expired or invalid admin key. Please login again.' });
  };

  if (!adminKey) {
    return (
      <section className="stack">
        <div className="pageTitleRow">
          <h2 className="pageTitle">Admin Console</h2>
          <span className="badge badgeAdmin">Admin</span>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Login</div>
              <div className="muted">Enter admin key to access administration features.</div>
            </div>
          </div>

          <AdminLogin
            onLogin={(key) => {
              setStoredAdminKey(key);
              setAdminKey(key);
              setFlash({ type: 'success', text: 'Logged in.' });
            }}
          />
          <div className="muted" style={{ marginTop: 10 }}>
            Default (docker compose): <code>admin</code>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="pageTitleRow">
        <div>
          <h2 className="pageTitle">Admin Console</h2>
          <div className="muted">marktverbund25.at · manage users, products & offers</div>
        </div>

        <div className="row">
          <span className="badge badgeAdmin">Admin</span>
          <button
            type="button"
            className="btn btnGhost"
            onClick={() => {
              onUnauthorized();
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`btn btnTab ${tab === 'overview' ? 'btnTabActive' : ''}`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={`btn btnTab ${tab === 'users' ? 'btnTabActive' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          className={`btn btnTab ${tab === 'products' ? 'btnTabActive' : ''}`}
          onClick={() => setTab('products')}
        >
          Products & Offers
        </button>
      </div>

      {flash && (
        <div className={`alert ${flash.type === 'error' ? 'alertError' : 'alertSuccess'}`}>
          <div>{flash.text}</div>
          <button type="button" className="btn btnGhost btnSmall" onClick={() => setFlash(null)}>
            Close
          </button>
        </div>
      )}

      {tab === 'overview' && <AdminOverview api={api} onUnauthorized={onUnauthorized} />}
      {tab === 'users' && <AdminUsers api={api} onUnauthorized={onUnauthorized} setFlash={setFlash} />}
      {tab === 'products' && <AdminProducts api={api} onUnauthorized={onUnauthorized} setFlash={setFlash} />}
    </section>
  );
}

function AdminLogin({ onLogin }) {
  const [key, setKey] = useState('');

  return (
    <form
      className="formRow"
      onSubmit={(e) => {
        e.preventDefault();
        const cleaned = key.trim();
        if (!cleaned) return;
        onLogin(cleaned);
      }}
    >
      <label className="field">
        <span className="fieldLabel">Admin key</span>
        <input
          className="input"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="admin"
        />
      </label>

      <button className="btn btnPrimary" type="submit">Login</button>
    </form>
  );
}

function AdminOverview({ api, onUnauthorized }) {
  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/overview');
        return res.data;
      } catch (err) {
        if (err?.response?.status === 401) onUnauthorized();
        throw err;
      }
    },
  });

  if (overviewQuery.isPending) return <p className="muted">Loading overview…</p>;
  if (overviewQuery.isError) return <p className="alert alertError">Failed to load overview.</p>;

  const { users, catalog, transactions } = overviewQuery.data;

  return (
    <div className="grid3">
      <StatCard title="Users" lines={[`Total: ${users.total}`, `Business: ${users.business}`, `Customers: ${users.customers}`]} />
      <StatCard title="Catalog" lines={[`Categories: ${catalog.categories}`, `Products: ${catalog.products}`, `Offers: ${catalog.offers}`]} />
      <StatCard title="Transactions" lines={[`Orders: ${transactions.orders}`, `Limit Orders: ${transactions.limits}`]} />
    </div>
  );
}

function StatCard({ title, lines }) {
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">{title}</div>
      </div>
      <ul className="list">
        {lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </div>
  );
}

function AdminUsers({ api, onUnauthorized, setFlash }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newIsBusiness, setNewIsBusiness] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/users');
        return res.data;
      } catch (err) {
        if (err?.response?.status === 401) onUnauthorized();
        throw err;
      }
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => api.post('/admin/users', { name: newName, isBusiness: newIsBusiness }),
    onSuccess: async () => {
      setNewName('');
      setNewIsBusiness(false);
      setFlash({ type: 'success', text: 'User created.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
      setFlash({ type: 'error', text: 'Failed to create user.' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, patch }) => api.patch(`/admin/users/${id}`, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
      setFlash({ type: 'error', text: 'Failed to update user.' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => api.delete(`/admin/users/${id}`),
    onSuccess: async () => {
      setFlash({ type: 'success', text: 'User deleted.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
      setFlash({ type: 'error', text: 'Failed to delete user.' });
    },
  });

  if (usersQuery.isPending) return <p className="muted">Loading users…</p>;
  if (usersQuery.isError) return <p className="alert alertError">Failed to load users.</p>;

  const { users } = usersQuery.data;

  return (
    <div className="stack">
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Create user</div>
            <div className="muted">Business users are required for B2B flows.</div>
          </div>
        </div>

        <form
          className="formRow"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            createUserMutation.mutate();
          }}
        >
          <label className="field">
            <span className="fieldLabel">Name</span>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Alice"
            />
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={newIsBusiness}
              onChange={(e) => setNewIsBusiness(e.target.checked)}
            />
            <span>Business user</span>
          </label>

          <button className="btn btnPrimary" type="submit" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div className="cardTitle">Users</div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Business?</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={u.isBusiness}
                        onChange={(e) => {
                          updateUserMutation.mutate({
                            id: u.id,
                            patch: { isBusiness: e.target.checked },
                          });
                        }}
                      />
                      <span className="muted">isBusiness</span>
                    </label>
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="btn btnDanger"
                      onClick={() => {
                        // eslint-disable-next-line no-alert
                        if (window.confirm(`Delete user "${u.name}"?`)) deleteUserMutation.mutate(u.id);
                      }}
                      disabled={deleteUserMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={3} className="muted">No users.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminProducts({ api, onUnauthorized, setFlash }) {
  const queryClient = useQueryClient();

  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/categories');
        return res.data;
      } catch (err) {
        if (err?.response?.status === 401) onUnauthorized();
        throw err;
      }
    },
  });

  const productsQuery = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/products');
        return res.data;
      } catch (err) {
        if (err?.response?.status === 401) onUnauthorized();
        throw err;
      }
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => api.post('/admin/products', {
      name: newProdName,
      description: newProdDesc,
      categoryIds: selectedCategoryIds,
    }),
    onSuccess: async () => {
      setNewProdName('');
      setNewProdDesc('');
      setSelectedCategoryIds([]);
      setFlash({ type: 'success', text: 'Product created.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
      setFlash({ type: 'error', text: 'Failed to create product.' });
    },
  });

  const addOfferMutation = useMutation({
    mutationFn: async ({ productId, seller, price }) => api.post(`/admin/products/${productId}/offers`, { seller, price }),
    onSuccess: async () => {
      setFlash({ type: 'success', text: 'Offer added.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
      setFlash({ type: 'error', text: 'Failed to add offer.' });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async ({ productId, offerId }) => api.delete(`/admin/products/${productId}/offers/${offerId}`),
    onSuccess: async () => {
      setFlash({ type: 'success', text: 'Offer removed.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
      setFlash({ type: 'error', text: 'Failed to remove offer.' });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => api.delete(`/admin/products/${productId}`),
    onSuccess: async () => {
      setFlash({ type: 'success', text: 'Product deleted.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
      setFlash({ type: 'error', text: 'Failed to delete product.' });
    },
  });

  if (categoriesQuery.isPending || productsQuery.isPending) return <p className="muted">Loading products…</p>;
  if (categoriesQuery.isError || productsQuery.isError) return <p className="alert alertError">Failed to load products.</p>;

  const { categories } = categoriesQuery.data;
  const { products } = productsQuery.data;

  return (
    <div className="stack">
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Create product</div>
            <div className="muted">Products + Offers are required for order / limit order demos.</div>
          </div>
        </div>

        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newProdName.trim()) return;
            createProductMutation.mutate();
          }}
        >
          <div className="formRow">
            <label className="field">
              <span className="fieldLabel">Name</span>
              <input
                className="input"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="e.g. USB-C Cable"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Description</span>
              <input
                className="input"
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                placeholder="short description"
              />
            </label>

            <button className="btn btnPrimary" type="submit" disabled={createProductMutation.isPending}>
              {createProductMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>

          <div className="stack">
            <div className="fieldLabel">Categories</div>
            <div className="row wrap">
              {categories.map((c) => {
                const checked = selectedCategoryIds.includes(c.id);
                return (
                  <label key={c.id} className="chip">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCategoryIds((prev) => [...prev, c.id]);
                        else setSelectedCategoryIds((prev) => prev.filter((x) => x !== c.id));
                      }}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      <div className="stack">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAddOffer={({ seller, price }) => addOfferMutation.mutate({ productId: p.id, seller, price })}
            onDeleteOffer={(offerId) => deleteOfferMutation.mutate({ productId: p.id, offerId })}
            onDeleteProduct={() => deleteProductMutation.mutate(p.id)}
          />
        ))}
        {!products.length && (
          <div className="card">
            <div className="muted">No products yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onAddOffer, onDeleteOffer, onDeleteProduct }) {
  const [seller, setSeller] = useState('');
  const [price, setPrice] = useState('');

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <div className="cardTitle">{product.name}</div>
          <div className="muted">{product.description || '—'}</div>
          <div className="muted" style={{ marginTop: 6 }}>
            {product.categories?.length
              ? `Categories: ${product.categories.map((c) => c.name).join(', ')}`
              : 'No categories'}
          </div>
        </div>

        <button
          type="button"
          className="btn btnDanger"
          onClick={() => {
            // eslint-disable-next-line no-alert
            if (window.confirm(`Delete product "${product.name}" (and its offers)?`)) onDeleteProduct();
          }}
        >
          Delete
        </button>
      </div>

      <div className="stack">
        <div className="divider" />

        <div className="row between">
          <div>
            <div className="cardTitle" style={{ fontSize: 14 }}>Offers</div>
            <div className="muted">Seller + price</div>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(product.offers || []).map((o) => (
                <tr key={o.id}>
                  <td>{o.seller}</td>
                  <td>{o.price}</td>
                  <td className="right">
                    <button type="button" className="btn btnGhost" onClick={() => onDeleteOffer(o.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {!product.offers?.length && (
                <tr>
                  <td colSpan={3} className="muted">No offers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          className="formRow"
          onSubmit={(e) => {
            e.preventDefault();
            const sellerClean = seller.trim();
            const priceNumber = Number(price);
            if (!sellerClean) return;
            if (Number.isNaN(priceNumber) || priceNumber <= 0) return;

            onAddOffer({ seller: sellerClean, price: priceNumber });
            setSeller('');
            setPrice('');
          }}
        >
          <label className="field">
            <span className="fieldLabel">Seller</span>
            <input
              className="input"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="e.g. MyShop GmbH"
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Price</span>
            <input
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 19.99"
            />
          </label>

          <button className="btn btnPrimary" type="submit">Add offer</button>
        </form>
      </div>
    </div>
  );
}
