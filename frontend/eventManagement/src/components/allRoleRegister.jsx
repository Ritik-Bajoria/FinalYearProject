import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ChevronRight, Sparkles, Star, Trophy, Shield } from 'lucide-react';

const allRegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    full_name: '',
    student_id_number: '',
    faculty_id_number: '',
    year_of_study: '1',
    major: '',
    department: '',
    position: '',
    admin_role: 'system_admin',
    permissions_level: '1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const getRoleData = () => {
    return {
      student: {
        icon: Star,
        title: 'Event Attendee',
        description: 'Join exciting events and activities',
        color: '#FFC107'
      },
      faculty: {
        icon: Trophy,
        title: 'Event Organizer',
        description: 'Create and manage amazing events',
        color: '#0D47A1'
      },
      admin: {
        icon: Shield,
        title: 'System Admin',
        description: 'Oversee platform operations',
        color: '#1A237E'
      }
    };
  };

  const preparePayload = () => {
    const baseData = {
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    if (formData.role === 'student') {
      baseData.student = {
        full_name: formData.full_name,
        student_id_number: formData.student_id_number,
        year_of_study: formData.year_of_study,
        major: formData.major
      };
    } else if (formData.role === 'faculty') {
      baseData.faculty = {
        full_name: formData.full_name,
        faculty_id_number: formData.faculty_id_number,
        department: formData.department,
        position: formData.position
      };
    } else if (formData.role === 'admin') {
      baseData.admin = {
        full_name: formData.full_name,
        admin_role: formData.admin_role,
        permissions_level: parseInt(formData.permissions_level)
      };
    }

    return baseData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (formData.role === 'student' && !formData.student_id_number) {
      setError('Student ID number is required');
      setLoading(false);
      return;
    }

    if (formData.role === 'faculty' && !formData.faculty_id_number) {
      setError('Faculty ID number is required');
      setLoading(false);
      return;
    }

    if (formData.role === 'admin' && !formData.admin_role) {
      setError('Admin role is required');
      setLoading(false);
      return;
    }

    try {
      const payload = preparePayload();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login', { state: { registrationSuccess: true } });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleData = getRoleData();

  return (
    <div className="min-h-screen p-4" style={{ 
      background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 50%, #FFC107 100%)',
      position: 'relative'
    }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/4 right-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm mb-4 relative">
            <UserPlus className="w-12 h-12 text-white" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Join the Event Revolution</h1>
          <p className="text-blue-100 text-lg">Create your account and start building extraordinary experiences</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 text-red-700 text-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>{error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-lg font-bold mb-4" style={{ color: '#212121' }}>
                Choose Your Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(roleData).map(([value, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: value }))}
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        formData.role === value 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 bg-white/80'
                      }`}
                      style={{
                        boxShadow: formData.role === value ? `0 8px 32px ${config.color}40` : 'none'
                      }}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          formData.role === value ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            formData.role === value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="text-center">
                          <h3 className={`font-bold ${
                            formData.role === value ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {config.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            formData.role === value ? 'text-blue-500' : 'text-gray-500'
                          }`}>
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#212121' }}>
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#607D8B' }} />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    style={{ 
                      '--tw-ring-color': '#1A237E'
                    }}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#212121' }}>
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#607D8B' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    style={{ 
                      '--tw-ring-color': '#1A237E'
                    }}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Role-specific fields */}
            {formData.role === 'student' && (
              <div className="bg-gradient-to-r from-yellow-50 to-blue-50 p-6 rounded-2xl border border-yellow-200">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span>Event Attendee Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Student ID Number *
                    </label>
                    <input
                      type="text"
                      name="student_id_number"
                      value={formData.student_id_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      placeholder="Enter your student ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Year of Study *
                    </label>
                    <select
                      name="year_of_study"
                      value={formData.year_of_study}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      required
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Major/Field of Study *
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      placeholder="Enter your major or field of study"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'faculty' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <span>Event Organizer Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Faculty ID Number *
                    </label>
                    <input
                      type="text"
                      name="faculty_id_number"
                      value={formData.faculty_id_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      placeholder="Enter your faculty ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Department *
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      placeholder="Enter your department"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Position/Title *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      placeholder="Enter your position or title"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'admin' && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>System Administrator Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Admin Role *
                    </label>
                    <select
                      name="admin_role"
                      value={formData.admin_role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      required
                    >
                      <option value="system_admin">System Administrator</option>
                      <option value="academic_admin">Event Coordinator</option>
                      <option value="student_affairs">Community Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#212121' }}>
                      Permission Level *
                    </label>
                    <select
                      name="permissions_level"
                      value={formData.permissions_level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ 
                        '--tw-ring-color': '#1A237E'
                      }}
                      required
                    >
                      <option value="1">Level 1 (Basic)</option>
                      <option value="2">Level 2 (Moderate)</option>
                      <option value="3">Level 3 (Full)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#212121' }}>
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#607D8B' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  style={{ 
                    '--tw-ring-color': '#1A237E'
                  }}
                  placeholder="Create a strong password"
                  required
                  minLength="8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              style={{ 
                background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
                boxShadow: '0 8px 32px rgba(26, 35, 126, 0.3)'
              }}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Create Account & Start Building</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm hover:underline font-medium transition-colors"
                style={{ color: '#1A237E' }}
              >
                Already part of our community? <span className="font-bold">Sign in here!</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-8 text-blue-100 text-sm">
          <p className="flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Create • Manage • Celebrate</span>
            <Sparkles className="w-4 h-4" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default allRegisterPage;