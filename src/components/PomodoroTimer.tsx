import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, RotateCcwIcon } from 'lucide-react';

// Declare the SoundPlayer type for TypeScript
declare global {
  interface Window {
    SoundPlayer: {
      playSound: (soundPath: string, volume?: number, loop?: boolean) => HTMLAudioElement;
      playAlarm: (soundPath: string, volume?: number, repeatCount?: number) => { stop: () => void };
    };
  }
}

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
  };
}

interface PomodoroTimerProps {
  timerMode: string;
  setTimerMode: (mode: string, isManual?: boolean) => void;
  settings: Settings;
  onPomodoroComplete?: () => void; // Optional callback for when a pomodoro completes
  isManualChange?: boolean; // Whether the timer mode change was manual (user clicked)
}

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  completedPomodoros: number;
  activeTimestamp?: number; // When the timer was last known to be active
  timerMode: string;
  originalDuration?: number;
  // Individual timer states
  timerStates: {
    pomodoro: { timeRemaining: number; isActive: boolean };
    shortBreak: { timeRemaining: number; isActive: boolean };
    longBreak: { timeRemaining: number; isActive: boolean };
  };
}

// Simple helper to get the duration in seconds
const getDuration = (mode: string, settings: Settings): number => {
  switch (mode) {
    case 'pomodoro': return settings.timerDurations.pomodoro * 60;
    case 'shortBreak': return settings.timerDurations.shortBreak * 60;
    case 'longBreak': return settings.timerDurations.longBreak * 60;
    default: return settings.timerDurations.pomodoro * 60;
  }
};

// Format time as MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  timerMode,
  setTimerMode,
  settings,
  onPomodoroComplete,
  isManualChange = false
}) => {
  // Use ref for interval to persist between renders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the saved timer state from localStorage with timestamp calculations
  const getSavedTimerState = (): TimerState => {
    try {
      const savedState = localStorage.getItem('pomoSpaceTimerState');
      if (savedState) {
        const parsedState = JSON.parse(savedState) as TimerState;
        
        // Initialize timerStates if it doesn't exist
        if (!parsedState.timerStates) {
          parsedState.timerStates = {
            pomodoro: { 
              timeRemaining: getDuration('pomodoro', settings), 
              isActive: parsedState.timerMode === 'pomodoro' ? parsedState.isActive : false 
            },
            shortBreak: { 
              timeRemaining: getDuration('shortBreak', settings), 
              isActive: parsedState.timerMode === 'shortBreak' ? parsedState.isActive : false 
            },
            longBreak: { 
              timeRemaining: getDuration('longBreak', settings), 
              isActive: parsedState.timerMode === 'longBreak' ? parsedState.isActive : false 
            }
          };
        }
        
        // If timer was active, calculate elapsed time since last active timestamp
        if (parsedState.isActive && parsedState.activeTimestamp) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - parsedState.activeTimestamp) / 1000);
          
          // Calculate new remaining time for the active timer
          let newTimeRemaining = Math.max(0, parsedState.timeRemaining - elapsedSeconds);
          
          // Update the active timer's time remaining
          if (parsedState.timerStates) {
            parsedState.timerStates[parsedState.timerMode as keyof typeof parsedState.timerStates].timeRemaining = newTimeRemaining;
          }
          
          // If timer would have completed, handle the timer completion
          if (newTimeRemaining <= 0) {
            newTimeRemaining = 0;
            
            // If this was a pomodoro, call the completion callback
            if (parsedState.timerMode === 'pomodoro' && onPomodoroComplete) {
              onPomodoroComplete();
            }
            
            // For auto transitions:
            let newMode;
            if (parsedState.timerMode === 'pomodoro') {
              // After longBreakInterval pomodoros, take a long break
              const newCompletedCount = parsedState.completedPomodoros + 1;
              newMode = newCompletedCount % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
            } else {
              // Completed a break, go back to pomodoro
              newMode = 'pomodoro';
            }
            
            const newCompletedPomodoros = parsedState.timerMode === 'pomodoro' ? 
              parsedState.completedPomodoros + 1 : 
              parsedState.completedPomodoros;
              
            // Reset the completed timer
            if (parsedState.timerStates) {
              parsedState.timerStates[parsedState.timerMode as keyof typeof parsedState.timerStates] = {
                timeRemaining: getDuration(parsedState.timerMode, settings),
                isActive: false
              };
            }
            
            // If the parent component's timerMode is different than what we calculated,
            // update our local state but don't trigger a change yet
            if (timerMode !== newMode && newMode) {
              setTimeout(() => {
                setTimerMode(newMode, false);
              }, 0);
            }
            
            // We don't auto-start the next timer, user must manually start it
            return {
              timeRemaining: getDuration(newMode || timerMode, settings),
              isActive: false,
              completedPomodoros: newCompletedPomodoros,
              timerMode: newMode || timerMode,
              timerStates: parsedState.timerStates
            };
          }
          
          // Update the timestamp to now if still active
          return {
            ...parsedState,
            timeRemaining: newTimeRemaining,
            activeTimestamp: parsedState.isActive ? now : undefined
          };
        }
        
        // Return the most up-to-date state
        return parsedState;
      }
    } catch (error) {
      console.error('Error reading timer state from localStorage:', error);
    }
    
    // Default state if nothing in localStorage
    return {
      timeRemaining: getDuration(timerMode, settings),
      isActive: false,
      completedPomodoros: 0,
      timerMode: timerMode,
      timerStates: {
        pomodoro: { timeRemaining: getDuration('pomodoro', settings), isActive: false },
        shortBreak: { timeRemaining: getDuration('shortBreak', settings), isActive: false },
        longBreak: { timeRemaining: getDuration('longBreak', settings), isActive: false }
      }
    };
  };
  
  // State for timer functionality with initialization
  const savedState = getSavedTimerState();
  const [timeRemaining, setTimeRemaining] = useState(savedState.timerStates?.[timerMode as keyof typeof savedState.timerStates]?.timeRemaining || savedState.timeRemaining);
  const [isActive, setIsActive] = useState(savedState.timerStates?.[timerMode as keyof typeof savedState.timerStates]?.isActive || false);
  const [completedPomodoros, setCompletedPomodoros] = useState(savedState.completedPomodoros);
  
  // Track timer states for all timer types
  const [timerStates, setTimerStates] = useState(savedState.timerStates || {
    pomodoro: { timeRemaining: getDuration('pomodoro', settings), isActive: false },
    shortBreak: { timeRemaining: getDuration('shortBreak', settings), isActive: false },
    longBreak: { timeRemaining: getDuration('longBreak', settings), isActive: false }
  });
  
  // Update the timer state in localStorage with all timer states
  const updateTimerState = (
    currentTimerMode: string,
    timeRemaining: number, 
    isActive: boolean, 
    completedPomodoros: number,
    allTimerStates: typeof timerStates
  ) => {
    try {
      // Get any existing state from localStorage to preserve originalDuration
      let originalDuration: number | undefined;
      const existingState = localStorage.getItem('pomoSpaceTimerState');
      if (existingState) {
        const parsedState = JSON.parse(existingState);
        originalDuration = parsedState.originalDuration;
      }
      
      // If we don't have an originalDuration, set it to the full duration
      if (!originalDuration) {
        originalDuration = getDuration(currentTimerMode, settings);
      }
      
      const timerState: TimerState = {
        timeRemaining,
        isActive,
        completedPomodoros,
        activeTimestamp: isActive ? Date.now() : undefined,
        timerMode: currentTimerMode,
        originalDuration,
        timerStates: allTimerStates
      };
      
      localStorage.setItem('pomoSpaceTimerState', JSON.stringify(timerState));
    } catch (error) {
      console.error('Error updating timer state:', error);
    }
  };
  
  // Save timeRemaining to localStorage every second when timer is active
  useEffect(() => {
    if (isActive) {
      // Update the current timer's state
      const updatedTimerStates = {
        ...timerStates,
        [timerMode]: { 
          timeRemaining, 
          isActive
        }
      };
      
      updateTimerState(timerMode, timeRemaining, isActive, completedPomodoros, updatedTimerStates);
    }
  }, [timeRemaining, isActive, completedPomodoros, timerMode, timerStates]);
  
  // Also save state when isActive changes
  useEffect(() => {
    // Update the current timer's state
    const updatedTimerStates = {
      ...timerStates,
      [timerMode]: { 
        timeRemaining, 
        isActive
      }
    };
    
    setTimerStates(updatedTimerStates);
    updateTimerState(timerMode, timeRemaining, isActive, completedPomodoros, updatedTimerStates);
  }, [isActive]);
  
  // Handle timer mode changes
  useEffect(() => {
    console.log(`Timer mode changed to ${timerMode} (Manual: ${isManualChange})`);
    
    // Always pause the timer when switching between timer modes
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    
    // Load the state for the selected timer
    const timerState = timerStates[timerMode as keyof typeof timerStates];
    if (timerState) {
      console.log(`Loading timer state for ${timerMode}: `, timerState);
      setTimeRemaining(timerState.timeRemaining);
      setIsActive(false); // Always start paused when switching tabs
    } else {
      // If no state exists for this timer, initialize it
      setTimeRemaining(getDuration(timerMode, settings));
      setIsActive(false);
    }
    
    // Update timer states with current time remaining
    const updatedTimerStates = {
      ...timerStates,
      [timerMode]: {
        timeRemaining: timerState?.timeRemaining || getDuration(timerMode, settings),
        isActive: false // Always paused when switching modes
      }
    };
    
    setTimerStates(updatedTimerStates);
    updateTimerState(timerMode, timeRemaining, false, completedPomodoros, updatedTimerStates);
    
  }, [timerMode]);
  
  // Helper function to play alarm sound
  const playAlarmSound = () => {
    if (window.SoundPlayer) {
      const alarmPath = `/sounds/alarm-${settings.sound.alarmSound}.mp3`;
      const volume = settings.sound.alarmVolume / 100;
      const repeats = settings.sound.alarmRepeat || 1;
      
      console.log(`Playing alarm sound: ${alarmPath} (volume: ${volume}, repeats: ${repeats})`);
      window.SoundPlayer.playAlarm(alarmPath, volume, repeats);
    }
  };
  
  // Start/stop the timer when isActive changes
  useEffect(() => {
    if (isActive) {
      // Start the timer
      if (!intervalRef.current && timeRemaining > 0) {
        intervalRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              // Timer complete
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
              
              // Play alarm sound
              playAlarmSound();
              
              // Move to next timer mode
              let nextMode = '';
              if (timerMode === 'pomodoro') {
                // Completed a pomodoro
                const newCompletedCount = completedPomodoros + 1;
                setCompletedPomodoros(newCompletedCount);
                
                // Call the onPomodoroComplete callback if provided
                if (onPomodoroComplete) {
                  onPomodoroComplete();
                }
                
                // After the set number of pomodoros, take a long break
                if (newCompletedCount % settings.longBreakInterval === 0) {
                  nextMode = 'longBreak';
                  console.log(`Taking long break after ${newCompletedCount} pomodoros (interval: ${settings.longBreakInterval})`);
                } else {
                  nextMode = 'shortBreak';
                  console.log(`Taking short break after ${newCompletedCount} pomodoros`);
                }
                
                // Reset the completed timer
                const updatedTimerStates = {
                  ...timerStates,
                  [timerMode]: {
                    timeRemaining: getDuration(timerMode, settings),
                    isActive: false
                  }
                };
                setTimerStates(updatedTimerStates);
              } else {
                // Completed a break
                nextMode = 'pomodoro';
                console.log(`Break complete, returning to pomodoro`);
                
                // Reset the completed timer
                const updatedTimerStates = {
                  ...timerStates,
                  [timerMode]: {
                    timeRemaining: getDuration(timerMode, settings),
                    isActive: false
                  }
                };
                setTimerStates(updatedTimerStates);
              }
              
              // Switch to the next timer mode but don't auto-start it
              if (nextMode) {
                // First set the timer mode which will update the UI
                setTimerMode(nextMode, false);
                
                // Force selection of the correct tab
                setTimeout(() => {
                  const tabElement = document.querySelector(`button[data-mode="${nextMode}"]`);
                  if (tabElement) {
                    console.log(`Activating tab for: ${nextMode}`);
                    (tabElement as HTMLElement).click();
                  } else {
                    console.warn(`Tab element for ${nextMode} not found`);
                  }
                }, 10);
              }
              
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    // Cleanup on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timerMode, completedPomodoros, settings, timeRemaining, setTimerMode, onPomodoroComplete]);
  
  // Toggle the timer
  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  // Reset the timer
  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(getDuration(timerMode, settings));
  };
  
  // Button color styles based on timer mode
  const getButtonColor = (buttonMode: string) => {
    if (buttonMode === timerMode) {
      return 'bg-white/40 text-white font-bold shadow-lg ring-2 ring-white/50 transform scale-105';
    }
    return 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90 transition-all';
  };
  
  // Effect to handle settings changes
  useEffect(() => {
    // For each timer type, update the duration based on settings
    const updatedTimerStates = { ...timerStates };
    
    ['pomodoro', 'shortBreak', 'longBreak'].forEach(mode => {
      const timerMode = mode as keyof typeof timerStates;
      const currentState = timerStates[timerMode];
      const newFullDuration = getDuration(mode, settings);
      const oldFullDuration = getDuration(mode, { 
        ...settings, 
        timerDurations: { 
          ...settings.timerDurations 
        } 
      });
      
      // If the timer is active OR partially completed, preserve elapsed time
      if (currentState.isActive || (currentState.timeRemaining < oldFullDuration)) {
        // Calculate current elapsed time in seconds
        const elapsedTime = Math.max(0, oldFullDuration - currentState.timeRemaining);
        
        // Apply the new duration but keep the exact elapsed time
        // This means if 5:07 has elapsed on a 25min timer, and user changes to 27min,
        // the new timer should show 27:00 - 5:07 = 21:53
        const newTimeRemaining = Math.max(1, newFullDuration - elapsedTime);
        
        // Update the timer state
        updatedTimerStates[timerMode] = {
          ...currentState,
          timeRemaining: newTimeRemaining
        };
        
        // If this is the current timer, also update the displayed time
        if (mode === timerMode) {
          setTimeRemaining(newTimeRemaining);
        }
      } else {
        // If the timer is not active and not partially completed, set to full new duration
        updatedTimerStates[timerMode] = {
          ...currentState,
          timeRemaining: newFullDuration
        };
        
        // If this is the current timer, also update the displayed time
        if (mode === timerMode) {
          setTimeRemaining(newFullDuration);
        }
      }
    });
    
    // Update the timer states and persist to localStorage
    setTimerStates(updatedTimerStates);
    updateTimerState(timerMode, timeRemaining, isActive, completedPomodoros, updatedTimerStates);
    
  }, [settings.timerDurations]);
  
  return (
    <div className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-lg mb-8">
      {/* Timer Mode Buttons */}
      <div className="flex justify-center mb-8 gap-3 sm:gap-5">
        <button 
          className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg text-sm sm:text-base transition-all duration-300 ease-in-out ${getButtonColor('pomodoro')}`} 
          onClick={() => setTimerMode('pomodoro', true)}
          data-mode="pomodoro"
        >
          Pomodoro
        </button>
        <button 
          className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg text-sm sm:text-base transition-all duration-300 ease-in-out ${getButtonColor('shortBreak')}`} 
          onClick={() => setTimerMode('shortBreak', true)}
          data-mode="shortBreak"
        >
          Short Break
        </button>
        <button 
          className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg text-sm sm:text-base transition-all duration-300 ease-in-out ${getButtonColor('longBreak')}`} 
          onClick={() => setTimerMode('longBreak', true)}
          data-mode="longBreak"
        >
          Long Break
        </button>
      </div>
      
      {/* Timer Display */}
      <div className="text-center">
        <div className="text-6xl sm:text-7xl font-bold text-white mb-4">
          {formatTime(timeRemaining)}
        </div>
        
        {/* Current Mode Indicator */}
        <div className="mb-8 text-white/90 font-medium text-lg">
          {timerMode === 'pomodoro' ? 'Focus Time' : 
           timerMode === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </div>
        
        {/* Timer Controls */}
        <div className="flex justify-center space-x-4">
          <button 
            className="bg-white/90 hover:bg-white text-gray-800 px-8 sm:px-10 py-3 rounded-md font-bold text-lg sm:text-xl transition-colors flex items-center" 
            onClick={toggleTimer}
          >
            {isActive ? (
              <>
                <PauseIcon className="mr-2" size={24} /> PAUSE
              </>
            ) : (
              <>
                <PlayIcon className="mr-2" size={24} /> START
              </>
            )}
          </button>
          
          {isActive && (
            <button 
              className="bg-white/10 text-white p-3 rounded-md hover:bg-white/20 transition-colors" 
              onClick={resetTimer}
            >
              <RotateCcwIcon size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};