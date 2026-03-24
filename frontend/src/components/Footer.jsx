import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiYoutube, FiFacebook, FiMail, FiPhone } from 'react-icons/fi';

const Footer = () => (
  <footer className="footer">
    <div className="footer-top">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="logo-hw">HW</span>
            <span className="logo-text">HotWheels</span>
          </Link>
          <p className="footer-desc">
            India's #1 destination for authentic Hot Wheels die-cast cars. 
            Premium collectibles, rare finds, and racing excitement delivered to your door.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram"><FiInstagram /></a>
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="YouTube"><FiYoutube /></a>
            <a href="#" aria-label="Facebook"><FiFacebook /></a>
          </div>
        </div>

        <div className="footer-links-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?category=Classic">Classic Cars</Link></li>
            <li><Link to="/products?category=Licensed">Licensed Cars</Link></li>
            <li><Link to="/products?category=Super+Treasure+Hunt">Treasure Hunts</Link></li>
            <li><Link to="/products?category=Monster+Trucks">Monster Trucks</Link></li>
            <li><Link to="/products?category=Track+Sets">Track Sets</Link></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/profile">My Orders</Link></li>
            <li><Link to="/cart">Shopping Cart</Link></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:support@hotwheelsindia.com"><FiMail /> support@hotwheels.com</a></li>
            <li><a href="tel:+918000123456"><FiPhone /> +91 8000 123 456</a></li>
          </ul>
          <div className="footer-newsletter">
            <p>Get exclusive deals & new arrivals!</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email..." />
              <button type="submit" className="btn btn-primary btn-sm">Join</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div className="footer-bottom">
      <div className="container footer-bottom-inner">
        <p>© 2024 HotWheels India. All rights reserved.</p>
        <p>Made with 🔥 for die-cast enthusiasts everywhere</p>
      </div>
    </div>
  </footer>
);

export default Footer;
