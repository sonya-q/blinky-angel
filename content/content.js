let blinkyContainer = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!blinkyContainer) {
    createBlinkyUI();
  }
  
  if (request.action === 'showUI') {
    showScreen('working');
    updateTimeDisplay(request.seconds);
    blinkyContainer.classList.remove('hidden');
  } else if (request.action === 'hideUI') {
    blinkyContainer.classList.add('hidden');
  } else if (request.action === 'updateTime') {
    updateTimeDisplay(request.seconds);
  } else if (request.action === 'showBreak') {
    showScreen('break');
    updateBreakDisplay(request.seconds);
    blinkyContainer.classList.remove('hidden');
  } else if (request.action === 'updateBreak') {
    updateBreakDisplay(request.seconds);
  } else if (request.action === 'showReady') {
    showScreen('ready');
    blinkyContainer.classList.remove('hidden');
  }
});

function createBlinkyUI() {
  if (document.getElementById('blinkyContainer')) {
    blinkyContainer = document.getElementById('blinkyContainer');
    return;
  }

  blinkyContainer = document.createElement('div');
  blinkyContainer.id = 'blinkyContainer';
  blinkyContainer.className = 'popupContainer hidden';
  blinkyContainer.innerHTML = `
    <div id="workingScreen" class="hidden">
      <div class="angel">✨</div>
      <h1>I'm watching over you</h1>
      <p>Next break in: <span id="timeRemaining">0:10</span></p>
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

  document.body.appendChild(blinkyContainer);
  
  // Attach continue button listener
  document.getElementById('continueButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({action: 'continue'});
  });
}

function showScreen(screenName) {
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

// Initialize
createBlinkyUI();