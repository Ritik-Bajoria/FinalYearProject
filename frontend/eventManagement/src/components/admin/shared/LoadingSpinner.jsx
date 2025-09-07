// shared/LoadingSpinner.jsx
const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]} mb-2`}></div>
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
};

export default LoadingSpinner;