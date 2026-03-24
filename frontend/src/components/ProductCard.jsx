import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar, FiEye } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart(product));
    toast.success(`${product.name} added to cart!`);
  };

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-card-image">
        <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400'} alt={product.name} loading="lazy" />
        <div className="product-card-badges">
          {product.isNewArrival && <span className="badge badge-blue">New</span>}
          {discount > 0 && <span className="badge badge-red">-{discount}%</span>}
          {product.category === 'Super Treasure Hunt' && <span className="badge badge-yellow">⭐ STH</span>}
        </div>
        <div className="product-card-overlay">
          <button className="product-quick-view" title="View Details"><FiEye /></button>
          <button className="product-add-cart" onClick={handleAddToCart} title="Add to Cart">
            <FiShoppingCart /> Add to Cart
          </button>
        </div>
        {product.stockCount === 0 && <div className="product-out-of-stock">Out of Stock</div>}
      </div>

      <div className="product-card-info">
        <div className="product-card-category">{product.category}</div>
        <h3 className="product-card-name">{product.name}</h3>
        {product.series && <p className="product-card-series">{product.series}</p>}
        <div className="product-card-meta">
          <div className="product-card-rating">
            <FiStar className="star-icon" />
            <span>{product.rating?.toFixed(1) || '0.0'}</span>
            <span className="review-count">({product.numReviews || 0})</span>
          </div>
          <div className="product-card-price">
            <span className="price-current">₹{product.price}</span>
            {discount > 0 && <span className="price-original">₹{product.originalPrice}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
