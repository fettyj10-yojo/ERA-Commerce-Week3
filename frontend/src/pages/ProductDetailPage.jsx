import { useState, useEffect } from 'react';
import { BASE_URL } from '../api/config';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';

function ProductDetailPage({ 
  selectedProductId, 
  currentUser, 
  setCurrentView,
  cart,
  setCart,
  token 
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [selectedProductId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/products/${selectedProductId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStockStatus = () => {
    if (product.stock_quantity === 0) {
      return <span className="text-red-600 font-medium">Out of Stock</span>;
    } else if (product.stock_quantity <= 10) {
      return <span className="text-yellow-600 font-medium">Low Stock ({product.stock_quantity} left)</span>;
    } else {
      return <span className="text-green-600 font-medium">In Stock</span>;
    }
  };

  const handleAddToCart = () => {
    if (product.stock_quantity === 0) return;

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock_quantity) {
        alert('Cannot add more than available stock');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    
    alert(`Added ${quantity} item(s) to cart`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          user_id: currentUser.id,
          rating,
          review_text: reviewText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setReviewSuccess('Review submitted successfully!');
      setReviewText('');
      setRating(5);
      fetchProduct();
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-red-600">Product not found</p>
      </div>
    );
  }

  const averageRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => setCurrentView('products')}
        className="text-blue-600 hover:text-blue-700 mb-4"
      >
        ← Back to Products
      </button>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <p className="text-xs text-slate-400 italic mb-4">🛍️ Product data from MySQL</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{product.name}</h1>
            <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full mb-3">
              {product.category_name}
            </span>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {formatPrice(product.price)}
            </p>
            <div className="mb-4">{getStockStatus()}</div>
          </div>

          <div>
            <p className="text-slate-600 mb-4">{product.description}</p>
            
            {product.stock_quantity > 0 && (
              <div className="mb-4">
                <label className="block text-sm text-slate-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                  className="border border-gray-300 rounded px-3 py-2 w-24"
                />
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className={`w-full py-3 rounded font-medium ${
                product.stock_quantity === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : `Add ${quantity} to Cart`}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Customer Reviews</h2>
        <p className="text-xs text-slate-400 italic mb-4">📦 Reviews stored in MongoDB</p>

        {product.reviews && product.reviews.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={Math.round(averageRating)} size="md" />
              <span className="text-slate-600">
                {averageRating.toFixed(1)} ({product.reviews.length} reviews)
              </span>
            </div>
          </div>
        )}

        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-3 mb-6">
            {product.reviews.map((review, index) => (
              <div key={index} className="bg-gray-50 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="text-slate-700 text-sm mb-1">{review.review_text}</p>
                <p className="text-xs text-slate-500">
                  By {review.first_name} — {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm mb-6">No reviews yet. Be the first!</p>
        )}

        <div className="border-t pt-4">
          <h3 className="font-medium text-slate-800 mb-3">Add Your Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl"
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-2">Your Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
                rows="3"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {reviewError && <p className="text-red-600 text-sm mb-3">{reviewError}</p>}
            {reviewSuccess && <p className="text-green-600 text-sm mb-3">{reviewSuccess}</p>}
            <button
              type="submit"
              disabled={submittingReview}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
