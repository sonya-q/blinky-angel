// blink-detector.js
// Handles both blink detection and 20-20-20 timer UI

console.log("👼 Blinky Angel loaded!");

// ============================================
// PART 1: BLINK DETECTION
// ============================================

// Inject TensorFlow script
function injectTensorFlowScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('tf-inject.js');
  script.type = "text/javascript";
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
      reminderCooldown: 20000
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

// Create blink widget
function createBlinkyWidget() {
  const widget = document.createElement('div');
  widget.id = 'blinky-angel-widget';
  widget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 50px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transition: transform 0.3s ease;
  `;
  widget.textContent = '👁️';
  
  widget.onmouseenter = () => {
    widget.style.transform = 'scale(1.1)';
  };
  widget.onmouseleave = () => {
    widget.style.transform = 'scale(1)';
  };
  
  document.body.appendChild(widget);
  return widget;
}

const widget = createBlinkyWidget();

// Blink detection message handlers
let lastReminderTime = 0;

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "BlinkyAngelCV") return;
  
  const { type, data, message } = event.data;
  
  switch (type) {
    case "BLINK_DETECTED":
      console.log("Blink rate:", data.blinksPerMinute, "blinks/min");
      widget.textContent = '😊';
      setTimeout(() => {
        widget.textContent = '👁️';
      }, 200);
      break;
      
    case "LOW_BLINK_RATE":
      const now = Date.now();
      if (now - lastReminderTime > currentSettings.reminderCooldown) {
        showBlinkReminder();
        lastReminderTime = now;
      }
      break;
      
    case "ERROR":
      console.error("CV Error:", message);
      widget.textContent = '⚠️';
      widget.title = message;
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

function showBlinkReminder() {
  widget.style.transform = 'scale(1.3)';
  widget.textContent = '😮';
  
  const reminder = document.createElement('div');
  reminder.style.cssText = `
    position: fixed;
    bottom: 140px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 200px;
    animation: slideIn 0.3s ease;
  `;
  reminder.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">💧 Time to blink!</div>
    <div style="color: #666;">Your blink rate is low. Remember to blink regularly!</div>
  `;
  
  document.body.appendChild(reminder);
  
  setTimeout(() => {
    reminder.remove();
    widget.style.transform = 'scale(1)';
    widget.textContent = '👁️';
  }, 5000);
}

// ============================================
// PART 2: 20-20-20 TIMER UI
// ============================================

let timerContainer = null;

function createTimerUI() {
  if (document.getElementById('timer-container')) {
    timerContainer = document.getElementById('timer-container');
    return;
  }

  timerContainer = document.createElement('div');
  timerContainer.id = 'timer-container';
  timerContainer.className = 'timer-popup hidden';
  timerContainer.innerHTML = `
    <div id="workingScreen" class="hidden">
      <div class="angel">✨</div>
      <h1>I'm watching over you</h1>
      <p>Next break in: <span id="timeRemaining">20:00</span></p>
      <p class="small-note">Will disappear in 3 seconds</p>
    </div>

    <div id="breakScreen" class="hidden">
      <div class="angel">👀</div>
      <h1>Time for a break!</h1>
      <p>Look 20 feet away</p>
      <div class="timer-display" id="breakTimer">20</div>
      <p class="small-note">seconds remaining</p>
    </div>

    <div id="readyScreen" class="hidden">
      <div class="angel">💪</div>
      <h1>Great job!</h1>
      <p>Ready for next session?</p>
      <button id="continueButton">Continue</button>
    </div>
  `;

  document.body.appendChild(timerContainer);
  
  document.getElementById('continueButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({action: 'continue'});
  });
}

createTimerUI();

function showTimerScreen(screenName) {
  document.getElementById('workingScreen').classList.add('hidden');
  document.getElementById('breakScreen').classList.add('hidden');
  document.getElementById('readyScreen').classList.add('hidden');
  
  document.getElementById(screenName + 'Screen').classList.remove('hidden');
}

function updateTimeDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  document.getElementById('timeRemaining').textContent = 
    `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function updateBreakDisplay(seconds) {
  document.getElementById('breakTimer').textContent = seconds;
}

// ============================================
// PART 3: MESSAGE HANDLERS (Both Features)
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
    showTimerScreen('working');
    updateTimeDisplay(request.seconds);
    timerContainer.classList.remove('hidden');
  } else if (request.action === 'hideUI') {
    timerContainer.classList.add('hidden');
  } else if (request.action === 'updateTime') {
    updateTimeDisplay(request.seconds);
  } else if (request.action === 'showBreak') {
    showTimerScreen('break');
    updateBreakDisplay(request.seconds);
    timerContainer.classList.remove('hidden');
  } else if (request.action === 'updateBreak') {
    updateBreakDisplay(request.seconds);
  } else if (request.action === 'showReady') {
    showTimerScreen('ready');
    timerContainer.classList.remove('hidden');
  }
});

console.log("✅ Blinky Angel fully initialized!");