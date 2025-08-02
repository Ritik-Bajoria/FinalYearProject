import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Zap, Sparkles, Calendar } from 'lucide-react';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        if (data.data.student) {
          localStorage.setItem('student', JSON.stringify(data.data.student));
          navigate('/student/dashboard');
        } else if (data.data.faculty) {
          localStorage.setItem('faculty', JSON.stringify(data.data.faculty));
          navigate('/faculty/dashboard');
        } else if (data.data.admin) {
          localStorage.setItem('admin', JSON.stringify(data.data.admin));
          navigate('/admin/dashboard');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-indigo-900 via-blue-900 to-yellow-400 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-yellow-400/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 w-52 h-52 bg-blue-400/10 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2"></div>
      </div>
{/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm mb-4 relative">
            <Calendar className="w-12 h-12 text-white" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-blue-100 text-lg">Ready to create amazing events?</p>
        </div>
      {/* Login Box */}
      <div className="bg-white/90 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10">
        
        

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2 shadow mb-5">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-800">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900 bg-white/70 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-800">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-14 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-900 bg-white/70 transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-800 to-indigo-900 text-white font-semibold text-lg shadow-lg hover:scale-105 hover:shadow-xl transition-transform duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                <span>Sign In & Create Events</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-indigo-900 hover:underline text-sm font-medium transition"
          >
            New to event management? <span className="font-bold">Join our community!</span>
          </button>
        </div>

        
      </div>
      <div className="text-center mt-6 text-blue-100 text-xs">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Create • Manage • Celebrate</span>
            <Sparkles className="w-4 h-4" />
          </p>
        </div>
    </div>
  );
};

export default LoginPage;
