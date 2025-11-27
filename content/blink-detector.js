// blink-detector.js
// Unified Pig Widget - Handles both blink reminders and 20-20-20 timer

console.log("🐷 Blinky Angel (Pig Edition) loaded!");

// ============================================
// PART 1: PIG WIDGET SETUP
// ============================================

let pigWidget = null;
let pigSpeechBubble = null;
let hoverZone = null;
let isHidden = false;
let currentPigState = 'idle'; // idle, blinking, happy, talking

// Pig image states
const PIG_IMAGES = {
  idle: chrome.runtime.getURL('assets/EyesOpen.png'),
  blinking: chrome.runtime.getURL('assets/EyesClosed.png'),
  happy: chrome.runtime.getURL('assets/Happy.png'),
  lookingAround: chrome.runtime.getURL('assets/sideToSide.png')
};

function createPigWidget() {
  // Create main pig container
  pigWidget = document.createElement('div');
  pigWidget.id = 'pig-widget';
  pigWidget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 180px;
    height: 180px;
    z-index: 999999;
    cursor: pointer;
    transition: all 0.3s ease;
    display: block;
  `;
  
  // Create pig image
  const pigImage = document.createElement('img');
  pigImage.id = 'pig-image';
  pigImage.src = PIG_IMAGES.idle;
  pigImage.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    transition: transform 0.3s ease;
  `;
  
  pigWidget.appendChild(pigImage);
  
  // Create speech bubble
  pigSpeechBubble = document.createElement('div');
  pigSpeechBubble.id = 'pig-speech';
  pigSpeechBubble.style.cssText = `
    position: absolute;
    bottom: 190px;
    right: 0;
    background: white;
    color: #333;
    padding: 12px 16px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 250px;
    display: none;
    z-index: 1000000;
    animation: bounceIn 0.4s ease;
  `;
  
  // Speech bubble arrow
  const arrow = document.createElement('div');
  arrow.style.cssText = `
    position: absolute;
    bottom: -8px;
    right: 20px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid white;
  `;
  pigSpeechBubble.appendChild(arrow);
  
  // Close button on speech bubble
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 4px;
    right: 4px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 24px;
    height: 24px;
    line-height: 20px;
  `;
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    hideSpeech();
  };
  pigSpeechBubble.appendChild(closeBtn);
  
  // Message container
  const messageDiv = document.createElement('div');
  messageDiv.id = 'pig-message';
  messageDiv.style.paddingRight = '20px';
  pigSpeechBubble.appendChild(messageDiv);
  
  pigWidget.appendChild(pigSpeechBubble);
  
  // Hover effects
  pigWidget.onmouseenter = () => {
    if (!isHidden) {
      pigImage.style.transform = 'scale(1.1) rotate(-5deg)';
    }
  };
  pigWidget.onmouseleave = () => {
    pigImage.style.transform = 'scale(1) rotate(0deg)';
  };
  
  // Click to hide/show
  pigWidget.onclick = () => {
    if (pigSpeechBubble.style.display === 'block') {
      hideSpeech();
    } else {
      togglePigVisibility();
    }
  };
  
  document.body.appendChild(pigWidget);
  
  // Create hover zone for revealing hidden pig
  createHoverZone();
  
  // Add CSS animations
  addPigAnimations();
  
  // Show initial greeting
  setTimeout(() => {
    showPigMessage("Hi! I'm here to help protect your eyes! 👁️", 'happy', 4000);
  }, 1000);
}

function createHoverZone() {
  hoverZone = document.createElement('div');
  hoverZone.id = 'pig-hover-zone';
  hoverZone.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100px;
    height: 100px;
    z-index: 999998;
    pointer-events: auto;
    display: none;
  `;
  
  hoverZone.onmouseenter = () => {
    if (isHidden) {
      showPig();
    }
  };
  
  document.body.appendChild(hoverZone);
}

function addPigAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-5deg); }
      75% { transform: rotate(5deg); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);
}

function setPigImage(state) {
  const pigImage = document.getElementById('pig-image');
  if (pigImage && PIG_IMAGES[state]) {
    pigImage.src = PIG_IMAGES[state];
    currentPigState = state;
  }
}

function showPigMessage(message, pigState = 'idle', duration = 5000, showCloseButton = true) {
  if (isHidden) {
    // Make pig visible when showing message
    showPig();
  }
  
  setPigImage(pigState);
  
  const messageDiv = document.getElementById('pig-message');
  const closeBtn = pigSpeechBubble.querySelector('button');
  
  messageDiv.innerHTML = message;
  closeBtn.style.display = showCloseButton ? 'block' : 'none';
  pigSpeechBubble.style.display = 'block';
  
  // Wiggle animation
  pigWidget.style.animation = 'wiggle 0.5s ease';
  setTimeout(() => {
    pigWidget.style.animation = '';
  }, 500);
  
  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => {
      hideSpeech();
    }, duration);
  }
}

function hideSpeech() {
  pigSpeechBubble.style.display = 'none';
  setPigImage('idle');
}

function togglePigVisibility() {
  if (isHidden) {
    showPig();
  } else {
    hidePig();
  }
}

function hidePig() {
  isHidden = true;
  pigWidget.style.transform = 'translateX(220px)';
  pigWidget.style.opacity = '0.3';
  hideSpeech();
  // Show hover zone when pig is hidden
  hoverZone.style.display = 'block';
}

function showPig() {
  isHidden = false;
  pigWidget.style.transform = 'translateX(0)';
  pigWidget.style.opacity = '1';
  // Hide hover zone when pig is visible
  hoverZone.style.display = 'none';
}

// Initialize pig widget
createPigWidget();

// ============================================
// PART 2: BLINK DETECTION INTEGRATION
// ============================================

// Inject TensorFlow script
function injectTensorFlowScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/tf-inject.js');  script.type = "text/javascript";
  (document.head || document.documentElement).appendChild(script);
  
  script.onload = () => {
    console.log("✅ TensorFlow script injected!");
    script.remove();
  };
  
  script.onerror = () => {
    console.error("❌ Failed to inject TensorFlow script");
  };
}

injectTensorFlowScript();

// Settings management
let currentSettings = {
  timeSinceLastBlink: 8000,
  minBlinksPerMinute: 10,
  reminderCooldown: 45000
};

chrome.storage.local.get(['reminderMode'], (result) => {
  const mode = result.reminderMode || 'balanced';
  loadModeSettings(mode);
});

function loadModeSettings(mode) {
  const MODES = {
    strict: {
      timeSinceLastBlink: 3000,
      minBlinksPerMinute: 12,
      reminderCooldown: 10000
    },
    balanced: {
      timeSinceLastBlink: 8000,
      minBlinksPerMinute: 10,
      reminderCooldown: 45000
    },
    gentle: {
      timeSinceLastBlink: 15000,
      minBlinksPerMinute: 7,
      reminderCooldown: 120000
    }
  };
  
  currentSettings = MODES[mode];
  console.log(`📊 Blink settings updated to ${mode} mode:`, currentSettings);
  
  // Send to page context
  window.postMessage({
    source: 'BlinkyAngelControl',
    type: 'SETTINGS_UPDATE',
    settings: currentSettings
  }, '*');
}

// Blink detection message handlers
let lastReminderTime = 0;

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "BlinkyAngelCV") return;
  
  const { type, data, message } = event.data;
  
  switch (type) {
    case "BLINK_DETECTED":
      console.log("Blink rate:", data.blinksPerMinute, "blinks/min");
      // Quick blink animation
      setPigImage('blinking');
      setTimeout(() => {
        setPigImage('idle');
      }, 150);
      break;
      
    case "LOW_BLINK_RATE":
      const now = Date.now();
      if (now - lastReminderTime > currentSettings.reminderCooldown) {
        showBlinkReminder(data.blinksPerMinute);
        lastReminderTime = now;
      }
      break;
      
    case "ERROR":
      console.error("CV Error:", message);
      showPigMessage(`⚠️ ${message}`, 'idle', 5000);
      break;
      
    case "STATS_UPDATE":
      chrome.storage.local.set({ stats: data.stats });
      chrome.runtime.sendMessage({
        type: 'STATS_UPDATE',
        stats: data.stats
      }).catch(() => {});
      break;
      
    case "REQUEST_SETTINGS":
      window.postMessage({
        source: 'BlinkyAngelControl',
        type: 'SETTINGS_UPDATE',
        settings: currentSettings
      }, '*');
      break;
  }
});

function showBlinkReminder(blinksPerMinute) {
  const messages = [
    "💧 Oink! Time to blink more!",
    "👀 Don't forget to blink, friend!",
    "💙 Your eyes need some love - blink please!",
    "✨ Blink break! Your eyes will thank you!"
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  const fullMessage = `<strong>${randomMessage}</strong><br><small>Current rate: ${blinksPerMinute}/min (healthy: 15-20/min)</small>`;
  
  showPigMessage(fullMessage, 'lookingAround', 6000);
}

// ============================================
// PART 3: 20-20-20 TIMER INTEGRATION
// ============================================

let currentTimerMessage = null;

function showTimerWorking(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;
  
  showPigMessage(
    `<strong>✨ I'm watching over you!</strong><br><small>Next break in: ${timeString}</small>`,
    'happy',
    3000,
    false
  );
}

function showTimerBreak(seconds) {
  showPigMessage(
    `<strong>👀 Time for a 20-20-20 break!</strong><br>Look 20 feet away<br><div style="font-size: 32px; font-weight: bold; margin: 8px 0; color: #764ba2;">${seconds}</div><small>seconds remaining</small>`,
    'lookingAround',
    0, // Don't auto-hide
    true
  );
}

function updateTimerBreak(seconds) {
  const messageDiv = document.getElementById('pig-message');
  if (messageDiv && pigSpeechBubble.style.display === 'block') {
    messageDiv.innerHTML = `<strong>👀 Time for a 20-20-20 break!</strong><br>Look 20 feet away<br><div style="font-size: 32px; font-weight: bold; margin: 8px 0; color: #764ba2;">${seconds}</div><small>seconds remaining</small>`;
  }
}

function showTimerReady() {
  showPigMessage(
    `<strong>💪 Great job!</strong><br>You completed your break!<br><button id="pig-continue-btn" style="margin-top: 8px; background: #764ba2; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold;">Continue</button>`,
    'happy',
    0,
    true
  );
  
  // Add continue button listener
  setTimeout(() => {
    const continueBtn = document.getElementById('pig-continue-btn');
    if (continueBtn) {
      continueBtn.onclick = () => {
        chrome.runtime.sendMessage({action: 'continue'});
        hideSpeech();
      };
    }
  }, 100);
}

// ============================================
// PART 4: MESSAGE HANDLERS (Both Features)
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Blink detection messages
  if (request.type === 'UPDATE_SETTINGS') {
    loadModeSettings(request.settings.reminderMode);
  } else if (request.type === 'TOGGLE_VIDEO') {
    window.postMessage({
      source: 'BlinkyAngelControl',
      type: 'TOGGLE_VIDEO',
      visible: request.visible
    }, '*');
  }
  
  // 20-20-20 timer messages
  else if (request.action === 'showUI') {
    showTimerWorking(request.seconds);
  } else if (request.action === 'hideUI') {
    hideSpeech();
  } else if (request.action === 'updateTime') {
    // Don't show updates, timer is hidden after 3 seconds
  } else if (request.action === 'showBreak') {
    showTimerBreak(request.seconds);
  } else if (request.action === 'updateBreak') {
    updateTimerBreak(request.seconds);
  } else if (request.action === 'showReady') {
    showTimerReady();
  }
});

console.log("✅ Blinky Angel (Pig Edition) fully initialized!");