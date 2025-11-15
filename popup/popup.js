console.log('Popup script loaded');

// Check current state when popup opens
chrome.storage.local.get(['isRunning'], function(result) {
  console.log('Current state:', result);
  updateUI(result.isRunning);
});

// Start button
document.getElementById('startButton').addEventListener('click', function() {
  console.log('Start button clicked!');
  
  chrome.runtime.sendMessage({action: 'start'}, function(response) {
    console.log('Response from background:', response);
    
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      alert('Error starting timer. Check console.');
    } else {
      updateUI(true);
      setTimeout(() => window.close(), 500); // Close popup after starting
    }
  });
});

// Stop button
document.getElementById('stopButton').addEventListener('click', function() {
  console.log('Stop button clicked!');
  
  chrome.runtime.sendMessage({action: 'stop'}, function(response) {
    console.log('Response:', response);
    updateUI(false);
  });
});

function updateUI(isRunning) {
  console.log('Updating UI, isRunning:', isRunning);
  
  if (isRunning) {
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('stopButton').style.display = 'block';
    document.getElementById('status').textContent = '✨ Active on all tabs!';
  } else {
    document.getElementById('startButton').style.display = 'block';
    document.getElementById('stopButton').style.display = 'none';
    document.getElementById('status').textContent = 'Click Start to begin';
  }
}