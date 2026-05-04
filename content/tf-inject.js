// tf-inject.js
// This runs in the page context and handles all TensorFlow logic with MediaPipe

(async () => {
  console.log("🚀 Blinky Angel CV module starting...");

  // ============================================
  // STEP 0.5: Settings from content script
  // ============================================
  
  let settings = {
    timeSinceLastBlink: 8000,
    minBlinksPerMinute: 10,
    reminderCooldown: 45000
  };
  
  // Request settings from content script
  window.postMessage({
    source: 'BlinkyAngelCV',
    type: 'REQUEST_SETTINGS'
  }, '*');
  
  // Listen for settings updates and video toggle
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data?.source === 'BlinkyAngelControl' && event.data?.type === 'SETTINGS_UPDATE') {
      settings = event.data.settings;
      console.log('⚙️ Settings updated:', settings);
    }
    
    if (event.data?.source === 'BlinkyAngelControl' && event.data?.type === 'TOGGLE_VIDEO') {
      toggleVideoVisibility(event.data.visible);
    }
  });

  // ============================================
  // STEP 1: Load MediaPipe Face Mesh from CDN
  // ============================================
  async function loadMediaPipe() {
    console.log("📦 Loading MediaPipe libraries...");
    
    // Load drawing utils
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
    
    // Load camera utils
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
    
    // Load face mesh
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
    
    console.log("✅ MediaPipe loaded successfully!");
  }
  
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(script);
    });
  }

  try {
    await loadMediaPipe();
  } catch (err) {
    console.error("❌ Could not load MediaPipe:", err);
    window.postMessage({
      source: "BlinkyAngelCV",
      type: "ERROR",
      message: "Failed to load MediaPipe: " + err.message
    }, "*");
    return;
  }

  // ============================================
  // STEP 2: Set up webcam VIDEO with visualization
  // ============================================
  async function setupWebcam() {
    console.log("📹 Setting up webcam with visualization...");
    
    // Create video element
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 320px;
      height: 240px;
      z-index: 999998;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      transform: scaleX(-1);
    `;
    document.body.appendChild(video);
    
    // Create canvas overlay for drawing landmarks
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    canvas.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 320px;
      height: 240px;
      z-index: 999999;
      border-radius: 12px;
      pointer-events: none;
      transform: scaleX(-1);
    `;
    document.body.appendChild(canvas);
    
    // Create stats overlay
    const statsDiv = document.createElement('div');
    statsDiv.id = 'blinky-stats';
    statsDiv.style.cssText = `
      position: fixed;
      bottom: 270px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 999999;
      min-width: 290px;
    `;
    statsDiv.innerHTML = `
      <div><strong>👁️ Blink Detector</strong></div>
      <div>Blinks: <span id="blink-count">0</span></div>
      <div>Rate: <span id="blink-rate">0</span> blinks/min</div>
      <div>Last blink: <span id="time-since-blink">0.0s</span></div>
      <div>EAR: <span id="ear-value">0.00</span></div>
      <div>Status: <span id="eye-status">👁️ Open</span></div>
      <button id="toggle-video" style="
        background: #667eea;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 5px;
      ">Hide Video</button>
    `;
    document.body.appendChild(statsDiv);

    // Video toggle button
    document.getElementById('toggle-video').onclick = () => {
      const isHidden = video.style.display === 'none';
      video.style.display = isHidden ? 'block' : 'none';
      canvas.style.display = isHidden ? 'block' : 'none';
      document.getElementById('toggle-video').textContent = isHidden ? 'Hide Video' : 'Show Video';
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480 
        } 
      });
      video.srcObject = stream;
      
      await new Promise(resolve => {
        video.onloadedmetadata = () => resolve();
      });
      
      console.log("📹 Webcam ready with visualization!");
      return { video, canvas, statsDiv };
      
    } catch (err) {
      console.error("❌ Could not access webcam:", err);
      window.postMessage({
        source: "BlinkyAngelCV",
        type: "ERROR",
        message: "Camera access denied. Please allow camera permissions."
      }, "*");
      return null;
    }
  }

  const webcamSetup = await setupWebcam();
  if (!webcamSetup) return;
  
  const { video, canvas, statsDiv } = webcamSetup;
  const canvasCtx = canvas.getContext('2d');

  // Video visibility toggle function
  function toggleVideoVisibility(visible) {
    video.style.display = visible ? 'block' : 'none';
    canvas.style.display = visible ? 'block' : 'none';
    statsDiv.style.display = visible ? 'block' : 'none';
    if (document.getElementById('toggle-video')) {
      document.getElementById('toggle-video').textContent = visible ? 'Hide Video' : 'Show Video';
    }
  }

  // ============================================
  // STEP 3: Eye landmark indices for MediaPipe
  // ============================================
  
  // Left eye landmarks (6 points for EAR calculation)
  const LEFT_EYE = [
    33,  // Left eye outer corner
    160, // Left eye top
    158, // Left eye top-inner
    133, // Left eye inner corner
    153, // Left eye bottom-inner
    144  // Left eye bottom
  ];
  
  // Right eye landmarks (6 points for EAR calculation)
  const RIGHT_EYE = [
    362, // Right eye outer corner
    385, // Right eye top
    387, // Right eye top-inner
    263, // Right eye inner corner
    373, // Right eye bottom-inner
    380  // Right eye bottom
  ];
  
  // All eye landmarks for drawing
  const LEFT_EYE_FULL = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  const RIGHT_EYE_FULL = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

  // ============================================
  // STEP 4: Eye Aspect Ratio (EAR) calculation
  // ============================================
  
  function calculateEAR(eyeLandmarks) {
    // EAR formula from the paper:
    // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    // Where p1-p6 are the 6 eye landmarks
    
    const p1 = eyeLandmarks[0]; // Outer corner
    const p2 = eyeLandmarks[1]; // Top
    const p3 = eyeLandmarks[2]; // Top-inner
    const p4 = eyeLandmarks[3]; // Inner corner
    const p5 = eyeLandmarks[4]; // Bottom-inner
    const p6 = eyeLandmarks[5]; // Bottom
    
    // Calculate euclidean distances
    const vertical1 = Math.sqrt(
      Math.pow(p2.x - p6.x, 2) + 
      Math.pow(p2.y - p6.y, 2) + 
      Math.pow(p2.z - p6.z, 2)
    );
    
    const vertical2 = Math.sqrt(
      Math.pow(p3.x - p5.x, 2) + 
      Math.pow(p3.y - p5.y, 2) + 
      Math.pow(p3.z - p5.z, 2)
    );
    
    const horizontal = Math.sqrt(
      Math.pow(p1.x - p4.x, 2) + 
      Math.pow(p1.y - p4.y, 2) + 
      Math.pow(p1.z - p4.z, 2)
    );
    
    // Calculate EAR
    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    return ear;
  }

  // ============================================
  // STEP 5: Blink detection variables
  // ============================================
  
  let blinkCount = 0;
  let lastBlinkTime = Date.now();
  let recentBlinks = [];
  
  // EAR threshold - eyes are considered closed below this value
  const EAR_THRESHOLD = 0.21; // Adjust between 0.15-0.25 based on testing
  
  // Number of consecutive frames eye must be closed to register blink
  const EAR_CONSEC_FRAMES = 2;
  
  let eyeClosedFrames = 0;
  let blinkInProgress = false;

  // ============================================
  // STEP 6: Setup MediaPipe Face Mesh
  // ============================================
  
  const faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true, // Enables iris landmarks
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // ============================================
  // STEP 7: Process face mesh results
  // ============================================
  
  faceMesh.onResults((results) => {
    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Draw face mesh (optional - comment out if too cluttered)
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 0.5});
      
      // Draw eyes with color
      drawLandmarks(canvasCtx, landmarks, LEFT_EYE_FULL, {color: '#30FF30', lineWidth: 1, radius: 2});
      drawLandmarks(canvasCtx, landmarks, RIGHT_EYE_FULL, {color: '#30FF30', lineWidth: 1, radius: 2});
      
      // Get eye landmarks for EAR calculation
      const leftEyeLandmarks = LEFT_EYE.map(idx => landmarks[idx]);
      const rightEyeLandmarks = RIGHT_EYE.map(idx => landmarks[idx]);
      
      // Calculate EAR for both eyes
      const leftEAR = calculateEAR(leftEyeLandmarks);
      const rightEAR = calculateEAR(rightEyeLandmarks);
      const avgEAR = (leftEAR + rightEAR) / 2.0;
      
      // Update stats display
      document.getElementById('ear-value').textContent = avgEAR.toFixed(3);
      
      // Calculate and display time since last blink
      const timeSinceLastBlink = Date.now() - lastBlinkTime;
      const timeSinceSeconds = (timeSinceLastBlink / 1000).toFixed(1);
      document.getElementById('time-since-blink').textContent = `${timeSinceSeconds}s`;
      
      // Blink detection logic
      if (avgEAR < EAR_THRESHOLD) {
        eyeClosedFrames++;
        document.getElementById('eye-status').textContent = '😑 Closed';
        
        if (eyeClosedFrames >= EAR_CONSEC_FRAMES && !blinkInProgress) {
          blinkInProgress = true;
        }
      } else {
        if (blinkInProgress) {
          // Blink completed!
          blinkCount++;
          const now = Date.now();
          lastBlinkTime = now;
          recentBlinks.push(now);
          
          // Remove blinks older than 1 minute
          recentBlinks = recentBlinks.filter(time => now - time < 60000);
          
          const blinksPerMinute = recentBlinks.length;
          
          console.log(`👁️ Blink detected! Count: ${blinkCount}, Rate: ${blinksPerMinute}/min, EAR: ${avgEAR.toFixed(3)}`);
          
          // Update display
          document.getElementById('blink-count').textContent = blinkCount;
          document.getElementById('blink-rate').textContent = blinksPerMinute;
          
          // Send to content script
          window.postMessage({
            source: "BlinkyAngelCV",
            type: "BLINK_DETECTED",
            data: {
              totalBlinks: blinkCount,
              blinksPerMinute: blinksPerMinute,
              ear: avgEAR
            }
          }, "*");
          
          blinkInProgress = false;
        }
        
        eyeClosedFrames = 0;
        document.getElementById('eye-status').textContent = '👁️ Open';
      }
      
      // Check if user needs reminder (use dynamic settings)
      const blinksPerMinute = recentBlinks.length;
      
      if (timeSinceLastBlink > settings.timeSinceLastBlink && 
          blinksPerMinute < settings.minBlinksPerMinute) {
        window.postMessage({
          source: "BlinkyAngelCV",
          type: "LOW_BLINK_RATE",
          data: { blinksPerMinute }
        }, "*");
      }
      
      // Send stats update to content script
      window.postMessage({
        source: "BlinkyAngelCV",
        type: "STATS_UPDATE",
        data: {
          stats: {
            totalBlinks: blinkCount,
            blinksPerMinute: blinksPerMinute,
            timeSinceLastBlink: timeSinceLastBlink,
            ear: avgEAR
          }
        }
      }, "*");
      
    } else {
      // No face detected
      document.getElementById('eye-status').textContent = '❌ No face';
      canvasCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  // ============================================
  // STEP 8: Helper functions for drawing
  // ============================================
  
  function drawLandmarks(ctx, landmarks, indices, style) {
    ctx.fillStyle = style.color;
    for (const idx of indices) {
      const landmark = landmarks[idx];
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, style.radius || 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  
  function drawConnectors(ctx, landmarks, connections, style) {
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;
    
    for (const connection of connections) {
      const start = landmarks[connection[0]];
      const end = landmarks[connection[1]];
      
      ctx.beginPath();
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
      ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
      ctx.stroke();
    }
  }
  
  // Face mesh tesselation connections
  const FACEMESH_TESSELATION = window.FACEMESH_TESSELATION || [];

  // ============================================
  // STEP 9: Start camera feed
  // ============================================
  
  const camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({image: video});
    },
    width: 640,
    height: 480
  });

  console.log("🎬 Starting face detection...");
  camera.start();

})();