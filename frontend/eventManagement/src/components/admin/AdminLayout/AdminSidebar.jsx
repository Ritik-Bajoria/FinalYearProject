import { 
  BarChart3, 
  Users, 
  Calendar, 
  Activity, 
  Settings 
} from 'lucide-react';
import NavButton from './NavButton';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-indigo-900 text-white h-screen sticky top-0">
      <nav className="p-4 space-y-2">
        <NavButton 
          icon={BarChart3} 
          label="Dashboard" 
          tabKey="dashboard" 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <NavButton 
          icon={Users} 
          label="User Management" 
          tabKey="users" 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <NavButton 
          icon={Calendar} 
          label="Event Moderation" 
          tabKey="events" 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <NavButton 
          icon={Activity} 
          label="System Logs" 
          tabKey="logs" 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <NavButton 
          icon={Settings} 
          label="Settings" 
          tabKey="settings" 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-indigo-800 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm">
            <span>System Status: Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;