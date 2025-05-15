import React, { useEffect, useState } from 'react';
import { PlusIcon, MinusIcon, ChevronDownIcon, PlayIcon, FlagIcon, ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { Task } from './Task';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface TaskHistoryItem {
  id: string;
  taskId: string;
  taskName: string;
  date: string;
  minutes: number;
  category?: string;
}

interface TaskListProps {
  timerMode: string;
  darkMode: boolean;
  activeTaskId: string | null;
  setActiveTaskId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Pre-defined categories
const CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Learning', 'Other'];

// Priority options
const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'blue' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'red' }
];

export const TaskList: React.FC<TaskListProps> = ({
  timerMode,
  darkMode,
  activeTaskId,
  setActiveTaskId
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const savedTasks = localStorage.getItem('pomoSpaceTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [newTaskText, setNewTaskText] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('Work');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showPrioritySelect, setShowPrioritySelect] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'none'>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>(() => {
    const savedHistory = localStorage.getItem('pomoSpaceTaskHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pomoSpaceTasks', JSON.stringify(tasks));
  }, [tasks]);
  
  // Save task history to localStorage
  useEffect(() => {
    localStorage.setItem('pomoSpaceTaskHistory', JSON.stringify(taskHistory));
  }, [taskHistory]);
  
  const addTask = () => {
    if (newTaskText.trim() === '') return;
    
    const newTask: TaskItem = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      estimatedPomodoros: estimatedPomodoros,
      completedPomodoros: 0,
      category: selectedCategory,
      priority: selectedPriority
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText('');
    setEstimatedPomodoros(1);
    setShowCategorySelect(false);
    setShowPrioritySelect(false);
  };
  
  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? {
      ...task,
      completed: !task.completed
    } : task));
    
    // If a completed task was the active task, clear the active task
    if (id === activeTaskId) {
      const task = tasks.find(t => t.id === id);
      if (task && !task.completed) {
        setActiveTaskId(null);
      }
    }
  };
  
  const deleteTask = (id: string) => {
    // If deleting the active task, clear the active task
    if (id === activeTaskId) {
      setActiveTaskId(null);
    }
    
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  const updateTask = (id: string, text: string, estimatedPomodoros: number, category?: string, priority?: string) => {
    setTasks(tasks.map(task => task.id === id ? {
      ...task,
      text,
      estimatedPomodoros,
      category: category || task.category,
      priority: (priority as 'low' | 'medium' | 'high') || task.priority
    } : task));
    setEditingTask(null);
  };
  
  const incrementPomodoro = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      addTaskToHistory(id, task.text, 25, task.category); // Assuming 25 minutes per pomodoro
      setTasks(tasks.map(task => task.id === id ? {
        ...task,
        completedPomodoros: task.completedPomodoros + 1
      } : task));
    }
  };
  
  const addTaskToHistory = (taskId: string, taskName: string, minutes: number, category?: string) => {
    const newHistoryItem: TaskHistoryItem = {
      id: Date.now().toString(),
      taskId,
      taskName,
      date: new Date().toISOString().split('T')[0],
      minutes,
      category
    };
    setTaskHistory(prev => [...prev, newHistoryItem]);
  };
  
  // Set a task as active for the current pomodoro
  const setTaskActive = (id: string) => {
    setActiveTaskId(id === activeTaskId ? null : id);
  };
  
  // Get sorted tasks
  const getSortedTasks = () => {
    if (sortBy === 'none') return tasks;
    
    const priorityValues = { high: 3, medium: 2, low: 1, undefined: 0 };
    
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const aPriority = priorityValues[a.priority as keyof typeof priorityValues] || 0;
        const bPriority = priorityValues[b.priority as keyof typeof priorityValues] || 0;
        
        return sortDirection === 'desc' 
          ? bPriority - aPriority 
          : aPriority - bPriority;
      }
      return 0;
    });
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  return (
    <div className="w-full p-6">
      <h2 className="text-3xl font-bold text-white mb-6">
        Tasks
      </h2>
      
      {/* Task Input */}
      <div className="mb-8">
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="What are you working on?" 
            className="w-full p-4 bg-white/10 border-0 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-white/30 placeholder-white/70" 
            value={newTaskText} 
            onChange={e => setNewTaskText(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && addTask()} 
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-3 mb-4">
          {/* Pomodoro Counter */}
          <div className="flex items-center">
            <span className="text-white mr-2 w-[100px] sm:w-auto">Pomodoros:</span>
            <div className="inline-flex items-center justify-between bg-indigo-500/30 rounded-lg h-10 flex-1 max-w-[180px] px-1 sm:px-0">
              <button 
                className="w-9 sm:w-8 h-9 sm:h-10 flex items-center justify-center text-white hover:bg-indigo-500/40 active:bg-indigo-500/60 transition-all duration-150 rounded-lg sm:rounded-l-lg sm:rounded-r-none"
                onClick={() => setEstimatedPomodoros(Math.max(1, estimatedPomodoros - 1))}
              >
                −
              </button>
              <span className="w-9 sm:w-8 h-9 sm:h-10 flex items-center justify-center text-white text-lg font-medium">
                {estimatedPomodoros}
              </span>
              <button 
                className="w-9 sm:w-8 h-9 sm:h-10 flex items-center justify-center text-white hover:bg-indigo-500/40 active:bg-indigo-500/60 transition-all duration-150 rounded-lg sm:rounded-r-lg sm:rounded-l-none"
                onClick={() => setEstimatedPomodoros(estimatedPomodoros + 1)}
              >
                +
              </button>
            </div>
          </div>
          
          {/* Category selector */}
          <div className="flex items-center justify-start">
            <span className="text-white mr-2 w-[100px] sm:w-auto">Category:</span>
            <div className="relative flex-grow max-w-xs">
              <button
                onClick={() => setShowCategorySelect(!showCategorySelect)}
                className="flex items-center bg-indigo-500/30 px-3 py-0 rounded-lg text-white hover:bg-indigo-500/40 transition-colors duration-200 justify-between h-10 w-full"
              >
                <span className="truncate">{selectedCategory}</span>
                <ChevronDownIcon size={16} className="ml-1 flex-shrink-0 transition-transform duration-200" style={{ transform: showCategorySelect ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              
              {showCategorySelect && (
                <div className="absolute z-50 mt-1 rounded-lg shadow-lg bg-indigo-600/95 backdrop-blur-md w-full">
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        className={`w-full text-left px-3 py-2 text-white hover:bg-indigo-700/70 transition-colors duration-200 ${selectedCategory === category ? 'font-semibold bg-indigo-700/50' : ''}`}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowCategorySelect(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Priority selector */}
          <div className="flex items-center justify-start">
            <span className="text-white mr-2 w-[100px] sm:w-auto">Priority:</span>
            <div className="relative flex-grow max-w-xs">
              <button
                onClick={() => setShowPrioritySelect(!showPrioritySelect)}
                className="flex items-center bg-indigo-500/30 px-3 py-0 rounded-lg text-white hover:bg-indigo-500/40 transition-colors duration-200 justify-between h-10 w-full"
              >
                <div className="flex items-center overflow-hidden">
                  <FlagIcon size={16} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{PRIORITIES.find(p => p.value === selectedPriority)?.label}</span>
                </div>
                <ChevronDownIcon size={16} className="ml-1 flex-shrink-0 transition-transform duration-200" style={{ transform: showPrioritySelect ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              
              {showPrioritySelect && (
                <div className="absolute z-50 mt-1 rounded-lg shadow-lg bg-indigo-600/95 backdrop-blur-md w-full right-0">
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {PRIORITIES.map(priority => (
                      <button
                        key={priority.value}
                        className={`w-full text-left px-3 py-2 text-white hover:bg-indigo-700/70 transition-colors duration-200 flex items-center ${selectedPriority === priority.value ? 'font-semibold bg-indigo-700/50' : ''}`}
                        onClick={() => {
                          setSelectedPriority(priority.value as 'low' | 'medium' | 'high');
                          setShowPrioritySelect(false);
                        }}
                      >
                        <FlagIcon size={14} className="mr-1 flex-shrink-0" style={{ color: priority.color === 'red' ? '#f56565' : priority.color === 'yellow' ? '#ecc94b' : '#4299e1' }} />
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Add Task button - Now positioned below all options and with a more distinctive color */}
        <div className="flex justify-center mt-4">
          <button 
            className="bg-white hover:bg-white/90 active:bg-white/80 text-indigo-900 px-8 py-3 rounded-lg flex items-center justify-center transition-all duration-150 font-medium text-base shadow-md"
            onClick={addTask}
          >
            <PlusIcon size={20} className="mr-2" />
            Add Task
          </button>
        </div>
      </div>
      
      {/* Task List Header - For sorting options */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap justify-between items-center mb-4 relative z-10 gap-2">
          <h3 className="text-xl font-semibold text-white">Your Tasks</h3>
          <div className="flex items-center">
            <div className="flex items-center">
              <button 
                onClick={() => {
                  setSortBy(sortBy === 'priority' ? 'none' : 'priority');
                  if (sortBy !== 'priority') setSortDirection('desc'); // Default to high-to-low
                }}
                className={`flex items-center px-2 sm:px-3 py-1.5 rounded-lg ${sortBy === 'priority' ? 'mr-0 sm:mr-2' : 'mr-2'} transition-colors ${
                  sortBy === 'priority' 
                    ? 'bg-indigo-500/50 text-white rounded-r-none sm:rounded-r-lg' 
                    : 'bg-indigo-500/20 text-white/70 hover:bg-indigo-500/30 hover:text-white'
                }`}
              >
                <FlagIcon size={12} className="mr-1 sm:mr-1.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">Sort by Priority</span>
              </button>
              
              {sortBy === 'priority' && (
                <button 
                  onClick={toggleSortDirection}
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-r-lg rounded-l-none sm:rounded-full bg-indigo-500/50 sm:bg-indigo-500/30 text-white hover:bg-indigo-500/50 transition-colors"
                >
                  {sortDirection === 'desc' ? <ArrowDownIcon size={12} className="sm:hidden" /> : <ArrowUpIcon size={12} className="sm:hidden" />}
                  {sortDirection === 'desc' ? <ArrowDownIcon size={14} className="hidden sm:block" /> : <ArrowUpIcon size={14} className="hidden sm:block" />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Task List */}
      <div className="space-y-2 relative" style={{ zIndex: 1 }}>
        {tasks.length === 0 ? (
          <p className="text-center py-8 text-white/60">
            No tasks yet. Add a task to get started!
          </p>
        ) : (
          getSortedTasks().map(task => (
            <div key={task.id} className="relative group">
              <Task 
                task={task} 
                timerMode={timerMode} 
                darkMode={darkMode} 
                onToggleComplete={() => toggleTaskCompletion(task.id)} 
                onDelete={() => deleteTask(task.id)} 
                onEdit={() => setEditingTask(task.id)} 
                isEditing={editingTask === task.id} 
                onUpdate={(text, pomodoros, category, priority) => updateTask(task.id, text, pomodoros, category, priority)} 
                onIncrementPomodoro={() => incrementPomodoro(task.id)} 
                isActive={task.id === activeTaskId}
              />
              
              {!task.completed && (
                <button 
                  className={`absolute right-16 top-1/2 -translate-y-1/2 p-2 rounded-full 
                    ${task.id === activeTaskId 
                      ? 'bg-green-500/30 text-green-300' 
                      : 'bg-indigo-500/30 text-white/70'} 
                    hover:bg-indigo-500/50 transition-all duration-200 opacity-0 group-hover:opacity-100`}
                  onClick={() => setTaskActive(task.id)}
                  title={task.id === activeTaskId ? "Current active task" : "Select as active task"}
                >
                  <PlayIcon size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Active Task Indicator */}
      {activeTaskId && (
        <div className="mt-6 p-4 bg-white/10 rounded-lg text-white/80 text-sm">
          <div className="flex flex-wrap items-center">
            <span className="mr-2">🔥</span> 
            <span>
              Currently focusing on: <span className="font-medium text-white break-words">
                {tasks.find(t => t.id === activeTaskId)?.text || "Selected task"}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};