// Track which screen we're on
let currentScreen = 'welcome';
let workTimerInterval = null;
let breakTimerInterval = null;
let secondsRemaining = 0;

// Function to show a specific screen and hide others
function showScreen(screenName) {
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('workingScreen').classList.add('hidden');
  document.getElementById('breakScreen').classList.add('hidden');
  document.getElementById('readyScreen').classList.add('hidden');

  document.getElementById(screenName + 'Screen').classList.remove('hidden');
  currentScreen = screenName;
}

// Called when user clicks "Start" button
function startTimer() {
  console.log('Timer started!');
  showScreen('working');

  secondsRemaining = 20;          // TEST
  // secondsRemaining = 1200;   // REAL

  updateTimeDisplay();

  workTimerInterval = setInterval(() => {
    secondsRemaining--;
    updateTimeDisplay();

    if (secondsRemaining <= 0) {
      clearInterval(workTimerInterval);
      startBreak();
    }
  }, 1000);

  setTimeout(() => {
    console.log('Popup would close here');
  }, 3000);
}

// Update the time remaining display
function updateTimeDisplay() {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('timeRemaining').textContent = display;
}

function startBreak() {
  console.log('Break time!');
  showScreen('break');

  let breakSeconds = 20;
  document.getElementById('breakTimer').textContent = breakSeconds;

  breakTimerInterval = setInterval(() => {
    breakSeconds--;
    document.getElementById('breakTimer').textContent = breakSeconds;

    if (breakSeconds <= 0) {
      clearInterval(breakTimerInterval);
      showReadyScreen();
    }
  }, 1000);
}

function showReadyScreen() {
  console.log('Break complete!');
  showScreen('ready');
}

function startNextSession() {
  console.log('Starting next session!');
  startTimer();
}

console.log('Timer popup loaded! Click Start to begin.');
