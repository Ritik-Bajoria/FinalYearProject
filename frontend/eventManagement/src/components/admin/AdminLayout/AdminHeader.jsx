import { Bell } from 'lucide-react';

const AdminHeader = ({ alertCount }) => {
  return (
    <header className="bg-indigo-900 text-white shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">University Event Management</h1>
            <span className="bg-indigo-800 px-2 py-1 rounded text-sm">Admin Panel</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 hover:bg-indigo-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">AD</span>
              </div>
              <span className="text-sm">Admin User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;