import { useState, useEffect, useRef } from 'react';

// Define types for our timer
export type TimerType = 'pomodoro' | 'shortBreak' | 'longBreak';

// Basic timer state interface
interface TimerState {
  startTime: number | null;  // Unix timestamp when the timer started
  duration: number;          // Total time for the session in seconds
  elapsed: number;           // Time elapsed in seconds (for paused state calculation)
  isRunning: boolean;        // Whether the timer is actively counting
}

// Store all timers with their individual states
interface AllTimerStates {
  pomodoro: TimerState;
  shortBreak: TimerState;
  longBreak: TimerState;
  activeType: TimerType;     // Currently active timer type
  completedPomodoros: number; // Count of completed pomodoros
}

interface TimerSettings {
  timerDurations: {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
  };
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

interface UseTimerOptions {
  onComplete?: () => void;
  settings: TimerSettings;
  settingsLastUpdated?: number; // Timestamp when settings were last updated
}

const TIMER_STORAGE_KEY = 'pomoSpaceTimerState';

export function useTimer({ onComplete, settings, settingsLastUpdated }: UseTimerOptions) {
  // Initialize the timer states
  const [allTimers, setAllTimers] = useState<AllTimerStates>(() => {
    return loadTimerStates(settings) || createDefaultTimerStates(settings);
  });
  
  // Get currently active timer type and its state
  const activeType = allTimers.activeType;
  const activeTimer = allTimers[activeType];
  
  // Track remaining time for display
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    return calculateTimeRemaining(activeTimer);
  });
  
  // Reference for the timer interval
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to update only the active timer state
  const updateActiveTimer = (newTimerState: TimerState) => {
    setAllTimers(prev => {
      const updated = {
        ...prev,
        [activeType]: newTimerState
      };
      
      // Save to localStorage
      saveTimerStates(updated);
      
      return updated;
    });
  };
  
  // Change the active timer type
  const changeTimerType = (newType: TimerType) => {
    if (newType === activeType) return;
    
    // Stop current timer interval if running
    clearTimerInterval();
    
    console.log(`Changing timer type from ${activeType} to ${newType}`);
    
    // Update the active type
    setAllTimers(prev => {
      const updated = { 
        ...prev,
        activeType: newType 
      };
      
      // Save to localStorage
      saveTimerStates(updated);
      
      return updated;
    });
    
    // Update the displayed time for the new active timer
    const newTimer = allTimers[newType];
    setTimeRemaining(calculateTimeRemaining(newTimer));
    
    // If the new timer is running, restart the interval
    if (newTimer.isRunning) {
      startTimerInterval();
    }
  };
  
  // Start or resume the timer
  const startTimer = () => {
    if (activeTimer.isRunning) return;
    
    const now = Date.now();
    
    // Calculate the proper start time based on elapsed time
    const updatedTimer = {
      ...activeTimer,
      startTime: now - (activeTimer.elapsed * 1000),
      isRunning: true
    };
    
    updateActiveTimer(updatedTimer);
    startTimerInterval();
  };
  
  // Pause the timer
  const pauseTimer = () => {
    if (!activeTimer.isRunning) return;
    
    clearTimerInterval();
    
    // Calculate elapsed time
    const now = Date.now();
    const startTime = activeTimer.startTime || now;
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    
    const updatedTimer = {
      ...activeTimer,
      isRunning: false,
      elapsed: elapsedSeconds
    };
    
    updateActiveTimer(updatedTimer);
  };
  
  // Reset the active timer
  const resetTimer = () => {
    clearTimerInterval();
    
    const newDuration = getDurationFromSettings(activeType, settings);
    const updatedTimer = {
      ...activeTimer,
      startTime: null,
      duration: newDuration,
      elapsed: 0,
      isRunning: false
    };
    
    updateActiveTimer(updatedTimer);
    setTimeRemaining(newDuration);
  };
  
  // Complete the current timer and move to the next one
  const completeTimer = () => {
    clearTimerInterval();
    
    let nextType: TimerType;
    let newCompletedPomodoros = allTimers.completedPomodoros;
    
    // Update pomodoro count and determine next timer type
    if (activeType === 'pomodoro') {
      newCompletedPomodoros += 1;
      
      if (newCompletedPomodoros % settings.longBreakInterval === 0) {
        nextType = 'longBreak';
      } else {
        nextType = 'shortBreak';
      }
      
      // Call complete callback if provided
      if (onComplete) {
        onComplete();
      }
    } else {
      // After any break, go back to pomodoro
      nextType = 'pomodoro';
    }
    
    // Reset the completed timer
    const completedTimer = {
      ...activeTimer,
      startTime: null,
      elapsed: 0,
      isRunning: false
    };
    
    // Update all states
    setAllTimers(prev => {
      const updated = {
        ...prev,
        [activeType]: completedTimer,
        activeType: nextType,
        completedPomodoros: newCompletedPomodoros
      };
      
      saveTimerStates(updated);
      return updated;
    });
    
    // Update displayed time for the new timer
    setTimeRemaining(getDurationFromSettings(nextType, settings));
  };
  
  // Start the timer interval
  const startTimerInterval = () => {
    if (timerIntervalRef.current) return;
    
    timerIntervalRef.current = setInterval(() => {
      // Get the latest active timer state
      const current = allTimers[activeType];
      const remaining = calculateTimeRemaining(current);
      
      if (remaining <= 0) {
        // Timer complete
        clearTimerInterval();
        completeTimer();
      } else {
        setTimeRemaining(remaining);
      }
    }, 200); // Update frequently for accuracy
  };
  
  // Clear the timer interval
  const clearTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
  
  // Effect to start/stop timer interval when active timer state changes
  useEffect(() => {
    if (activeTimer.isRunning) {
      startTimerInterval();
    } else {
      clearTimerInterval();
    }
    
    return () => clearTimerInterval();
  }, [activeTimer.isRunning, activeTimer.startTime, activeType]);
  
  // Effect to handle settings changes
  useEffect(() => {
    if (!settingsLastUpdated) return;
    
    console.log('Settings changed, checking if timer durations need updates');
    
    // Get current durations from settings
    const pomodoroDuration = settings.timerDurations.pomodoro * 60;
    const shortBreakDuration = settings.timerDurations.shortBreak * 60;
    const longBreakDuration = settings.timerDurations.longBreak * 60;
    
    // Track if any timer needs updating
    let needsUpdate = false;
    const updatedTimers = { ...allTimers };
    
    // Check pomodoro timer - ONLY update if the pomodoro setting changed
    if (updatedTimers.pomodoro.duration !== pomodoroDuration) {
      console.log(`Updating pomodoro duration: ${updatedTimers.pomodoro.duration}s -> ${pomodoroDuration}s`);
      
      if (activeType === 'pomodoro' && activeTimer.isRunning) {
        // If this timer is active and running, preserve elapsed time proportion
        const now = Date.now();
        const startTime = activeTimer.startTime || now;
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        updatedTimers.pomodoro = {
          ...updatedTimers.pomodoro,
          duration: pomodoroDuration,
          startTime: now - (elapsedSeconds * 1000)
        };
      } else {
        // Otherwise just update the duration
        updatedTimers.pomodoro = {
          ...updatedTimers.pomodoro,
          duration: pomodoroDuration
        };
      }
      needsUpdate = true;
    }
    
    // Check short break timer - ONLY update if the short break setting changed
    if (updatedTimers.shortBreak.duration !== shortBreakDuration) {
      console.log(`Updating short break duration: ${updatedTimers.shortBreak.duration}s -> ${shortBreakDuration}s`);
      
      if (activeType === 'shortBreak' && activeTimer.isRunning) {
        // If this timer is active and running, preserve elapsed time proportion
        const now = Date.now();
        const startTime = activeTimer.startTime || now;
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        updatedTimers.shortBreak = {
          ...updatedTimers.shortBreak,
          duration: shortBreakDuration,
          startTime: now - (elapsedSeconds * 1000)
        };
      } else {
        // Otherwise just update the duration
        updatedTimers.shortBreak = {
          ...updatedTimers.shortBreak,
          duration: shortBreakDuration
        };
      }
      needsUpdate = true;
    }
    
    // Check long break timer - ONLY update if the long break setting changed
    if (updatedTimers.longBreak.duration !== longBreakDuration) {
      console.log(`Updating long break duration: ${updatedTimers.longBreak.duration}s -> ${longBreakDuration}s`);
      
      if (activeType === 'longBreak' && activeTimer.isRunning) {
        // If this timer is active and running, preserve elapsed time proportion
        const now = Date.now();
        const startTime = activeTimer.startTime || now;
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        updatedTimers.longBreak = {
          ...updatedTimers.longBreak,
          duration: longBreakDuration,
          startTime: now - (elapsedSeconds * 1000)
        };
      } else {
        // Otherwise just update the duration
        updatedTimers.longBreak = {
          ...updatedTimers.longBreak,
          duration: longBreakDuration
        };
      }
      needsUpdate = true;
    }
    
    // Only update if something actually changed
    if (needsUpdate) {
      console.log('Applying timer duration updates from settings');
      setAllTimers(updatedTimers);
      saveTimerStates(updatedTimers);
      
      // Update the displayed time if the active timer was changed
      if ((activeType === 'pomodoro' && updatedTimers.pomodoro.duration !== allTimers.pomodoro.duration) ||
          (activeType === 'shortBreak' && updatedTimers.shortBreak.duration !== allTimers.shortBreak.duration) ||
          (activeType === 'longBreak' && updatedTimers.longBreak.duration !== allTimers.longBreak.duration)) {
        
        setTimeRemaining(calculateTimeRemaining(updatedTimers[activeType]));
      }
    }
  }, [settings, settingsLastUpdated]);
  
  // Effect to handle page reload and initial load
  useEffect(() => {
    // Check if timer was running when the page was closed/refreshed
    if (activeTimer.isRunning && activeTimer.startTime) {
      const remaining = calculateTimeRemaining(activeTimer);
      
      // If timer would have finished during page refresh
      if (remaining <= 0) {
        completeTimer();
      } else {
        setTimeRemaining(remaining);
        startTimerInterval();
      }
    } else {
      // Timer is not running, just set remaining time
      const newRemaining = activeTimer.duration - activeTimer.elapsed;
      setTimeRemaining(newRemaining > 0 ? newRemaining : 0);
    }
  }, []);
  
  // Return the public interface
  return {
    timeRemaining,
    isRunning: activeTimer.isRunning,
    timerType: activeType,
    completedPomodoros: allTimers.completedPomodoros,
    startTimer,
    pauseTimer,
    resetTimer,
    changeTimerType
  };
}

// Helper function to calculate time remaining
function calculateTimeRemaining(timer: TimerState): number {
  if (!timer.isRunning || !timer.startTime) {
    return timer.duration - timer.elapsed;
  }
  
  const now = Date.now();
  const elapsedMs = now - timer.startTime;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  
  return Math.max(0, timer.duration - elapsedSeconds);
}

// Helper function to get duration from settings
function getDurationFromSettings(type: TimerType, settings: TimerSettings): number {
  switch (type) {
    case 'pomodoro': return settings.timerDurations.pomodoro * 60;
    case 'shortBreak': return settings.timerDurations.shortBreak * 60;
    case 'longBreak': return settings.timerDurations.longBreak * 60;
    default: return settings.timerDurations.pomodoro * 60;
  }
}

// Helper function to load timer states from localStorage
function loadTimerStates(settings: TimerSettings): AllTimerStates | null {
  try {
    const storedState = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!storedState) return null;
    
    const parsedState = JSON.parse(storedState);
    
    // Basic structure validation
    if (!parsedState || 
        !parsedState.pomodoro || 
        !parsedState.shortBreak || 
        !parsedState.longBreak || 
        !parsedState.activeType) {
      console.log('Invalid saved timer state found in localStorage');
      return null;
    }
    
    // Log the loaded state for debugging
    console.log('Loading timer state with durations:', {
      pomodoro: parsedState.pomodoro.duration,
      shortBreak: parsedState.shortBreak.duration,
      longBreak: parsedState.longBreak.duration
    });
    
    // Create a copy of the parsed state without modifying anything yet
    const validatedState: AllTimerStates = {
      activeType: parsedState.activeType,
      completedPomodoros: parsedState.completedPomodoros || 0,
      
      // Preserve the original durations from localStorage
      pomodoro: { ...parsedState.pomodoro },
      shortBreak: { ...parsedState.shortBreak },
      longBreak: { ...parsedState.longBreak }
    };
    
    // Get settings durations in seconds
    const pomodoroDuration = settings.timerDurations.pomodoro * 60;
    const shortBreakDuration = settings.timerDurations.shortBreak * 60;
    const longBreakDuration = settings.timerDurations.longBreak * 60;
    
    // Only update durations if they are invalid or the timer is not running
    // This preserves in-progress timers even if settings have changed
    
    // Pomodoro: Only update if invalid or not running
    if (!validatedState.pomodoro.duration || (validatedState.activeType !== 'pomodoro' || !validatedState.pomodoro.isRunning)) {
      validatedState.pomodoro.duration = pomodoroDuration;
    }
    
    // Short Break: Only update if invalid or not running
    if (!validatedState.shortBreak.duration || (validatedState.activeType !== 'shortBreak' || !validatedState.shortBreak.isRunning)) {
      validatedState.shortBreak.duration = shortBreakDuration;
    }
    
    // Long Break: Only update if invalid or not running
    if (!validatedState.longBreak.duration || (validatedState.activeType !== 'longBreak' || !validatedState.longBreak.isRunning)) {
      validatedState.longBreak.duration = longBreakDuration;
    }
    
    // Log the final state for debugging
    console.log('Final timer state durations:', {
      pomodoro: validatedState.pomodoro.duration,
      shortBreak: validatedState.shortBreak.duration,
      longBreak: validatedState.longBreak.duration
    });
    
    return validatedState;
  } catch (error) {
    console.error('Error loading timer states:', error);
    return null;
  }
}

// Helper function to save timer states to localStorage
function saveTimerStates(state: AllTimerStates): void {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving timer states:', error);
  }
}

// Helper function to create default timer states
function createDefaultTimerState(duration: number): TimerState {
  return {
    startTime: null,
    duration: duration,
    elapsed: 0,
    isRunning: false
  };
}

// Helper function to create all default timer states
function createDefaultTimerStates(settings: TimerSettings): AllTimerStates {
  return {
    activeType: 'pomodoro',
    completedPomodoros: 0,
    pomodoro: createDefaultTimerState(settings.timerDurations.pomodoro * 60),
    shortBreak: createDefaultTimerState(settings.timerDurations.shortBreak * 60),
    longBreak: createDefaultTimerState(settings.timerDurations.longBreak * 60)
  };
}