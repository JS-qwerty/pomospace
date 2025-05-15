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
  // Add a loading state to prevent premature rendering
  const [isLoading, setIsLoading] = useState(true);
  
  // CRITICAL FIX: Check for the hardcoded 15-minute value in localStorage on startup
  useEffect(() => {
    console.log('🔍 App initialization - checking for hardcoded timer value');
    
    try {
      const timerState = localStorage.getItem('pomoSpaceTimerState');
      if (timerState) {
        const parsedState = JSON.parse(timerState);
        
        // Check if there's a hardcoded 15-minute (900 seconds) value
        let needsFixing = false;
        
        // Check pomodoro timer state
        if (parsedState.timerStates?.pomodoro?.timeRemaining === 900) {
          console.warn('⚠️ Found hardcoded 15-minute value in pomodoro timer! Fixing...');
          parsedState.timerStates.pomodoro.timeRemaining = 1500; // 25 minutes
          needsFixing = true;
        }
        
        // Check main timer if mode is pomodoro
        if (parsedState.timerMode === 'pomodoro' && parsedState.timeRemaining === 900) {
          console.warn('⚠️ Found hardcoded 15-minute value in main timer! Fixing...');
          parsedState.timeRemaining = 1500; // 25 minutes
          needsFixing = true;
        }
        
        // If we found and fixed issues, save the state and reload
        if (needsFixing) {
          localStorage.setItem('pomoSpaceTimerState', JSON.stringify(parsedState));
          console.log('✅ Fixed timer values, reloading page to apply changes');
          window.location.reload();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking timer state:', error);
      localStorage.removeItem('pomoSpaceTimerState');
    }
    
    // Continue with normal app initialization
    setIsLoading(false);
  }, []);
  
  // CRITICAL FIX: Reset localStorage on app initialization if timer values are wrong
  useEffect(() => {
    // Skip if we're still in the first loading check
    if (isLoading) return;
    
    console.log('🧹 App initialization - checking localStorage');
    
    // Check for timer issues and completely reset if needed
    const timerState = localStorage.getItem('pomoSpaceTimerState');
    const settingsStr = localStorage.getItem('pomoSpaceSettings');
    
    try {
      // If we have settings, validate them
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        console.log('Current settings:', settings);
        
        // Check if pomodoro duration in settings is valid
        if (!settings.timerDurations?.pomodoro || 
            settings.timerDurations.pomodoro < 1 ||
            settings.timerDurations.pomodoro > 60) {
          
          console.log('❌ Invalid pomodoro duration in settings, resetting');
          localStorage.removeItem('pomoSpaceSettings');
          localStorage.removeItem('pomoSpaceTimerState');
          window.location.reload();
          return;
        }
      }
      
      // If we have timer state, check it against settings
      if (timerState && settingsStr) {
        const state = JSON.parse(timerState);
        const settings = JSON.parse(settingsStr);
        
        // Check if values in timer state match settings
        if (state.timerMode === 'pomodoro' && !state.isActive) {
          const expectedPomodoroTime = settings.timerDurations.pomodoro * 60;
          const actualPomodoroTime = state.timerStates?.pomodoro?.timeRemaining;
          
          console.log('Expected pomodoro time:', expectedPomodoroTime);
          console.log('Actual pomodoro time:', actualPomodoroTime);
          
          // If there's a mismatch, reset everything
          if (actualPomodoroTime !== expectedPomodoroTime) {
            console.log('🚨 Timer value mismatch detected! Resetting localStorage');
            localStorage.removeItem('pomoSpaceTimerState');
            
            // Force reset of settings to ensure consistency
            const newSettings = {
              ...settings,
              lastUpdated: Date.now()
            };
            localStorage.setItem('pomoSpaceSettings', JSON.stringify(newSettings));
            
            // Reload to apply changes
            window.location.reload();
            return;
          }
        }
      }
      
      // All checks passed, we can finish loading
      setIsLoading(false);
    } catch (error) {
      console.error('Error validating localStorage data:', error);
      // If there's an error, perform a complete reset
      localStorage.removeItem('pomoSpaceSettings');
      localStorage.removeItem('pomoSpaceTimerState');
      window.location.reload();
      return;
    }
  }, [isLoading]);
  
  // Get the current theme from localStorage or default to 'dark'
  const [timerMode, setTimerMode] = useState<string>(localStorage.getItem('pomoSpaceTimerMode') || 'pomodoro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('timer');
  
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

  // Force correct Pomodoro settings to prevent any display issues
  useEffect(() => {
    // Skip if we're still in the first loading checks
    if (isLoading) return;
    
    // Check if we have timer settings in localStorage
    const savedSettingsStr = localStorage.getItem('pomoSpaceSettings');
    if (savedSettingsStr) {
      try {
        const savedSettings = JSON.parse(savedSettingsStr);
        
        // Ensure the pomodoro duration is valid (between 1 and 60 minutes)
        if (!savedSettings.timerDurations || 
            !savedSettings.timerDurations.pomodoro || 
            savedSettings.timerDurations.pomodoro < 1 || 
            savedSettings.timerDurations.pomodoro > 60) {
          
          console.log('Invalid pomodoro duration detected in settings. Resetting to 25 minutes.');
          
          // Fix the settings with correct pomodoro duration (25 min)
          const correctedSettings = {
            ...savedSettings,
            timerDurations: {
              ...(savedSettings.timerDurations || {}),
              pomodoro: 25,  // Force pomodoro to be 25 minutes
              shortBreak: savedSettings.timerDurations?.shortBreak || 5,
              longBreak: savedSettings.timerDurations?.longBreak || 15
            },
            lastUpdated: Date.now()  // Add timestamp to force update
          };
          
          // Save corrected settings
          localStorage.setItem('pomoSpaceSettings', JSON.stringify(correctedSettings));
          
          // Also clear the timer state to force a fresh start
          localStorage.removeItem('pomoSpaceTimerState');
          
          // Reload to apply changes
          window.location.reload();
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
        // Settings are corrupted, reset them
        localStorage.removeItem('pomoSpaceSettings');
      }
    }
    // Set loading to false in case it hasn't been set yet
    setIsLoading(false);
  }, [isLoading]);

  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettingsStr = localStorage.getItem('pomoSpaceSettings');
    
    if (savedSettingsStr) {
      try {
        const savedSettings = JSON.parse(savedSettingsStr);
        // Ensure default values for any missing properties
        return {
          timerDurations: {
            pomodoro: savedSettings.timerDurations?.pomodoro || 25,
            shortBreak: savedSettings.timerDurations?.shortBreak || 5,
            longBreak: savedSettings.timerDurations?.longBreak || 15,
          },
          longBreakInterval: savedSettings.longBreakInterval || 4,
          autoStartBreaks: savedSettings.autoStartBreaks || false,
          autoStartPomodoros: savedSettings.autoStartPomodoros || false,
          darkMode: savedSettings.darkMode !== undefined ? savedSettings.darkMode : true,
          sound: {
            alarmSound: savedSettings.sound?.alarmSound || 'kitty',
            alarmVolume: savedSettings.sound?.alarmVolume || 80,
            alarmRepeat: savedSettings.sound?.alarmRepeat || 1,
            tickingSound: savedSettings.sound?.tickingSound || 'none',
            tickingVolume: savedSettings.sound?.tickingVolume || 50
          },
          lastUpdated: savedSettings.lastUpdated || Date.now()
        };
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
    
    // Default settings if nothing in localStorage or parse error
    return {
      timerDurations: {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
      },
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      darkMode: true,
      sound: {
        alarmSound: 'kitty',
        alarmVolume: 80,
        alarmRepeat: 1,
        tickingSound: 'none',
        tickingVolume: 50
      },
      lastUpdated: Date.now()
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
    setTimerMode(mode);
    
    // Store in localStorage for cross-tab synchronization
    localStorage.setItem('pomoSpaceTimerMode', mode);
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
        onSettingsClick={() => setSettingsOpen(true)} 
        darkMode={settings.darkMode} 
      />
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <main className="flex flex-col items-center w-full">
          {/* Show loading indicator when settings are being loaded */}
          {isLoading ? (
            <div className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-lg flex justify-center items-center h-[300px]">
              <div className="text-white text-xl">Loading timer...</div>
            </div>
          ) : (
            <>
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
            </>
          )}
          
          {/* Footer with credits */}
          <footer className="text-center text-white/70 py-4 mt-8">
            <p className="text-sm">
              Made with ❤️ by <a href="https://www.linkedin.com/in/jonah-serna/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Jonah Serna</a>
            </p>
          </footer>
        </main>
      </div>
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        settings={settings} 
        onSettingsChange={setSettings} 
      />
    </div>
  );
}