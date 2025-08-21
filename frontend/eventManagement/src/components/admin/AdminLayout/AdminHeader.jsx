import { Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';

const AdminHeader = ({ alertCount, onMenuToggle, isMobileMenuOpen }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 hover:bg-indigo-800 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              
              {/* Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                <h1 className="text-lg sm:text-xl font-bold leading-tight">
                  University Event Management
                </h1>
                <span className="bg-indigo-800 px-2 py-1 rounded text-xs sm:text-sm font-medium mt-1 sm:mt-0 w-fit">
                  Admin Panel
                </span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-indigo-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                      {alertCount > 99 ? '99+' : alertCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    {alertCount > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                          <p className="text-sm text-gray-800 font-medium">System Alerts</p>
                          <p className="text-xs text-gray-600 mt-1">{alertCount} active alerts requiring attention</p>
                          <span className="text-xs text-gray-500">Just now</span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center ring-2 ring-indigo-300">
                  <span className="text-sm font-bold">AD</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-medium">Admin User</span>
                  <div className="text-xs text-indigo-200">Administrator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
};

export default AdminHeader;