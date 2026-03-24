import { useState, useEffect, useMemo } from 'react';
import {
  FiPackage, FiUsers, FiDollarSign, FiTrendingUp, FiPlus, FiEdit, FiTrash2,
  FiSearch, FiFilter, FiAlertTriangle, FiEye, FiRefreshCw, FiBarChart2,
  FiShoppingCart, FiCheckCircle, FiClock, FiXCircle, FiTruck, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Classic', 'Super Treasure Hunt', 'Racing', 'Fantasy', 'Licensed', 'Monster Trucks', 'Track Sets', 'Limited Edition'];
const ORDER_STATUSES = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

/* ── tiny sparkline-style bar chart ── */
const MiniBar = ({ value, max, color = 'var(--red)' }) => (
  <div style={{ height: 6, background: 'var(--dark-4)', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
    <div style={{ height: '100%', width: `${Math.min(100, (value / (max || 1)) * 100)}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
  </div>
);

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', originalPrice: '', category: 'Classic',
    brand: 'Hot Wheels', series: '', year: new Date().getFullYear(), scale: '1:64',
    color: '', stockCount: 10, isNewArrival: false, isFeatured: false, images: [''],
  });

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [pRes, oRes, uRes] = await Promise.all([
        api.get('/products?limit=200'),
        api.get('/orders'),
        api.get('/users'),
      ]);
      setProducts(pRes.data.products || []);
      setOrders(oRes.data || []);
      setUsers(uRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  /* ── DERIVED STATS ── */
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const todayRevenue = activeOrders.filter(o => {
      const d = new Date(o.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).reduce((acc, o) => acc + o.totalPrice, 0);

    const statusCounts = ORDER_STATUSES.reduce((acc, s) => {
      acc[s] = orders.filter(o => o.status === s).length;
      return acc;
    }, {});

    const lowStock = products.filter(p => p.stockCount > 0 && p.stockCount <= 5);
    const outOfStock = products.filter(p => p.stockCount === 0);
    const avgOrderValue = activeOrders.length ? Math.round(totalRevenue / activeOrders.length) : 0;

    const categoryRevenue = {};
    orders.forEach(o => o.orderItems?.forEach(item => {
      // rough estimate — no category on order item, skip
    }));

    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const recentUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    return { totalRevenue, todayRevenue, statusCounts, lowStock, outOfStock, avgOrderValue, recentOrders, recentUsers };
  }, [orders, products, users]);

  /* ── FILTERED DATA ── */
  const filteredProducts = useMemo(() => products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchStock = stockFilter === 'All' ? true : stockFilter === 'Low' ? (p.stockCount > 0 && p.stockCount <= 5) : stockFilter === 'Out' ? p.stockCount === 0 : p.stockCount > 5;
    return matchSearch && matchStock;
  }), [products, productSearch, stockFilter]);

  const filteredOrders = useMemo(() => orders.filter(o => {
    const matchSearch = o._id.toLowerCase().includes(orderSearch.toLowerCase()) || o.user?.name?.toLowerCase().includes(orderSearch.toLowerCase()) || o.user?.email?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = orderStatusFilter === 'All' ? true : o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  }), [orders, orderSearch, orderStatusFilter]);

  /* ── HANDLERS ── */
  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); fetchAll(true); }
    catch (e) { toast.error('Failed to delete'); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) { await api.put(`/products/${editProduct._id}`, productForm); toast.success('Product updated!'); }
      else { await api.post('/products', productForm); toast.success('Product created!'); }
      setShowForm(false); setEditProduct(null); fetchAll(true);
    } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try { await api.put(`/orders/${orderId}/status`, { status }); toast.success('Status updated!'); fetchAll(true); }
    catch (e) { toast.error('Failed to update'); }
  };

  const startEdit = (product) => {
    setEditProduct(product);
    setProductForm({ ...product, images: product.images?.length ? product.images : [''] });
    setShowForm(true); setTab('products');
    setTimeout(() => window.scrollTo({ top: 200, behavior: 'smooth' }), 100);
  };

  const resetForm = () => {
    setProductForm({ name: '', description: '', price: '', originalPrice: '', category: 'Classic', brand: 'Hot Wheels', series: '', year: new Date().getFullYear(), scale: '1:64', color: '', stockCount: 10, isNewArrival: false, isFeatured: false, images: [''] });
    setEditProduct(null);
  };

  const STATUS_ICONS = { Processing: <FiClock />, Confirmed: <FiCheckCircle />, Shipped: <FiTruck />, Delivered: <FiPackage />, Cancelled: <FiXCircle /> };
  const STATUS_COLORS = { Processing: 'var(--yellow)', Confirmed: 'var(--blue)', Shipped: '#8080ff', Delivered: '#00d264', Cancelled: 'var(--red)' };
  const maxStatus = Math.max(...Object.values(stats.statusCounts));

  if (loading) return <div className="spinner" style={{ marginTop: '100px' }}></div>;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1>Admin <span>Dashboard</span></h1>
            <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-accent)', marginTop: '6px', fontSize: '0.9rem' }}>
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => fetchAll(true)} disabled={refreshing}>
            <FiRefreshCw style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="container" style={{ padding: '36px 20px' }}>

        {/* ── KPI CARDS ── */}
        <div className="admin-kpi-grid">
          {[
            { icon: <FiDollarSign />, label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, sub: `₹${stats.todayRevenue.toLocaleString()} today`, color: 'red', trend: '+12%' },
            { icon: <FiShoppingCart />, label: 'Total Orders', value: orders.length, sub: `${stats.statusCounts.Processing || 0} pending`, color: 'yellow', trend: '+8%' },
            { icon: <FiPackage />, label: 'Products', value: products.length, sub: `${stats.outOfStock.length} out of stock`, color: 'blue', trend: '' },
            { icon: <FiUsers />, label: 'Customers', value: users.filter(u => !u.isAdmin).length, sub: `${stats.recentUsers.length} recent`, color: 'green', trend: '+5%' },
            { icon: <FiBarChart2 />, label: 'Avg Order Value', value: `₹${stats.avgOrderValue.toLocaleString()}`, sub: 'Per transaction', color: 'purple', trend: '' },
            { icon: <FiAlertTriangle />, label: 'Low Stock', value: stats.lowStock.length, sub: `${stats.outOfStock.length} out of stock`, color: 'orange', trend: '' },
          ].map((kpi, i) => (
            <div key={i} className={`kpi-card kpi-${kpi.color}`}>
              <div className={`kpi-icon kpi-icon-${kpi.color}`}>{kpi.icon}</div>
              <div className="kpi-body">
                <p className="kpi-label">{kpi.label}</p>
                <strong className="kpi-value">{kpi.value}</strong>
                <div className="kpi-bottom">
                  <span className="kpi-sub">{kpi.sub}</span>
                  {kpi.trend && <span className="kpi-trend"><FiArrowUp size={11} /> {kpi.trend}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── OVERVIEW ROW ── */}
        <div className="admin-overview-row">
          {/* Order Status Breakdown */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>Orders by Status</h3>
              <FiBarChart2 style={{ color: 'var(--gray)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ORDER_STATUSES.map(s => (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-accent)', fontSize: '0.82rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: STATUS_COLORS[s] }}>
                      {STATUS_ICONS[s]} {s}
                    </span>
                    <strong>{stats.statusCounts[s] || 0}</strong>
                  </div>
                  <MiniBar value={stats.statusCounts[s] || 0} max={maxStatus} color={STATUS_COLORS[s]} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>Recent Orders</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setTab('orders')}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentOrders.map(o => (
                <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--dark-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.82rem' }}>#{o._id.slice(-6).toUpperCase()}</p>
                    <p style={{ color: 'var(--gray)', fontSize: '0.75rem', fontFamily: 'var(--font-accent)' }}>{o.user?.name || 'Guest'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, color: 'var(--red)', fontSize: '0.88rem' }}>₹{o.totalPrice?.toLocaleString()}</p>
                    <span className={`status-badge status-${o.status}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3><FiAlertTriangle style={{ color: 'var(--yellow)' }} /> Stock Alerts</h3>
            </div>
            {stats.lowStock.length === 0 && stats.outOfStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray)', fontFamily: 'var(--font-accent)' }}>
                <FiCheckCircle size={28} style={{ color: '#00d264', marginBottom: 8 }} />
                <p>All products well stocked!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...stats.outOfStock, ...stats.lowStock].slice(0, 6).map(p => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: p.stockCount === 0 ? 'rgba(255,45,32,0.06)' : 'rgba(255,215,0,0.06)', borderRadius: 8, border: `1px solid ${p.stockCount === 0 ? 'rgba(255,45,32,0.2)' : 'rgba(255,215,0,0.2)'}` }}>
                    <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.82rem', fontWeight: 700 }}>{p.name.slice(0, 30)}{p.name.length > 30 ? '…' : ''}</p>
                    <span style={{ fontFamily: 'var(--font-accent)', fontSize: '0.8rem', fontWeight: 700, color: p.stockCount === 0 ? 'var(--red)' : 'var(--yellow)', background: p.stockCount === 0 ? 'rgba(255,45,32,0.12)' : 'rgba(255,215,0,0.12)', padding: '3px 10px', borderRadius: 20 }}>
                      {p.stockCount === 0 ? 'OUT' : `${p.stockCount} left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="tabs" style={{ marginTop: 40 }}>
          <button className={`tab-btn ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}><FiPackage /> Products ({products.length})</button>
          <button className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}><FiShoppingCart /> Orders ({orders.length})</button>
          <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}><FiUsers /> Users ({users.length})</button>
        </div>

        {/* ══════════════ PRODUCTS TAB ══════════════ */}
        {tab === 'products' && (
          <div>
            {/* TOOLBAR */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <FiSearch className="admin-search-icon" />
                <input className="admin-search-input" placeholder="Search products by name or category..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              </div>
              <select className="sort-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option value="All">All Stock</option>
                <option value="In">In Stock</option>
                <option value="Low">Low Stock (≤5)</option>
                <option value="Out">Out of Stock</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
                <FiPlus /> Add Product
              </button>
            </div>

            {/* PRODUCT FORM */}
            {showForm && (
              <div className="admin-form-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {editProduct ? '✏️ Edit Product' : '➕ Add New Product'}
                  </h3>
                  <button className="btn btn-outline btn-sm" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                </div>
                <form onSubmit={handleProductSubmit}>
                  <div className="grid-2">
                    <div className="form-group"><label>Product Name *</label><input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Hot Wheels Twin Mill" required /></div>
                    <div className="form-group"><label>Category *</label>
                      <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Sale Price (₹) *</label><input type="number" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="299" required /></div>
                    <div className="form-group"><label>Original Price (₹) <span style={{ color: 'var(--gray)', fontSize: '0.78rem' }}>for strike-through</span></label><input type="number" min="0" value={productForm.originalPrice} onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })} placeholder="399" /></div>
                    <div className="form-group"><label>Stock Count *</label><input type="number" min="0" value={productForm.stockCount} onChange={(e) => setProductForm({ ...productForm, stockCount: e.target.value })} /></div>
                    <div className="form-group"><label>Series</label><input value={productForm.series} onChange={(e) => setProductForm({ ...productForm, series: e.target.value })} placeholder="e.g. Legends Series" /></div>
                    <div className="form-group"><label>Color</label><input value={productForm.color} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} placeholder="e.g. Flame Orange" /></div>
                    <div className="form-group"><label>Year</label><input type="number" value={productForm.year} onChange={(e) => setProductForm({ ...productForm, year: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Description *</label><textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required rows={3} placeholder="Describe the product..." /></div>
                  <div className="form-group"><label>Image URL</label><input value={productForm.images[0]} onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })} placeholder="https://images.unsplash.com/..." /></div>
                  {productForm.images[0] && <img src={productForm.images[0]} alt="preview" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }} onError={(e) => e.target.style.display = 'none'} />}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                    {[{ key: 'isFeatured', label: '⭐ Featured Product' }, { key: 'isNewArrival', label: '🆕 New Arrival' }].map(({ key, label }) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-accent)', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={productForm[key]} onChange={(e) => setProductForm({ ...productForm, [key]: e.target.checked })} style={{ accentColor: 'var(--red)', width: 16, height: 16 }} />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="submit" className="btn btn-primary">{editProduct ? 'Update Product' : 'Create Product'}</button>
                    <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* PRODUCT TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th><th>Price</th><th>Stock</th>
                    <th>Rating</th><th>Tags</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const discount = p.originalPrice && p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                    const stockColor = p.stockCount === 0 ? 'var(--red)' : p.stockCount <= 5 ? 'var(--yellow)' : '#00d264';
                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={p.images?.[0]} alt="" style={{ width: 52, height: 42, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} onError={(e) => e.target.style.display = 'none'} />
                            <div>
                              <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.88rem', maxWidth: 180 }}>{p.name}</p>
                              <p style={{ color: 'var(--gray)', fontSize: '0.72rem', fontFamily: 'var(--font-accent)' }}>{p.series || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-dark">{p.category}</span></td>
                        <td>
                          <div>
                            <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, color: 'var(--red)' }}>₹{p.price}</p>
                            {discount > 0 && <p style={{ fontSize: '0.72rem', color: 'var(--gray)', textDecoration: 'line-through', fontFamily: 'var(--font-accent)' }}>₹{p.originalPrice} (-{discount}%)</p>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MiniBar value={p.stockCount} max={50} color={stockColor} />
                            <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, color: stockColor, fontSize: '0.85rem', minWidth: 28 }}>{p.stockCount}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-accent)', fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--yellow)' }}>★</span>
                            <span>{p.rating?.toFixed(1)}</span>
                            <span style={{ color: 'var(--gray)' }}>({p.numReviews})</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {p.isFeatured && <span className="badge badge-yellow" style={{ fontSize: '0.65rem' }}>Featured</span>}
                            {p.isNewArrival && <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>New</span>}
                            {p.stockCount === 0 && <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>OOS</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link to={`/products/${p._id}`} className="admin-action-btn" title="View"><FiEye /></Link>
                            <button className="admin-action-btn" title="Edit" onClick={() => startEdit(p)}><FiEdit /></button>
                            <button className="admin-action-btn danger" title="Delete" onClick={() => handleDeleteProduct(p._id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <FiPackage size={40} />
                  <h3>No products match your filters</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ ORDERS TAB ══════════════ */}
        {tab === 'orders' && (
          <div>
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <FiSearch className="admin-search-icon" />
                <input className="admin-search-input" placeholder="Search by order ID or customer name..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
              </div>
              <select className="sort-select" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th>
                    <th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o._id}>
                      <td><span style={{ fontFamily: 'var(--font-accent)', fontSize: '0.82rem', color: 'var(--gray)' }}>#{o._id.slice(-8).toUpperCase()}</span></td>
                      <td>
                        <div>
                          <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.88rem' }}>{o.user?.name || 'Guest'}</p>
                          <p style={{ color: 'var(--gray)', fontSize: '0.75rem', fontFamily: 'var(--font-accent)' }}>{o.user?.email}</p>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {o.orderItems?.slice(0, 2).map((item, i) => (
                            <img key={i} src={item.image} alt="" style={{ width: 36, height: 30, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} onError={(e) => e.target.style.display = 'none'} />
                          ))}
                          {o.orderItems?.length > 2 && <span style={{ fontFamily: 'var(--font-accent)', fontSize: '0.75rem', color: 'var(--gray)' }}>+{o.orderItems.length - 2}</span>}
                        </div>
                      </td>
                      <td><strong style={{ fontFamily: 'var(--font-accent)', color: 'var(--red)', fontSize: '0.95rem' }}>₹{o.totalPrice?.toLocaleString()}</strong></td>
                      <td><span className="badge badge-dark">{o.paymentMethod}</span></td>
                      <td>
                        <select value={o.status} onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)} className={`status-select status-select-${o.status}`}>
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><span style={{ fontSize: '0.78rem', color: 'var(--gray)', fontFamily: 'var(--font-accent)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span></td>
                      <td>
                        <Link to={`/order/${o._id}/invoice`} className="admin-action-btn" title="View Invoice"><FiEye /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <FiShoppingCart size={40} />
                  <h3>No orders match your filters</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ USERS TAB ══════════════ */}
        {tab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700 }}>{u.name}</span>
                      </div>
                    </td>
                    <td><span style={{ color: 'var(--gray)', fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>{u.email}</span></td>
                    <td><span className={`badge ${u.isAdmin ? 'badge-red' : 'badge-dark'}`}>{u.isAdmin ? '👑 Admin' : 'User'}</span></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--gray)', fontFamily: 'var(--font-accent)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        /* KPI GRID */
        .admin-kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 28px; }
        .kpi-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; gap: 14px; align-items: flex-start; transition: var(--transition); }
        .kpi-card:hover { transform: translateY(-3px); border-color: var(--red); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; }
        .kpi-icon-red { background: rgba(255,45,32,0.12); color: var(--red); border: 1px solid rgba(255,45,32,0.2); }
        .kpi-icon-yellow { background: rgba(255,215,0,0.12); color: var(--yellow); border: 1px solid rgba(255,215,0,0.2); }
        .kpi-icon-blue { background: rgba(0,212,255,0.12); color: var(--blue); border: 1px solid rgba(0,212,255,0.2); }
        .kpi-icon-green { background: rgba(0,210,100,0.12); color: #00d264; border: 1px solid rgba(0,210,100,0.2); }
        .kpi-icon-purple { background: rgba(128,128,255,0.12); color: #8080ff; border: 1px solid rgba(128,128,255,0.2); }
        .kpi-icon-orange { background: rgba(255,140,0,0.12); color: #ff8c00; border: 1px solid rgba(255,140,0,0.2); }
        .kpi-body { flex: 1; min-width: 0; }
        .kpi-label { font-family: var(--font-accent); font-size: 0.7rem; letter-spacing: 0.07em; text-transform: uppercase; color: var(--gray); margin-bottom: 4px; }
        .kpi-value { font-family: var(--font-heading); font-size: 1.25rem; display: block; margin-bottom: 4px; }
        .kpi-bottom { display: flex; align-items: center; gap: 8px; }
        .kpi-sub { font-family: var(--font-accent); font-size: 0.7rem; color: var(--gray); }
        .kpi-trend { font-family: var(--font-accent); font-size: 0.7rem; color: #00d264; display: flex; align-items: center; gap: 2px; }

        /* OVERVIEW ROW */
        .admin-overview-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 12px; }
        .admin-panel { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
        .admin-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .admin-panel-header h3 { font-family: var(--font-accent); font-size: 0.9rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }

        /* TOOLBAR */
        .admin-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
        .admin-search-wrap { flex: 1; min-width: 240px; position: relative; }
        .admin-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--gray); }
        .admin-search-input { width: 100%; background: var(--dark-3); border: 1px solid var(--border); color: var(--white); padding: 10px 14px 10px 40px; border-radius: 8px; font-family: var(--font-accent); font-size: 0.88rem; transition: var(--transition); }
        .admin-search-input:focus { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-glow); outline: none; }

        /* FORM CARD */
        .admin-form-card { background: var(--dark-2); border: 1px solid rgba(255,45,32,0.25); border-radius: 14px; padding: 28px; margin-bottom: 24px; animation: slideDown 0.2s ease; }

        /* TABLE */
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { padding: 12px 14px; text-align: left; font-family: var(--font-accent); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray); border-bottom: 1px solid var(--border); white-space: nowrap; }
        .admin-table td { padding: 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .admin-table tr:hover td { background: var(--dark-2); }
        .admin-table tbody tr:last-child td { border-bottom: none; }

        /* ACTION BUTTONS */
        .admin-action-btn { width: 32px; height: 32px; background: var(--dark-4); border: 1px solid var(--border); color: var(--gray); border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); text-decoration: none; font-size: 0.85rem; }
        .admin-action-btn:hover { border-color: var(--red); color: var(--red); background: rgba(255,45,32,0.1); }
        .admin-action-btn.danger:hover { background: var(--red); color: white; border-color: var(--red); }

        /* STATUS SELECT */
        .sort-select, .status-select { background: var(--dark-3); border: 1px solid var(--border); color: var(--white); padding: 8px 10px; border-radius: 8px; font-family: var(--font-accent); font-size: 0.8rem; cursor: pointer; transition: var(--transition); }
        .status-select { padding: 5px 8px; font-size: 0.75rem; }
        .status-select-Processing { border-color: rgba(255,215,0,0.4); color: var(--yellow); }
        .status-select-Confirmed { border-color: rgba(0,212,255,0.4); color: var(--blue); }
        .status-select-Shipped { border-color: rgba(128,128,255,0.4); color: #8080ff; }
        .status-select-Delivered { border-color: rgba(0,210,100,0.4); color: #00d264; }
        .status-select-Cancelled { border-color: rgba(255,45,32,0.4); color: var(--red); }

        /* RESPONSIVE */
        @media (max-width: 1200px) { .admin-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px) { .admin-overview-row { grid-template-columns: 1fr; } .admin-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .admin-kpi-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
