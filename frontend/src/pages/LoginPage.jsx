import { useState } from 'react';
import { BASE_URL } from '../api/config';

function LoginPage({ setCurrentView, setCurrentUser, setToken }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setCurrentView('dashboard');
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setRegisterSuccess('Registration successful! Please login.');
      setRegisterData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'customer'
      });
      setTimeout(() => {
        setActiveTab('login');
        setRegisterSuccess('');
      }, 2000);
    } catch (error) {
      setRegisterError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full p-8 rounded-lg border shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛍️</div>
          <h1 className="text-xl font-bold text-slate-800">ERA Commerce</h1>
          <p className="text-sm text-slate-500">Company Store</p>
        </div>

        <div className="flex mb-4 border-b">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-sm ${
              activeTab === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-slate-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-sm ${
              activeTab === 'register'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-slate-500'
            }`}
          >
            Register
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {loginError && (
              <p className="text-red-600 text-sm mb-3">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={registerData.first_name}
                onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={registerData.last_name}
                onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 mb-1">Role</label>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {registerError && (
              <p className="text-red-600 text-sm mb-3">{registerError}</p>
            )}
            {registerSuccess && (
              <p className="text-green-600 text-sm mb-3">{registerSuccess}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
