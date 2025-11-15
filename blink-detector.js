// console.log('This is a popup!');

// blink-detector.js
// Content script that injects TensorFlow and handles UI

console.log("👼 Blinky Angel loaded!");

// ============================================
// STEP 1: Inject the TensorFlow script
// ============================================
function injectTensorFlowScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('tf-inject.js');
  script.type = "text/javascript";
  (document.head || document.documentElement).appendChild(script);
  
  script.onload = () => {
    console.log("✅ TensorFlow script injected!");
    script.remove(); // Clean up
  };
  
  script.onerror = () => {
    console.error("❌ Failed to inject TensorFlow script");
  };
}

// Inject the script
injectTensorFlowScript();

// ============================================
// STEP 2: Create Blinky Angel widget
// ============================================
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
  
  // Add hover effect
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

// ============================================
// STEP 3: Listen for messages from tf-inject.js
// ============================================
let lastReminderTime = 0;

window.addEventListener("message", (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  if (event.data?.source !== "BlinkyAngelCV") return;
  
  const { type, data, message } = event.data;
  
  switch (type) {
    case "BLINK_DETECTED":
      console.log("Blink rate:", data.blinksPerMinute, "blinks/min");
      // Update widget (optional: show blink count)
      widget.textContent = '😊';
      setTimeout(() => {
        widget.textContent = '👁️';
      }, 200);
      break;
      
    case "LOW_BLINK_RATE":
      const now = Date.now();
      // Only show reminder every 30 seconds
      if (now - lastReminderTime > 30000) {
        showBlinkReminder();
        lastReminderTime = now;
      }
      break;
      
    case "ERROR":
      console.error("CV Error:", message);
      showError(message);
      break;
  }
});

// ============================================
// STEP 4: Reminder functions
// ============================================
function showBlinkReminder() {
  // Animate widget
  widget.style.transform = 'scale(1.3)';
  widget.textContent = '😮';
  
  // Create reminder popup
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
  
  // Remove after 5 seconds
  setTimeout(() => {
    reminder.remove();
    widget.style.transform = 'scale(1)';
    widget.textContent = '👁️';
  }, 5000);
}

function showError(message) {
  widget.textContent = '⚠️';
  widget.title = message;
}

// ============================================
// STEP 5: 20-20-20 rule timer (bonus feature)
// ============================================
let sessionStartTime = Date.now();

setInterval(() => {
  const elapsed = Date.now() - sessionStartTime;
  // Every 20 minutes (1200000ms)
  if (elapsed > 0 && elapsed % 1200000 < 1000) {
    show20x20x20Reminder();
  }
}, 1000);

function show20x20x20Reminder() {
  const reminder = document.createElement('div');
  reminder.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px 40px;
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
    z-index: 9999999;
    font-family: Arial, sans-serif;
    text-align: center;
    font-size: 18px;
  `;
  reminder.innerHTML = `
    <div style="font-size: 60px; margin-bottom: 15px;">👀</div>
    <div style="font-weight: bold; font-size: 24px; margin-bottom: 10px;">20-20-20 Time!</div>
    <div style="margin-bottom: 15px;">Look at something 20 feet away for 20 seconds</div>
    <button id="blinky-dismiss" style="
      background: white;
      color: #667eea;
      border: none;
      padding: 10px 30px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    ">Got it!</button>
  `;
  
  document.body.appendChild(reminder);
  
  document.getElementById('blinky-dismiss').onclick = () => {
    reminder.remove();
  };
  
  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (document.body.contains(reminder)) {
      reminder.remove();
    }
  }, 30000);
}

console.log("✅ Blinky Angel fully initialized!");