import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Zap, Sparkles, Calendar } from 'lucide-react';
import './LoginPage.css';

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
          localStorage.setItem('userRole','student')
          localStorage.setItem('student', JSON.stringify(data.data.student));
          navigate('/student/dashboard');
        } else if (data.data.faculty) {
          localStorage.setItem('userRole','student')
          localStorage.setItem('faculty', JSON.stringify(data.data.faculty));
          navigate('/faculty/dashboard');
        } else if (data.data.admin) {
          localStorage.setItem('userRole','admin')
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
    <div className="login-container">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="login-bg-element-1"></div>
        <div className="login-bg-element-2"></div>
        <div className="login-bg-element-3"></div>
      </div>
{/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="login-header-icon">
            <Calendar style={{ width: '3rem', height: '3rem', color: 'white' }} />
            <div className="login-header-badge">
              <Sparkles style={{ width: '1rem', height: '1rem', color: '#92400e' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Welcome Back!</h1>
          <p style={{ color: '#bfdbfe', fontSize: '1.125rem' }}>Ready to create amazing events?</p>
        </div>
      {/* Login Box */}
      <div className="login-form-container">
        
        

        {/* Error */}
        {error && (
          <div className="login-error">
            <div className="login-error-dot"></div>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>Email Address</label>
            <div className="login-input-group">
              <Mail className="login-input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="login-input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>Password</label>
            <div className="login-input-group">
              <Lock className="login-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="login-input"
                style={{ paddingRight: '3.5rem' }}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-password-toggle"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
          >
            {loading ? (
              <div className="login-spinner"></div>
            ) : (
              <>
                <Zap style={{ width: '1.5rem', height: '1.5rem' }} />
                <span>Sign In & Create Events</span>
                <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="login-register-link"
          >
            New to event management? <span style={{ fontWeight: 'bold' }}>Join our community!</span>
          </button>
        </div>

        
      </div>
      <div className="login-footer">
          <p className="login-footer-content">
            <Sparkles style={{ width: '1rem', height: '1rem' }} />
            <span>Create • Manage • Celebrate</span>
            <Sparkles style={{ width: '1rem', height: '1rem' }} />
          </p>
        </div>
    </div>
  );
};

export default LoginPage;
