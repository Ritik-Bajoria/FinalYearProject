import { Loader } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend = null, isLoading = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          {isLoading ? (
            <div className="flex items-center mt-1">
              <Loader className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
              {trend && (
                <p className="text-green-600 text-sm font-medium mt-1">
                  +{trend}% from last month
                </p>
              )}
            </>
          )}
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;