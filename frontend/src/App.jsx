import { useState } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminReportsPage from './pages/AdminReportsPage';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [cart, setCart] = useState([]);

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage
            setCurrentView={setCurrentView}
            setCurrentUser={setCurrentUser}
            setToken={setToken}
          />
        );

      case 'dashboard':
        return (
          <DashboardPage
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            cart={cart}
          />
        );

      case 'products':
        return (
          <ProductsPage
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            setSelectedProductId={setSelectedProductId}
            cart={cart}
            setCart={setCart}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            token={token}
          />
        );

      case 'product-detail':
        return (
          <ProductDetailPage
            selectedProductId={selectedProductId}
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            cart={cart}
            setCart={setCart}
            token={token}
          />
        );

      case 'cart':
        return (
          <CartPage
            cart={cart}
            setCart={setCart}
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            token={token}
          />
        );

      case 'orders':
        return (
          <OrdersPage
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            setSelectedOrderId={setSelectedOrderId}
            token={token}
          />
        );

      case 'order-detail':
        return (
          <OrderDetailPage
            selectedOrderId={selectedOrderId}
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            token={token}
          />
        );

      case 'admin-products':
        return (
          <AdminProductsPage
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            token={token}
          />
        );

      case 'admin-reports':
        return (
          <AdminReportsPage
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            token={token}
          />
        );

      default:
        return (
          <LoginPage
            setCurrentView={setCurrentView}
            setCurrentUser={setCurrentUser}
            setToken={setToken}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {currentView !== 'login' && (
        <Navbar
          currentUser={currentUser}
          setCurrentView={setCurrentView}
          setCurrentUser={setCurrentUser}
          setToken={setToken}
          cart={cart}
        />
      )}
      {renderView()}
    </div>
  );
}

export default App;
