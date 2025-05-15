import React, { useRef, useState } from 'react';
import { XIcon, MoonIcon, UploadIcon, FileTextIcon } from 'lucide-react';
import { downloadTaskHistoryCSV, handleFileUpload } from '../utils/dataUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
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
      tickingSound: string;
      tickingVolume: number;
      alarmRepeat: number;
    };
  };
  onSettingsChange: (settings: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update timer durations
  const updateTimerDuration = (timerType: string, value: string) => {
    const numValue = parseInt(value);
    // Validate the input
    if (isNaN(numValue) || numValue < 1) return;
    
    const maxValues = {
      pomodoro: 60,
      shortBreak: 30,
      longBreak: 60
    };
    
    const timerKey = timerType as keyof typeof maxValues;
    
    // Apply a maximum value
    const validValue = Math.min(numValue, maxValues[timerKey]);
    
    // Force an immediate update by adding a timestamp
    const updatedSettings = {
      ...settings,
      timerDurations: {
        ...settings.timerDurations,
        [timerType]: validValue
      },
      lastUpdated: Date.now() // Add a timestamp to force re-renders
    };
    
    // Apply the settings update
    onSettingsChange(updatedSettings);
    
    // Special treatment when changing pomodoro duration - add a flag to signal this
    if (timerType === 'pomodoro') {
      // Clear localStorage timer state to force a reset the next time the page loads
      try {
        const timerState = localStorage.getItem('pomoSpaceTimerState');
        if (timerState) {
          const parsedState = JSON.parse(timerState);
          if (parsedState && parsedState.timerStates && parsedState.timerStates.pomodoro) {
            // Signal that there was a settings change
            parsedState.timerStates.pomodoro.settingsChanged = true;
            localStorage.setItem('pomoSpaceTimerState', JSON.stringify(parsedState));
          }
        }
      } catch (e) {
        console.error('Error updating timer state:', e);
      }
    }
  };
  
  // Toggle boolean settings
  const toggleSetting = (settingName: string) => {
    onSettingsChange({
      ...settings,
      [settingName]: !settings[settingName as keyof typeof settings]
    });
  };
  
  // Update sound settings
  const updateSoundSetting = (setting: string, value: string | number) => {
    onSettingsChange({
      ...settings,
      sound: {
        ...settings.sound,
        [setting]: value
      }
    });
  };
  
  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const success = await handleFileUpload(files[0]);
    
    if (success) {
      setImportStatus('success');
      // Reload the page after a short delay to apply imported settings
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setImportStatus('error');
      // Clear the error message after a few seconds
      setTimeout(() => {
        setImportStatus(null);
      }, 3000);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  if (!isOpen) return null;
  
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white/90 backdrop-blur-sm'} rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 z-10 p-4 border-b ${settings.darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex justify-between items-center`}>
          <h2 className={`text-xl font-semibold ${settings.darkMode ? 'text-white' : 'text-gray-800'}`}>
            Settings
          </h2>
          <button onClick={onClose} className={`${settings.darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-4 space-y-6">
          {/* Timer Settings */}
          <div>
            <h3 className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              TIMER
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'} block mb-2`}>
                  Time (minutes)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>
                      Pomodoro
                    </label>
                    <input type="number" value={settings.timerDurations.pomodoro} onChange={e => updateTimerDuration('pomodoro', e.target.value)} className={`w-full p-2 rounded ${settings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`} />
                  </div>
                  <div>
                    <label className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>
                      Short Break
                    </label>
                    <input type="number" value={settings.timerDurations.shortBreak} onChange={e => updateTimerDuration('shortBreak', e.target.value)} className={`w-full p-2 rounded ${settings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`} />
                  </div>
                  <div>
                    <label className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>
                      Long Break
                    </label>
                    <input type="number" value={settings.timerDurations.longBreak} onChange={e => updateTimerDuration('longBreak', e.target.value)} className={`w-full p-2 rounded ${settings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`} />
                  </div>
                </div>
              </div>
              
              <div>
                <label className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'} block mb-2`}>
                  Long Break Interval
                </label>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={settings.longBreakInterval} 
                    onChange={e => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 10) {
                        onSettingsChange({
                          ...settings,
                          longBreakInterval: value
                        });
                      }
                    }} 
                    className={`w-16 p-2 rounded ${settings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`} 
                  />
                  <span className={`ml-2 text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    pomodoros
                  </span>
                </div>
                <p className={`text-xs mt-1 ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  The app will switch to a long break after this many pomodoros
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={settings.darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Auto Start Breaks
                </span>
                <button className={`w-12 h-6 rounded-full relative ${settings.autoStartBreaks ? 'bg-blue-600' : settings.darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} onClick={() => toggleSetting('autoStartBreaks')}>
                  <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.autoStartBreaks ? 'right-0.5' : 'left-0.5'} shadow`}></span>
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className={settings.darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Auto Start Pomodoros
                </span>
                <button className={`w-12 h-6 rounded-full relative ${settings.autoStartPomodoros ? 'bg-blue-600' : settings.darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} onClick={() => toggleSetting('autoStartPomodoros')}>
                  <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.autoStartPomodoros ? 'right-0.5' : 'left-0.5'} shadow`}></span>
                </button>
              </div>
            </div>
          </div>
          {/* Sound Settings */}
          <div>
            <h3 className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              SOUND
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'} block mb-2`}>
                  Alarm Sound
                </label>
                <div className="flex items-center space-x-2">
                  <select value={settings.sound?.alarmSound || 'kitchen'} onChange={e => updateSoundSetting('alarmSound', e.target.value)} className={`flex-grow p-2 rounded ${settings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}>
                    <option value="kitchen">Alarm Clock</option>
                    <option value="digital">Digital</option>
                    <option value="bell">Pager</option>
                  </select>
                  <input type="range" min="0" max="100" value={settings.sound?.alarmVolume || 50} onChange={e => updateSoundSetting('alarmVolume', parseInt(e.target.value))} className="w-24" />
                </div>
                <div className="flex items-center mt-2">
                  <span className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>
                    Repeat
                  </span>
                  <input type="number" min="1" max="10" value={settings.sound?.alarmRepeat || 1} onChange={e => updateSoundSetting('alarmRepeat', parseInt(e.target.value))} className={`w-16 p-1 rounded ${settings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`} />
                </div>
              </div>
            </div>
          </div>
          {/* Data Management */}
          <div>
            <h3 className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              DATA MANAGEMENT
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <p className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Export your productivity data for analysis in spreadsheet applications.
                </p>
                <button
                  onClick={() => downloadTaskHistoryCSV()}
                  className={`flex items-center justify-center w-full py-2 px-4 rounded ${settings.darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white transition`}
                >
                  <FileTextIcon size={16} className="mr-2" />
                  Export as CSV
                </button>
                <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  CSV format can be opened in Excel or Google Sheets for data analysis
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <p className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Import previously exported data.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json"
                  className="hidden"
                  id="data-import"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center justify-center w-full py-2 px-4 rounded ${settings.darkMode ? 'bg-blue-600/80 hover:bg-blue-700' : 'bg-indigo-600/80 hover:bg-indigo-700'} text-white transition`}
                >
                  <UploadIcon size={16} className="mr-2" />
                  Import Data
                </button>
                
                {importStatus && (
                  <p className={`text-sm mt-2 ${importStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {importStatus === 'success' 
                      ? 'Data imported successfully! Reloading...' 
                      : 'Failed to import data. Please check the file and try again.'}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Dark Mode Toggle */}
          <div>
            <h3 className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              APPEARANCE
            </h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <MoonIcon className={`mr-2 ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`} size={20} />
                <span className={settings.darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Dark Mode
                </span>
              </div>
              <button className={`w-12 h-6 rounded-full relative ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-200'}`} onClick={() => toggleSetting('darkMode')}>
                <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.darkMode ? 'right-0.5' : 'left-0.5'} shadow`}></span>
              </button>
            </div>
          </div>
          <button className={`w-full py-2 rounded-md transition ${settings.darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'} sticky bottom-0`} onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>;
};