import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { logout } from '../store/authSlice';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useSelector((s) => s.auth);
  const cartItems = useSelector((s) => s.cart.items);
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${searchQuery.trim()}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-hw">HW</span>
          <span className="logo-text">HotWheels</span>
        </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search cars, sets, series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Shop</Link>
          <Link to="/products?category=Super+Treasure+Hunt" className="nav-link nav-link-hot">
            <span className="fire-dot"></span> Treasure Hunt
          </Link>
          <Link to="/products?newArrival=true" className="nav-link">New Arrivals</Link>
        </div>

        <div className="navbar-actions">
          <Link to="/cart" className="nav-action-btn" title="Cart">
            <FiShoppingCart />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="user-menu-wrapper">
              <button className="nav-action-btn nav-user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <FiUser />
                <span className="user-name">{user.name.split(' ')[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span>{user.name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <Link to="/profile" className="user-dropdown-item"><FiPackage /> My Orders</Link>
                  {user.isAdmin && (
                    <Link to="/admin" className="user-dropdown-item"><FiSettings /> Admin Panel</Link>
                  )}
                  <button className="user-dropdown-item danger" onClick={handleLogout}><FiLogOut /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
