import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiPackage, FiUser, FiEdit, FiCheck, FiFileText, FiChevronDown, FiChevronUp, FiMapPin, FiCreditCard, FiClock } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  Processing: { bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)', color: 'var(--yellow)' },
  Confirmed: { bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.3)', color: 'var(--blue)' },
  Shipped: { bg: 'rgba(128,128,255,0.12)', border: 'rgba(128,128,255,0.3)', color: '#8080ff' },
  Delivered: { bg: 'rgba(0,210,100,0.12)', border: 'rgba(0,210,100,0.3)', color: '#00d264' },
  Cancelled: { bg: 'rgba(255,45,32,0.12)', border: 'rgba(255,45,32,0.3)', color: 'var(--red)' },
};

const STATUS_STEPS = ['Processing', 'Confirmed', 'Shipped', 'Delivered'];

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="order-card">
      {/* ORDER HEADER */}
      <div className="order-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.9rem' }}>
              Order #{order._id.slice(-8).toUpperCase()}
            </span>
            <span
              className="status-pill"
              style={{ background: STATUS_COLORS[order.status]?.bg, border: `1px solid ${STATUS_COLORS[order.status]?.border}`, color: STATUS_COLORS[order.status]?.color }}
            >
              {order.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: 'var(--font-accent)', fontSize: '0.78rem', color: 'var(--gray)' }}>
            <span><FiClock size={11} /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span><FiCreditCard size={11} /> {order.paymentMethod}</span>
            <span>{order.orderItems?.length} item{order.orderItems?.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <strong style={{ fontFamily: 'var(--font-accent)', fontSize: '1.15rem', color: 'var(--red)' }}>
            ₹{order.totalPrice?.toLocaleString()}
          </strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* ✅ VIEW INVOICE BUTTON */}
            <Link
              to={`/order/${order._id}/invoice`}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
              title="View Tax Invoice"
            >
              <FiFileText size={13} /> Invoice
            </Link>
            <button
              className="btn btn-sm"
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', padding: '6px 10px', borderRadius: 7, cursor: 'pointer' }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
              {expanded ? 'Less' : 'Details'}
            </button>
          </div>
        </div>
      </div>

      {/* ITEM THUMBNAILS (always visible) */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 0', flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
        {order.orderItems?.map((item, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img
              src={item.image}
              alt={item.name}
              style={{ width: 56, height: 46, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
              onError={(e) => e.target.style.display = 'none'}
            />
            {item.quantity > 1 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.quantity}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* EXPANDED DETAILS */}
      {expanded && (
        <div className="order-expanded">
          {/* PROGRESS TRACKER */}
          {!isCancelled && (
            <div className="order-progress">
              <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 14 }}>Order Progress</p>
              <div className="progress-track">
                {STATUS_STEPS.map((st, i) => {
                  const done = stepIdx >= i;
                  const active = stepIdx === i;
                  return (
                    <div key={st} className="progress-step" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div className="progress-circle" style={{
                          background: done ? (active ? 'var(--red)' : '#00d264') : 'var(--dark-3)',
                          border: `2px solid ${done ? (active ? 'var(--red)' : '#00d264') : 'var(--border)'}`,
                          boxShadow: active ? '0 0 12px var(--red-glow)' : done ? '0 0 8px rgba(0,210,100,0.3)' : 'none',
                        }}>
                          {done && !active ? <FiCheck size={12} /> : <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{i + 1}</span>}
                        </div>
                        <span style={{ fontFamily: 'var(--font-accent)', fontSize: '0.68rem', color: done ? (active ? 'var(--red)' : '#00d264') : 'var(--gray)', textAlign: 'center', letterSpacing: '0.04em' }}>{st}</span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className="progress-line" style={{ background: stepIdx > i ? '#00d264' : 'var(--border)' }}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isCancelled && (
            <div style={{ background: 'rgba(255,45,32,0.08)', border: '1px solid rgba(255,45,32,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontFamily: 'var(--font-accent)', fontSize: '0.85rem', color: 'var(--red)' }}>
              ❌ This order was cancelled.
            </div>
          )}

          {/* ITEMS TABLE */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 10 }}>Items Ordered</p>
            {order.orderItems?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <img src={item.image} alt={item.name} style={{ width: 52, height: 42, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} onError={(e) => e.target.style.display = 'none'} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.88rem' }}>{item.name}</p>
                  <p style={{ color: 'var(--gray)', fontSize: '0.75rem', fontFamily: 'var(--font-accent)' }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                </div>
                <strong style={{ fontFamily: 'var(--font-accent)', color: 'var(--red)', fontSize: '0.9rem' }}>₹{(item.price * item.quantity).toLocaleString()}</strong>
              </div>
            ))}
          </div>

          {/* PRICE BREAKDOWN */}
          <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 10 }}>Price Breakdown</p>
            {[
              { label: 'Subtotal', val: `₹${order.itemsPrice?.toLocaleString()}` },
              { label: 'Shipping', val: order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`, green: order.shippingPrice === 0 },
              { label: 'Tax (18% GST)', val: `₹${order.taxPrice?.toLocaleString()}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-accent)', fontSize: '0.83rem', color: r.green ? '#00d264' : 'var(--gray)', marginBottom: 6 }}>
                <span>{r.label}</span><span>{r.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.95rem', paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 6 }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--red)' }}>₹{order.totalPrice?.toLocaleString()}</span>
            </div>
          </div>

          {/* SHIPPING ADDRESS */}
          {order.shippingAddress && (
            <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiMapPin size={11} /> Delivered To
              </p>
              <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                <strong>{order.shippingAddress.name}</strong> • {order.shippingAddress.phone && `+91 ${order.shippingAddress.phone}`}<br />
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </p>
            </div>
          )}

          {/* VIEW FULL INVOICE */}
          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <Link to={`/order/${order._id}/invoice`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FiFileText /> View Full Tax Invoice / Bill
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user } = useSelector((s) => s.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my');
        setOrders(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', profile);
      toast.success('Profile updated!');
    } catch (e) {
      toast.error('Failed to update profile');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>My <span>Account</span></h1>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="tabs">
          <button className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            <FiPackage /> My Orders {orders.length > 0 && <span style={{ background: 'var(--red)', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>{orders.length}</span>}
          </button>
          <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
            <FiUser /> Profile
          </button>
        </div>

        {tab === 'orders' && (
          <div>
            {loading ? (
              <div className="spinner" style={{ marginTop: 40 }}></div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <FiPackage size={60} />
                <h3>No Orders Yet</h3>
                <p>Place your first order and your bill will be right here!</p>
                <Link to="/products" className="btn btn-primary">Shop Now</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map((order) => <OrderCard key={order._id} order={order} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="card" style={{ padding: '30px', maxWidth: 500 }}>
            <h3 style={{ fontFamily: 'var(--font-accent)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.06em' }}><FiEdit /> Edit Profile</h3>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group"><label>Full Name</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
              <div className="form-group"><label>Phone</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" /></div>
              <div className="form-group"><label>New Password <span style={{ color: 'var(--gray)', fontSize: '0.78rem' }}>(optional)</span></label><input type="password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} placeholder="Leave blank to keep current" /></div>
              <button type="submit" className="btn btn-primary" disabled={saving}><FiCheck /> {saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        /* ORDER CARD */
        .order-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 20px; transition: var(--transition); }
        .order-card:hover { border-color: rgba(255,45,32,0.25); }
        .order-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 0; flex-wrap: wrap; }
        .status-pill { padding: 3px 10px; border-radius: 20px; font-family: var(--font-accent); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em; }

        /* EXPANDED */
        .order-expanded { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); animation: fadeUp 0.25s ease; }

        /* PROGRESS TRACKER */
        .order-progress { background: var(--dark-3); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; margin-bottom: 14px; }
        .progress-track { display: flex; align-items: flex-start; }
        .progress-step { display: flex; align-items: center; position: relative; }
        .progress-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; z-index: 2; transition: all 0.3s ease; }
        .progress-line { position: absolute; left: 28px; right: -100%; height: 2px; top: 14px; z-index: 1; transition: background 0.3s ease; }
      `}</style>
    </div>
  );
};

export default ProfilePage;
