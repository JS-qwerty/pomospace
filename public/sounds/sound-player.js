// Global audio context
let audioContext;

// Initialize audio context on user interaction
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log("Audio context initialized!");
  } catch (e) {
    console.error("Could not create audio context:", e);
  }
}

// Play a sound with proper browser support
function playSound(soundPath, volume = 0.5, loop = false) {
  if (!audioContext) {
    initAudio();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  // Create audio element
  const audio = new Audio(soundPath);
  audio.volume = volume;
  audio.loop = loop;
  
  // Play with a promise and fallback
  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch(error => {
      console.error('Playback failed:', error);
    });
  }
  
  return audio;
}

// Play an alarm sound with repeats
function playAlarm(soundPath, volume = 0.5, repeatCount = 1) {
  if (!audioContext) {
    initAudio();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const alarm = new Audio(soundPath);
  alarm.volume = volume;
  
  // Track alarm instances to control them
  const alarmInstances = [];
  
  // Fixed duration for each alarm sound (3 seconds)
  const ALARM_DURATION = 3000; // 3 seconds
  
  // Play each repeat with exact timing
  for (let i = 0; i < repeatCount; i++) {
    setTimeout(() => {
      // Create a new audio instance for each play to avoid timing issues
      const alarmInstance = new Audio(soundPath);
      alarmInstance.volume = volume;
      alarmInstances.push(alarmInstance);
      
      // Start playing
      const playPromise = alarmInstance.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.error('Alarm playback failed:', error);
        });
      }
      
      // Stop this instance after exactly 3 seconds
      setTimeout(() => {
        alarmInstance.pause();
        alarmInstance.currentTime = 0;
        
        // Remove from tracking array
        const index = alarmInstances.indexOf(alarmInstance);
        if (index > -1) {
          alarmInstances.splice(index, 1);
        }
      }, ALARM_DURATION);
      
    }, i * ALARM_DURATION); // Precise timing between repeats
  }
  
  // Return an object with method to stop all alarm instances
  return {
    stop: function() {
      alarmInstances.forEach(instance => {
        instance.pause();
        instance.currentTime = 0;
      });
      alarmInstances.length = 0;
    }
  };
}

// Make sure to initialize audio on first user interaction
document.addEventListener('click', function initOnFirstClick() {
  initAudio();
  document.removeEventListener('click', initOnFirstClick);
}, { once: true });

window.SoundPlayer = {
  playSound,
  playAlarm
}; 