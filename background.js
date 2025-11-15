console.log('Background script loaded');

let timerState = {
  isRunning: false,
  phase: 'welcome',
  secondsRemaining: 0
};

let workInterval = null;
let breakInterval = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'start') {
    console.log('Starting timer!');
    startTimer();
    sendResponse({success: true});
  } else if (request.action === 'stop') {
    console.log('Stopping timer!');
    stopTimer();
    sendResponse({success: true});
  } else if (request.action === 'getState') {
    sendResponse(timerState);
  } else if (request.action === 'continue') {
    console.log('Continuing to next session!');
    startTimer();
    sendResponse({success: true});
  }
  return true;
});

function startTimer() {
  console.log('startTimer() called');
  timerState.isRunning = true;
  timerState.phase = 'working';
  timerState.secondsRemaining = 10;
  
  chrome.storage.local.set({isRunning: true});
  
  broadcastToAllTabs({action: 'showUI', phase: 'working', seconds: 10});
  
  startWorkTimer();
}

function stopTimer() {
  timerState.isRunning = false;
  chrome.storage.local.set({isRunning: false});
  
  if (workInterval) clearInterval(workInterval);
  if (breakInterval) clearInterval(breakInterval);
  
  broadcastToAllTabs({action: 'hideUI'});
}

function startWorkTimer() {
  console.log('Work timer starting...');
  
  if (workInterval) clearInterval(workInterval);
  
  workInterval = setInterval(() => {
    timerState.secondsRemaining--;
    console.log('Seconds remaining:', timerState.secondsRemaining);
    
    broadcastToAllTabs({
      action: 'updateTime', 
      seconds: timerState.secondsRemaining
    });
    
    if (timerState.secondsRemaining <= 0) {
      clearInterval(workInterval);
      console.log('Work time complete, starting break');
      startBreak();
    }
  }, 1000);
  
  setTimeout(() => {
    console.log('Hiding UI after 3 seconds');
    broadcastToAllTabs({action: 'hideUI'});
  }, 3000);
}

function startBreak() {
  console.log('Starting break');
  timerState.phase = 'break';
  let breakSeconds = 20;
  
  broadcastToAllTabs({action: 'showBreak', seconds: breakSeconds});
  
  if (breakInterval) clearInterval(breakInterval);
  
  breakInterval = setInterval(() => {
    breakSeconds--;
    broadcastToAllTabs({action: 'updateBreak', seconds: breakSeconds});
    
    if (breakSeconds <= 0) {
      clearInterval(breakInterval);
      showReady();
    }
  }, 1000);
}

function showReady() {
  console.log('Break complete, showing ready screen');
  timerState.phase = 'ready';
  broadcastToAllTabs({action: 'showReady'});
}

function broadcastToAllTabs(message) {
  console.log('Broadcasting to all tabs:', message);
  
  chrome.tabs.query({}, function(tabs) {
    console.log('Found tabs:', tabs.length);
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) {
          // Ignore errors - some tabs can't receive messages
        }
      });
    });
  });
}