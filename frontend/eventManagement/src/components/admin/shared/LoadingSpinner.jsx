import { Loader } from 'lucide-react';

const LoadingSpinner = ({ size = 8 }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader className={`w-${size} h-${size} animate-spin text-indigo-600`} />
    </div>
  );
};

export default LoadingSpinner;