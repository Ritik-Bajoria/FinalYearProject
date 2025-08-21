import { Loader, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend = null, isLoading = false }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">{title}</p>
          {isLoading ? (
            <div className="flex items-center mt-2">
              <Loader className="w-4 h-4 animate-spin text-slate-400" />
              <span className="text-slate-400 text-sm ml-2">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-slate-900 mt-1">{value || 0}</p>
              {trend && (
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                  <p className="text-emerald-600 text-xs font-medium">
                    +{trend}% from last month
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-2.5 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;