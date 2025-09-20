import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ChevronRight, Sparkles, Shield, Clock } from 'lucide-react';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Registration Form, 2: OTP Verification
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    student_id_number: '',
    year_of_study: '1',
    major: ''
  });
  const [otpData, setOtpData] = useState({
    otp: '',
    tempToken: '',
    expiresAt: null
  });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate full_name to not contain numbers
    if (name === 'full_name' && /\d/.test(value)) {
      setError('Name cannot contain numbers');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.email || !formData.password || !formData.confirmPassword || !formData.student_id_number) {
      setError('Please fill all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const startOtpTimer = (expirationTime) => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const timeLeft = Math.max(0, Math.floor((expirationTime - now) / 1000));
      setOtpTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        role: 'student',
        student: {
          full_name: formData.full_name,
          student_id_number: formData.student_id_number,
          year_of_study: formData.year_of_study,
          major: formData.major
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration initiated, now show OTP verification step
        setOtpData({
          otp: '',
          tempToken: data.temp_token,
          expiresAt: new Date(data.expires_at).getTime()
        });
        setCurrentStep(2);
        startOtpTimer(new Date(data.expires_at).getTime());
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpData.otp || otpData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temp_token: otpData.tempToken,
          otp: otpData.otp
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login', { 
          state: { 
            registrationSuccess: true,
            message: 'Registration successful! Please login with your credentials.'
          } 
        });
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temp_token: otpData.tempToken
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpData(prev => ({
          ...prev,
          expiresAt: new Date(data.expires_at).getTime()
        }));
        startOtpTimer(new Date(data.expires_at).getTime());
        setError('');
        // Show success message briefly
        setError('OTP resent successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-6 sm:p-10 bg-gradient-to-br from-indigo-900 via-blue-900 to-yellow-400 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/4 right-16 w-28 h-28 bg-yellow-300/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-24 left-1/3 w-44 h-44 bg-blue-300/20 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="max-w-xl mx-auto z-10 relative">
        <div className="text-center mb-10 pt-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-md shadow-md mb-5 relative">
            <Sparkles className="w-10 h-10 text-white" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Student Registration</h1>
          <p className="text-blue-100 text-lg">Join the university event platform today</p>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl px-8 py-10 border border-white/20">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                <span className="text-sm font-bold">1</span>
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                <Shield className="w-4 h-4" />
              </div>
            </div>
          </div>

          {currentStep === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 text-red-700 text-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{error}</span>
                </div>
              )}

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white" placeholder="John Doe" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white" placeholder="example@university.edu" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Student ID *</label>
                <input type="text" name="student_id_number" value={formData.student_id_number} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white" placeholder="SID2023" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Year *</label>
                <select name="year_of_study" value={formData.year_of_study} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white" required>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Major *</label>
              <input type="text" name="major" value={formData.major} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white" placeholder="Computer Science" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white" 
                    placeholder="••••••••" 
                    required 
                    minLength="8" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange} 
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white" 
                    placeholder="••••••••" 
                    required 
                    minLength="8" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>

              <button type="submit" disabled={loading} className="w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 bg-gradient-to-r from-indigo-900 to-blue-800 shadow-md">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending OTP...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" />
                    Send Verification Code
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </button>

              <div className="text-center">
                <button type="button" onClick={() => navigate('/login')} className="text-sm hover:underline font-medium text-indigo-900">
                  Already have an account? <span className="font-bold">Sign in here!</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                <p className="text-gray-600">
                  We've sent a 6-digit verification code to<br />
                  <span className="font-semibold text-indigo-600">{formData.email}</span>
                </p>
              </div>

              {error && (
                <div className={`border-l-4 rounded-lg p-4 text-sm flex items-center space-x-2 ${
                  error.includes('successfully') 
                    ? 'bg-green-50 border-green-400 text-green-700' 
                    : 'bg-red-50 border-red-400 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    error.includes('successfully') ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-800">Verification Code</label>
                  <input 
                    type="text" 
                    value={otpData.otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpData(prev => ({ ...prev, otp: value }));
                      if (error) setError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-800 bg-white text-center text-2xl font-bold tracking-widest" 
                    placeholder="000000"
                    maxLength="6"
                    required 
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                {otpTimer > 0 && (
                  <div className="text-center">
                    <div className="inline-flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      Code expires in {formatTime(otpTimer)}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={otpLoading || otpData.otp.length !== 6} 
                  className="w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 bg-gradient-to-r from-indigo-900 to-blue-800 shadow-md"
                >
                  {otpLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5" />
                      Verify & Complete Registration
                    </div>
                  )}
                </button>

                <div className="text-center space-y-2">
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={otpLoading || otpTimer > 0}
                    className="text-sm hover:underline font-medium text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpTimer > 0 ? `Resend code in ${formatTime(otpTimer)}` : 'Resend verification code'}
                  </button>
                  <br />
                  <button 
                    type="button" 
                    onClick={() => {
                      setCurrentStep(1);
                      setError('');
                      setOtpData({ otp: '', tempToken: '', expiresAt: null });
                    }} 
                    className="text-sm hover:underline font-medium text-gray-600"
                  >
                    Back to registration form
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* <div className="text-center mt-10 pb-6 text-blue-100 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create • Learn • Grow
            <Sparkles className="w-4 h-4" />
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default RegisterPage;
