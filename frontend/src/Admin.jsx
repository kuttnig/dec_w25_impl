import { useMemo, useState } from 'react';
import axios from 'axios';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const API_BASE = 'http://localhost:5172';
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

function createAdminApi(adminKey) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'x-admin-key': adminKey,
    },
  });
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(getStoredAdminKey());
  const [tab, setTab] = useState('overview');

  const api = useMemo(() => createAdminApi(adminKey), [adminKey]);

  // If we get 401 errors, we want to force the user to login again.
  const handleUnauthorized = () => {
    clearStoredAdminKey();
    setAdminKey('');
    setTab('overview');
  };

  if (!adminKey) {
    return (
      <AdminLogin
        onLogin={(key) => {
          setStoredAdminKey(key);
          setAdminKey(key);
        }}
      />
    );
  }

  return (
    <section>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Admin</h2>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setTab('overview')} disabled={tab === 'overview'}>
            Overview
          </button>
          <button type="button" onClick={() => setTab('users')} disabled={tab === 'users'}>
            Users
          </button>
          <button type="button" onClick={() => setTab('products')} disabled={tab === 'products'}>
            Products & Offers
          </button>
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => {
              handleUnauthorized();
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <hr />

      {tab === 'overview' && <AdminOverview api={api} onUnauthorized={handleUnauthorized} />}
      {tab === 'users' && <AdminUsers api={api} onUnauthorized={handleUnauthorized} />}
      {tab === 'products' && <AdminProducts api={api} onUnauthorized={handleUnauthorized} />}
    </section>
  );
}

function AdminLogin({ onLogin }) {
  const [key, setKey] = useState('');

  return (
    <section>
      <h2>Admin Login</h2>
      <p style={{ fontWeight: 'normal' }}>
        This project uses a simple admin key.
        Default (docker compose) is <code>admin</code>.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned = key.trim();
          if (!cleaned) return;
          onLogin(cleaned);
        }}
      >
        <label htmlFor="adminKey">
          Admin key
          <br />
          <input
            id="adminKey"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="admin"
          />
        </label>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Login</button>
        </div>
      </form>
    </section>
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

  if (overviewQuery.isPending) return <p>Loading overview…</p>;
  if (overviewQuery.isError) return <p>Failed to load overview.</p>;

  const { users, catalog, transactions } = overviewQuery.data;

  return (
    <section>
      <h3>Overview</h3>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <StatCard title="Users" lines={[`Total: ${users.total}`, `Business: ${users.business}`, `Customers: ${users.customers}`]} />
        <StatCard title="Catalog" lines={[`Categories: ${catalog.categories}`, `Products: ${catalog.products}`, `Offers: ${catalog.offers}`]} />
        <StatCard title="Transactions" lines={[`Orders: ${transactions.orders}`, `Limit Orders: ${transactions.limits}`]} />
      </div>
    </section>
  );
}

function StatCard({ title, lines }) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, minWidth: 220 }}>
      <strong>{title}</strong>
      <ul style={{ margin: '8px 0 0 16px' }}>
        {lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </div>
  );
}

function AdminUsers({ api, onUnauthorized }) {
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
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
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
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => api.delete(`/admin/users/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
    },
  });

  if (usersQuery.isPending) return <p>Loading users…</p>;
  if (usersQuery.isError) return <p>Failed to load users.</p>;

  const { users } = usersQuery.data;

  return (
    <section>
      <h3>Users</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          createUserMutation.mutate();
        }}
        style={{ border: '1px solid #eee', padding: 12, marginBottom: 12 }}
      >
        <strong>Create user</strong>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <label htmlFor="newUserName">
            Name
            <br />
            <input
              id="newUserName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Alice"
            />
          </label>
          <label htmlFor="newUserIsBusiness" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              id="newUserIsBusiness"
              type="checkbox"
              checked={newIsBusiness}
              onChange={(e) => setNewIsBusiness(e.target.checked)}
            />
            Business user
          </label>
          <button type="submit" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Business?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>
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
              </td>
              <td>
                <button
                  type="button"
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
        </tbody>
      </table>
    </section>
  );
}

function AdminProducts({ api, onUnauthorized }) {
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
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
    },
  });

  const addOfferMutation = useMutation({
    mutationFn: async ({ productId, seller, price }) => api.post(`/admin/products/${productId}/offers`, { seller, price }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async ({ productId, offerId }) => api.delete(`/admin/products/${productId}/offers/${offerId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => api.delete(`/admin/products/${productId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => {
      if (err?.response?.status === 401) onUnauthorized();
    },
  });

  if (categoriesQuery.isPending || productsQuery.isPending) return <p>Loading products…</p>;
  if (categoriesQuery.isError || productsQuery.isError) return <p>Failed to load products or categories.</p>;

  const { categories } = categoriesQuery.data;
  const { products } = productsQuery.data;

  return (
    <section>
      <h3>Products & Offers</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newProdName.trim()) return;
          createProductMutation.mutate();
        }}
        style={{ border: '1px solid #eee', padding: 12, marginBottom: 12 }}
      >
        <strong>Create product</strong>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <label htmlFor="newProdName">
            Name
            <br />
            <input
              id="newProdName"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              placeholder="e.g. USB-C Cable"
            />
          </label>

          <label htmlFor="newProdDesc">
            Description
            <br />
            <input
              id="newProdDesc"
              value={newProdDesc}
              onChange={(e) => setNewProdDesc(e.target.value)}
              placeholder="short description"
            />
          </label>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 4 }}>Categories</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {categories.map((c) => {
              const checked = selectedCategoryIds.includes(c.id);
              return (
                <label key={c.id} htmlFor={`cat-${c.id}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    id={`cat-${c.id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategoryIds((prev) => [...prev, c.id]);
                      } else {
                        setSelectedCategoryIds((prev) => prev.filter((x) => x !== c.id));
                      }
                    }}
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={createProductMutation.isPending}>
            {createProductMutation.isPending ? 'Creating…' : 'Create product'}
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAddOffer={({ seller, price }) => addOfferMutation.mutate({ productId: p.id, seller, price })}
            onDeleteOffer={(offerId) => deleteOfferMutation.mutate({ productId: p.id, offerId })}
            onDeleteProduct={() => deleteProductMutation.mutate(p.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, onAddOffer, onDeleteOffer, onDeleteProduct }) {
  const [seller, setSeller] = useState('');
  const [price, setPrice] = useState('');

  return (
    <div style={{ border: '1px solid #ddd', padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <strong>{product.name}</strong>
        <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>
          {product.categories?.length ? `Categories: ${product.categories.map((c) => c.name).join(', ')}` : 'No category'}
        </span>
        <button
          type="button"
          onClick={() => {
            // eslint-disable-next-line no-alert
            if (window.confirm(`Delete product "${product.name}" (and its offers)?`)) onDeleteProduct();
          }}
        >
          Delete product
        </button>
      </div>
      <div style={{ marginTop: 6 }}>{product.description}</div>

      <h4 style={{ marginBottom: 6 }}>Offers</h4>
      {product.offers?.length ? (
        <table>
          <thead>
            <tr>
              <th>Seller</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {product.offers.map((o) => (
              <tr key={o.id}>
                <td>{o.seller}</td>
                <td>{o.price}</td>
                <td>
                  <button type="button" onClick={() => onDeleteOffer(o.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ fontWeight: 'normal' }}>No offers yet.</p>
      )}

      <form
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
        style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 10 }}
      >
        <strong>Add offer</strong>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <label htmlFor={`seller-${product.id}`}>
            Seller
            <br />
            <input
              id={`seller-${product.id}`}
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="e.g. MyShop GmbH"
            />
          </label>

          <label htmlFor={`price-${product.id}`}>
            Price
            <br />
            <input
              id={`price-${product.id}`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 19.99"
            />
          </label>

          <button type="submit">Add</button>
        </div>
        <p style={{ fontWeight: 'normal', fontSize: 12, opacity: 0.75 }}>
          Tip: price must be a positive number.
        </p>
      </form>
    </div>
  );
}
