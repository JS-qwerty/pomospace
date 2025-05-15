// Sound file mappings
export const SOUND_PATHS = {
  ticking: {
    mechanical: '/sounds/ticking-mechanical.mp3',
    digital: '/sounds/ticking-digital.mp3',
    none: ''
  },
  alarm: {
    kitchen: '/sounds/alarm-kitchen.mp3',
    digital: '/sounds/alarm-digital.mp3',
    bell: '/sounds/alarm-bell.mp3'
  }
};

// Preload audio files for better performance
export const preloadSounds = () => {
  const soundsToPreload = [
    ...Object.values(SOUND_PATHS.ticking).filter(path => path !== ''),
    ...Object.values(SOUND_PATHS.alarm)
  ];
  
  soundsToPreload.forEach(soundPath => {
    if (soundPath) {
      const audio = new Audio();
      audio.src = soundPath;
      // Just load it without playing
      audio.load();
    }
  });
};

// Helper to create an audio element with the right settings
export const createAudioElement = (
  soundType: 'ticking' | 'alarm',
  soundName: string,
  volume: number,
  loop: boolean = false
): HTMLAudioElement => {
  const audio = new Audio();
  const paths = soundType === 'ticking' ? SOUND_PATHS.ticking : SOUND_PATHS.alarm;
  const soundPath = paths[soundName as keyof typeof paths] || '';
  
  if (soundPath) {
    audio.src = soundPath;
    audio.volume = volume / 100;
    audio.loop = loop;
  }
  
  return audio;
};

// Play a sound with repeat functionality
export const playWithRepeat = (
  audio: HTMLAudioElement,
  repeatCount: number = 1
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (repeatCount <= 0 || !audio.src) {
      resolve();
      return;
    }
    
    let played = 0;
    
    const playNextRepeat = () => {
      played++;
      
      if (played >= repeatCount) {
        audio.removeEventListener('ended', playNextRepeat);
        resolve();
        return;
      }
      
      // Reset and play again
      audio.currentTime = 0;
      audio.play().catch(reject);
    };
    
    audio.addEventListener('ended', playNextRepeat);
    
    // Start the first play
    audio.currentTime = 0;
    audio.play().catch(error => {
      audio.removeEventListener('ended', playNextRepeat);
      reject(error);
    });
  });
}; 