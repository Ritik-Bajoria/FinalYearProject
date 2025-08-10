import PropTypes from 'prop-types';

const NavButton = ({ 
  icon: Icon, 
  label, 
  tabKey, 
  activeTab, 
  setActiveTab, 
  count = null 
}) => {
  const isActive = activeTab === tabKey;

  return (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-indigo-800 text-white' 
          : 'text-slate-300 hover:bg-indigo-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {count !== null && (
        <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold ${
          isActive 
            ? 'bg-amber-400 text-indigo-900' 
            : 'bg-slate-700 text-slate-200'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

NavButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  tabKey: PropTypes.string.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  count: PropTypes.number,
};

export default NavButton;