import { 
  BarChart3, 
  Users, 
  Calendar, 
  Activity,
  LogOut,
  // Settings 
} from 'lucide-react';
import { useState } from 'react';
import NavButton from '../../NavButton';

const AdminSidebar = ({ activeTab, setActiveTab, isMobileMenuOpen, onBackdropClick }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const sidebarClasses = `
    fixed lg:relative top-0 left-0 h-screen w-64
    transform transition-transform duration-300 ease-in-out
    z-30 lg:z-auto overflow-hidden
    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Overview & Analytics'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage Users'
    },
    {
      id: 'events',
      label: 'Event Moderation',
      icon: Calendar,
      description: 'Review Events'
    },
    {
      id: 'logs',
      label: 'System Logs',
      icon: Activity,
      description: 'System Activity'
    }
  ];

  return (
    <aside 
      className={sidebarClasses}
      style={{
        height:'100%',
        background: 'linear-gradient(180deg, #1A237E 0%, #283593 50%, #3F51B5 100%)',
        boxShadow: '4px 0 20px rgba(26, 35, 126, 0.3)'
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 animate-pulse"
           style={{
             background: 'radial-gradient(circle, rgba(255, 193, 7, 0.1) 0%, transparent 70%)'
           }} />
      <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full opacity-8"
           style={{
             background: 'radial-gradient(circle, rgba(255, 152, 0, 0.08) 0%, transparent 70%)',
             animation: 'float 6s ease-in-out infinite reverse'
           }} />

      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          {/* Admin Profile Section */}
          <div className="p-4 bg-opacity-20 backdrop-blur border-b border-yellow-400 border-opacity-20">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-12 h-12 mr-3 bg-yellow-400 text-indigo-900 rounded-full flex items-center justify-center font-bold text-lg border-2 border-yellow-400 border-opacity-30 shadow-lg">
                  AD
                </div>
                {/* Online status indicator */}
                <div className="absolute bottom-0.5 right-2.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold mb-1 text-white">Admin User</div>
                <div className="text-xs opacity-80 text-gray-200">Administrator</div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center px-4 py-3 rounded-lg text-left
                      transition-all duration-300 ease-in-out relative overflow-hidden
                      hover:bg-opacity-10 hover:transform hover:translate-x-1 hover:shadow-md`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-r" />
                    )}
                    
                    <IconComponent 
                      className={`w-5 h-5 mr-3 transition-all duration-300 ${
                        isActive ? 'text-yellow-400 scale-105' : 'text-white text-opacity-80'
                      }`} 
                    />
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-white font-semibold' : 'text-white text-opacity-90'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
              
              {/* Logout Button - placed right after System Logs */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-300 ease-in-out bg-gradient-to-r from-red-500 from-opacity-10 to-red-600 to-opacity-5 border border-red-500 border-opacity-20 hover:bg-gradient-to-r hover:from-red-500 hover:from-opacity-20 hover:to-red-600 hover:to-opacity-10 hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <LogOut className="w-5 h-5 mr-3 text-white" />
                <span className="text-sm font-semibold text-white">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            </div>
          </nav>
        </div>

        {/* Footer Section */}
        <div className="p-4">
          <div className="border-t border-yellow-400 border-opacity-20 mb-4" />
          
          {/* System Status */}
          {/* <div className="bg-white bg-opacity-5 rounded-lg p-3 border border-white border-opacity-10 mb-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white opacity-90 font-medium">System Status: Online</span>
            </div>
          </div> */}

          {/* Version Info */}
          {/* <div className="bg-white bg-opacity-5 rounded-lg p-3 text-center border border-white border-opacity-10">
            <div className="text-xs opacity-70 font-medium text-gray-200">
              Admin Panel v2.1.0
            </div>
          </div> */}
        </div>
      </div>

      {/* Mobile close area */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden absolute inset-0 -z-10"
          onClick={onBackdropClick}
        />
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </aside>
  );
};

export default AdminSidebar;