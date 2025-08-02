const GeneralSettings = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            System Name
          </label>
          <input
            type="text"
            defaultValue="University Event Management"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Default Event Capacity
          </label>
          <input
            type="number"
            defaultValue="100"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Auto-approve Events
          </label>
          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="false">Require Manual Approval</option>
            <option value="true">Auto-approve All Events</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;