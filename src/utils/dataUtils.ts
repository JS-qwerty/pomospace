/**
 * Data utility functions for PomoSpace
 * Handles export and import of user data
 */

// Keys used in localStorage
const STORAGE_KEYS = {
  TIMER_STATE: 'pomoSpaceTimerState',
  SETTINGS: 'pomoSpaceSettings',
  TASKS: 'pomoSpaceTasks',
  TASK_HISTORY: 'pomoSpaceTaskHistory',
  ACTIVE_TASK: 'pomoSpaceActiveTask'
};

// Export all user data to a JSON object
export const exportUserData = (): string => {
  const userData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {} as Record<string, any>
  };
  
  // Collect all data from localStorage
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        userData.data[key] = JSON.parse(value);
      }
    } catch (error) {
      console.error(`Error exporting ${key}:`, error);
    }
  });
  
  return JSON.stringify(userData, null, 2);
};

// Import user data from a JSON string
export const importUserData = (jsonData: string): boolean => {
  try {
    const userData = JSON.parse(jsonData);
    
    // Simple validation
    if (!userData.version || !userData.data) {
      throw new Error('Invalid data format');
    }
    
    // Import each data item to localStorage
    Object.entries(userData.data).forEach(([key, value]) => {
      if (Object.values(STORAGE_KEYS).includes(key)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Download data as a JSON file
export const downloadUserData = () => {
  const data = exportUserData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Create filename with date
  const date = new Date().toISOString().split('T')[0];
  a.download = `pomospace-data-${date}.json`;
  a.href = url;
  a.click();
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Convert task history to CSV format
 * Makes data more accessible for non-technical users
 */
export const exportTaskHistoryAsCSV = (): string => {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.TASK_HISTORY);
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    
    if (!savedHistory) return '';
    
    const taskHistory = JSON.parse(savedHistory);
    const tasks = savedTasks ? JSON.parse(savedTasks) : [];
    
    // Create a map of task IDs to their completed pomodoros
    const taskPomodoroMap = new Map();
    tasks.forEach((task: { id: string; completedPomodoros?: number }) => {
      if (task.id && task.completedPomodoros !== undefined) {
        taskPomodoroMap.set(task.id, task.completedPomodoros);
      }
    });
    
    // Define CSV headers
    const headers = ['Date', 'Task', 'Category', 'Minutes', 'Completed Pomodoros'];
    
    // Initialize with header row
    const csvRows = [headers.join(',')];
    
    // Add task history rows
    for (const entry of taskHistory) {
      // Get actual completed pomodoros for this task
      const completedPomodoros = taskPomodoroMap.get(entry.taskId) || 0;
      
      // Format each field properly for CSV
      const formattedRow = [
        entry.date || '',
        `"${(entry.taskName || '').replace(/"/g, '""')}"`, // Escape quotes in task names
        `"${(entry.category || 'Uncategorized').replace(/"/g, '""')}"`,
        entry.minutes || 0,
        completedPomodoros
      ];
      
      csvRows.push(formattedRow.join(','));
    }
    
    return csvRows.join('\n');
  } catch (error) {
    console.error('Error creating CSV:', error);
    return '';
  }
};

/**
 * Download task history as a CSV file
 * More accessible format for spreadsheet analysis
 */
export const downloadTaskHistoryCSV = () => {
  const csvData = exportTaskHistoryAsCSV();
  
  if (!csvData) {
    console.error('No data to export');
    return;
  }
  
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Create filename with date
  const date = new Date().toISOString().split('T')[0];
  a.download = `pomospace-history-${date}.csv`;
  a.href = url;
  a.click();
  
  // Clean up
  URL.revokeObjectURL(url);
};

// Load data from a file input element
export const handleFileUpload = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        const result = importUserData(event.target.result as string);
        resolve(result);
      } else {
        resolve(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      resolve(false);
    };
    
    reader.readAsText(file);
  });
}; 