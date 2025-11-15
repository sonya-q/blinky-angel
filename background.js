chrome.runtime.onInstalled.addListener(() => { // checks to make sure chrome extension downloaded
  // repeating 20 minute alarm
  chrome.alarms.create('twenty-twenty-twenty', { // name,
    periodInMinutes: 20 // fires every 20 minutes
  });
});

// listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'twenty-twenty-twenty') {
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png', // You can skip icon for now
      title: '👼 Blinky Angel Reminder',
      message: 'Time for 20-20-20! Look at something 20 feet away for 20 seconds.',
      priority: 2
    });
  }
});
