// popup.js
// Manages both blink detection settings and 20-20-20 timer

// ============================================
// BLINK DETECTION - Mode configurations
// ============================================

const MODES = {
  strict: {
    name: "Strict",
    timeSinceLastBlink: 3000,
    minBlinksPerMinute: 12,
    reminderCooldown: 10000,
    description:
      "<strong>Strict:</strong> Reminder every 10s if you blink less than 12 times/min or haven't blinked in 3s. For maximum eye health.",
  },
  balanced: {
    name: "Balanced",
    timeSinceLastBlink: 8000,
    minBlinksPerMinute: 10,
    reminderCooldown: 45000,
    description:
      "<strong>Balanced:</strong> Reminder every 45s if you blink less than 10 times/min or haven't blinked in 8s. Good for most users.",
  },
  gentle: {
    name: "Gentle",
    timeSinceLastBlink: 15000,
    minBlinksPerMinute: 7,
    reminderCooldown: 120000,
    description:
      "<strong>Gentle:</strong> Reminder every 2min if you blink less than 7 times/min or haven't blinked in 15s. Less intrusive, more flexible.",
  },
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup initialized!");

  // Load blink detection settings
  loadBlinkSettings();

  // Load 20-20-20 timer state
  loadTimerState();

  // Setup tab switching
  setupTabs();

  // Setup blink detection controls
  setupBlinkControls();

  // Setup timer controls
  setupTimerControls();

  // Start polling for stats
  startStatsPolling();
});

// Clean up polling when popup closes
window.addEventListener("unload", function () {
  if (timerPollingInterval) {
    clearInterval(timerPollingInterval);
    timerPollingInterval = null;
  }
});

// ============================================
// TAB SWITCHING
// ============================================

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;

      // Remove active class from all tabs
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked tab
      button.classList.add("active");
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });
}

// ============================================
// BLINK DETECTION CONTROLS
// ============================================

function loadBlinkSettings() {
  chrome.storage.local.get(
    ["reminderMode", "videoDebug", "stats"],
    (result) => {
      console.log("Loaded blink settings:", result);

      const mode = result.reminderMode || "balanced";
      const videoDebug =
        result.videoDebug !== undefined ? result.videoDebug : true;

      setActiveMode(mode);

      const toggle = document.getElementById("video-toggle");
      if (videoDebug) {
        toggle.classList.add("active");
      }

      if (result.stats) {
        updateStatsDisplay(result.stats);
      }
    },
  );
}

function setupBlinkControls() {
  // Mode button handlers
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const mode = this.dataset.mode;
      console.log("Mode clicked:", mode);
      setActiveMode(mode);
      saveBlinkSettings(mode);
    });
  });

  // Video toggle handler
  document
    .getElementById("video-toggle")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      const isActive = this.classList.contains("active");

      chrome.storage.local.set({ videoDebug: isActive });

      // Send to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "TOGGLE_VIDEO",
              visible: isActive,
            })
            .catch(() => {});
        });
      });
    });
}

function setActiveMode(mode) {
  // Update UI
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.getElementById(`mode-${mode}`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Update description
  const descElement = document.getElementById("mode-desc");
  if (descElement && MODES[mode]) {
    descElement.innerHTML = MODES[mode].description;
  }

  // Update header emoji
  const headerEmoji = document.getElementById("header-emoji");
  if (headerEmoji && MODES[mode]) {
    headerEmoji.textContent = MODES[mode].emoji;
  }
}

function saveBlinkSettings(mode) {
  const settings = {
    reminderMode: mode,
    config: MODES[mode],
  };

  chrome.storage.local.set(settings, () => {
    console.log("Blink settings saved:", settings);

    // Broadcast to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs
          .sendMessage(tab.id, {
            type: "UPDATE_SETTINGS",
            settings: settings,
          })
          .catch(() => {});
      });
    });
  });
}

function updateStatsDisplay(stats) {
  const blinkRateEl = document.getElementById("blink-rate");
  const totalBlinksEl = document.getElementById("total-blinks");
  const timeSinceEl = document.getElementById("time-since-blink");

  if (blinkRateEl) {
    blinkRateEl.textContent = `${stats.blinksPerMinute || 0} blinks/min`;
  }

  if (totalBlinksEl) {
    totalBlinksEl.textContent = stats.totalBlinks || 0;
  }

  if (timeSinceEl) {
    const timeSince = stats.timeSinceLastBlink || 0;
    if (timeSince < 1000) {
      timeSinceEl.textContent = `${Math.floor(timeSince)}ms`;
    } else {
      timeSinceEl.textContent = `${(timeSince / 1000).toFixed(1)}s`;
    }
  }
}

function startStatsPolling() {
  setInterval(() => {
    chrome.storage.local.get(["stats"], (result) => {
      if (result.stats) {
        updateStatsDisplay(result.stats);
      }
    });
  }, 100);
}

// ============================================
// 20-20-20 TIMER CONTROLS
// ============================================

let timerPollingInterval = null;

function loadTimerState() {
  chrome.runtime.sendMessage({ action: "getState" }, (state) => {
    if (chrome.runtime.lastError) {
      // fallback to local storage if background cannot respond
      chrome.storage.local.get(["isRunning"], (result) => {
        updateTimerUI(result.isRunning || false);
      });
      return;
    }

    const isRunning = state?.isRunning || false;
    updateTimerUI(isRunning);

    if (isRunning && typeof state.secondsRemaining === "number") {
      setTimerCountdown(state.secondsRemaining);
    }
  });

  // Start polling for timer updates every 100ms
  startTimerPolling();
}

function startTimerPolling() {
  if (timerPollingInterval) {
    clearInterval(timerPollingInterval);
  }

  timerPollingInterval = setInterval(() => {
    chrome.storage.local.get(["timerState"], (result) => {
      if (result.timerState) {
        const state = result.timerState;
        console.log("Timer state from storage:", state);

        if (state.isRunning) {
          updateTimerUI(true);
          if (state.phase === "working") {
            const statusText = document.getElementById("timer-status");
            if (statusText) {
              statusText.textContent = `Time left:`;
            }
            const display = document.getElementById("timer-display");
            if (display) {
              display.textContent = formatTime(state.secondsRemaining);
            }
          } else if (state.phase === "break") {
            const statusText = document.getElementById("timer-status");
            if (statusText) {
              statusText.textContent = `Break: ${formatTime(state.secondsRemaining)}`;
            }
            const display = document.getElementById("timer-display");
            if (display) {
              display.textContent = formatTime(state.secondsRemaining);
            }
          }
        } else if (state.phase === "ready") {
          updateTimerUI(false);
          const statusText = document.getElementById("timer-status");
          if (statusText) {
            statusText.textContent = "Break complete! Ready to continue.";
          }
        }
      }
    });
  }, 100); // Poll every 100ms for smooth updates
}

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function setTimerCountdown(seconds) {
  const statusText = document.getElementById("timer-status");
  const display = document.getElementById("timer-display");

  if (statusText) {
    statusText.textContent = `Time left:`;
  }

  if (display) {
    display.textContent = formatTime(seconds);
  }
}

function setupTimerControls() {
  // Start button
  document.getElementById("startTimerButton").addEventListener("click", () => {
    console.log("Starting 20-20-20 timer");

    chrome.runtime.sendMessage({ action: "start" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error starting timer:", chrome.runtime.lastError);
      } else {
        updateTimerUI(true);
        // Ensure polling is active
        if (!timerPollingInterval) {
          startTimerPolling();
        }
      }
    });
  });

  // Stop button
  document.getElementById("stopTimerButton").addEventListener("click", () => {
    console.log("Stopping 20-20-20 timer");

    chrome.runtime.sendMessage({ action: "stop" }, (response) => {
      updateTimerUI(false);
      if (timerPollingInterval) {
        clearInterval(timerPollingInterval);
        timerPollingInterval = null;
      }
    });
  });
}

function updateTimerUI(isRunning) {
  const startBtn = document.getElementById("startTimerButton");
  const stopBtn = document.getElementById("stopTimerButton");
  const statusText = document.getElementById("timer-status");
  const emoji = document.getElementById("timer-emoji");

  if (isRunning) {
    startBtn.style.display = "none";
    stopBtn.style.display = "block";
    statusText.textContent = "Time left: 20:00";
    emoji.textContent = "▶️";
    const display = document.getElementById("timer-display");
    if (display) {
      display.textContent = "20:00";
    }
  } else {
    startBtn.style.display = "block";
    stopBtn.style.display = "none";
    statusText.textContent = "Ready to start";
    emoji.textContent = "⏸️";
    const display = document.getElementById("timer-display");
    if (display) {
      display.textContent = "20:00";
    }
  }
}

// Listen for messages from background script (optional, as polling takes priority)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "STATS_UPDATE") {
    updateStatsDisplay(message.stats);
  } else if (message.action === "updateTime") {
    setTimerCountdown(message.seconds);
    updateTimerUI(true);
  } else if (message.action === "showUI") {
    updateTimerUI(true);
    setTimerCountdown(message.seconds);
  } else if (message.action === "showBreak") {
    const display = document.getElementById("timer-display");
    if (display) {
      display.textContent = formatTime(message.seconds);
    }
  } else if (message.action === "showReady") {
    updateTimerUI(false);
    const statusText = document.getElementById("timer-status");
    if (statusText) {
      statusText.textContent = "Break complete! Ready to continue.";
    }
  }
});
