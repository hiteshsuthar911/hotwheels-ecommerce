import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiPrinter, FiDownload, FiCheckCircle, FiPackage, FiArrowLeft, FiMail } from 'react-icons/fi';
import api from '../utils/api';

const OrderInvoicePage = () => {
  const { id } = useParams();
  const { user } = useSelector((s) => s.auth);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="spinner" style={{ marginTop: '100px' }}></div>;
  if (!order) return (
    <div className="container empty-state" style={{ marginTop: '40px' }}>
      <FiPackage size={60} />
      <h3>Order not found</h3>
      <Link to="/profile" className="btn btn-primary">View My Orders</Link>
    </div>
  );

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const orderId = order._id.slice(-10).toUpperCase();

  return (
    <div className="invoice-page-wrapper">
      {/* Action bar (hidden on print) */}
      <div className="invoice-actions no-print">
        <div className="container invoice-actions-inner">
          <Link to="/profile" className="btn btn-outline btn-sm"><FiArrowLeft /> My Orders</Link>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/products" className="btn btn-outline btn-sm">Continue Shopping</Link>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}><FiPrinter /> Print Invoice</button>
          </div>
        </div>
      </div>

      {/* Success Banner (hidden on print) */}
      <div className="order-success-banner no-print">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="success-icon-wrap">
            <FiCheckCircle />
          </div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase. Your Hot Wheels are on their way! 🏎️</p>
        </div>
      </div>

      {/* PRINTABLE INVOICE */}
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="invoice-card" ref={printRef}>

          {/* INVOICE HEADER */}
          <div className="invoice-header">
            <div className="invoice-brand">
              <div className="invoice-logo">
                <span className="logo-hw">HW</span>
                <div>
                  <h1 className="invoice-brand-name">HotWheels India</h1>
                  <p className="invoice-brand-sub">Die-Cast Collectibles | Est. 2024</p>
                </div>
              </div>
              <div className="invoice-brand-contact">
                <p>support@hotwheels.com</p>
                <p>+91 8000 123 456</p>
                <p>www.hotwheelsindia.com</p>
              </div>
            </div>

            <div className="invoice-title-block">
              <h2 className="invoice-title">TAX INVOICE</h2>
              <div className="invoice-meta-grid">
                <div className="invoice-meta-item">
                  <span>Invoice No.</span>
                  <strong>INV-{orderId}</strong>
                </div>
                <div className="invoice-meta-item">
                  <span>Order ID</span>
                  <strong>#{orderId}</strong>
                </div>
                <div className="invoice-meta-item">
                  <span>Date & Time</span>
                  <strong>{formattedDate}</strong>
                </div>
                <div className="invoice-meta-item">
                  <span>Payment Method</span>
                  <strong>{order.paymentMethod}</strong>
                </div>
                <div className="invoice-meta-item">
                  <span>Order Status</span>
                  <strong className={`status-badge status-${order.status}`}>{order.status}</strong>
                </div>
                <div className="invoice-meta-item">
                  <span>Payment Status</span>
                  <strong style={{ color: order.isPaid ? '#00d264' : 'var(--yellow)' }}>
                    {order.isPaid ? '✓ Paid' : '⏳ Pending'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* BILLING / SHIPPING */}
          <div className="invoice-addresses">
            <div className="invoice-address-block">
              <h4>Bill To</h4>
              <p><strong>{order.user?.name || user?.name}</strong></p>
              <p>{order.user?.email || user?.email}</p>
            </div>
            <div className="invoice-address-block">
              <h4>Ship To</h4>
              <p><strong>{order.shippingAddress?.name}</strong></p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && <p>📞 {order.shippingAddress?.phone}</p>}
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* ITEMS TABLE */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Item Description</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems?.map((item, idx) => (
                <tr key={idx}>
                  <td className="invoice-table-num">{idx + 1}</td>
                  <td>
                    <div className="invoice-item-name">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="invoice-item-img" />
                      )}
                      <div>
                        <strong>{item.name}</strong>
                        <p className="invoice-item-sub">Hot Wheels Die-Cast • 1:64 Scale</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>Collectible</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.price.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--red)' }}>₹{(item.price * item.quantity).toLocaleString()}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="invoice-totals-section">
            <div className="invoice-totals">
              <div className="invoice-total-row">
                <span>Subtotal</span>
                <span>₹{order.itemsPrice?.toLocaleString()}</span>
              </div>
              <div className="invoice-total-row">
                <span>Shipping Charges</span>
                <span style={{ color: order.shippingPrice === 0 ? '#00d264' : 'inherit' }}>
                  {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
                </span>
              </div>
              <div className="invoice-total-row">
                <span>CGST (9%)</span>
                <span>₹{Math.round((order.taxPrice || 0) / 2).toLocaleString()}</span>
              </div>
              <div className="invoice-total-row">
                <span>SGST (9%)</span>
                <span>₹{Math.round((order.taxPrice || 0) / 2).toLocaleString()}</span>
              </div>
              <div className="invoice-divider" style={{ margin: '12px 0' }}></div>
              <div className="invoice-total-row invoice-grand-total">
                <span>GRAND TOTAL</span>
                <span>₹{order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* AMOUNT IN WORDS */}
          <div className="invoice-words">
            <strong>Amount in Words: </strong>
            <span>Indian Rupees {order.totalPrice?.toLocaleString()} Only</span>
          </div>

          <div className="invoice-divider"></div>

          {/* FOOTER */}
          <div className="invoice-footer">
            <div className="invoice-terms">
              <h5>Terms & Conditions</h5>
              <ul>
                <li>All products are 100% authentic Hot Wheels die-cast collectibles.</li>
                <li>Returns accepted within 7 days of delivery for unused, unopened items.</li>
                <li>This is a computer-generated invoice and doesn't require a signature.</li>
                <li>GSTIN: 22AAAAA0000A1Z5 | CIN: U74999DL2024PTC000000</li>
              </ul>
            </div>
            <div className="invoice-thankyou">
              <div className="invoice-stamp">
                <span>HotWheels India</span>
                <span className="invoice-stamp-sub">Authorized Signatory</span>
              </div>
              <p className="invoice-thank-msg">🏎️ Thank you for shopping with HotWheels India!</p>
              <p style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>For queries: support@hotwheels.com</p>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        /* ==== INVOICE STYLES ==== */
        .invoice-page-wrapper { background: var(--black); min-height: 100vh; }
        
        /* SUCCESS BANNER */
        .order-success-banner {
          background: linear-gradient(135deg, #001a00, #000d00);
          border-bottom: 1px solid rgba(0,210,100,0.25);
          padding: 40px 0;
          text-align: center;
        }
        .success-icon-wrap {
          width: 72px; height: 72px; background: rgba(0,210,100,0.1);
          border: 2px solid #00d264; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; color: #00d264; margin: 0 auto 20px;
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .order-success-banner h2 { font-family: var(--font-heading); font-size: 1.8rem; color: #00d264; text-transform: uppercase; margin-bottom: 8px; }
        .order-success-banner p { color: var(--gray); font-family: var(--font-accent); }

        /* ACTIONS BAR */
        .invoice-actions { background: var(--dark-2); border-bottom: 1px solid var(--border); padding: 14px 0; }
        .invoice-actions-inner { display: flex; align-items: center; justify-content: space-between; }

        /* INVOICE CARD */
        .invoice-card {
          background: #0e0e0e;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          overflow: hidden;
          max-width: 860px;
          margin: 0 auto;
        }

        /* HEADER */
        .invoice-header {
          padding: 36px 40px;
          background: linear-gradient(135deg, #111 0%, #0a0a0a 100%);
          border-bottom: 2px solid var(--red);
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .invoice-brand { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
        .invoice-logo { display: flex; align-items: center; gap: 14px; }
        .invoice-brand-name { font-family: var(--font-heading); font-size: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .invoice-brand-sub { font-family: var(--font-accent); font-size: 0.8rem; color: var(--red); letter-spacing: 0.08em; margin-top: 2px; }
        .invoice-brand-contact { text-align: right; }
        .invoice-brand-contact p { font-family: var(--font-accent); font-size: 0.82rem; color: var(--gray); margin-bottom: 3px; }

        /* TITLE BLOCK */
        .invoice-title-block {}
        .invoice-title { font-family: var(--font-heading); font-size: 1.1rem; color: var(--red); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px; }
        .invoice-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .invoice-meta-item { background: #161616; border: 1px solid #222; border-radius: 8px; padding: 12px 14px; }
        .invoice-meta-item span { display: block; font-family: var(--font-accent); font-size: 0.7rem; color: var(--gray); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
        .invoice-meta-item strong { font-family: var(--font-accent); font-size: 0.9rem; }

        /* ADDRESSES */
        .invoice-addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 28px 40px; }
        .invoice-address-block h4 { font-family: var(--font-accent); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--red); margin-bottom: 12px; }
        .invoice-address-block p { font-family: var(--font-accent); font-size: 0.88rem; color: var(--gray); margin-bottom: 4px; }
        .invoice-address-block p strong { color: var(--white); }

        /* TABLE */
        .invoice-table { width: 100%; border-collapse: collapse; margin: 0; }
        .invoice-table thead tr { background: rgba(255,45,32,0.08); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .invoice-table th { padding: 12px 16px; font-family: var(--font-accent); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray); text-align: left; }
        .invoice-table td { padding: 16px; font-family: var(--font-accent); font-size: 0.88rem; border-bottom: 1px solid #1a1a1a; vertical-align: middle; }
        .invoice-table tbody tr:last-child td { border-bottom: none; }
        .invoice-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .invoice-table-num { color: var(--gray); font-size: 0.8rem; }
        .invoice-item-name { display: flex; align-items: center; gap: 12px; }
        .invoice-item-img { width: 52px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); flex-shrink: 0; }
        .invoice-item-sub { color: var(--gray); font-size: 0.76rem; margin-top: 2px; }

        /* TOTALS */
        .invoice-totals-section { padding: 24px 40px; display: flex; justify-content: flex-end; border-top: 1px solid #1a1a1a; }
        .invoice-totals { width: 320px; }
        .invoice-total-row { display: flex; justify-content: space-between; font-family: var(--font-accent); font-size: 0.88rem; color: var(--gray); margin-bottom: 10px; }
        .invoice-grand-total {
          font-size: 1.1rem !important;
          font-weight: 700;
          color: var(--white) !important;
          background: rgba(255,45,32,0.08);
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,45,32,0.2);
          margin: 0;
        }
        .invoice-grand-total span:last-child { color: var(--red) !important; font-size: 1.2rem; }

        /* WORDS */
        .invoice-words { padding: 14px 40px; background: #0a0a0a; border-top: 1px solid #1a1a1a; font-family: var(--font-accent); font-size: 0.83rem; color: var(--gray); }
        .invoice-words strong { color: var(--white); }

        /* INVOICE FOOTER */
        .invoice-footer { padding: 28px 40px; display: flex; justify-content: space-between; align-items: flex-end; gap: 30px; flex-wrap: wrap; border-top: 1px solid #1a1a1a; }
        .invoice-terms h5 { font-family: var(--font-accent); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gray); margin-bottom: 10px; }
        .invoice-terms ul { padding-left: 0; list-style: none; }
        .invoice-terms ul li { font-family: var(--font-accent); font-size: 0.78rem; color: var(--gray-2); margin-bottom: 4px; padding-left: 12px; position: relative; }
        .invoice-terms ul li::before { content: '•'; position: absolute; left: 0; color: var(--red); }
        .invoice-thankyou { text-align: right; }
        .invoice-stamp {
          display: inline-flex; flex-direction: column; align-items: center;
          border: 2px solid var(--red); border-radius: 8px;
          padding: 10px 20px; margin-bottom: 16px;
          font-family: var(--font-accent); font-weight: 700;
          color: var(--red); font-size: 0.9rem;
          box-shadow: 0 0 15px var(--red-glow);
        }
        .invoice-stamp-sub { font-size: 0.68rem; color: var(--gray); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.08em; }
        .invoice-thank-msg { font-family: var(--font-accent); font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; color: var(--white); }
        .invoice-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 0; }

        /* RESPONSIVE */
        @media (max-width: 700px) {
          .invoice-header, .invoice-totals-section, .invoice-footer { padding: 20px; }
          .invoice-addresses { padding: 20px; grid-template-columns: 1fr; gap: 16px; }
          .invoice-meta-grid { grid-template-columns: repeat(2, 1fr); }
          .invoice-brand { flex-direction: column; }
          .invoice-brand-contact { text-align: left; }
          .invoice-totals { width: 100%; }
        }

        /* PRINT STYLES */
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .invoice-page-wrapper, .invoice-card { background: white !important; border: none !important; }
          .invoice-header { background: white !important; border-bottom: 2px solid #FF2D20 !important; }
          .invoice-brand-name, .invoice-title { color: #FF2D20 !important; }
          .invoice-table thead tr { background: #f5f5f5 !important; }
          .invoice-meta-item { background: #f9f9f9 !important; border: 1px solid #eee !important; }
          .invoice-address-block p, .invoice-terms ul li, .invoice-total-row { color: #444 !important; }
          .invoice-address-block p strong, .invoice-grand-total span:first-child { color: #000 !important; }
          .invoice-grand-total span:last-child, .invoice-brand-sub { color: #FF2D20 !important; }
          .invoice-grand-total { background: #fff0f0 !important; border: 1px solid #ffd0cc !important; }
          .invoice-words { background: #f5f5f5 !important; }
          .invoice-words strong { color: black !important; }
          .invoice-stamp { border-color: #FF2D20 !important; color: #FF2D20 !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default OrderInvoicePage;
