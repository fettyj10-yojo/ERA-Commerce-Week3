import { useState, useEffect } from 'react';
import { BASE_URL } from '../api/config';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function OrderDetailPage({ selectedOrderId, currentUser, setCurrentView, token }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [selectedOrderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/orders/${selectedOrderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={() => setCurrentView('orders')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-slate-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => setCurrentView('orders')}
        className="text-blue-600 hover:text-blue-700 mb-4"
      >
        ← Back to Orders
      </button>

      <div className="bg-white border rounded-lg p-6 mb-4">
        <p className="text-xs text-slate-400 italic mb-4">🛍️ Order data from MySQL</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-500">Order ID</p>
            <p className="text-lg font-mono font-bold">#{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500">Order Date</p>
            <p className="text-sm font-medium">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Amount</p>
            <p className="text-lg font-bold text-blue-600">
              {formatPrice(order.total_amount)}
            </p>
          </div>
        </div>

        {order.customer && (
          <div className="border-t pt-4">
            <p className="text-sm text-slate-500 mb-2">Customer Information</p>
            <p className="font-medium">
              {order.customer.first_name} {order.customer.last_name}
            </p>
            <p className="text-sm text-slate-600">{order.customer.email}</p>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Order Items</h2>
        
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr
                key={index}
                className={`${
                  index < order.items.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm">{item.product_name}</td>
                <td className="px-4 py-3 text-sm">{item.quantity}</td>
                <td className="px-4 py-3 text-sm">
                  {formatPrice(item.price_at_purchase)}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {formatPrice(item.subtotal)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300">
              <td colSpan="3" className="px-4 py-3 text-right font-bold">
                Total
              </td>
              <td className="px-4 py-3 text-lg font-bold text-blue-600">
                {formatPrice(order.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderDetailPage;
