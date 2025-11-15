// Test notification button
document.getElementById('testNotification').addEventListener('click', () => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '👼 Test Notification',
    message: 'The 20-20-20 reminder will look like this!',
    priority: 2
  });
});

// Start blink detection button
document.getElementById('startBlinkDetection').addEventListener('click', () => {
  chrome.tabs.create({ url: 'blink-detector.html' });
});