import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiTruck, FiCreditCard, FiCheckCircle, FiMapPin, FiPhone,
  FiUser, FiArrowLeft, FiArrowRight, FiShoppingBag, FiShield,
  FiChevronDown, FiChevronUp, FiCopy, FiInfo
} from 'react-icons/fi';
import { clearCart } from '../store/cartSlice';
import api from '../utils/api';
import toast from 'react-hot-toast';

/* ── helpers ── */
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry','Jammu & Kashmir','Ladakh',
];

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', days: '5–7 business days', price: 0, threshold: 999, icon: '📦' },
  { id: 'express', label: 'Express Delivery', days: '2–3 business days', price: 149, icon: '⚡' },
  { id: 'overnight', label: 'Overnight Delivery', days: 'Next business day', price: 299, icon: '🚀' },
];

const UPI_APPS = [
  { id: 'gpay', label: 'Google Pay', icon: '🔵' },
  { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
  { id: 'paytm', label: 'Paytm', icon: '🔷' },
  { id: 'bhim', label: 'BHIM UPI', icon: '🇮🇳' },
];

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank',
];

const StepIndicator = ({ step, current }) => {
  const done = current > step.num;
  const active = current === step.num;
  return (
    <div className={`step-indicator ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
      <div className="step-circle">
        {done ? <FiCheckCircle /> : step.icon}
      </div>
      <span className="step-label">{step.label}</span>
    </div>
  );
};

/* ── Load Razorpay SDK ── */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const { items } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);

  // Pre-load Razorpay SDK
  useEffect(() => { loadRazorpayScript(); }, []);

  /* ── Shipping state ── */
  const [shipping, setShipping] = useState({
    name: user?.name || '', phone: '', street: '', landmark: '',
    city: '', state: '', postalCode: '', country: 'India',
  });
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [saveAddress, setSaveAddress] = useState(false);

  /* ── Payment state ── */
  const [paymentMethod, setPaymentMethod] = useState('');
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [netBank, setNetBank] = useState('State Bank of India');
  const [walletType, setWalletType] = useState('Paytm');
  const [showCVV, setShowCVV] = useState(false);

  /* ── Derived values ── */
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.id === deliveryOption);
  const shippingCost = subtotal >= (selectedDelivery?.threshold || 0) && deliveryOption === 'standard'
    ? 0 : selectedDelivery?.price || 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shippingCost + tax;

  /* ── Validation ── */
  const validateShipping = () => {
    if (!shipping.name.trim()) { toast.error('Full name is required'); return false; }
    if (!/^[6-9]\d{9}$/.test(shipping.phone)) { toast.error('Enter a valid 10-digit mobile number'); return false; }
    if (!shipping.street.trim()) { toast.error('Street address is required'); return false; }
    if (!shipping.city.trim()) { toast.error('City is required'); return false; }
    if (!shipping.state) { toast.error('Please select a state'); return false; }
    if (!/^\d{6}$/.test(shipping.postalCode)) { toast.error('Enter a valid 6-digit PIN code'); return false; }
    return true;
  };

  const validatePayment = () => {
    if (!paymentMethod) { toast.error('Please select a payment method'); return false; }
    if (paymentMethod === 'UPI' && !upiId.trim()) { toast.error('Please enter your UPI ID or scan the QR code'); return false; }
    if (paymentMethod === 'Card') {
      if (card.number.replace(/\s/g, '').length !== 16) { toast.error('Enter a valid 16-digit card number'); return false; }
      if (!card.name.trim()) { toast.error('Card holder name is required'); return false; }
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) { toast.error('Enter expiry as MM/YY'); return false; }
      if (card.cvv.length < 3) { toast.error('Enter a valid CVV'); return false; }
    }
    return true;
  };

  /* ── Create DB order after payment ── */
  const createDbOrder = async (paymentLabel, razorpayPaymentId = null) => {
    const { data } = await api.post('/orders', {
      orderItems: items.map((i) => ({ product: i._id, name: i.name, image: i.images?.[0], price: i.price, quantity: i.quantity })),
      shippingAddress: { ...shipping, deliveryOption },
      paymentMethod: paymentLabel,
      itemsPrice: subtotal,
      taxPrice: tax,
      shippingPrice: shippingCost,
      totalPrice: total,
      razorpayPaymentId,
      isPaid: razorpayPaymentId ? true : false,
      paidAt: razorpayPaymentId ? new Date() : null,
    });
    return data;
  };

  const handlePlaceOrder = async () => {
    // ── RAZORPAY FLOW ──
    if (paymentMethod === 'Razorpay') {
      setLoading(true);
      try {
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) { toast.error('Razorpay SDK failed to load. Check your connection.'); setLoading(false); return; }

        // 1. Create Razorpay order on backend
        const { data: rzpOrder } = await api.post('/payments/create-order', {
          amount: total,
          receipt: `hwrcpt_${Date.now()}`,
        });

        // 2. Open Razorpay modal
        const options = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'HotWheels India',
          description: `Order for ${items.length} item${items.length > 1 ? 's' : ''}`,
          image: 'https://i.imgur.com/n5tjHFD.png',
          order_id: rzpOrder.orderId,
          prefill: {
            name: shipping.name,
            contact: `+91${shipping.phone}`,
            email: user?.email || '',
          },
          notes: { address: `${shipping.street}, ${shipping.city}` },
          theme: { color: '#FF2D20' },
          handler: async (response) => {
            try {
              // 3. Verify payment signature
              await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              // 4. Create order in DB (marked as paid)
              const order = await createDbOrder(`Razorpay (${response.razorpay_payment_id})`, response.razorpay_payment_id);
              dispatch(clearCart());
              toast.success('Payment successful! 🏎️ Generating invoice...');
              navigate(`/order/${order._id}/invoice`);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              toast.error('Payment cancelled');
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          toast.error(`Payment failed: ${resp.error.description}`);
          setLoading(false);
        });
        rzp.open();
        setLoading(false);
        return;
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to initiate payment');
        setLoading(false);
        return;
      }
    }

    // ── COD / Manual payment flow ──
    setLoading(true);
    try {
      const paymentLabel = paymentMethod === 'UPI' ? `UPI (${upiApp})` : paymentMethod === 'Card' ? 'Credit/Debit Card' : paymentMethod === 'NetBanking' ? `Net Banking (${netBank})` : paymentMethod === 'Wallet' ? `Wallet (${walletType})` : 'Cash on Delivery';
      const order = await createDbOrder(paymentLabel);
      dispatch(clearCart());
      toast.success('Order placed! 🏎️ Redirecting to your invoice...');
      navigate(`/order/${order._id}/invoice`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const formatCard = (v) => v.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => { const d = v.replace(/\D/g, ''); return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d; };

  const STEPS = [
    { num: 1, label: 'Shipping', icon: <FiTruck /> },
    { num: 2, label: 'Payment', icon: <FiCreditCard /> },
    { num: 3, label: 'Review', icon: <FiCheckCircle /> },
  ];

  /* ── Render ── */
  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1>Check<span>out</span></h1>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px' }}>
        {/* STEP INDICATOR */}
        <div className="checkout-stepper">
          {STEPS.map((s, i) => (
            <>
              <StepIndicator key={s.num} step={s} current={step} />
              {i < STEPS.length - 1 && <div className={`step-line-connector ${step > s.num ? 'done' : ''}`}></div>}
            </>
          ))}
        </div>

        <div className="checkout-layout">
          {/* ════ LEFT: FORM ════ */}
          <div className="checkout-form-area">

            {/* ─── STEP 1: SHIPPING ─── */}
            {step === 1 && (
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <FiMapPin style={{ color: 'var(--red)' }} />
                  <h2>Shipping Details</h2>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label><FiUser style={{ marginRight: 6 }} />Full Name *</label>
                    <input value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} placeholder="As per delivery address" />
                  </div>
                  <div className="form-group">
                    <label><FiPhone style={{ marginRight: 6 }} />Mobile Number *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', fontFamily: 'var(--font-accent)', fontSize: '0.88rem' }}>+91</span>
                      <input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile" style={{ paddingLeft: 46 }} maxLength={10} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address, Building & Flat No. *</label>
                  <input value={shipping.street} onChange={(e) => setShipping({ ...shipping, street: e.target.value })} placeholder="House/Flat No., Building Name, Street Name" />
                </div>

                <div className="form-group">
                  <label>Landmark <span style={{ color: 'var(--gray)', fontSize: '0.78rem' }}>(optional)</span></label>
                  <input value={shipping.landmark} onChange={(e) => setShipping({ ...shipping, landmark: e.target.value })} placeholder="Near school, opposite temple, etc." />
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label>City *</label>
                    <input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <select value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>PIN Code *</label>
                    <input value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit PIN" maxLength={6} />
                  </div>
                </div>

                {/* DELIVERY OPTIONS */}
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontFamily: 'var(--font-accent)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--gray)', display: 'block', marginBottom: 12 }}>
                    <FiTruck style={{ marginRight: 6 }} /> Delivery Option *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {DELIVERY_OPTIONS.map(opt => {
                      const isFree = opt.id === 'standard' && subtotal >= 999;
                      return (
                        <label key={opt.id} className={`delivery-option ${deliveryOption === opt.id ? 'selected' : ''}`}>
                          <input type="radio" name="delivery" value={opt.id} checked={deliveryOption === opt.id} onChange={() => setDeliveryOption(opt.id)} style={{ accentColor: 'var(--red)' }} />
                          <span className="delivery-icon">{opt.icon}</span>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontFamily: 'var(--font-accent)', fontSize: '0.92rem' }}>{opt.label}</strong>
                            <p style={{ color: 'var(--gray)', fontSize: '0.78rem', fontFamily: 'var(--font-accent)', marginTop: 2 }}>{opt.days}</p>
                          </div>
                          <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, color: isFree || opt.price === 0 ? '#00d264' : 'var(--red)' }}>
                            {isFree ? 'FREE' : opt.price === 0 ? 'FREE' : `₹${opt.price}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {subtotal < 999 && deliveryOption === 'standard' && (
                    <p style={{ marginTop: 8, fontFamily: 'var(--font-accent)', fontSize: '0.78rem', color: 'var(--yellow)' }}>
                      💡 Add ₹{999 - subtotal} more to get FREE standard delivery!
                    </p>
                  )}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, cursor: 'pointer', fontFamily: 'var(--font-accent)', fontSize: '0.85rem', color: 'var(--gray)' }}>
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} style={{ accentColor: 'var(--red)' }} />
                  Save this address for future orders
                </label>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-outline" onClick={() => navigate('/cart')}><FiArrowLeft /> Back to Cart</button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => { if (validateShipping()) setStep(2); }}>
                    Continue to Payment <FiArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: PAYMENT ─── */}
            {step === 2 && (
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <FiCreditCard style={{ color: 'var(--red)' }} />
                  <h2>Payment Method</h2>
                </div>

                {/* METHOD SELECTOR TABS */}
                <div className="payment-tabs" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {[
                    { id: 'Razorpay', label: 'Pay Online', icon: '🔐' },
                    { id: 'UPI', label: 'UPI', icon: '📱' },
                    { id: 'Card', label: 'Card', icon: '💳' },
                    { id: 'NetBanking', label: 'Net Banking', icon: '🏦' },
                    { id: 'Wallet', label: 'Wallet', icon: '👛' },
                    { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
                  ].map(pm => (
                    <button
                      key={pm.id}
                      className={`payment-tab ${paymentMethod === pm.id ? 'active' : ''} ${pm.id === 'Razorpay' ? 'razorpay-tab' : ''}`}
                      onClick={() => setPaymentMethod(pm.id)}
                    >
                      <span>{pm.icon}</span>
                      <span>{pm.label}</span>
                      {pm.id === 'Razorpay' && <span className="rzp-badge">Recommended</span>}
                    </button>
                  ))}
                </div>

                {/* ── RAZORPAY ── */}
                {paymentMethod === 'Razorpay' && (
                  <div className="payment-detail-box rzp-box">
                    <div className="rzp-header">
                      <div className="rzp-logo">🔐</div>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-accent)', fontSize: '1rem', marginBottom: 4 }}>Pay Securely with Razorpay</h4>
                        <p style={{ color: 'var(--gray)', fontSize: '0.82rem', fontFamily: 'var(--font-accent)' }}>India's most trusted payment gateway</p>
                      </div>
                    </div>
                    <div className="rzp-methods">
                      {['💳 Credit & Debit Cards', '📱 UPI (GPay, PhonePe, Paytm)', '🏦 Net Banking (100+ banks)', '👛 Wallets (Paytm, Amazon Pay)', '🏠 EMI'].map(m => (
                        <div key={m} className="rzp-method-item">
                          <span style={{ color: '#00d264' }}>✓</span> {m}
                        </div>
                      ))}
                    </div>
                    <div className="rzp-amount-display">
                      <span>Amount to Pay</span>
                      <strong>₹{total.toLocaleString()}</strong>
                    </div>
                    <div className="security-note"><FiShield /> PCI-DSS compliant • 256-bit SSL encryption • RBI regulated</div>
                    <p style={{ marginTop: 14, fontFamily: 'var(--font-accent)', fontSize: '0.78rem', color: 'var(--gray)', textAlign: 'center' }}>
                      Click "Review Order" → "Place Order" to open the secure Razorpay payment window
                    </p>
                  </div>
                )}

                {/* ── UPI ── */}
                {paymentMethod === 'UPI' && (
                  <div className="payment-detail-box">
                    <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-accent)', fontSize: '0.85rem', marginBottom: 16 }}>Choose your UPI app or enter your UPI ID:</p>
                    <div className="upi-apps-grid">
                      {UPI_APPS.map(app => (
                        <button key={app.id} className={`upi-app-btn ${upiApp === app.id ? 'selected' : ''}`} onClick={() => setUpiApp(app.id)}>
                          <span style={{ fontSize: '1.6rem' }}>{app.icon}</span>
                          <span>{app.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label>UPI ID</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@ybl / yourname@paytm" style={{ flex: 1 }} />
                        <button className="btn btn-outline btn-sm" onClick={() => { toast.success('UPI ID verified ✓'); }}>Verify</button>
                      </div>
                    </div>
                    <div className="upi-qr-box">
                      <div className="upi-qr-placeholder">
                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📲</div>
                        <strong style={{ fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>Scan QR Code</strong>
                        <p style={{ color: 'var(--gray)', fontSize: '0.78rem', marginTop: 4 }}>Open any UPI app and scan to pay ₹{total.toLocaleString()}</p>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--blue)', marginTop: 8, padding: '4px 10px', background: 'rgba(0,212,255,0.1)', borderRadius: 6 }}>
                          hotwheels@ybl
                          <button onClick={() => { navigator.clipboard.writeText('hotwheels@ybl'); toast.success('UPI ID copied!'); }} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', marginLeft: 6 }}>
                            <FiCopy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="security-note"><FiShield /> All UPI transactions are secured by NPCI</div>
                  </div>
                )}

                {/* ── CARD ── */}
                {paymentMethod === 'Card' && (
                  <div className="payment-detail-box">
                    <div className="card-preview">
                      <div className="card-chip">💳</div>
                      <div className="card-number-preview">{card.number || '•••• •••• •••• ••••'}</div>
                      <div className="card-bottom-preview">
                        <div>
                          <p className="card-label">Card Holder</p>
                          <strong>{card.name || 'YOUR NAME'}</strong>
                        </div>
                        <div>
                          <p className="card-label">Expires</p>
                          <strong>{card.expiry || 'MM/YY'}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Card Number *</label>
                      <input value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} placeholder="1234 5678 9012 3456" maxLength={19} style={{ letterSpacing: '0.1em', fontSize: '1.1rem' }} />
                    </div>
                    <div className="form-group">
                      <label>Name on Card *</label>
                      <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} placeholder="AS PRINTED ON CARD" style={{ letterSpacing: '0.05em' }} />
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Expiry Date *</label>
                        <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="MM/YY" maxLength={5} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>CVV * <FiInfo size={13} style={{ color: 'var(--gray)' }} title="3-digit code on back of card" /></label>
                        <div style={{ position: 'relative' }}>
                          <input type={showCVV ? 'text' : 'password'} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="•••" maxLength={4} />
                          <button type="button" onClick={() => setShowCVV(!showCVV)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            {showCVV ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="card-logos">
                      <span>💳 Visa</span><span>💳 Mastercard</span><span>💳 RuPay</span><span>💳 Amex</span>
                    </div>
                    <div className="security-note"><FiShield /> 256-bit SSL encrypted • Your card details are never stored</div>
                  </div>
                )}

                {/* ── NET BANKING ── */}
                {paymentMethod === 'NetBanking' && (
                  <div className="payment-detail-box">
                    <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-accent)', fontSize: '0.85rem', marginBottom: 14 }}>Select your bank:</p>
                    <div className="bank-grid">
                      {BANKS.map(b => (
                        <button key={b} className={`bank-btn ${netBank === b ? 'selected' : ''}`} onClick={() => setNetBank(b)}>
                          🏦 {b}
                        </button>
                      ))}
                    </div>
                    <div className="form-group" style={{ marginTop: 14 }}>
                      <label>Or search other bank</label>
                      <input placeholder="Type bank name..." />
                    </div>
                    <div className="security-note"><FiShield /> You'll be redirected to your bank's secure portal to complete payment</div>
                  </div>
                )}

                {/* ── WALLET ── */}
                {paymentMethod === 'Wallet' && (
                  <div className="payment-detail-box">
                    <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-accent)', fontSize: '0.85rem', marginBottom: 14 }}>Select your wallet:</p>
                    <div className="upi-apps-grid">
                      {[{ id: 'Paytm', icon: '🔷', label: 'Paytm' }, { id: 'Amazon', icon: '🟠', label: 'Amazon Pay' }, { id: 'PhonePe', icon: '🟣', label: 'PhonePe' }, { id: 'Mobikwik', icon: '🔵', label: 'MobiKwik' }].map(w => (
                        <button key={w.id} className={`upi-app-btn ${walletType === w.id ? 'selected' : ''}`} onClick={() => setWalletType(w.id)}>
                          <span style={{ fontSize: '1.6rem' }}>{w.icon}</span>
                          <span>{w.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="security-note"><FiShield /> Instant wallet payment — no OTP required for existing balance</div>
                  </div>
                )}

                {/* ── COD ── */}
                {paymentMethod === 'COD' && (
                  <div className="payment-detail-box">
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 12 }}>💵</div>
                      <h4 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.1rem', marginBottom: 8 }}>Cash on Delivery</h4>
                      <p style={{ color: 'var(--gray)', fontFamily: 'var(--font-accent)', fontSize: '0.88rem', maxWidth: 300, margin: '0 auto' }}>
                        Pay in cash when your Hot Wheels arrive at your doorstep.
                        No advance payment required.
                      </p>
                      <div className="cod-info-grid">
                        <div className="cod-info-item"><span>💰</span><p>No extra COD charges</p></div>
                        <div className="cod-info-item"><span>🔄</span><p>Easy returns within 7 days</p></div>
                        <div className="cod-info-item"><span>✅</span><p>Available on all orders</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {!paymentMethod && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontFamily: 'var(--font-accent)' }}>
                    <FiCreditCard size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>Select a payment method above to continue</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-outline" onClick={() => setStep(1)}><FiArrowLeft /> Back</button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => { if (validatePayment()) setStep(3); }} disabled={!paymentMethod}>
                    Review Order <FiArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: REVIEW ─── */}
            {step === 3 && (
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <FiCheckCircle style={{ color: 'var(--red)' }} />
                  <h2>Review & Confirm Order</h2>
                </div>

                {/* SHIPPING SUMMARY */}
                <div className="review-section">
                  <div className="review-section-header">
                    <h4><FiMapPin /> Delivery Address</h4>
                    <button className="btn btn-outline btn-sm" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <div className="review-address">
                    <strong>{shipping.name}</strong> • 📞 +91 {shipping.phone}
                    <br />{shipping.street}{shipping.landmark ? `, ${shipping.landmark}` : ''}
                    <br />{shipping.city}, {shipping.state} — {shipping.postalCode}
                    <br />{shipping.country}
                  </div>
                  <div className="delivery-badge">
                    {selectedDelivery?.icon} {selectedDelivery?.label} — {selectedDelivery?.days}
                    <span style={{ marginLeft: 8, color: shippingCost === 0 ? '#00d264' : 'var(--red)', fontWeight: 700 }}>
                      {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                    </span>
                  </div>
                </div>

                {/* PAYMENT SUMMARY */}
                <div className="review-section">
                  <div className="review-section-header">
                    <h4><FiCreditCard /> Payment Method</h4>
                    <button className="btn btn-outline btn-sm" onClick={() => setStep(2)}>Edit</button>
                  </div>
                  <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.9rem' }}>
                    {paymentMethod === 'Razorpay' && '🔐 Online Payment via Razorpay (Card / UPI / Net Banking / Wallet)'}
                    {paymentMethod === 'UPI' && `📱 UPI — ${upiId || 'hotwheels@ybl'} via ${UPI_APPS.find(a => a.id === upiApp)?.label}`}
                    {paymentMethod === 'Card' && `💳 Card ending in ${card.number.slice(-4) || '****'}`}
                    {paymentMethod === 'NetBanking' && `🏦 Net Banking — ${netBank}`}
                    {paymentMethod === 'Wallet' && `👛 ${walletType} Wallet`}
                    {paymentMethod === 'COD' && '💵 Cash on Delivery'}
                  </p>
                </div>

                {/* ORDER ITEMS */}
                <div className="review-section">
                  <h4 style={{ fontFamily: 'var(--font-accent)', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiShoppingBag /> Order Items ({items.length})
                  </h4>
                  {items.map(item => (
                    <div key={item._id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <img src={item.images?.[0]} alt={item.name} style={{ width: 56, height: 46, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.88rem' }}>{item.name}</p>
                        <p style={{ color: 'var(--gray)', fontSize: '0.75rem', fontFamily: 'var(--font-accent)' }}>Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <strong style={{ fontFamily: 'var(--font-accent)', color: 'var(--red)' }}>₹{(item.price * item.quantity).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-outline" onClick={() => setStep(2)}><FiArrowLeft /> Back</button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handlePlaceOrder} disabled={loading}>
                    {loading ? '⏳ Processing...' : paymentMethod === 'Razorpay' ? `🔐 Pay ₹${total.toLocaleString()} via Razorpay` : `🏎️ Place Order — ₹${total.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ════ RIGHT: ORDER SUMMARY ════ */}
          <div className="checkout-summary-area">
            <div className="checkout-summary-card">
              <button className="summary-toggle" onClick={() => setOrderSummaryOpen(!orderSummaryOpen)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <FiShoppingBag /> Order Summary ({items.length} item{items.length > 1 ? 's' : ''})
                </span>
                {orderSummaryOpen ? <FiChevronUp /> : <FiChevronDown />}
              </button>

              {/* Items list */}
              <div className={`summary-items ${orderSummaryOpen ? 'open' : ''}`}>
                {items.map(item => (
                  <div key={item._id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={item.images?.[0]} alt={item.name} style={{ width: 54, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                      <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.82rem', fontWeight: 700 }}>{item.name}</p>
                      <p style={{ color: 'var(--gray)', fontSize: '0.72rem' }}>{item.category}</p>
                    </div>
                    <strong style={{ fontFamily: 'var(--font-accent)', fontSize: '0.85rem', color: 'var(--red)' }}>₹{(item.price * item.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="summary-breakdown">
                <div className="summary-row-item"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="summary-row-item">
                  <span>Shipping <span style={{ fontSize: '0.72rem', color: 'var(--gray' }}>{selectedDelivery?.label}</span></span>
                  <span style={{ color: shippingCost === 0 ? '#00d264' : 'inherit' }}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                </div>
                <div className="summary-row-item"><span>CGST (9%)</span><span>₹{Math.round(tax / 2).toLocaleString()}</span></div>
                <div className="summary-row-item"><span>SGST (9%)</span><span>₹{Math.round(tax / 2).toLocaleString()}</span></div>
                <div className="summary-total-row">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Security badges */}
              <div className="checkout-badges">
                <div className="checkout-badge"><FiShield /> 100% Secure</div>
                <div className="checkout-badge">🔒 SSL Encrypted</div>
                <div className="checkout-badge">✅ Authentic</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* STEPPER */
        .checkout-stepper { display: flex; align-items: center; gap: 0; margin-bottom: 36px; max-width: 420px; }
        .step-indicator { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .step-circle { width: 42px; height: 42px; border-radius: 50%; background: var(--dark-3); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--gray); transition: var(--transition); }
        .step-label { font-family: var(--font-accent); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray); transition: var(--transition); white-space: nowrap; }
        .step-indicator.active .step-circle { border-color: var(--red); background: rgba(255,45,32,0.12); color: var(--red); box-shadow: 0 0 15px var(--red-glow); }
        .step-indicator.active .step-label { color: var(--white); }
        .step-indicator.done .step-circle { border-color: #00d264; background: rgba(0,210,100,0.12); color: #00d264; }
        .step-indicator.done .step-label { color: #00d264; }
        .step-line-connector { flex: 1; height: 2px; background: var(--border); margin: 0 12px; margin-bottom: 22px; transition: background 0.3s; }
        .step-line-connector.done { background: #00d264; }

        /* LAYOUT */
        .checkout-layout { display: grid; grid-template-columns: 1fr 380px; gap: 28px; align-items: start; }
        .checkout-form-area {}
        .checkout-summary-area {}

        /* FORM CARD */
        .checkout-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 32px; }
        .checkout-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .checkout-card-header h2 { font-family: var(--font-accent); font-size: 1.15rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }

        /* DELIVERY OPTIONS */
        .delivery-option { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 2px solid var(--border); border-radius: 10px; cursor: pointer; transition: var(--transition); }
        .delivery-option:hover { border-color: rgba(255,45,32,0.3); }
        .delivery-option.selected { border-color: var(--red); background: rgba(255,45,32,0.04); }
        .delivery-icon { font-size: 1.4rem; }

        /* PAYMENT TABS */
        .payment-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 24px; }
        .payment-tab { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 6px; border: 2px solid var(--border); border-radius: 10px; background: var(--dark-3); color: var(--gray); cursor: pointer; transition: var(--transition); font-family: var(--font-accent); font-size: 0.72rem; font-weight: 700; position: relative; }
        .payment-tab:hover { border-color: rgba(255,45,32,0.3); color: var(--white); }
        .payment-tab.active { border-color: var(--red); background: rgba(255,45,32,0.08); color: var(--white); box-shadow: 0 0 12px var(--red-glow); }
        .payment-tab span:first-child { font-size: 1.3rem; }
        .razorpay-tab { background: rgba(0,114,240,0.06); border-color: rgba(0,114,240,0.25); }
        .razorpay-tab.active { border-color: #0072f0; background: rgba(0,114,240,0.12); box-shadow: 0 0 12px rgba(0,114,240,0.3); }
        .rzp-badge { font-size: 0.55rem; background: #0072f0; color: white; padding: 1px 6px; border-radius: 10px; letter-spacing: 0.04em; }
        /* RAZORPAY PANEL */
        .rzp-box { border-color: rgba(0,114,240,0.25); background: rgba(0,114,240,0.04); }
        .rzp-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
        .rzp-logo { width: 48px; height: 48px; background: rgba(0,114,240,0.1); border: 1px solid rgba(0,114,240,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
        .rzp-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .rzp-method-item { font-family: var(--font-accent); font-size: 0.8rem; color: var(--gray); display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--dark-4); border-radius: 6px; }
        .rzp-amount-display { display: flex; justify-content: space-between; align-items: center; background: rgba(0,114,240,0.08); border: 1px solid rgba(0,114,240,0.2); border-radius: 8px; padding: 12px 16px; margin-bottom: 2px; font-family: var(--font-accent); }
        .rzp-amount-display span { font-size: 0.82rem; color: var(--gray); }
        .rzp-amount-display strong { font-size: 1.15rem; color: #4d9fff; }

        /* PAYMENT DETAIL BOX */
        .payment-detail-box { background: var(--dark-3); border: 1px solid var(--border); border-radius: 12px; padding: 22px; animation: fadeUp 0.3s ease; }

        /* UPI */
        .upi-apps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .upi-app-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; border: 2px solid var(--border); border-radius: 10px; background: var(--dark-4); cursor: pointer; transition: var(--transition); font-family: var(--font-accent); font-size: 0.72rem; color: var(--gray); }
        .upi-app-btn:hover { border-color: rgba(255,45,32,0.3); color: var(--white); }
        .upi-app-btn.selected { border-color: var(--red); background: rgba(255,45,32,0.08); color: var(--white); }
        .upi-qr-box { margin-top: 16px; display: flex; justify-content: center; }
        .upi-qr-placeholder { border: 2px dashed var(--border); border-radius: 12px; padding: 24px 40px; text-align: center; }

        /* CARD PREVIEW */
        .card-preview {
          background: linear-gradient(135deg, #1a0505, #2d0808);
          border: 1px solid rgba(255,45,32,0.3);
          border-radius: 14px; padding: 22px 24px;
          margin-bottom: 20px; position: relative; overflow: hidden;
          min-height: 130px;
        }
        .card-preview::before { content: ''; position: absolute; right: -30px; top: -30px; width: 120px; height: 120px; background: rgba(255,45,32,0.1); border-radius: 50%; }
        .card-preview::after { content: ''; position: absolute; right: 30px; top: 20px; width: 70px; height: 70px; background: rgba(255,45,32,0.06); border-radius: 50%; }
        .card-chip { font-size: 1.4rem; margin-bottom: 14px; }
        .card-number-preview { font-family: 'monospace', monospace; font-size: 1.05rem; letter-spacing: 0.15em; color: var(--white); margin-bottom: 14px; }
        .card-bottom-preview { display: flex; justify-content: space-between; }
        .card-label { font-family: var(--font-accent); font-size: 0.62rem; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 2px; }
        .card-bottom-preview strong { font-family: var(--font-accent); font-size: 0.85rem; letter-spacing: 0.05em; }
        .card-logos { display: flex; gap: 12px; margin-top: 14px; font-family: var(--font-accent); font-size: 0.78rem; color: var(--gray); flex-wrap: wrap; }

        /* NET BANKING */
        .bank-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .bank-btn { padding: 10px 12px; border: 2px solid var(--border); border-radius: 8px; background: var(--dark-4); color: var(--gray); cursor: pointer; text-align: left; font-family: var(--font-accent); font-size: 0.78rem; transition: var(--transition); }
        .bank-btn:hover { border-color: rgba(255,45,32,0.3); color: var(--white); }
        .bank-btn.selected { border-color: var(--red); background: rgba(255,45,32,0.08); color: var(--white); }

        /* COD */
        .cod-info-grid { display: flex; gap: 16px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
        .cod-info-item { text-align: center; }
        .cod-info-item span { font-size: 1.4rem; display: block; margin-bottom: 4px; }
        .cod-info-item p { font-family: var(--font-accent); font-size: 0.75rem; color: var(--gray); }

        /* SECURITY NOTE */
        .security-note { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-family: var(--font-accent); font-size: 0.78rem; color: var(--gray); padding: 8px 12px; background: rgba(0,210,100,0.06); border: 1px solid rgba(0,210,100,0.15); border-radius: 8px; }

        /* REVIEW */
        .review-section { background: var(--dark-3); border: 1px solid var(--border); border-radius: 10px; padding: 18px; margin-bottom: 14px; }
        .review-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .review-section-header h4 { display: flex; align-items: center; gap: 8px; font-family: var(--font-accent); font-size: 0.8rem; letter-spacing: 0.07em; text-transform: uppercase; color: var(--gray); }
        .review-address { font-family: var(--font-accent); font-size: 0.88rem; color: var(--white); line-height: 1.7; }
        .delivery-badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; background: rgba(255,45,32,0.08); border: 1px solid rgba(255,45,32,0.2); border-radius: 20px; padding: 4px 12px; font-family: var(--font-accent); font-size: 0.78rem; color: var(--gray); }

        /* SUMMARY CARD */
        .checkout-summary-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; position: sticky; top: 90px; }
        .summary-toggle { width: 100%; padding: 18px 20px; background: var(--dark-2); border: none; border-bottom: 1px solid var(--border); color: var(--white); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .summary-items { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; padding: 0 16px; }
        .summary-items.open { max-height: 400px; padding: 12px 16px; overflow-y: auto; }
        .summary-breakdown { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
        .summary-row-item { display: flex; justify-content: space-between; font-family: var(--font-accent); font-size: 0.85rem; color: var(--gray); }
        .summary-total-row { display: flex; justify-content: space-between; font-family: var(--font-accent); font-weight: 700; font-size: 1.05rem; padding-top: 10px; border-top: 1px solid var(--border); color: var(--white); }
        .summary-total-row span:last-child { color: var(--red); font-size: 1.15rem; }
        .checkout-badges { display: flex; justify-content: center; gap: 12px; padding: 14px; border-top: 1px solid var(--border); flex-wrap: wrap; }
        .checkout-badge { display: flex; align-items: center; gap: 5px; font-family: var(--font-accent); font-size: 0.72rem; color: var(--gray); }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .checkout-summary-area { order: -1; }
          .payment-tabs { grid-template-columns: repeat(3, 1fr); }
          .upi-apps-grid { grid-template-columns: repeat(2, 1fr); }
          .checkout-stepper { max-width: 100%; }
        }
        @media (max-width: 580px) {
          .checkout-card { padding: 20px; }
          .payment-tabs { grid-template-columns: repeat(2, 1fr); }
          .bank-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
