import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, FlameIcon, ChevronRightIcon, BarChart4Icon, LineChartIcon, PieChartIcon, ListIcon } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportsPageProps {
  darkMode: boolean;
}

type TaskHistoryItem = {
  id?: string;
  date: string;
  taskName: string;
  minutes: number;
  category?: string;
};

interface DailyStats {
  date: string;
  totalMinutes: number;
  tasks: TaskHistoryItem[];
}

interface CategoryStats {
  category: string;
  totalMinutes: number;
  percentage: number;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  darkMode
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real app, this would load from API or localStorage
  const loadTaskHistory = (): TaskHistoryItem[] => {
    const savedHistory = localStorage.getItem('pomoSpaceTaskHistory');
    if (savedHistory) {
      try {
        return JSON.parse(savedHistory);
      } catch (e) {
        console.error('Error parsing task history:', e);
      }
    }
    
    // Mock data if no history exists
    return [
      { id: '1', date: '2024-05-15', taskName: 'Project Planning', minutes: 75, category: 'Work' },
      { id: '2', date: '2024-05-15', taskName: 'Documentation', minutes: 50, category: 'Work' },
      { id: '3', date: '2024-05-14', taskName: 'Email Management', minutes: 25, category: 'Personal' },
      { id: '4', date: '2024-05-14', taskName: 'Coding', minutes: 100, category: 'Work' },
      { id: '5', date: '2024-05-13', taskName: 'Team Meeting', minutes: 50, category: 'Work' },
      { id: '6', date: '2024-05-13', taskName: 'Research', minutes: 75, category: 'Learning' },
      { id: '7', date: '2024-05-12', taskName: 'Reading', minutes: 50, category: 'Learning' },
      { id: '8', date: '2024-05-11', taskName: 'Exercise', minutes: 25, category: 'Health' },
      { id: '9', date: '2024-05-10', taskName: 'Bug Fixing', minutes: 125, category: 'Work' },
      { id: '10', date: '2024-05-09', taskName: 'Learning', minutes: 75, category: 'Learning' }
    ];
  };
  
  const taskHistory = loadTaskHistory();
  
  // Compute daily statistics
  const getDailyStats = (): DailyStats[] => {
    const stats: Record<string, DailyStats> = {};
    
    taskHistory.forEach(task => {
      if (!stats[task.date]) {
        stats[task.date] = {
          date: task.date,
          totalMinutes: 0,
          tasks: []
        };
      }
      
      stats[task.date].totalMinutes += task.minutes;
      stats[task.date].tasks.push(task);
    });
    
    return Object.values(stats).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };
  
  // Compute category statistics
  const getCategoryStats = (): CategoryStats[] => {
    const stats: Record<string, number> = {};
    let totalMinutes = 0;
    
    taskHistory.forEach(task => {
      const category = task.category || 'Other';
      stats[category] = (stats[category] || 0) + task.minutes;
      totalMinutes += task.minutes;
    });
    
    return Object.entries(stats).map(([category, minutes]) => ({
      category,
      totalMinutes: minutes,
      percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
    })).sort((a, b) => b.totalMinutes - a.totalMinutes);
  };
  
  // Compute focus streak (consecutive days with activity)
  const calculateFocusStreak = (): number => {
    const dailyStats = getDailyStats();
    if (dailyStats.length === 0) return 0;
    
    // Get unique dates
    const dates = [...new Set(dailyStats.map(stat => stat.date))].sort().reverse();
    
    // Check how many consecutive days from today
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    
    for (let i = 0; i < dates.length; i++) {
      const dateToCheck = currentDate.toISOString().split('T')[0];
      const found = dates.includes(dateToCheck);
      
      if (found) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  // Calculate total focused hours
  const getTotalFocusHours = (): number => {
    return taskHistory.reduce((total, task) => total + task.minutes, 0) / 60;
  };
  
  // Get unique active days
  const getActiveDays = (): number => {
    return new Set(taskHistory.map(task => task.date)).size;
  };
  
  // Prepare data for daily chart
  const getDailyChartData = () => {
    const dailyStats = getDailyStats();
    const dates = dailyStats.map(stat => new Date(stat.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
    const minutes = dailyStats.map(stat => stat.totalMinutes);
    
    return {
      labels: dates.reverse(),
      datasets: [
        {
          label: 'Focus Minutes',
          data: minutes.reverse(),
          backgroundColor: darkMode ? 'rgba(124, 58, 237, 0.7)' : 'rgba(99, 102, 241, 0.7)',
          borderColor: darkMode ? 'rgba(124, 58, 237, 1)' : 'rgba(99, 102, 241, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Prepare data for category pie chart
  const getCategoryChartData = () => {
    const categoryStats = getCategoryStats();
    
    return {
      labels: categoryStats.map(stat => stat.category),
      datasets: [
        {
          label: 'Minutes per Category',
          data: categoryStats.map(stat => stat.totalMinutes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: darkMode ? 'rgba(30, 41, 59, 1)' : 'rgba(255, 255, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Style variables
  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white/95';
  const cardBgColor = darkMode ? 'bg-gray-700' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const subTextColor = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const highlightColor = darkMode ? 'text-indigo-400 border-indigo-500' : 'text-indigo-600 border-indigo-600';
  
  const getTabStyle = (tab: string) => {
    return `px-3 sm:px-6 py-3 text-left sm:text-center transition-colors ${
      activeTab === tab 
      ? `border-b-2 ${highlightColor} font-medium` 
      : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
    }`;
  };
  
  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
        }
      },
      x: {
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
        }
      }
    }
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
        }
      }
    }
  };
  
  return (
    <div className={`w-full ${bgColor} backdrop-blur-sm rounded-lg shadow-lg overflow-hidden`}>
      {/* Tab Navigation */}
      <div className={`flex flex-wrap sm:flex-nowrap border-b ${borderColor}`}>
        <button 
          className={`${getTabStyle('overview')} min-w-[50%] sm:min-w-0 sm:flex-1 flex items-center justify-start sm:justify-center`} 
          onClick={() => setActiveTab('overview')}
        >
          <BarChart4Icon className="w-4 h-4 mr-2" />
          <span>Overview</span>
        </button>
        <button 
          className={`${getTabStyle('daily')} min-w-[50%] sm:min-w-0 sm:flex-1 flex items-center justify-start sm:justify-center`} 
          onClick={() => setActiveTab('daily')}
        >
          <LineChartIcon className="w-4 h-4 mr-2" />
          <span>Daily</span>
        </button>
        <button 
          className={`${getTabStyle('categories')} min-w-[50%] sm:min-w-0 sm:flex-1 flex items-center justify-start sm:justify-center`} 
          onClick={() => setActiveTab('categories')}
        >
          <PieChartIcon className="w-4 h-4 mr-2" />
          <span>Categories</span>
        </button>
        <button 
          className={`${getTabStyle('history')} min-w-[50%] sm:min-w-0 sm:flex-1 flex items-center justify-start sm:justify-center`} 
          onClick={() => setActiveTab('history')}
        >
          <ListIcon className="w-4 h-4 mr-2" />
          <span>History</span>
        </button>
      </div>
      
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Section */}
            <div className="mb-8">
              <h2 className={`text-xl font-bold ${textColor} mb-4 text-left`}>
                Your Productivity Overview
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${cardBgColor} p-4 rounded-lg shadow-sm`}>
                  <div className="flex items-center mb-2">
                    <ClockIcon className={`mr-2 ${subTextColor}`} size={20} />
                    <span className={`${subTextColor} text-left`}>Hours Focused</span>
                  </div>
                  <p className={`text-2xl font-bold ${textColor} text-left`}>{getTotalFocusHours().toFixed(1)}</p>
                </div>
                
                <div className={`${cardBgColor} p-4 rounded-lg shadow-sm`}>
                  <div className="flex items-center mb-2">
                    <CalendarIcon className={`mr-2 ${subTextColor}`} size={20} />
                    <span className={`${subTextColor} text-left`}>Days Active</span>
                  </div>
                  <p className={`text-2xl font-bold ${textColor} text-left`}>{getActiveDays()}</p>
                </div>
                
                <div className={`${cardBgColor} p-4 rounded-lg shadow-sm`}>
                  <div className="flex items-center mb-2">
                    <FlameIcon className={`mr-2 ${subTextColor}`} size={20} />
                    <span className={`${subTextColor} text-left`}>Focus Streak</span>
                  </div>
                  <p className={`text-2xl font-bold ${textColor} text-left`}>{calculateFocusStreak()}</p>
                </div>
              </div>
            </div>
            
            {/* Combined Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <div>
                <h3 className={`text-lg font-semibold ${textColor} mb-3 text-left`}>Recent Activity</h3>
                <div className={`${cardBgColor} p-4 rounded-lg shadow-sm h-64`}>
                  {taskHistory.length > 0 ? (
                    <Bar data={getDailyChartData()} options={barOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className={subTextColor}>No recent activity data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Category Distribution Chart */}
              <div>
                <h3 className={`text-lg font-semibold ${textColor} mb-3 text-left`}>Category Distribution</h3>
                <div className={`${cardBgColor} p-4 rounded-lg shadow-sm h-64`}>
                  {taskHistory.length > 0 ? (
                    <Pie data={getCategoryChartData()} options={pieOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className={subTextColor}>No category data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Daily Progress Tab */}
        {activeTab === 'daily' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
              <h2 className={`text-xl font-bold ${textColor} text-left`}>
                Daily Focus Time
              </h2>
              <div className="flex space-x-2 w-full sm:w-auto">
                {['week', 'month', 'year'].map(range => (
                  <button 
                    key={range} 
                    onClick={() => setTimeRange(range)} 
                    className={`flex-1 sm:flex-none text-center px-3 py-1 rounded-md ${
                      timeRange === range 
                      ? 'bg-indigo-600 text-white' 
                      : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={`${cardBgColor} rounded-lg p-4 shadow-sm`} style={{ height: '400px' }}>
              {taskHistory.length > 0 ? (
                <Bar data={getDailyChartData()} options={barOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={subTextColor}>Start tracking your focus time to see daily statistics!</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <h2 className={`text-xl font-bold ${textColor} mb-4 text-left`}>
              Time by Category
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className={`${cardBgColor} rounded-lg p-4 shadow-sm`} style={{ height: '300px' }}>
                {taskHistory.length > 0 ? (
                  <Pie data={getCategoryChartData()} options={pieOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className={subTextColor}>No category data available</p>
                  </div>
                )}
              </div>
              
              {/* Category List */}
              <div className="flex flex-col max-h-[400px] sm:max-h-[300px] overflow-y-auto">
                {getCategoryStats().map((stat, index) => (
                  <div key={index} className={`mb-3 p-3 rounded-lg ${cardBgColor}`}>
                    <div className="flex justify-between mb-1">
                      <span className={`font-medium ${textColor} text-left`}>{stat.category}</span>
                      <span className={`${textColor} text-right`}>{(stat.totalMinutes / 60).toFixed(1)} hours</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                    <div className={`text-xs mt-1 ${subTextColor} text-left`}>
                      {stat.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 className={`text-xl font-bold ${textColor} mb-4 text-left`}>
              Focus Time History
            </h2>
            
            {getDailyStats().length > 0 ? (
              <div className="space-y-4">
                {getDailyStats().map((dayStat, index) => (
                  <div key={index} className={`${cardBgColor} rounded-lg shadow-sm overflow-hidden`}>
                    <div className={`p-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border-b ${borderColor} flex flex-col sm:flex-row justify-between sm:items-center`}>
                      <div className="flex items-center text-left">
                        <CalendarIcon className={`mr-2 ${subTextColor} flex-shrink-0`} size={16} />
                        <span className={`font-medium ${textColor} truncate`}>
                          {new Date(dayStat.date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <span className={`${textColor} font-medium mt-1 sm:mt-0 text-left sm:text-right`}>
                        {(dayStat.totalMinutes / 60).toFixed(1)} hours
                      </span>
                    </div>
                    
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dayStat.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="p-3 flex flex-col sm:flex-row justify-between sm:items-center">
                          <div className={`${textColor} text-left`}>
                            <div className="font-medium">{task.taskName}</div>
                            <div className={`text-xs ${subTextColor}`}>{task.category || 'Uncategorized'}</div>
                          </div>
                          <div className={`${subTextColor} mt-1 sm:mt-0 text-left sm:text-right`}>
                            {task.minutes} minutes
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${cardBgColor} rounded-lg p-8 shadow-sm text-center`}>
                <p className={subTextColor}>
                  No focus history available yet. Start tracking your work sessions!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};