import React, { useState, useRef, useEffect } from 'react';

const BasicTimer: React.FC = () => {
  const [count, setCount] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start the timer
  const startTimer = () => {
    if (intervalRef.current !== null) return;
    
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setCount(prevCount => {
        if (prevCount <= 1) {
          stopTimer();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
    
    console.log('Timer started, interval ID:', intervalRef.current);
  };
  
  // Stop the timer
  const stopTimer = () => {
    if (intervalRef.current === null) return;
    
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    console.log('Timer stopped');
  };
  
  // Reset the timer
  const resetTimer = () => {
    stopTimer();
    setCount(60);
    console.log('Timer reset');
  };
  
  // Toggle the timer
  const toggleTimer = () => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        console.log('Timer cleaned up on unmount');
      }
    };
  }, []);
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 m-4 w-64 mx-auto">
      <h2 className="text-white text-xl font-bold mb-4">Basic Timer</h2>
      <div className="text-4xl font-bold text-white text-center mb-6">
        {count}
      </div>
      <div className="flex justify-center space-x-3">
        <button
          onClick={toggleTimer}
          className="px-4 py-2 rounded bg-blue-500 text-white font-medium hover:bg-blue-600"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-2 rounded bg-gray-600 text-white font-medium hover:bg-gray-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default BasicTimer; 