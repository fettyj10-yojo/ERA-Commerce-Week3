import { useState } from 'react';

function ProductCard({ product, onViewDetails, onAddToCart }) {
  const [showFeedback, setShowFeedback] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStockStatus = () => {
    if (product.stock_quantity === 0) {
      return <span className="text-xs text-red-600">Out of Stock</span>;
    } else if (product.stock_quantity <= 10) {
      return <span className="text-xs text-yellow-600">Low Stock ({product.stock_quantity} left)</span>;
    } else {
      return <span className="text-xs text-green-600">In Stock</span>;
    }
  };

  const handleAddToCart = () => {
    if (product.stock_quantity > 0) {
      onAddToCart(product);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1500);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md cursor-pointer transition">
      <p className="text-xs text-slate-400 uppercase mb-1">
        {product.category_name}
      </p>
      <h3 className="text-base font-semibold text-slate-800">
        {product.name}
      </h3>
      <p className="text-lg font-bold text-blue-600 mt-1">
        {formatPrice(product.price)}
      </p>
      {getStockStatus()}
      <p className="text-sm text-slate-500 mt-2 line-clamp-2">
        {product.description}
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onViewDetails(product.id)}
          className="border border-gray-300 text-sm px-3 py-1 rounded hover:bg-gray-50"
        >
          View Details
        </button>
        <button
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
          className={`text-sm px-3 py-1 rounded ${
            product.stock_quantity === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showFeedback ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
