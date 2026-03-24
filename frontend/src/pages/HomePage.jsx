import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiZap, FiTruck, FiShield, FiAward, FiChevronDown } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import '../components/ProductCard.css';
import './HomePage.css';

const CATEGORIES = [
  { name: 'Classic', icon: '🏛️', color: '#FFD700' },
  { name: 'Super Treasure Hunt', icon: '⭐', color: '#FF2D20' },
  { name: 'Racing', icon: '🏁', color: '#00D4FF' },
  { name: 'Fantasy', icon: '🔥', color: '#FF6B35' },
  { name: 'Licensed', icon: '🏎️', color: '#9B59B6' },
  { name: 'Monster Trucks', icon: '🚀', color: '#2ECC71' },
];

const FEATURES = [
  { icon: <FiZap />, title: 'Fast Delivery', desc: 'Express shipping India-wide in 2-5 days' },
  { icon: <FiShield />, title: '100% Authentic', desc: 'Only genuine Hot Wheels products' },
  { icon: <FiTruck />, title: 'Free Shipping', desc: 'On orders above ₹999' },
  { icon: <FiAward />, title: 'Collectors Grade', desc: 'Curated rare & limited editions' },
];

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, newRes] = await Promise.all([
          api.get('/products?featured=true&limit=8'),
          api.get('/products?newArrival=true&limit=4'),
        ]);
        setFeatured(featRes.data.products || []);
        setNewArrivals(newRes.data.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?keyword=${searchQuery.trim()}`);
  };

  return (
    <div className="home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-speed-lines"></div>
          <div className="hero-grid"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-badge"><FiZap /> Speed. Collect. Race.</div>
          <h1 className="hero-title">
            India's Premier<br />
            <span className="hero-title-accent">Hot Wheels</span><br />
            Destination
          </h1>
          <p className="hero-subtitle">
            Discover 500+ die-cast cars, rare Treasure Hunts, and premium Track Sets. 
            Delivered directly to your garage.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by car name, series, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Search <FiArrowRight /></button>
          </form>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop All Cars <FiArrowRight />
            </Link>
            <Link to="/products?category=Super+Treasure+Hunt" className="btn btn-outline btn-lg">
              ⭐ Treasure Hunts
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><span>500+</span><p>Products</p></div>
            <div className="hero-stat-div"></div>
            <div className="hero-stat"><span>50K+</span><p>Happy Collectors</p></div>
            <div className="hero-stat-div"></div>
            <div className="hero-stat"><span>100%</span><p>Authentic</p></div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <FiChevronDown />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-bar">
        <div className="container features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-item">
              <div className="feature-icon">{f.icon}</div>
              <div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by <span>Category</span></h2>
            <p className="section-subtitle">Find exactly what you're looking for</p>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`} className="category-card">
                <div className="category-icon" style={{ color: cat.color }}>{cat.icon}</div>
                <span className="category-name">{cat.name}</span>
                <div className="category-arrow"><FiArrowRight /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section" style={{ background: 'var(--dark-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured <span>Cars</span></h2>
            <p className="section-subtitle">Handpicked by our collectors team</p>
          </div>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="products-grid">
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/products?featured=true" className="btn btn-outline btn-lg">
              View All Featured <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">New <span>Arrivals</span></h2>
            <p className="section-subtitle">Fresh stock just landed</p>
          </div>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="products-grid">
              {newArrivals.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="promo-banner">
        <div className="container promo-content">
          <div>
            <h2>⭐ Exclusive Treasure Hunt Alert!</h2>
            <p>Super Treasure Hunts sell out fast. Join our waitlist and never miss another one.</p>
          </div>
          <Link to="/products?category=Super+Treasure+Hunt" className="btn btn-yellow btn-lg">
            Shop STH Now <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
