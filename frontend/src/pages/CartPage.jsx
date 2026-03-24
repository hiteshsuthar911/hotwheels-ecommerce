import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiTrash2, FiShoppingBag, FiArrowRight, FiTruck } from 'react-icons/fi';
import { removeFromCart, updateQuantity } from '../store/cartSlice';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (!user) { toast.error('Please login to checkout'); navigate('/login'); return; }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <FiShoppingBag size={80} />
          <h3>Your Cart is Empty</h3>
          <p>Start adding some amazing Hot Wheels to your collection!</p>
          <Link to="/products" className="btn btn-primary btn-lg">Shop Now <FiArrowRight /></Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Shopping <span>Cart</span></h1>
          <p style={{ color: 'var(--gray)', marginTop: '8px', fontFamily: 'var(--font-accent)' }}>{items.length} item{items.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="cart-layout">
          {/* ITEMS */}
          <div className="cart-items">
            {items.map((item) => (
              <div key={item._id} className="cart-item">
                <Link to={`/products/${item._id}`} className="cart-item-img">
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=200'} alt={item.name} />
                </Link>
                <div className="cart-item-info">
                  <Link to={`/products/${item._id}`} className="cart-item-name">{item.name}</Link>
                  <p className="cart-item-category">{item.category} • {item.scale}</p>
                  <p className="cart-item-price">₹{item.price} each</p>
                </div>
                <div className="cart-item-controls">
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}>+</button>
                  </div>
                  <span className="cart-item-total">₹{(item.price * item.quantity).toFixed(0)}</span>
                  <button className="btn-remove" onClick={() => { dispatch(removeFromCart(item._id)); toast.success('Item removed'); }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* SUMMARY */}
          <div className="cart-summary">
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.2rem', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="summary-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiTruck size={14} /> Shipping</span>
                <span style={{ color: shipping === 0 ? '#00d264' : 'inherit' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="summary-row"><span>Tax (18% GST)</span><span>₹{tax}</span></div>
              <div className="divider" style={{ margin: '16px 0' }}></div>
              <div className="summary-row total-row"><strong>Total</strong><strong style={{ color: 'var(--red)', fontSize: '1.3rem', fontFamily: 'var(--font-accent)' }}>₹{total}</strong></div>
              {subtotal < 999 && (
                <p style={{ marginTop: '12px', color: 'var(--yellow)', fontFamily: 'var(--font-accent)', fontSize: '0.82rem' }}>
                  Add ₹{999 - subtotal} more for FREE shipping!
                </p>
              )}
              <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '20px' }} onClick={handleCheckout}>
                Proceed to Checkout <FiArrowRight />
              </button>
              <Link to="/products" className="btn btn-outline btn-full" style={{ marginTop: '10px' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cart-layout { display: grid; grid-template-columns: 1fr 380px; gap: 30px; align-items: start; }
        .cart-items { display: flex; flex-direction: column; gap: 16px; }
        .cart-item { display: flex; gap: 20px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; align-items: center; transition: var(--transition); }
        .cart-item:hover { border-color: var(--red); }
        .cart-item-img { width: 100px; height: 80px; flex-shrink: 0; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
        .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item-info { flex: 1; }
        .cart-item-name { font-family: var(--font-accent); font-weight: 700; font-size: 1rem; text-decoration: none; color: var(--white); transition: var(--transition); display: block; margin-bottom: 4px; }
        .cart-item-name:hover { color: var(--red); }
        .cart-item-category { color: var(--gray); font-size: 0.82rem; font-family: var(--font-accent); }
        .cart-item-price { color: var(--red); font-family: var(--font-accent); font-weight: 700; margin-top: 4px; }
        .cart-item-controls { display: flex; gap: 16px; align-items: center; flex-shrink: 0; }
        .cart-item-total { font-family: var(--font-accent); font-weight: 700; font-size: 1.1rem; min-width: 80px; text-align: right; }
        .btn-remove { background: rgba(255,45,32,0.1); border: 1px solid rgba(255,45,32,0.2); color: var(--red); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); }
        .btn-remove:hover { background: var(--red); color: white; }
        .summary-row { display: flex; justify-content: space-between; color: var(--gray); font-family: var(--font-accent); font-size: 0.9rem; margin-bottom: 12px; }
        .total-row { color: var(--white); font-size: 1.05rem; }
        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-summary { order: -1; }
        }
        @media (max-width: 600px) {
          .cart-item { flex-direction: column; align-items: flex-start; }
          .cart-item-controls { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
