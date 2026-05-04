console.log("Background script loaded");

let timerState = {
  isRunning: false,
  phase: "welcome",
  secondsRemaining: 0,
};

let workInterval = null;
let breakInterval = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  if (request.action === "start") {
    console.log("Starting timer!");
    startTimer();
    sendResponse({ success: true });
  } else if (request.action === "stop") {
    console.log("Stopping timer!");
    stopTimer();
    sendResponse({ success: true });
  } else if (request.action === "getState") {
    sendResponse(timerState);
  } else if (request.action === "continue") {
    console.log("Continuing to next session!");
    startTimer();
    sendResponse({ success: true });
  }
  return true;
});

function startTimer() {
  console.log("startTimer() called");
  timerState.isRunning = true;
  timerState.phase = "working";
  // 20 minutes = 1200 seconds
  timerState.secondsRemaining = 20 * 60;

  chrome.storage.local.set({
    isRunning: true,
    timerState: {
      isRunning: true,
      phase: "working",
      secondsRemaining: timerState.secondsRemaining,
    },
  });

  broadcastToAllTabs({
    action: "showUI",
    phase: "working",
    seconds: timerState.secondsRemaining,
  });

  startWorkTimer();
}

function stopTimer() {
  timerState.isRunning = false;
  chrome.storage.local.set({
    isRunning: false,
    timerState: {
      isRunning: false,
      phase: "stopped",
      secondsRemaining: 0,
    },
  });

  if (workInterval) clearInterval(workInterval);
  if (breakInterval) clearInterval(breakInterval);

  broadcastToAllTabs({ action: "hideUI" });
}

function startWorkTimer() {
  console.log("Work timer starting...");

  if (workInterval) clearInterval(workInterval);

  workInterval = setInterval(() => {
    timerState.secondsRemaining--;
    console.log("Seconds remaining:", timerState.secondsRemaining);

    const payload = {
      action: "updateTime",
      phase: "working",
      seconds: timerState.secondsRemaining,
    };

    // Store to chrome.storage for popup to poll
    chrome.storage.local.set({
      timerState: {
        isRunning: timerState.isRunning,
        phase: timerState.phase,
        secondsRemaining: timerState.secondsRemaining,
      },
    });

    broadcastToAllTabs(payload);

    if (timerState.secondsRemaining <= 0) {
      clearInterval(workInterval);
      console.log("Work time complete, starting break");
      startBreak();
    }
  }, 1000);
}

function startBreak() {
  console.log("Starting break");
  timerState.phase = "break";
  let breakSeconds = 20;

  broadcastToAllTabs({ action: "showBreak", seconds: breakSeconds });

  if (breakInterval) clearInterval(breakInterval);

  breakInterval = setInterval(() => {
    breakSeconds--;

    const breakPayload = {
      action: "updateTime",
      phase: "break",
      seconds: breakSeconds,
    };

    // Store to chrome.storage for popup to poll
    chrome.storage.local.set({
      timerState: {
        isRunning: timerState.isRunning,
        phase: "break",
        secondsRemaining: breakSeconds,
      },
    });

    broadcastToAllTabs(breakPayload);

    if (breakSeconds <= 0) {
      clearInterval(breakInterval);
      showReady();
    }
  }, 1000);
}

function showReady() {
  console.log("Break complete, showing ready screen");
  timerState.phase = "ready";

  chrome.storage.local.set({
    timerState: {
      isRunning: timerState.isRunning,
      phase: "ready",
      secondsRemaining: 0,
    },
  });

  broadcastToAllTabs({ action: "showReady" });
}

function broadcastToAllTabs(message) {
  console.log("Broadcasting to all tabs:", message);

  chrome.tabs.query({}, function (tabs) {
    console.log("Found tabs:", tabs.length);
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) {
          // Ignore errors - some tabs can't receive messages
        }
      });
    });
  });
}
