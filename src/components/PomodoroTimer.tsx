import React, { useEffect } from 'react';
import { PlayIcon, PauseIcon, RotateCcwIcon } from 'lucide-react';
import { useTimer, TimerType } from '../hooks/useTimer';

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
    tickingSound: string;
    tickingVolume: number;
  };
  lastUpdated?: number;
}

interface PomodoroTimerProps {
  timerMode: string;
  setTimerMode: (mode: string, isManual?: boolean) => void;
  settings: Settings;
  onPomodoroComplete?: () => void;
  isManualChange?: boolean;
}

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
  // Use our timer hook with the isolatedTimerStates option enabled
  const {
    timeRemaining,
    isRunning,
    timerType,
    completedPomodoros,
    startTimer,
    pauseTimer,
    resetTimer,
    changeTimerType
  } = useTimer({
    onComplete: onPomodoroComplete,
    settings: settings,
    settingsLastUpdated: settings.lastUpdated
  });

  // Helper to play alarm sound when timer completes
  const playAlarmSound = () => {
    if (window.SoundPlayer) {
      const alarmPath = `/sounds/alarm-${settings.sound.alarmSound}.mp3`;
      const volume = settings.sound.alarmVolume / 100;
      const repeats = settings.sound.alarmRepeat || 1;
      
      console.log(`Playing alarm sound: ${alarmPath} (volume: ${volume}, repeats: ${repeats})`);
      window.SoundPlayer.playAlarm(alarmPath, volume, repeats);
    }
  };

  // Handle timer mode changes with clear logging
  useEffect(() => {
    // Convert string timerMode to TimerType
    const newType = timerMode as TimerType;
    
    // Only change timer type if there's actually a change 
    if (newType !== timerType) {
      console.log(`Timer mode UI change detected: from ${timerType} to ${newType} (Manual: ${isManualChange})`);
      
      // Always call changeTimerType to keep UI and timer state in sync
      changeTimerType(newType);
    }
  }, [timerMode, timerType, changeTimerType, isManualChange]);
  
  // Toggle the timer
  const toggleTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };
  
  // Button color styles based on timer mode
  const getButtonColor = (buttonMode: string) => {
    if (buttonMode === timerType) {
      return 'bg-white/40 text-white font-bold shadow-lg ring-2 ring-white/50 transform scale-105';
    }
    return 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90 transition-all';
  };
  
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
          {timerType === 'pomodoro' ? 'Focus Time' : 
           timerType === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </div>
        
        {/* Timer Controls */}
        <div className="flex justify-center space-x-4">
          <button 
            className="bg-white/90 hover:bg-white text-gray-800 px-8 sm:px-10 py-3 rounded-md font-bold text-lg sm:text-xl transition-colors flex items-center" 
            onClick={toggleTimer}
          >
            {isRunning ? (
              <>
                <PauseIcon className="mr-2" size={24} /> PAUSE
              </>
            ) : (
              <>
                <PlayIcon className="mr-2" size={24} /> START
              </>
            )}
          </button>
          
          {isRunning && (
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