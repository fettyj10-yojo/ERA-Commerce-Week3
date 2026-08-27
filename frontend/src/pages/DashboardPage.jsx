import { useState, useEffect } from 'react';
import { BASE_URL } from '../api/config';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

function DashboardPage({ currentUser, setCurrentView, cart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        fetch(`${BASE_URL}/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/orders/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const ordersData = await ordersRes.json();

      setProducts(productsData.slice(0, 6));
      setCategories(categoriesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {currentUser.first_name}!
          </h1>
          <span className={`text-xs px-2 py-1 rounded text-white ${
            currentUser.role === 'admin' ? 'bg-purple-600' : 'bg-slate-600'
          }`}>
            {currentUser.role}
          </span>
        </div>
        <p className="text-slate-600 mb-4">
          Browse our company store and place your orders.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{products.length}+</p>
            <p className="text-sm text-slate-600">Products Available</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
            <p className="text-sm text-slate-600">My Orders</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{cartItemCount}</p>
            <p className="text-sm text-slate-600">Cart Items</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentView('products')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Browse Products
          </button>
          <button
            onClick={() => setCurrentView('orders')}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            My Orders
          </button>
          <button
            onClick={() => setCurrentView('cart')}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            View Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(id) => {
                setCurrentView('product-detail');
              }}
              onAddToCart={() => {}}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Shop by Category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setCurrentView('products')}
              className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              {category.name}
              {category.product_count > 0 && (
                <span className="ml-2 text-xs text-slate-500">
                  ({category.product_count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {currentUser.role === 'admin' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Admin Panel</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('admin-products')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Manage Products
            </button>
            <button
              onClick={() => setCurrentView('admin-reports')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              View Reports
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
