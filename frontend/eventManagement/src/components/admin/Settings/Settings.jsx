import GeneralSettings from './GeneralSettings';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import MaintenanceSettings from './MaintenanceSettings';

const Settings = () => {
  const handleSave = () => {
    // Save settings logic
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GeneralSettings />
        <NotificationSettings />
        <SecuritySettings />
        <MaintenanceSettings />
      </div>

      <div className="flex justify-end space-x-4">
        <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;