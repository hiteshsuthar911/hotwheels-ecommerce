import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiGrid, FiList } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import '../components/ProductCard.css';

const CATEGORIES = ['All', 'Classic', 'Super Treasure Hunt', 'Racing', 'Fantasy', 'Licensed', 'Monster Trucks', 'Track Sets', 'Limited Edition'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || 'All';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const featured = searchParams.get('featured') || '';
  const newArrival = searchParams.get('newArrival') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (keyword) params.set('keyword', keyword);
        if (category && category !== 'All') params.set('category', category);
        if (sort) params.set('sort', sort);
        if (featured) params.set('featured', featured);
        if (newArrival) params.set('newArrival', newArrival);
        params.set('page', page);
        params.set('limit', 12);
        const { data } = await api.get(`/products?${params.toString()}`);
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value && value !== 'All') p.set(key, value);
    else p.delete(key);
    p.set('page', '1');
    setSearchParams(p);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>Products</span>
          </div>
          <h1>Shop <span>Hot Wheels</span></h1>
          <p style={{ color: 'var(--gray)', marginTop: '8px', fontFamily: 'var(--font-accent)' }}>
            {total} products{keyword ? ` for "${keyword}"` : ''}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="shop-layout">
          {/* Mobile filter toggle */}
          <button className="mobile-filter-btn btn btn-outline btn-sm" onClick={() => setSidebarOpen(true)}>
            <FiFilter /> Filters
          </button>

          {/* FILTER SIDEBAR */}
          <aside className={`filter-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="filter-sidebar-header">
              <h3>Filters</h3>
              <button className="filter-close" onClick={() => setSidebarOpen(false)}><FiX /></button>
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              {CATEGORIES.map((cat) => (
                <label key={cat} className={`filter-option ${category === cat || (cat === 'All' && !category) ? 'active' : ''}`}>
                  <input type="radio" name="category" value={cat} checked={category === cat || (cat === 'All' && !category)} onChange={() => setFilter('category', cat)} />
                  {cat}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h4>Quick Filters</h4>
              <label className={`filter-option ${featured ? 'active' : ''}`}>
                <input type="checkbox" checked={!!featured} onChange={(e) => setFilter('featured', e.target.checked ? 'true' : '')} />
                ⭐ Featured Only
              </label>
              <label className={`filter-option ${newArrival ? 'active' : ''}`}>
                <input type="checkbox" checked={!!newArrival} onChange={(e) => setFilter('newArrival', e.target.checked ? 'true' : '')} />
                🆕 New Arrivals
              </label>
            </div>

            <button className="btn btn-outline btn-full btn-sm" onClick={() => setSearchParams({})}>
              Clear All Filters
            </button>
          </aside>

          {/* PRODUCTS AREA */}
          <div className="products-area">
            <div className="products-toolbar">
              <span className="products-count">{total} Results</span>
              <div className="sort-wrap">
                <label style={{ color: 'var(--gray)', fontSize: '0.85rem', fontFamily: 'var(--font-accent)' }}>Sort:</label>
                <select value={sort} onChange={(e) => setFilter('sort', e.target.value)} className="sort-select">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="spinner"></div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <FiGrid size={64} />
                <h3>No Products Found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button className="btn btn-primary" onClick={() => setSearchParams({})}>Clear Filters</button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* PAGINATION */}
            {pages > 1 && (
              <div className="pagination">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setFilter('page', p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .shop-layout { display: grid; grid-template-columns: 260px 1fr; gap: 30px; align-items: start; }
        .mobile-filter-btn { display: none; margin-bottom: 20px; }
        .filter-sidebar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .filter-close { background: none; border: none; color: var(--gray); cursor: pointer; font-size: 1.2rem; display: none; }
        .products-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding: 14px 18px; background: var(--dark-2); border: 1px solid var(--border); border-radius: var(--radius); }
        .products-count { font-family: var(--font-accent); font-size: 0.9rem; color: var(--gray); }
        .sort-wrap { display: flex; align-items: center; gap: 8px; }
        .sort-select { background: var(--dark-3); border: 1px solid var(--border); color: var(--white); padding: 8px 12px; border-radius: 8px; font-family: var(--font-accent); font-size: 0.85rem; cursor: pointer; }
        .pagination { display: flex; gap: 8px; justify-content: center; margin-top: 40px; }
        .page-btn { width: 40px; height: 40px; background: var(--dark-3); border: 1px solid var(--border); color: var(--gray); border-radius: 8px; cursor: pointer; font-family: var(--font-accent); font-weight: 700; transition: var(--transition); }
        .page-btn:hover, .page-btn.active { background: var(--red); border-color: var(--red); color: var(--white); }
        @media (max-width: 900px) {
          .shop-layout { grid-template-columns: 1fr; }
          .mobile-filter-btn { display: flex; }
          .filter-sidebar { position: fixed; top: 0; left: -340px; width: 300px; height: 100vh; z-index: 2000; overflow-y: auto; transition: left 0.3s ease; border-radius: 0; }
          .filter-sidebar.open { left: 0; box-shadow: 4px 0 40px rgba(0,0,0,0.8); }
          .filter-close { display: flex; }
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;
