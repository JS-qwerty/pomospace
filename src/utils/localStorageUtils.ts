/**
 * LocalStorage Utilities with defensive programming patterns
 * to prevent data corruption and ensure consistent values.
 */

// Helper type for timer state
interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  completedPomodoros: number;
  activeTimestamp?: number;
  timerMode: string;
  originalDuration?: number;
  timerStates: {
    pomodoro: { timeRemaining: number; isActive: boolean; settingsChanged?: boolean };
    shortBreak: { timeRemaining: number; isActive: boolean; settingsChanged?: boolean };
    longBreak: { timeRemaining: number; isActive: boolean; settingsChanged?: boolean };
  };
  settingsChanged?: boolean;
}

// Helper type for settings
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
  lastUpdated?: number;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
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

/**
 * Get settings from localStorage with validation
 */
export function getSettings(): Settings {
  try {
    const savedSettingsStr = localStorage.getItem('pomoSpaceSettings');
    if (!savedSettingsStr) {
      return DEFAULT_SETTINGS;
    }
    
    const savedSettings = JSON.parse(savedSettingsStr);
    
    // Validate essential properties
    if (!savedSettings.timerDurations || 
        typeof savedSettings.timerDurations.pomodoro !== 'number' ||
        savedSettings.timerDurations.pomodoro < 1 || 
        savedSettings.timerDurations.pomodoro > 60) {
      
      console.warn('Invalid settings detected, using defaults');
      return DEFAULT_SETTINGS;
    }
    
    // Return with defaults for any missing properties
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
    console.error('Error reading settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage with validation
 */
export function saveSettings(settings: Settings): void {
  // Validate pomodoro time
  if (!settings.timerDurations.pomodoro || 
      settings.timerDurations.pomodoro < 1 || 
      settings.timerDurations.pomodoro > 60) {
    
    console.warn('Invalid pomodoro duration, setting to default (25)');
    settings.timerDurations.pomodoro = 25;
  }
  
  // Add a timestamp to force updates
  settings.lastUpdated = Date.now();
  
  try {
    localStorage.setItem('pomoSpaceSettings', JSON.stringify(settings));
    
    // Force timer state to update as well to ensure consistency
    const timerState = getTimerState('pomodoro', settings);
    saveTimerState(timerState);
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
}

/**
 * Create a fresh timer state based on settings
 */
export function createFreshTimerState(currentMode: string, settings: Settings): TimerState {
  const pomodoroTime = settings.timerDurations.pomodoro * 60;
  const shortBreakTime = settings.timerDurations.shortBreak * 60;
  const longBreakTime = settings.timerDurations.longBreak * 60;
  
  // Select the current time based on mode
  let currentTime = pomodoroTime;
  if (currentMode === 'shortBreak') currentTime = shortBreakTime;
  if (currentMode === 'longBreak') currentTime = longBreakTime;
  
  return {
    timeRemaining: currentTime,
    isActive: false,
    completedPomodoros: 0,
    timerMode: currentMode,
    originalDuration: currentTime,
    timerStates: {
      pomodoro: { timeRemaining: pomodoroTime, isActive: false },
      shortBreak: { timeRemaining: shortBreakTime, isActive: false },
      longBreak: { timeRemaining: longBreakTime, isActive: false }
    },
    settingsChanged: false
  };
}

/**
 * Get timer state from localStorage with validation
 */
export function getTimerState(currentMode: string, settings: Settings): TimerState {
  try {
    const savedState = localStorage.getItem('pomoSpaceTimerState');
    if (!savedState) {
      return createFreshTimerState(currentMode, settings);
    }
    
    const parsedState = JSON.parse(savedState) as TimerState;
    
    // Force correct values for all timer states
    const correctPomodoroTime = settings.timerDurations.pomodoro * 60;
    const correctShortBreakTime = settings.timerDurations.shortBreak * 60;
    const correctLongBreakTime = settings.timerDurations.longBreak * 60;
    
    // If pomodoro timer should be inactive, always use the full duration
    if (currentMode === 'pomodoro' && !parsedState.isActive) {
      parsedState.timeRemaining = correctPomodoroTime;
    }
    
    // Ensure timer states exist and have correct values
    if (!parsedState.timerStates) {
      parsedState.timerStates = {
        pomodoro: { timeRemaining: correctPomodoroTime, isActive: false },
        shortBreak: { timeRemaining: correctShortBreakTime, isActive: false },
        longBreak: { timeRemaining: correctLongBreakTime, isActive: false }
      };
    } else {
      // For inactive timers, always use the full duration from settings
      if (!parsedState.timerStates.pomodoro.isActive) {
        parsedState.timerStates.pomodoro.timeRemaining = correctPomodoroTime;
      }
      if (!parsedState.timerStates.shortBreak.isActive) {
        parsedState.timerStates.shortBreak.timeRemaining = correctShortBreakTime;
      }
      if (!parsedState.timerStates.longBreak.isActive) {
        parsedState.timerStates.longBreak.timeRemaining = correctLongBreakTime;
      }
    }
    
    return parsedState;
  } catch (error) {
    console.error('Error reading timer state from localStorage:', error);
    return createFreshTimerState(currentMode, settings);
  }
}

/**
 * Save timer state to localStorage
 */
export function saveTimerState(timerState: TimerState): void {
  try {
    // Update the active timestamp
    if (timerState.isActive) {
      timerState.activeTimestamp = Date.now();
    } else {
      timerState.activeTimestamp = undefined;
    }
    
    localStorage.setItem('pomoSpaceTimerState', JSON.stringify(timerState));
  } catch (error) {
    console.error('Error saving timer state to localStorage:', error);
  }
}

/**
 * Completely reset localStorage to defaults
 */
export function resetLocalStorage(): void {
  try {
    // Create default settings
    const defaultSettings = DEFAULT_SETTINGS;
    localStorage.setItem('pomoSpaceSettings', JSON.stringify(defaultSettings));
    
    // Create default timer state
    const defaultTimerState = createFreshTimerState('pomodoro', defaultSettings);
    localStorage.setItem('pomoSpaceTimerState', JSON.stringify(defaultTimerState));
    
    console.log('localStorage reset to defaults');
  } catch (error) {
    console.error('Error resetting localStorage:', error);
    // For critical errors, attempt to clear everything
    localStorage.clear();
  }
}

/**
 * CRITICAL: Check if there's a hardcoded 15-minute value in localStorage
 * This is a targeted fix for the specific problem
 */
export function fixHardcodedPomodoroTime(): boolean {
  try {
    const state = localStorage.getItem('pomoSpaceTimerState');
    if (!state) {
      return false;
    }
    
    const parsedState = JSON.parse(state);
    
    // Search for the exact 15-minute value (900 seconds) that's causing issues
    let foundHardcodedValue = false;
    
    // Check if the pomodoro timer has exactly 15 minutes (900 seconds) instead of 25 minutes (1500 seconds)
    if (parsedState.timerStates?.pomodoro?.timeRemaining === 900) {
      console.warn('⚠️ Found hardcoded 15-minute value in localStorage! Fixing...');
      parsedState.timerStates.pomodoro.timeRemaining = 1500; // Force to 25 minutes
      foundHardcodedValue = true;
    }
    
    // Also check the main timeRemaining if timer mode is pomodoro
    if (parsedState.timerMode === 'pomodoro' && parsedState.timeRemaining === 900) {
      console.warn('⚠️ Found hardcoded 15-minute value in main timeRemaining! Fixing...');
      parsedState.timeRemaining = 1500; // Force to 25 minutes
      foundHardcodedValue = true;
    }
    
    // Check originalDuration in case it's being used for calculations
    if (parsedState.timerMode === 'pomodoro' && parsedState.originalDuration === 900) {
      console.warn('⚠️ Found hardcoded 15-minute value in originalDuration! Fixing...');
      parsedState.originalDuration = 1500; // Force to 25 minutes
      foundHardcodedValue = true;
    }
    
    if (foundHardcodedValue) {
      localStorage.setItem('pomoSpaceTimerState', JSON.stringify(parsedState));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for hardcoded timer values:', error);
    return false;
  }
}

/**
 * Validate that localStorage has correct values
 * Returns true if values are valid, false if reset was needed
 */
export function validateLocalStorage(): boolean {
  try {
    // First run the targeted fix for the 15-minute issue
    const fixedHardcodedValue = fixHardcodedPomodoroTime();
    if (fixedHardcodedValue) {
      console.log('Fixed hardcoded 15-minute value in localStorage');
    }
    
    const settings = getSettings();
    const timerState = getTimerState('pomodoro', settings);
    
    // Verify pomodoro time is correct
    const correctPomodoroTime = settings.timerDurations.pomodoro * 60;
    
    if (timerState.timerMode === 'pomodoro' && 
        !timerState.isActive && 
        timerState.timerStates.pomodoro.timeRemaining !== correctPomodoroTime) {
      
      console.warn('Invalid timer state detected');
      resetLocalStorage();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating localStorage:', error);
    resetLocalStorage();
    return false;
  }
} 