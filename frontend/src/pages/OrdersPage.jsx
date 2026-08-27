import { useState, useEffect } from 'react';
import { BASE_URL } from '../api/config';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function OrdersPage({ currentUser, setCurrentView, setSelectedOrderId, token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const endpoint = currentUser.role === 'admin' 
        ? `${BASE_URL}/orders` 
        : `${BASE_URL}/orders/my`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setCurrentView('order-detail');
  };

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
        <h1 className="text-2xl font-bold text-slate-800">
          {currentUser.role === 'admin' ? 'All Orders' : 'My Orders'}
        </h1>
        <p className="text-xs text-slate-400 italic">🛍️ Data from MySQL</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-center">
          <p className="text-slate-500">No orders yet.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Order ID</th>
                {currentUser.role === 'admin' && (
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Customer</th>
                )}
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50 ${
                    index < orders.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-mono">#{order.id}</td>
                  {currentUser.role === 'admin' && (
                    <td className="px-4 py-3 text-sm">
                      {order.first_name} {order.last_name}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {order.item_count} items
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetails(order.id)}
                      className="text-blue-600 text-sm hover:text-blue-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
