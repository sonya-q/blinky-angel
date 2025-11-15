// tf-inject.js
// This runs in the page context and handles all TensorFlow logic

(async () => {
  console.log("🚀 Blinky Angel CV module starting...");

  // ============================================
  // STEP 1: Load TensorFlow.js from CDN
  // ============================================
  function loadTensorFlow() {
    return new Promise((resolve, reject) => {
      const tfScript = document.createElement('script');
      tfScript.src = chrome.runtime.getURL('libs/tf.min.js');
      tfScript.onload = () => {
        console.log("✅ TensorFlow.js loaded! Version:", window.tf.version.tfjs);
        resolve();
      };
      tfScript.onerror = () => reject(new Error("Failed to load TensorFlow.js"));
      document.head.appendChild(tfScript);
    });
  }

  try {
    await loadTensorFlow();
  } catch (err) {
    console.error("❌ Could not load TensorFlow:", err);
    return;
  }

  // ============================================
  // STEP 2: Set up webcam access
  // ============================================
  async function setupWebcam() {
    // Create a video element to capture webcam feed
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    
    // Make it invisible but keep it in DOM (needed for video capture)
    video.style.position = 'fixed';
    video.style.bottom = '-1000px'; // Hide it off-screen
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    
    document.body.appendChild(video);

    try {
      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480 
        } 
      });
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = () => resolve();
      });
      
      console.log("📹 Webcam ready!");
      return video;
      
    } catch (err) {
      console.error("❌ Could not access webcam:", err);
      // Send error to content script
      window.postMessage({
        source: "BlinkyAngelCV",
        type: "ERROR",
        message: "Camera access denied. Please allow camera permissions."
      }, "*");
      return null;
    }
  }

  const video = await setupWebcam();
  if (!video) return;

  // ============================================
  // STEP 3: Blink detection variables
  // ============================================
  let blinkCount = 0;
  let lastBlinkTime = Date.now();
  let recentBlinks = []; // Track blinks in last minute
  const BLINK_THRESHOLD = 0.25; // Eye aspect ratio threshold for blink
  
  // ============================================
  // STEP 4: Simple blink detection logic
  // ============================================
  async function detectBlink(video) {
    const tf = window.tf;
    
    // Create canvas to capture video frame
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    
    // Draw current video frame
    ctx.drawImage(video, 0, 0, 224, 224);
    
    // Convert to tensor
    let imgTensor = tf.browser.fromPixels(canvas);
    imgTensor = imgTensor.toFloat().div(tf.scalar(255)); // Normalize to [0,1]
    imgTensor = imgTensor.expandDims(0); // Add batch dimension
    
    // TODO: For hackathon speed, we'll use a simplified approach
    // Instead of a full face landmark model, we'll use a simple heuristic
    // based on pixel intensity changes in the eye region
    
    // For now, simulate blink detection with a simple timer
    // In production, you'd use a face mesh model here
    
    // Clean up
    imgTensor.dispose();
    
    // Simulate blink (for testing - replace with real detection)
    const randomBlink = Math.random() < 0.02; // ~2% chance per frame
    
    return randomBlink;
  }

  // ============================================
  // STEP 5: Main processing loop
  // ============================================
  async function processFrame() {
    const now = Date.now();
    
    // Detect if user blinked
    const didBlink = await detectBlink(video);
    
    if (didBlink) {
      blinkCount++;
      lastBlinkTime = now;
      recentBlinks.push(now);
      
      // Remove blinks older than 1 minute
      recentBlinks = recentBlinks.filter(time => now - time < 60000);
      
      const blinksPerMinute = recentBlinks.length;
      
      console.log(`👁️ Blink detected! Count: ${blinkCount}, Rate: ${blinksPerMinute}/min`);
      
      // Send blink data to content script
      window.postMessage({
        source: "BlinkyAngelCV",
        type: "BLINK_DETECTED",
        data: {
          totalBlinks: blinkCount,
          blinksPerMinute: blinksPerMinute
        }
      }, "*");
    }
    
    // Check if user needs a reminder (less than 7 blinks/minute)
    const blinksPerMinute = recentBlinks.length;
    if (now - lastBlinkTime > 5000 && blinksPerMinute < 7) {
      window.postMessage({
        source: "BlinkyAngelCV",
        type: "LOW_BLINK_RATE",
        data: { blinksPerMinute }
      }, "*");
    }
    
    // Continue loop (run at ~30fps)
    setTimeout(() => requestAnimationFrame(processFrame), 33);
  }

  // Start the detection loop
  console.log("🎬 Starting blink detection...");
  requestAnimationFrame(processFrame);

})();