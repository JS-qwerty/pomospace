import React, { useState, useEffect } from 'react';

const SimpleTimer: React.FC = () => {
  const [seconds, setSeconds] = useState(300); // 5 minutes
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    console.log('SimpleTimer effect, isActive:', isActive, 'seconds:', seconds);
    let intervalId: NodeJS.Timeout;

    if (isActive && seconds > 0) {
      console.log('Starting simple timer interval');
      intervalId = setInterval(() => {
        console.log('Simple timer tick');
        setSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      console.log('Timer complete');
      setIsActive(false);
    }

    return () => {
      if (intervalId) {
        console.log('Clearing simple timer interval');
        clearInterval(intervalId);
      }
    };
  }, [isActive, seconds]);

  const toggleTimer = () => {
    console.log('Toggle simple timer:', !isActive);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    console.log('Reset simple timer');
    setIsActive(false);
    setSeconds(300);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto my-8">
      <h2 className="text-xl font-bold text-white mb-4">Simple Timer Test</h2>
      <div className="text-5xl font-bold text-white text-center my-6">
        {formatTime(seconds)}
      </div>
      <div className="flex justify-center space-x-4">
        <button
          className="bg-white/90 hover:bg-white text-gray-800 px-6 py-2 rounded-md font-bold"
          onClick={toggleTimer}
        >
          {isActive ? 'PAUSE' : 'START'}
        </button>
        <button
          className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-md"
          onClick={resetTimer}
        >
          RESET
        </button>
      </div>
    </div>
  );
};

export default SimpleTimer; 