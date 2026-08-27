import { useState, useEffect } from 'react';
import { BASE_URL } from '../api/config';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminProductsPage({ currentUser, setCurrentView, token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser.role !== 'admin') {
      return;
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          category_id: parseInt(formData.category_id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      const data = await response.json();
      setMessage(`Product added successfully! ID: ${data.productId}`);
      setFormData({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: ''
      });
      fetchData();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return <span className="text-red-600 font-medium">Out of Stock</span>;
    } else if (quantity <= 10) {
      return <span className="text-yellow-600 font-medium">Low Stock</span>;
    } else {
      return <span className="text-green-600 font-medium">In Stock</span>;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white border rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">Access denied. Admin only.</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage Products</h1>
        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
          Admin Only
        </span>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Product</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows="3"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="col-span-2">
            {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submitting ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <h2 className="text-xl font-bold text-slate-800 p-6 pb-4">All Products</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.id}
                className={`hover:bg-gray-50 ${
                  index < products.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm font-mono">{product.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {product.category_name}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-3 text-sm">{product.stock_quantity}</td>
                <td className="px-4 py-3 text-sm">
                  {getStockStatus(product.stock_quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminProductsPage;
