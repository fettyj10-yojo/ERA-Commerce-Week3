import { useState } from 'react';
import { BASE_URL } from '../api/config';

function CartPage({ cart, setCart, currentUser, setCurrentView, token }) {
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState('');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const item = cart.find(item => item.id === productId);
    if (newQuantity > item.stock_quantity) {
      alert('Cannot exceed available stock');
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeItem = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    setOrderError('');

    try {
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }));

      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          items: orderItems
        })
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      setOrderSuccess(data);
      setCart([]);
    } catch (error) {
      setOrderError(error.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white border rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-slate-600 mb-1">Order ID: #{orderSuccess.orderId}</p>
          <p className="text-slate-600 mb-4">
            Total Amount: {formatPrice(orderSuccess.total_amount)}
          </p>
          <button
            onClick={() => setCurrentView('orders')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white border rounded-lg p-6 text-center">
          <p className="text-slate-500 mb-4">Your cart is empty.</p>
          <button
            onClick={() => setCurrentView('products')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Your Cart</h1>

      <div className="bg-white border rounded-lg mb-4">
        {cart.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-4 ${
              index < cart.length - 1 ? 'border-b' : ''
            }`}
          >
            <div className="flex-1">
              <h3 className="font-medium text-slate-800">{item.name}</h3>
              <p className="text-sm text-slate-500">{formatPrice(item.price)} each</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="border border-gray-300 w-8 h-8 rounded hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="border border-gray-300 w-8 h-8 rounded hover:bg-gray-50"
                >
                  +
                </button>
              </div>

              <p className="font-bold text-slate-800 w-24 text-right">
                {formatPrice(item.price * item.quantity)}
              </p>

              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 text-sm hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Order Summary</h2>
        
        <div className="space-y-2 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600">
                {item.name} × {item.quantity}
              </span>
              <span className="text-slate-800">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between">
            <span className="text-xl font-bold text-slate-800">Total</span>
            <span className="text-xl font-bold text-blue-600">
              {formatPrice(calculateTotal())}
            </span>
          </div>
        </div>

        {orderError && (
          <p className="text-red-600 text-sm mb-4">{orderError}</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="w-full bg-blue-600 text-white py-3 rounded text-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
        >
          {placingOrder ? 'Placing Order...' : `Place Order — ${formatPrice(calculateTotal())}`}
        </button>
      </div>
    </div>
  );
}

export default CartPage;
