import React from 'react';
import { BarChartIcon, Settings2Icon } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsClick: () => void;
  darkMode: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onSettingsClick,
  darkMode
}) => {
  const getTabStyle = (tab: string) => {
    const baseStyle = darkMode
      ? 'px-4 py-2 text-white/90 hover:text-white transition-colors'
      : 'px-4 py-2 text-white/90 hover:text-white transition-colors';
    
    const activeStyle = darkMode
      ? 'border-b-2 border-white/80 text-white font-medium'
      : 'border-b-2 border-white/80 text-white font-medium';
    
    return `${baseStyle} ${activeTab === tab ? activeStyle : ''}`;
  };
  
  return (
    <div className="flex justify-center w-full bg-white/5 backdrop-blur-sm py-4">
      <nav className="flex items-center justify-between w-full max-w-2xl px-6">
        {/* App Logo */}
        <div className="flex-none">
          <h1 className="text-white font-semibold text-xl">PomoSpace</h1>
        </div>
        
        {/* Navigation Items */}
        <div className="flex items-center space-x-1">
          <button 
            className={`${getTabStyle('timer')} flex items-center justify-center`} 
            onClick={() => onTabChange('timer')}
          >
            <span>Timer</span>
          </button>
          
          <button 
            className={`${getTabStyle('reports')} flex items-center justify-center`} 
            onClick={() => onTabChange('reports')}
          >
            <BarChartIcon className="mr-1 hidden sm:inline-block" size={18} />
            <span>Reports</span>
          </button>
          
          <button 
            className="px-4 py-2 text-white/80 hover:text-white transition-colors flex items-center justify-center" 
            onClick={onSettingsClick}
          >
            <Settings2Icon size={18} />
          </button>
        </div>
        
        {/* Login button hidden for future implementation */}
        {/* 
        <button className={getTabStyle('login')} onClick={() => onTabChange('login')}>
          <UserIcon className="inline-block mr-1" size={18} />
          Login
        </button>
        */}
      </nav>
    </div>
  );
};