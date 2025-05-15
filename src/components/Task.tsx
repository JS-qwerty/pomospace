import React, { useState } from 'react';
import { CheckIcon, TrashIcon, PencilIcon, FlagIcon, ChevronDownIcon } from 'lucide-react';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface TaskProps {
  task: TaskItem;
  timerMode: string;
  darkMode: boolean;
  onToggleComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  onUpdate: (text: string, pomodoros: number, category?: string, priority?: string) => void;
  onIncrementPomodoro: () => void;
  isActive?: boolean;
}

// Pre-defined categories
const CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Learning', 'Other'];

// Priority options
const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'blue' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'red' }
];

export const Task: React.FC<TaskProps> = ({
  task,
  timerMode,
  darkMode,
  onToggleComplete,
  onDelete,
  onEdit,
  isEditing,
  onUpdate,
  onIncrementPomodoro,
  isActive
}) => {
  const [editText, setEditText] = useState(task.text);
  const [editPomodoros, setEditPomodoros] = useState(task.estimatedPomodoros);
  const [editCategory, setEditCategory] = useState(task.category || 'Other');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>(task.priority || 'medium');
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showPrioritySelect, setShowPrioritySelect] = useState(false);
  
  const getPriorityColor = (priority: string = 'medium') => {
    switch(priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleUpdate = () => {
    if (editText.trim() === '') return;
    onUpdate(editText, editPomodoros, editCategory, editPriority);
  };

  if (isEditing) {
    return (
      <div className="bg-white/10 p-4 rounded-lg">
        <input 
          type="text" 
          className="w-full p-3 bg-white/10 border-0 rounded-lg text-white mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={editText} 
          onChange={e => setEditText(e.target.value)} 
          autoFocus 
        />
        
        <div className="flex flex-col sm:flex-row sm:justify-between mb-3 space-y-3 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-shrink-0 items-center justify-between bg-white/10 rounded-lg mb-1 sm:mb-0 px-1 sm:px-0">
              <button 
                className="w-9 sm:w-9 h-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 rounded-lg sm:rounded-none transform hover:scale-110 active:scale-95 transition-all duration-150"
                onClick={() => setEditPomodoros(Math.max(1, editPomodoros - 1))}
              >
                -
              </button>
              <span className="w-9 sm:w-9 h-9 sm:h-9 flex items-center justify-center text-white">
                {editPomodoros}
              </span>
              <button 
                className="w-9 sm:w-9 h-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 rounded-lg sm:rounded-none transform hover:scale-110 active:scale-95 transition-all duration-150"
                onClick={() => setEditPomodoros(editPomodoros + 1)}
              >
                +
              </button>
            </div>
            
            <div className="relative flex-1 min-w-[140px]">
              <button
                onClick={() => setShowCategorySelect(!showCategorySelect)}
                className="flex items-center bg-white/10 h-10 sm:h-9 px-3 rounded-lg text-white hover:bg-white/20 active:bg-white/30 transition-all duration-150 w-full justify-between"
              >
                <span className="truncate max-w-[100px]">{editCategory}</span>
                <ChevronDownIcon size={16} className="ml-1 flex-shrink-0" />
              </button>
              
              {showCategorySelect && (
                <div className="absolute z-50 mt-1 bg-indigo-600/95 backdrop-blur-md rounded-lg shadow-lg w-full">
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        className={`w-full text-left px-3 py-2 text-white hover:bg-indigo-700/70 active:bg-indigo-700/80 transition-colors duration-150 ${editCategory === category ? 'font-medium bg-indigo-700/50' : ''}`}
                        onClick={() => {
                          setEditCategory(category);
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
            
            <div className="relative flex-1 min-w-[140px]">
              <button
                onClick={() => setShowPrioritySelect(!showPrioritySelect)}
                className="flex items-center bg-white/10 h-10 sm:h-9 px-3 rounded-lg text-white hover:bg-white/20 active:bg-white/30 transition-all duration-150 w-full justify-between"
              >
                <div className="flex items-center">
                  <FlagIcon size={14} className="mr-1 flex-shrink-0" />
                  <span className="truncate max-w-[80px]">{PRIORITIES.find(p => p.value === editPriority)?.label || 'Medium'}</span>
                </div>
                <ChevronDownIcon size={16} className="ml-1 flex-shrink-0" />
              </button>
              
              {showPrioritySelect && (
                <div className="absolute z-50 mt-1 bg-indigo-600/95 backdrop-blur-md rounded-lg shadow-lg w-full">
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {PRIORITIES.map(priority => (
                      <button
                        key={priority.value}
                        className={`w-full text-left px-3 py-2 text-white hover:bg-indigo-700/70 active:bg-indigo-700/80 transition-colors duration-150 ${editPriority === priority.value ? 'font-medium bg-indigo-700/50' : ''}`}
                        onClick={() => {
                          setEditPriority(priority.value as 'low' | 'medium' | 'high');
                          setShowPrioritySelect(false);
                        }}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button 
            className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-lg transition-all duration-150"
            onClick={() => onUpdate(task.text, task.estimatedPomodoros, task.category)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transform hover:scale-105 active:scale-95 transition-all duration-150"
            onClick={handleUpdate}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg flex flex-wrap items-center p-4 group hover:shadow-md transition-shadow duration-200 ${isActive ? 'ring-2 ring-green-400' : ''}`}>
      <button 
        className={`w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 hover:scale-110 active:scale-95 transition-all duration-150 ${
          task.completed ? 'bg-gray-200' : 'bg-white hover:bg-gray-100 active:bg-gray-200'
        }`}
        onClick={onToggleComplete}
      >
        {task.completed && <CheckIcon size={14} className="text-gray-500" />}
      </button>
      
      <div className="ml-3 flex-grow min-w-0">
        <div className="flex flex-wrap items-center gap-y-1 gap-x-2">
          <span className={`${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'} truncate`}>
            {task.text}
          </span>
          
          {task.category && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {task.category}
            </span>
          )}
          
          {task.priority && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              <FlagIcon size={12} className="mr-1" />
              {PRIORITIES.find(p => p.value === task.priority)?.label}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-gray-500 mr-2 mt-1 sm:mt-0 ml-auto sm:ml-0 order-3 sm:order-none">
        {task.completedPomodoros}/{task.estimatedPomodoros}
      </div>
      
      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
        <button 
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-full transform hover:scale-110 active:scale-95 transition-all duration-150"
          onClick={onEdit}
        >
          <PencilIcon size={16} />
        </button>
        <button 
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-full transform hover:scale-110 active:scale-95 transition-all duration-150"
          onClick={onDelete}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
};