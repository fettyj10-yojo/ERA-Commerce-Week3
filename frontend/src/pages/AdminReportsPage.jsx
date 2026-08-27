import { useState, useEffect } from 'react';
import { BASE_URL } from '../api/config';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminReportsPage({ currentUser, setCurrentView, token }) {
  const [salesSummary, setSalesSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser.role !== 'admin') {
      return;
    }
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [salesRes, topProductsRes, categorySalesRes, inventoryRes] = await Promise.all([
        fetch(`${BASE_URL}/reports/sales`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/reports/top-products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/reports/category-sales`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/reports/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!salesRes.ok || !topProductsRes.ok || !categorySalesRes.ok || !inventoryRes.ok) {
        throw new Error('Failed to fetch reports');
      }

      const salesData = await salesRes.json();
      const topProductsData = await topProductsRes.json();
      const categorySalesData = await categorySalesRes.json();
      const inventoryData = await inventoryRes.json();

      setSalesSummary(salesData);
      setTopProducts(topProductsData);
      setCategorySales(categorySalesData);
      setInventory(inventoryData);
    } catch (error) {
      setError(error.message);
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

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in_stock':
        return 'text-green-600';
      case 'low_stock':
        return 'text-yellow-600';
      case 'out_of_stock':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Sales Reports</h1>
        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
          Admin Only
        </span>
      </div>
      <p className="text-xs text-slate-400 italic mb-6">
        📊 Powered by MySQL aggregate functions
      </p>

      {salesSummary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {formatPrice(salesSummary.total_revenue)}
            </p>
            <p className="text-sm text-slate-600 mt-1">Total Revenue</p>
          </div>
          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {salesSummary.total_orders}
            </p>
            <p className="text-sm text-slate-600 mt-1">Total Orders</p>
          </div>
          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {formatPrice(salesSummary.average_order_value)}
            </p>
            <p className="text-sm text-slate-600 mt-1">Average Order Value</p>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Top Products by Revenue
        </h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Units Sold</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.slice(0, 5).map((product, index) => (
              <tr
                key={index}
                className={`${
                  index < Math.min(topProducts.length, 5) - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium">{product.product_name}</td>
                <td className="px-4 py-3 text-sm">{product.total_sold}</td>
                <td className="px-4 py-3 text-sm font-bold text-blue-600">
                  {formatPrice(product.total_revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Revenue by Category
        </h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Orders</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {categorySales.map((category, index) => (
              <tr
                key={index}
                className={`${
                  index < categorySales.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium">{category.category_name}</td>
                <td className="px-4 py-3 text-sm">{category.total_orders}</td>
                <td className="px-4 py-3 text-sm font-bold text-blue-600">
                  {formatPrice(category.total_revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Inventory Overview
        </h2>
        <p className="text-xs text-slate-400 italic mb-4">
          📦 Live stock levels from MySQL
        </p>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 ${
                  index < inventory.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.category_name}</td>
                <td className="px-4 py-3 text-sm">{item.stock_quantity}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`font-medium ${getStockStatusColor(item.stock_status)}`}>
                    {formatStatus(item.stock_status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminReportsPage;
