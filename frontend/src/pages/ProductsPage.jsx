import { useState, useEffect } from 'react';
import { BASE_URL } from '../api/config';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

function ProductsPage({ 
  currentUser, 
  setCurrentView, 
  setSelectedProductId,
  cart,
  setCart,
  selectedCategoryId,
  setSelectedCategoryId,
  token 
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${BASE_URL}/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        alert('Max stock reached');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleViewDetails = (productId) => {
    setSelectedProductId(productId);
    setCurrentView('product-detail');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategoryId || product.category_id === parseInt(selectedCategoryId);
    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId(null);
  };

  const hasActiveFilters = searchTerm || selectedCategoryId;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        <p className="text-xs text-slate-400 italic">🛍️ Data from MySQL</p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />

        <select
          value={selectedCategoryId || ''}
          onChange={(e) => setSelectedCategoryId(e.target.value || null)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="border border-gray-300 text-sm px-3 py-2 rounded hover:bg-gray-50"
          >
            Clear Filters
          </button>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <p className="text-center text-slate-400 py-12">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={handleViewDetails}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
