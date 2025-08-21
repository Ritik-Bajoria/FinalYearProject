import { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children, activeTab, setActiveTab, alertCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mobile menu toggle
  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  const handleBackdropClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Close mobile menu when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header always on top */}
      <AdminHeader 
        alertCount={alertCount}
        onMenuToggle={handleMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Sidebar + Content below header */}
      <div className="flex flex-1 relative">
        {/* Sidebar (sticks below header) */}
        <div className="hidden lg:block lg:w-64 flex-shrink-0 border-r border-gray-200">
          <AdminSidebar 
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            isMobileMenuOpen={isMobileMenuOpen}
            onBackdropClick={handleBackdropClick}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            <div className="mx-auto">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 flex lg:hidden"
          onClick={handleBackdropClick}
        >
          <div className="w-64 bg-white shadow-xl h-full" onClick={(e) => e.stopPropagation()}>
            <AdminSidebar 
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              isMobileMenuOpen={isMobileMenuOpen}
              onBackdropClick={handleBackdropClick}
            />
          </div>
          <div className="flex-1k bg-opacity-50" />
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
