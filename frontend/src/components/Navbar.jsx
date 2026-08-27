function Navbar({ currentUser, setCurrentView, setCurrentUser, setToken, cart }) {
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setToken(null);
    setCurrentView('login');
  };

  return (
    <nav className="sticky top-0 w-full bg-slate-900 h-16 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <span className="text-white font-bold text-lg">ERA Commerce</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400 text-sm">Company Store</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-slate-300 hover:text-white text-sm"
        >
          Home
        </button>
        <button
          onClick={() => setCurrentView('products')}
          className="text-slate-300 hover:text-white text-sm"
        >
          Products
        </button>
        <button
          onClick={() => setCurrentView('orders')}
          className="text-slate-300 hover:text-white text-sm"
        >
          My Orders
        </button>

        {currentUser?.role === 'admin' && (
          <>
            <button
              onClick={() => setCurrentView('admin-products')}
              className="text-slate-300 hover:text-white text-sm"
            >
              Manage Products
            </button>
            <button
              onClick={() => setCurrentView('admin-reports')}
              className="text-slate-300 hover:text-white text-sm"
            >
              Reports
            </button>
          </>
        )}

        <button
          onClick={() => setCurrentView('cart')}
          className="bg-blue-600 text-white rounded-full px-3 py-1 text-sm hover:bg-blue-700"
        >
          🛒 Cart {cartItemCount > 0 && `(${cartItemCount})`}
        </button>

        <span className="text-white text-sm">
          {currentUser?.first_name} {currentUser?.last_name}
        </span>

        <span className={`text-xs px-2 py-1 rounded text-white ${
          currentUser?.role === 'admin' ? 'bg-purple-600' : 'bg-slate-600'
        }`}>
          {currentUser?.role}
        </span>

        <button
          onClick={handleLogout}
          className="border border-slate-500 text-slate-300 rounded px-3 py-1 text-sm hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
