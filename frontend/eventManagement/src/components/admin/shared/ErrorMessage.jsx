const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-red-800">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;