import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiStar, FiArrowLeft, FiCheck, FiTruck, FiShield } from 'react-icons/fi';
import { addToCart } from '../store/cartSlice';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../components/ProductCard.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [tab, setTab] = useState('desc');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (e) {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) dispatch(addToCart(product));
    toast.success(`${product.name} added to cart!`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to review'); return; }
    setReviewLoading(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewComment('');
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error submitting review');
    } finally {
      setReviewLoading(false);
    }
  };

  const discount = product?.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  if (loading) return <div className="spinner" style={{ marginTop: '100px' }}></div>;
  if (!product) return null;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="breadcrumb-sep">/</span>
        <a href="/products">Products</a>
        <span className="breadcrumb-sep">/</span>
        <span>{product.name}</span>
      </div>

      <button className="btn btn-outline btn-sm" style={{ marginBottom: '24px' }} onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back
      </button>

      <div className="detail-layout">
        {/* IMAGES */}
        <div className="detail-images">
          <div className="detail-main-img">
            <img src={product.images?.[selectedImg] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600'} alt={product.name} />
            {discount > 0 && <span className="badge badge-red" style={{ position: 'absolute', top: '16px', left: '16px' }}>-{discount}%</span>}
            {product.category === 'Super Treasure Hunt' && <span className="badge badge-yellow" style={{ position: 'absolute', top: '16px', right: '16px' }}>⭐ STH</span>}
          </div>
          {product.images?.length > 1 && (
            <div className="detail-thumbs">
              {product.images.map((img, i) => (
                <button key={i} className={`thumb-btn ${i === selectedImg ? 'active' : ''}`} onClick={() => setSelectedImg(i)}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="detail-info">
          <div className="detail-category">{product.category}</div>
          <h1 className="detail-title">{product.name}</h1>
          {product.series && <p className="detail-series">{product.series} • {product.scale} Scale • {product.year}</p>}

          <div className="detail-rating">
            <div className="stars">
              {[1,2,3,4,5].map((s) => (
                <FiStar key={s} fill={s <= Math.round(product.rating) ? 'var(--yellow)' : 'none'} color={s <= Math.round(product.rating) ? 'var(--yellow)' : 'var(--gray-2)'} />
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-accent)', fontSize: '0.9rem' }}>{product.rating?.toFixed(1)} ({product.numReviews} reviews)</span>
          </div>

          <div className="detail-price">
            <span className="price-current" style={{ fontSize: '2rem' }}>₹{product.price}</span>
            {discount > 0 && <>
              <span className="price-original" style={{ fontSize: '1.1rem' }}>₹{product.originalPrice}</span>
              <span className="badge badge-red">{discount}% OFF</span>
            </>}
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-item"><span>Brand</span><strong>{product.brand}</strong></div>
            <div className="detail-meta-item"><span>Scale</span><strong>{product.scale}</strong></div>
            <div className="detail-meta-item"><span>Color</span><strong>{product.color}</strong></div>
            <div className="detail-meta-item"><span>Year</span><strong>{product.year}</strong></div>
          </div>

          <div className={`detail-stock ${product.stockCount > 0 ? 'in-stock' : 'out-stock'}`}>
            <FiCheck /> {product.stockCount > 0 ? `In Stock (${product.stockCount} available)` : 'Out of Stock'}
          </div>

          {product.stockCount > 0 && (
            <div className="detail-actions">
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="qty-value">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(Math.min(product.stockCount, qty + 1))}>+</button>
              </div>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAddToCart}>
                <FiShoppingCart /> Add to Cart
              </button>
            </div>
          )}

          <div className="detail-perks">
            <div className="perk"><FiTruck /> Free shipping above ₹999</div>
            <div className="perk"><FiShield /> 100% Authentic Guarantee</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ marginTop: '60px' }}>
        <div className="tabs">
          <button className={`tab-btn ${tab === 'desc' ? 'active' : ''}`} onClick={() => setTab('desc')}>Description</button>
          <button className={`tab-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
            Reviews ({product.numReviews})
          </button>
        </div>

        {tab === 'desc' && (
          <div className="card" style={{ padding: '30px' }}>
            <p style={{ color: 'var(--gray)', lineHeight: '1.8' }}>{product.description}</p>
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            {product.reviews?.length === 0 && <p style={{ color: 'var(--gray)', padding: '30px 0' }}>No reviews yet. Be the first!</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {product.reviews?.map((r) => (
                <div key={r._id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontFamily: 'var(--font-accent)' }}>{r.name}</strong>
                      <div className="stars" style={{ marginTop: '4px' }}>
                        {[1,2,3,4,5].map((s) => <FiStar key={s} fill={s <= r.rating ? 'var(--yellow)' : 'none'} color={s <= r.rating ? 'var(--yellow)' : 'var(--gray-2)'} size={14} />)}
                      </div>
                    </div>
                    <span style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>{r.comment}</p>
                </div>
              ))}
            </div>

            {user && (
              <div className="card" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-accent)', fontSize: '1.2rem' }}>Write a Review</h3>
                <form onSubmit={submitReview}>
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="stars" style={{ gap: '8px' }}>
                      {[1,2,3,4,5].map((s) => (
                        <button key={s} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }} onClick={() => setReviewRating(s)}>
                          <FiStar fill={s <= reviewRating ? 'var(--yellow)' : 'none'} color={s <= reviewRating ? 'var(--yellow)' : 'var(--gray-2)'} size={24} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Comment</label>
                    <textarea rows={4} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience with this car..." required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .detail-main-img { position: relative; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); background: var(--dark-3); aspect-ratio: 4/3; }
        .detail-main-img img { width: 100%; height: 100%; object-fit: cover; }
        .detail-thumbs { display: flex; gap: 10px; margin-top: 12px; }
        .thumb-btn { width: 72px; height: 60px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border); cursor: pointer; background: none; transition: var(--transition); }
        .thumb-btn.active, .thumb-btn:hover { border-color: var(--red); }
        .thumb-btn img { width: 100%; height: 100%; object-fit: cover; }
        .detail-category { font-family: var(--font-accent); font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--red); margin-bottom: 10px; }
        .detail-title { font-family: var(--font-heading); font-size: clamp(1.4rem, 3vw, 2rem); text-transform: uppercase; margin-bottom: 8px; }
        .detail-series { color: var(--gray); font-family: var(--font-accent); font-size: 0.9rem; margin-bottom: 16px; }
        .detail-rating { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .detail-price { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .detail-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .detail-meta-item { background: var(--dark-3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
        .detail-meta-item span { display: block; font-size: 0.72rem; color: var(--gray); font-family: var(--font-accent); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px; }
        .detail-meta-item strong { font-family: var(--font-accent); font-size: 0.95rem; }
        .detail-stock { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; font-family: var(--font-accent); font-weight: 700; font-size: 0.9rem; margin-bottom: 20px; }
        .in-stock { background: rgba(0,210,100,0.1); border: 1px solid rgba(0,210,100,0.3); color: #00d264; }
        .out-stock { background: rgba(255,45,32,0.1); border: 1px solid rgba(255,45,32,0.3); color: var(--red); }
        .detail-actions { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
        .detail-perks { display: flex; flex-direction: column; gap: 8px; padding: 16px; background: var(--dark-3); border-radius: 10px; border: 1px solid var(--border); }
        .perk { display: flex; align-items: center; gap: 10px; font-family: var(--font-accent); font-size: 0.85rem; color: var(--gray); }
        @media (max-width: 768px) {
          .detail-layout { grid-template-columns: 1fr; gap: 30px; }
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;
