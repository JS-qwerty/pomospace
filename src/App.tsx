import React, { useEffect, useState, useCallback } from 'react';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TaskList } from './components/TaskList';
import { Navigation } from './components/Navigation';
import { SettingsModal } from './components/SettingsModal';
import { ReportsPage } from './components/ReportsPage';
import { preloadSounds } from './utils/soundUtils';

interface Settings {
  timerDurations: {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
  };
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  darkMode: boolean;
  sound: {
    alarmSound: string;
    alarmVolume: number;
    alarmRepeat: number;
    tickingSound: string;
    tickingVolume: number;
  };
  lastUpdated?: number; // Timestamp to force timer resets when settings change
}

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  category?: string;
}

interface TaskHistoryItem {
  id: string;
  taskId: string;
  taskName: string;
  date: string;
  minutes: number;
  category?: string;
}

export function App() {
  // Initialize timer mode from localStorage or default to 'pomodoro'
  const [timerMode, setTimerMode] = useState<string>(() => {
    try {
      const savedState = localStorage.getItem('pomoSpaceTimerState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return parsed.timerMode || 'pomodoro';
      }
    } catch (e) {
      console.error('Error reading timer mode from localStorage:', e);
    }
    return 'pomodoro';
  });
  
  // Track if timer change is manual (user clicked) or automatic (timer completed)
  const [isManualTimerChange, setIsManualTimerChange] = useState(false);
  
  const [activeTab, setActiveTab] = useState('timer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Track the active task
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    try {
      const savedState = localStorage.getItem('pomoSpaceActiveTask');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (e) {
      console.error('Error reading active task from localStorage:', e);
    }
    return null;
  });

  // Settings state
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('pomoSpaceSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (e) {
      console.error('Error reading settings from localStorage:', e);
    }
    
    // Default settings if nothing in localStorage
    return {
      timerDurations: {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15
      },
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      darkMode: false,
      sound: {
        alarmSound: 'kitchen',
        alarmVolume: 50,
        alarmRepeat: 1,
        tickingSound: 'none',
        tickingVolume: 50
      }
    };
  });

  // Save active task to localStorage
  useEffect(() => {
    localStorage.setItem('pomoSpaceActiveTask', JSON.stringify(activeTaskId));
  }, [activeTaskId]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomoSpaceSettings', JSON.stringify(settings));
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Add task history entry when a pomodoro is completed
  const addTaskToHistory = useCallback((taskId: string, taskName: string, minutes: number, category?: string) => {
    const newHistoryItem: TaskHistoryItem = {
      id: Date.now().toString(),
      taskId,
      taskName,
      date: new Date().toISOString().split('T')[0],
      minutes,
      category
    };
    
    try {
      // Read existing history
      const savedHistory = localStorage.getItem('pomoSpaceTaskHistory') || '[]';
      const taskHistory = JSON.parse(savedHistory);
      
      // Add new entry
      taskHistory.push(newHistoryItem);
      
      // Save back to localStorage
      localStorage.setItem('pomoSpaceTaskHistory', JSON.stringify(taskHistory));
      
      console.log('Added task history entry:', newHistoryItem);
    } catch (e) {
      console.error('Error adding task history:', e);
    }
  }, []);
  
  // Handler for when a pomodoro is completed
  const handlePomodoroComplete = useCallback(() => {
    if (activeTaskId) {
      // Get the task details
      try {
        const savedTasks = localStorage.getItem('pomoSpaceTasks') || '[]';
        const tasks: TaskItem[] = JSON.parse(savedTasks);
        
        const activeTask = tasks.find(task => task.id === activeTaskId);
        
        if (activeTask) {
          // Add to task history
          addTaskToHistory(
            activeTask.id,
            activeTask.text,
            settings.timerDurations.pomodoro,
            activeTask.category
          );
          
          // Update the task's completed pomodoros count
          const updatedTasks = tasks.map(task => 
            task.id === activeTaskId 
              ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
              : task
          );
          
          // Save updated tasks
          localStorage.setItem('pomoSpaceTasks', JSON.stringify(updatedTasks));
        }
      } catch (e) {
        console.error('Error updating task after pomodoro completion:', e);
      }
    }
  }, [activeTaskId, settings.timerDurations.pomodoro, addTaskToHistory]);
  
  // Preload sounds
  useEffect(() => {
    preloadSounds();
  }, []);
  
  // Synchronize with timer state in localStorage when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const savedState = localStorage.getItem('pomoSpaceTimerState');
          if (savedState) {
            const parsed = JSON.parse(savedState);
            if (parsed.timerMode && parsed.timerMode !== timerMode) {
              setTimerMode(parsed.timerMode);
            }
          }
        } catch (e) {
          console.error('Error synchronizing with timer state:', e);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timerMode]);

  // Handle timer mode change
  const handleTimerModeChange = useCallback((mode: string, isManual: boolean = false) => {
    console.log(`Timer mode changed to: ${mode} (Manual: ${isManual})`);
    setIsManualTimerChange(isManual);
    setTimerMode(mode);
  }, []);

  // Get background color based on timer mode
  const getBgColor = () => {
    const mode = settings.darkMode ? 'dark' : 'light';
    switch (timerMode) {
      case 'pomodoro':
        return mode === 'dark' ? 'bg-indigo-900' : 'bg-indigo-600';
      case 'shortBreak':
        return mode === 'dark' ? 'bg-violet-900' : 'bg-violet-600';
      case 'longBreak':
        return mode === 'dark' ? 'bg-teal-900' : 'bg-teal-600';
      default:
        return mode === 'dark' ? 'bg-indigo-900' : 'bg-indigo-600';
    }
  };

  // Handle tab changes, preventing navigation to the login page for now
  const handleTabChange = (tab: string) => {
    // Prevent navigation to 'login' tab since it's not fully implemented yet
    if (tab === 'login') {
      console.log('Login functionality is not implemented yet');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className={`flex flex-col min-h-screen w-full transition-colors duration-300 ${getBgColor()} ${settings.darkMode ? 'dark' : ''}`}>
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        darkMode={settings.darkMode} 
      />
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <main className="flex flex-col items-center w-full">
          {activeTab === 'timer' && (
            <>
              <PomodoroTimer 
                timerMode={timerMode} 
                setTimerMode={handleTimerModeChange} 
                settings={settings}
                onPomodoroComplete={handlePomodoroComplete}
              />
              <TaskList 
                timerMode={timerMode}
                darkMode={settings.darkMode}
                activeTaskId={activeTaskId}
                setActiveTaskId={setActiveTaskId}
              />
            </>
          )}
          
          {activeTab === 'reports' && <ReportsPage darkMode={settings.darkMode} />}
          
          {/* Login page hidden for future implementation */}
          {/* 
          {activeTab === 'login' && (
            <div className={`w-full ${settings.darkMode ? 'bg-gray-800' : 'bg-white/10 backdrop-blur-sm'} rounded-lg p-6 shadow-lg`}>
              <h2 className={`text-2xl font-bold text-center mb-6 ${settings.darkMode ? 'text-white' : 'text-white'}`}>
                Login
              </h2>
              <button className="w-full bg-white/90 backdrop-blur-sm border border-white/20 rounded-md py-2 px-4 flex items-center justify-center space-x-2 mb-4 hover:bg-white/100 transition-colors">
                <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
                <span className="text-gray-700">Sign in with Google</span>
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-2 ${settings.darkMode ? 'bg-gray-800 text-gray-400' : 'bg-indigo-600 text-white/80'}`}>
                    or
                  </span>
                </div>
              </div>
              <input type="email" placeholder="Email" className="w-full bg-white/90 backdrop-blur-sm border border-white/20 rounded-md p-2 mb-4 placeholder-gray-500" />
              <button className="w-full bg-white/20 hover:bg-white/30 text-white rounded-md py-2 transition-colors backdrop-blur-sm">
                Sign up with Email
              </button>
            </div>
          )}
          */}
        </main>
        
        {/* Footer with credits */}
        <footer className="text-center text-white/70 py-4 mt-8">
          <p className="text-sm">
            Made with ❤️ by <a href="https://www.linkedin.com/in/jonah-serna/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Jonah Serna</a>
          </p>
        </footer>
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onSettingsChange={setSettings} 
      />
    </div>
  );
}